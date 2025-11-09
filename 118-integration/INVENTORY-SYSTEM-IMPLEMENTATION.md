# Inventory System Implementation Guide

## Overview

Unified inventory system consolidating Real Estate, SKUs, Furniture, Consumables, and Collectibles into a single panel with 5 category tabs.

---

## Database Schema

```sql
-- Unified inventory items
CREATE TABLE inventory_items (
  id SERIAL PRIMARY KEY,
  wallet_address VARCHAR(42) NOT NULL,
  item_type VARCHAR(50) NOT NULL, -- 'land', 'house', 'furniture', 'sku', 'consumable', 'collectible'
  template_id INTEGER REFERENCES item_templates(id),
  token_id VARCHAR(100),
  quantity INTEGER DEFAULT 1,
  acquired_at TIMESTAMP DEFAULT NOW(),
  metadata JSONB,
  UNIQUE(wallet_address, item_type, token_id)
);

-- Item templates (defines all possible items)
CREATE TABLE item_templates (
  id SERIAL PRIMARY KEY,
  item_type VARCHAR(50) NOT NULL,
  category VARCHAR(50),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  rarity VARCHAR(20),
  icon VARCHAR(100),
  max_stack INTEGER DEFAULT 1,
  metadata JSONB
);

-- Equipped items
CREATE TABLE equipped_items (
  id SERIAL PRIMARY KEY,
  wallet_address VARCHAR(42) NOT NULL,
  slot VARCHAR(50) NOT NULL,
  inventory_item_id INTEGER REFERENCES inventory_items(id),
  equipped_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(wallet_address, slot)
);

-- Indexes
CREATE INDEX idx_inventory_address ON inventory_items(wallet_address);
CREATE INDEX idx_inventory_type ON inventory_items(item_type);
CREATE INDEX idx_equipped_address ON equipped_items(wallet_address);
```

---

## Backend Routes

```typescript
// GET /api/inventory - Get all items
router.get('/inventory', async (req, res) => {
  const address = req.headers['x-wallet-address'];
  const { type } = req.query;

  let query = db.query.inventoryItems.findMany({
    where: eq(inventoryItems.walletAddress, address.toLowerCase()),
    with: { template: true }
  });

  if (type) {
    query = db.query.inventoryItems.findMany({
      where: and(
        eq(inventoryItems.walletAddress, address.toLowerCase()),
        eq(inventoryItems.itemType, type)
      ),
      with: { template: true }
    });
  }

  const items = await query;
  res.json(items);
});

// GET /api/inventory/real-estate - Get land + houses with value
router.get('/inventory/real-estate', async (req, res) => {
  const address = req.headers['x-wallet-address'];

  const land = await db.query.inventoryItems.findMany({
    where: and(
      eq(inventoryItems.walletAddress, address.toLowerCase()),
      eq(inventoryItems.itemType, 'land')
    ),
    with: { template: true }
  });

  const houses = await db.query.inventoryItems.findMany({
    where: and(
      eq(inventoryItems.walletAddress, address.toLowerCase()),
      eq(inventoryItems.itemType, 'house')
    ),
    with: { template: true }
  });

  const totalValue = [...land, ...houses].reduce((sum, item) => {
    return sum + (item.metadata?.purchasePrice || 0);
  }, 0);

  res.json({ land, houses, totalValue });
});

// GET /api/inventory/skus - Get SKUs by category
router.get('/inventory/skus', async (req, res) => {
  const address = req.headers['x-wallet-address'];
  const { category } = req.query;

  let query = db.query.inventoryItems.findMany({
    where: and(
      eq(inventoryItems.walletAddress, address.toLowerCase()),
      eq(inventoryItems.itemType, 'sku')
    ),
    with: { template: true }
  });

  if (category) {
    // Filter by category in template
  }

  const skus = await query;
  
  const grouped = {
    emotes: skus.filter(s => s.template.category === 'emote'),
    avatars: skus.filter(s => s.template.category === 'avatar'),
    wearables: skus.filter(s => s.template.category === 'wearable')
  };

  res.json(grouped);
});

// GET /api/inventory/furniture - Get furniture
router.get('/inventory/furniture', async (req, res) => {
  const address = req.headers['x-wallet-address'];

  const furniture = await db.query.inventoryItems.findMany({
    where: and(
      eq(inventoryItems.walletAddress, address.toLowerCase()),
      eq(inventoryItems.itemType, 'furniture')
    ),
    with: { template: true }
  });

  res.json(furniture);
});

// GET /api/inventory/equipped - Get equipped items
router.get('/inventory/equipped', async (req, res) => {
  const address = req.headers['x-wallet-address'];

  const equipped = await db.query.equippedItems.findMany({
    where: eq(equippedItems.walletAddress, address.toLowerCase()),
    with: { inventoryItem: { with: { template: true } } }
  });

  res.json(equipped);
});

// POST /api/inventory/equip - Equip item
router.post('/inventory/equip', async (req, res) => {
  const { itemId, slot } = req.body;
  const address = req.headers['x-wallet-address'];

  // Unequip current item in slot
  await db.delete(equippedItems)
    .where(and(
      eq(equippedItems.walletAddress, address.toLowerCase()),
      eq(equippedItems.slot, slot)
    ));

  // Equip new item
  await db.insert(equippedItems).values({
    walletAddress: address.toLowerCase(),
    slot,
    inventoryItemId: itemId
  });

  res.json({ success: true });
});

// POST /api/inventory/unequip - Unequip item
router.post('/inventory/unequip', async (req, res) => {
  const { slot } = req.body;
  const address = req.headers['x-wallet-address'];

  await db.delete(equippedItems)
    .where(and(
      eq(equippedItems.walletAddress, address.toLowerCase()),
      eq(equippedItems.slot, slot)
    ));

  res.json({ success: true });
});

// GET /api/inventory/stats - Get inventory statistics
router.get('/inventory/stats', async (req, res) => {
  const address = req.headers['x-wallet-address'];

  const items = await db.query.inventoryItems.findMany({
    where: eq(inventoryItems.walletAddress, address.toLowerCase())
  });

  const stats = {
    totalItems: items.length,
    byType: items.reduce((acc, item) => {
      acc[item.itemType] = (acc[item.itemType] || 0) + 1;
      return acc;
    }, {} as Record<string, number>),
    totalValue: items.reduce((sum, item) => {
      return sum + (item.metadata?.purchasePrice || 0);
    }, 0)
  };

  res.json(stats);
});
```

---

## Frontend Components

### InventoryPanel (Main Container)

```typescript
// inventory-panel.tsx
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { RealEstateTab } from './tabs/real-estate-tab';
import { SKUTab } from './tabs/sku-tab';
import { FurnitureTab } from './tabs/furniture-tab';
import { ConsumablesTab } from './tabs/consumables-tab';
import { CollectiblesTab } from './tabs/collectibles-tab';

export function InventoryPanel({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/90 z-50 overflow-auto">
      <div className="max-w-6xl mx-auto p-4">
        <Card className="bg-black/90 border-cyan-500/30">
          <div className="p-4 border-b border-cyan-500/30 flex justify-between items-center">
            <h2 className="text-2xl font-bold text-cyan-400">Inventory</h2>
            <button onClick={onClose} className="text-cyan-400 hover:text-cyan-300">
              ✕
            </button>
          </div>

          <Tabs defaultValue="real-estate" className="p-4">
            <TabsList className="grid w-full grid-cols-5 mb-4">
              <TabsTrigger value="real-estate">🏠 Real Estate</TabsTrigger>
              <TabsTrigger value="skus">🎭 SKUs</TabsTrigger>
              <TabsTrigger value="furniture">🛋️ Furniture</TabsTrigger>
              <TabsTrigger value="consumables">⚡ Consumables</TabsTrigger>
              <TabsTrigger value="collectibles">💎 Collectibles</TabsTrigger>
            </TabsList>

            <TabsContent value="real-estate">
              <RealEstateTab />
            </TabsContent>

            <TabsContent value="skus">
              <SKUTab />
            </TabsContent>

            <TabsContent value="furniture">
              <FurnitureTab />
            </TabsContent>

            <TabsContent value="consumables">
              <ConsumablesTab />
            </TabsContent>

            <TabsContent value="collectibles">
              <CollectiblesTab />
            </TabsContent>
          </Tabs>
        </Card>
      </div>
    </div>
  );
}
```

### RealEstateTab

```typescript
// tabs/real-estate-tab.tsx
import { useEffect, useState } from 'react';
import { useAccount } from 'wagmi';

export function RealEstateTab() {
  const { address } = useAccount();
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    if (!address) return;

    const fetchRealEstate = async () => {
      const res = await fetch('/api/inventory/real-estate', {
        headers: { 'x-wallet-address': address }
      });
      setData(await res.json());
    };

    fetchRealEstate();
  }, [address]);

  if (!data) return <div>Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="text-right text-cyan-400">
        Total Value: ${data.totalValue.toLocaleString()}
      </div>

      <div>
        <h3 className="text-lg font-bold text-cyan-400 mb-4">Land Parcels ({data.land.length})</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {data.land.map((item: any) => (
            <Card key={item.id} className="p-4 bg-black/60 border-cyan-500/30">
              <div className="text-sm text-cyan-400">{item.template.name}</div>
              <div className="text-xs text-cyan-400/60">
                {item.metadata?.coordinates || 'Unknown location'}
              </div>
              <div className="text-xs text-cyan-400/60 mt-2">
                ${item.metadata?.purchasePrice?.toLocaleString() || 0}
              </div>
            </Card>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-lg font-bold text-cyan-400 mb-4">Houses ({data.houses.length})</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {data.houses.map((item: any) => (
            <Card key={item.id} className="p-4 bg-black/60 border-cyan-500/30">
              <div className="text-sm text-cyan-400">{item.template.name}</div>
              <div className="text-xs text-cyan-400/60">
                ${item.metadata?.purchasePrice?.toLocaleString() || 0}
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
```

### SKUTab

```typescript
// tabs/sku-tab.tsx
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export function SKUTab() {
  const [skus, setSkus] = useState<any>({ emotes: [], avatars: [], wearables: [] });

  // Fetch SKUs...

  return (
    <Tabs defaultValue="emotes">
      <TabsList>
        <TabsTrigger value="emotes">Emotes</TabsTrigger>
        <TabsTrigger value="avatars">Avatars</TabsTrigger>
        <TabsTrigger value="wearables">Wearables</TabsTrigger>
      </TabsList>

      <TabsContent value="emotes">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {skus.emotes.map((item: any) => (
            <Card key={item.id} className="p-4 bg-black/60 border-cyan-500/30">
              <div className="text-4xl text-center mb-2">{item.template.icon}</div>
              <div className="text-xs text-center text-cyan-400">{item.template.name}</div>
              <div className="text-xs text-center text-purple-400">{item.template.rarity}</div>
            </Card>
          ))}
        </div>
      </TabsContent>
    </Tabs>
  );
}
```

---

## Integration

```typescript
// In game-interface.tsx
import { InventoryPanel } from './inventory-panel';

const [showInventory, setShowInventory] = useState(false);

// Add button to toolbar
<button onClick={() => setShowInventory(true)}>
  🎒 Inventory
</button>

{showInventory && <InventoryPanel onClose={() => setShowInventory(false)} />}
```

---

## Migration from Old Systems

### Replace House Inventory
```typescript
// Old: HouseInventoryDialog
// New: InventoryPanel with Furniture tab filtered by house ID
```

### Replace Land Manager
```typescript
// Old: LandManagerPanel
// New: InventoryPanel with Real Estate tab
```

### Replace SKU List
```typescript
// Old: SKUMarketplace
// New: InventoryPanel with SKUs tab
```

---

## Testing Checklist

- [ ] Real estate displays land + houses
- [ ] Total value calculation correct
- [ ] SKUs grouped by category
- [ ] Furniture displays all items
- [ ] Consumables show quantity
- [ ] Collectibles show rarity
- [ ] Equip/unequip works
- [ ] Mobile responsive grid
- [ ] Loading states work
- [ ] Empty states work

---

**Status:** Ready for implementation  
**Estimated Time:** 3-4 days  
**Dependencies:** Database, backend routes, shadcn/ui components
