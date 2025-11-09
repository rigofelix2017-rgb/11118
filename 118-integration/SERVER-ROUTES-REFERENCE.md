# Backend Server Routes Reference

## Overview

This document provides complete reference implementations for all backend routes required by the 118-integration package.

**IMPORTANT**: The frontend components **cannot function** without these backend endpoints. You must implement all routes marked as "Required" for the features you're using.

---

## Server Setup

### Express Server Template

```typescript
// server/index.ts
import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import routes from './routes';

const app = express();
const server = createServer(app);
const wss = new WebSocketServer({ server });

app.use(cors());
app.use(express.json());
app.use('/api', routes);

// WebSocket for proximity chat
wss.on('connection', (ws) => {
  console.log('Client connected');
  
  ws.on('message', (data) => {
    const message = JSON.parse(data.toString());
    // Broadcast to nearby players
    broadcastToNearby(message, wss);
  });
});

server.listen(3001, () => {
  console.log('Server running on port 3001');
});
```

### Dependencies

```bash
npm install express cors ws pg drizzle-orm
npm install -D @types/express @types/cors @types/ws
```

---

## Session Management Routes

**Used by:** Smart wallet, player state, intro system

```typescript
// server/routes.ts
import { Router } from 'express';
import { db } from './db';
import { sessions } from './schema';
import { eq } from 'drizzle-orm';

const router = Router();

// POST /api/session/login
router.post('/session/login', async (req, res) => {
  try {
    const { address, authData } = req.body;
    
    if (!address) {
      return res.status(400).json({ error: 'Address required' });
    }

    // Check if session exists
    let session = await db.query.sessions.findFirst({
      where: eq(sessions.address, address.toLowerCase())
    });

    if (!session) {
      // Create new session
      const sessionId = crypto.randomUUID();
      [session] = await db.insert(sessions).values({
        address: address.toLowerCase(),
        sessionId,
        authData: authData ? JSON.stringify(authData) : null,
        createdAt: new Date()
      }).returning();
    }

    res.json({
      success: true,
      sessionId: session.sessionId,
      isNew: !session.hasCompletedIntro
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// GET /api/session/me
router.get('/session/me', async (req, res) => {
  try {
    const address = req.headers['x-wallet-address'] as string;
    
    if (!address) {
      return res.json({ address: null, isNew: true, hasCompletedIntro: false });
    }

    const session = await db.query.sessions.findFirst({
      where: eq(sessions.address, address.toLowerCase())
    });

    if (!session) {
      return res.json({ 
        address: null, 
        isNew: true, 
        hasCompletedIntro: false 
      });
    }

    res.json({
      address: session.address,
      isNew: !session.hasCompletedIntro,
      hasCompletedIntro: session.hasCompletedIntro || false
    });
  } catch (error) {
    console.error('Session check error:', error);
    res.status(500).json({ error: 'Failed to check session' });
  }
});

// POST /api/session/complete-intro
router.post('/session/complete-intro', async (req, res) => {
  try {
    const { address } = req.body;
    
    await db.update(sessions)
      .set({ hasCompletedIntro: true })
      .where(eq(sessions.address, address.toLowerCase()));

    res.json({ success: true });
  } catch (error) {
    console.error('Complete intro error:', error);
    res.status(500).json({ error: 'Failed to update intro status' });
  }
});

// POST /api/session/logout
router.post('/session/logout', async (req, res) => {
  try {
    const { address } = req.body;
    
    // Optional: Clean up session data
    // For now, just acknowledge
    res.json({ success: true });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ error: 'Logout failed' });
  }
});

export default router;
```

---

## Jukebox Routes

**Used by:** 01-jukebox-system

```typescript
// server/routes.ts (continued)
import { jukeboxQueue } from './schema';
import { desc } from 'drizzle-orm';

// GET /api/jukebox/queue
router.get('/jukebox/queue', async (req, res) => {
  try {
    const queue = await db.query.jukeboxQueue.findMany({
      where: eq(jukeboxQueue.played, false),
      orderBy: [jukeboxQueue.addedAt],
      limit: 50
    });

    res.json(queue);
  } catch (error) {
    console.error('Queue fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch queue' });
  }
});

// POST /api/jukebox/add
router.post('/jukebox/add', async (req, res) => {
  try {
    const { youtubeUrl } = req.body;
    const address = req.headers['x-wallet-address'] as string;

    if (!youtubeUrl || !address) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Extract video ID and fetch metadata
    const videoId = extractYouTubeId(youtubeUrl);
    const metadata = await fetchYouTubeMetadata(videoId);

    const [song] = await db.insert(jukeboxQueue).values({
      youtubeUrl,
      videoId,
      title: metadata.title,
      addedBy: address.toLowerCase(),
      addedAt: new Date(),
      played: false
    }).returning();

    res.json({ success: true, songId: song.id });
  } catch (error) {
    console.error('Add song error:', error);
    res.status(500).json({ error: 'Failed to add song' });
  }
});

// GET /api/jukebox/price
router.get('/jukebox/price', async (req, res) => {
  try {
    // Get current price from smart contract or return fixed price
    const priceInUSDC = '1.00'; // $1 per song
    res.json({ priceInUSDC });
  } catch (error) {
    console.error('Price fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch price' });
  }
});

// GET /api/jukebox/server-time
router.get('/jukebox/server-time', async (req, res) => {
  try {
    res.json({ serverTime: Date.now() });
  } catch (error) {
    console.error('Server time error:', error);
    res.status(500).json({ error: 'Failed to get server time' });
  }
});

// POST /api/jukebox/skip
router.post('/jukebox/skip', async (req, res) => {
  try {
    const { songId } = req.body;
    
    await db.update(jukeboxQueue)
      .set({ played: true })
      .where(eq(jukeboxQueue.id, songId));

    res.json({ success: true });
  } catch (error) {
    console.error('Skip song error:', error);
    res.status(500).json({ error: 'Failed to skip song' });
  }
});

// Helper: Extract YouTube video ID
function extractYouTubeId(url: string): string {
  const regex = /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/;
  const match = url.match(regex);
  return match ? match[1] : '';
}

// Helper: Fetch YouTube metadata
async function fetchYouTubeMetadata(videoId: string) {
  const apiKey = process.env.YOUTUBE_API_KEY;
  const response = await fetch(
    `https://www.googleapis.com/youtube/v3/videos?id=${videoId}&key=${apiKey}&part=snippet`
  );
  const data = await response.json();
  return {
    title: data.items[0]?.snippet?.title || 'Unknown Title',
    thumbnail: data.items[0]?.snippet?.thumbnails?.default?.url
  };
}
```

---

## Wallet Routes

**Used by:** 04-smart-wallet

```typescript
// server/routes.ts (continued)

// GET /api/wallet/is-new
router.get('/wallet/is-new', async (req, res) => {
  try {
    const { address } = req.query;
    
    if (!address || typeof address !== 'string') {
      return res.status(400).json({ error: 'Address required' });
    }

    const session = await db.query.sessions.findFirst({
      where: eq(sessions.address, address.toLowerCase())
    });

    res.json({ isNew: !session || !session.hasCompletedIntro });
  } catch (error) {
    console.error('Wallet check error:', error);
    res.status(500).json({ error: 'Failed to check wallet status' });
  }
});

// POST /api/wallet/complete-onboarding
router.post('/wallet/complete-onboarding', async (req, res) => {
  try {
    const { address } = req.body;
    
    await db.update(sessions)
      .set({ hasCompletedIntro: true })
      .where(eq(sessions.address, address.toLowerCase()));

    res.json({ success: true });
  } catch (error) {
    console.error('Onboarding error:', error);
    res.status(500).json({ error: 'Failed to complete onboarding' });
  }
});
```

---

## Tipping Routes

**Used by:** 02-tipping-system

```typescript
// server/routes.ts (continued)
import { tips } from './schema';

// GET /api/tips/received
router.get('/tips/received', async (req, res) => {
  try {
    const address = req.headers['x-wallet-address'] as string;
    
    if (!address) {
      return res.status(400).json({ error: 'Address required' });
    }

    const received = await db.query.tips.findMany({
      where: eq(tips.toAddress, address.toLowerCase()),
      orderBy: [desc(tips.timestamp)],
      limit: 100
    });

    res.json(received);
  } catch (error) {
    console.error('Tips received error:', error);
    res.status(500).json({ error: 'Failed to fetch tips' });
  }
});

// GET /api/tips/sent
router.get('/tips/sent', async (req, res) => {
  try {
    const address = req.headers['x-wallet-address'] as string;
    
    if (!address) {
      return res.status(400).json({ error: 'Address required' });
    }

    const sent = await db.query.tips.findMany({
      where: eq(tips.fromAddress, address.toLowerCase()),
      orderBy: [desc(tips.timestamp)],
      limit: 100
    });

    res.json(sent);
  } catch (error) {
    console.error('Tips sent error:', error);
    res.status(500).json({ error: 'Failed to fetch tips' });
  }
});

// POST /api/tips/record (called after on-chain tip)
router.post('/tips/record', async (req, res) => {
  try {
    const { from, to, amount, token, txHash } = req.body;
    
    await db.insert(tips).values({
      fromAddress: from.toLowerCase(),
      toAddress: to.toLowerCase(),
      amount,
      token,
      txHash,
      timestamp: new Date()
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Record tip error:', error);
    res.status(500).json({ error: 'Failed to record tip' });
  }
});
```

---

## Housing Routes

**Used by:** 03-housing-system

```typescript
// server/routes.ts (continued)
import { houses } from './schema';

// GET /api/houses/:address
router.get('/houses/:address', async (req, res) => {
  try {
    const { address } = req.params;
    
    const house = await db.query.houses.findFirst({
      where: eq(houses.ownerAddress, address.toLowerCase())
    });

    if (!house) {
      return res.json({ 
        theme: 'default',
        furniture: [],
        privacy: 'public'
      });
    }

    res.json({
      theme: house.theme,
      furniture: house.furniture,
      privacy: house.privacy
    });
  } catch (error) {
    console.error('House fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch house' });
  }
});

// POST /api/houses/save
router.post('/houses/save', async (req, res) => {
  try {
    const { furniture, theme, privacy } = req.body;
    const address = req.headers['x-wallet-address'] as string;

    if (!address) {
      return res.status(400).json({ error: 'Address required' });
    }

    // Upsert house data
    const existing = await db.query.houses.findFirst({
      where: eq(houses.ownerAddress, address.toLowerCase())
    });

    if (existing) {
      await db.update(houses)
        .set({ 
          furniture, 
          theme, 
          privacy,
          updatedAt: new Date()
        })
        .where(eq(houses.ownerAddress, address.toLowerCase()));
    } else {
      await db.insert(houses).values({
        ownerAddress: address.toLowerCase(),
        furniture,
        theme,
        privacy,
        updatedAt: new Date()
      });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('House save error:', error);
    res.status(500).json({ error: 'Failed to save house' });
  }
});
```

---

## Agency Ecosystem Routes

**Used by:** 09-agency-ecosystem

```typescript
// server/routes.ts (continued)
import { landParcels, skuInventory, stakingPositions } from './schema';

// GET /api/land/parcels
router.get('/land/parcels', async (req, res) => {
  try {
    const parcels = await db.query.landParcels.findMany({
      orderBy: [landParcels.id],
      limit: 10000
    });

    res.json(parcels);
  } catch (error) {
    console.error('Parcels fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch parcels' });
  }
});

// GET /api/land/owned/:address
router.get('/land/owned/:address', async (req, res) => {
  try {
    const { address } = req.params;
    
    const owned = await db.query.landParcels.findMany({
      where: eq(landParcels.owner, address.toLowerCase())
    });

    res.json(owned);
  } catch (error) {
    console.error('Owned parcels error:', error);
    res.status(500).json({ error: 'Failed to fetch owned parcels' });
  }
});

// GET /api/sku/marketplace
router.get('/sku/marketplace', async (req, res) => {
  try {
    const skus = await db.query.skuInventory.findMany({
      where: eq(skuInventory.listed, true),
      orderBy: [desc(skuInventory.createdAt)],
      limit: 100
    });

    res.json(skus);
  } catch (error) {
    console.error('SKU marketplace error:', error);
    res.status(500).json({ error: 'Failed to fetch SKUs' });
  }
});

// GET /api/sku/owned/:address
router.get('/sku/owned/:address', async (req, res) => {
  try {
    const { address } = req.params;
    
    const owned = await db.query.skuInventory.findMany({
      where: eq(skuInventory.owner, address.toLowerCase())
    });

    res.json(owned);
  } catch (error) {
    console.error('Owned SKUs error:', error);
    res.status(500).json({ error: 'Failed to fetch owned SKUs' });
  }
});

// POST /api/staking/stake
router.post('/staking/stake', async (req, res) => {
  try {
    const { amount, lockDuration } = req.body;
    const address = req.headers['x-wallet-address'] as string;

    const multiplier = getMultiplier(lockDuration);
    
    await db.insert(stakingPositions).values({
      owner: address.toLowerCase(),
      amount,
      lockDuration,
      multiplier,
      stakedAt: new Date(),
      unlocksAt: new Date(Date.now() + lockDuration * 1000)
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Stake error:', error);
    res.status(500).json({ error: 'Failed to stake' });
  }
});

// POST /api/staking/unstake
router.post('/staking/unstake', async (req, res) => {
  try {
    const { positionId } = req.body;
    
    await db.delete(stakingPositions)
      .where(eq(stakingPositions.id, positionId));

    res.json({ success: true });
  } catch (error) {
    console.error('Unstake error:', error);
    res.status(500).json({ error: 'Failed to unstake' });
  }
});

function getMultiplier(lockDuration: number): number {
  if (lockDuration >= 63072000) return 5; // 2 years
  if (lockDuration >= 31536000) return 3; // 1 year
  if (lockDuration >= 2592000) return 1.2; // 30 days
  return 1;
}
```

---

## WebSocket Implementation (Proximity Chat)

**Used by:** 07-proximity-chat

```typescript
// server/websocket.ts
import { WebSocket, WebSocketServer } from 'ws';

interface Player {
  ws: WebSocket;
  address: string;
  position: { x: number; y: number; z: number };
}

const players = new Map<string, Player>();

export function setupWebSocket(wss: WebSocketServer) {
  wss.on('connection', (ws) => {
    let playerAddress: string | null = null;

    ws.on('message', (data) => {
      try {
        const message = JSON.parse(data.toString());

        switch (message.type) {
          case 'connect':
            playerAddress = message.address;
            players.set(playerAddress, {
              ws,
              address: playerAddress,
              position: message.position || { x: 0, y: 0, z: 0 }
            });
            break;

          case 'position_update':
            if (playerAddress) {
              const player = players.get(playerAddress);
              if (player) {
                player.position = message.position;
              }
            }
            break;

          case 'chat':
            if (playerAddress) {
              broadcastToNearby(playerAddress, message, 50); // 50 unit radius
            }
            break;
        }
      } catch (error) {
        console.error('WebSocket message error:', error);
      }
    });

    ws.on('close', () => {
      if (playerAddress) {
        players.delete(playerAddress);
      }
    });
  });
}

function broadcastToNearby(senderAddress: string, message: any, radius: number) {
  const sender = players.get(senderAddress);
  if (!sender) return;

  players.forEach((player, address) => {
    if (address === senderAddress) return;

    const distance = Math.sqrt(
      Math.pow(player.position.x - sender.position.x, 2) +
      Math.pow(player.position.y - sender.position.y, 2) +
      Math.pow(player.position.z - sender.position.z, 2)
    );

    if (distance <= radius && player.ws.readyState === WebSocket.OPEN) {
      player.ws.send(JSON.stringify({
        ...message,
        from: senderAddress,
        distance
      }));
    }
  });
}
```

---

## Database Schema

```typescript
// server/schema.ts
import { pgTable, serial, varchar, timestamp, boolean, jsonb, integer, text } from 'drizzle-orm/pg-core';

export const sessions = pgTable('sessions', {
  id: serial('id').primaryKey(),
  address: varchar('address', { length: 42 }).notNull(),
  sessionId: varchar('session_id', { length: 255 }).notNull().unique(),
  authData: text('auth_data'),
  hasCompletedIntro: boolean('has_completed_intro').default(false),
  createdAt: timestamp('created_at').defaultNow()
});

export const jukeboxQueue = pgTable('jukebox_queue', {
  id: serial('id').primaryKey(),
  youtubeUrl: text('youtube_url').notNull(),
  videoId: varchar('video_id', { length: 20 }),
  title: text('title').notNull(),
  addedBy: varchar('added_by', { length: 42 }).notNull(),
  addedAt: timestamp('added_at').defaultNow(),
  played: boolean('played').default(false)
});

export const tips = pgTable('tips', {
  id: serial('id').primaryKey(),
  fromAddress: varchar('from_address', { length: 42 }).notNull(),
  toAddress: varchar('to_address', { length: 42 }).notNull(),
  amount: varchar('amount', { length: 78 }).notNull(),
  token: varchar('token', { length: 42 }).notNull(),
  txHash: varchar('tx_hash', { length: 66 }),
  timestamp: timestamp('timestamp').defaultNow()
});

export const houses = pgTable('houses', {
  id: serial('id').primaryKey(),
  ownerAddress: varchar('owner_address', { length: 42 }).notNull().unique(),
  theme: varchar('theme', { length: 50 }),
  furniture: jsonb('furniture'),
  privacy: varchar('privacy', { length: 20 }),
  updatedAt: timestamp('updated_at').defaultNow()
});

export const landParcels = pgTable('land_parcels', {
  id: serial('id').primaryKey(),
  owner: varchar('owner', { length: 42 }),
  zone: varchar('zone', { length: 20 }),
  x: integer('x').notNull(),
  y: integer('y').notNull(),
  hasHouse: boolean('has_house').default(false),
  businessLicense: varchar('business_license', { length: 50 }),
  purchasedAt: timestamp('purchased_at')
});

export const skuInventory = pgTable('sku_inventory', {
  id: serial('id').primaryKey(),
  owner: varchar('owner', { length: 42 }).notNull(),
  creator: varchar('creator', { length: 42 }).notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  category: varchar('category', { length: 50 }),
  price: varchar('price', { length: 78 }),
  listed: boolean('listed').default(true),
  createdAt: timestamp('created_at').defaultNow()
});

export const stakingPositions = pgTable('staking_positions', {
  id: serial('id').primaryKey(),
  owner: varchar('owner', { length: 42 }).notNull(),
  amount: varchar('amount', { length: 78 }).notNull(),
  lockDuration: integer('lock_duration').notNull(),
  multiplier: integer('multiplier').notNull(),
  stakedAt: timestamp('staked_at').defaultNow(),
  unlocksAt: timestamp('unlocks_at').notNull()
});
```

---

## Environment Variables Template

```bash
# .env

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/dbname

# External APIs
YOUTUBE_API_KEY=your_youtube_api_key_here
NEXT_PUBLIC_CDP_PROJECT_ID=your_coinbase_cdp_project_id

# Smart Contracts (Base Mainnet)
JUKEBOX_CONTRACT_ADDRESS=0x5026a8ff0CF9c29CDd17661a2E09Fd3417c05311
TIPPING_CONTRACT_ADDRESS=0xfD81b26d6a2F555E3B9613e478FD0DF27d3a168C

# Agency Ecosystem Contracts (Deploy your own)
NEXT_PUBLIC_LAND_REGISTRY_ADDRESS=0x0000000000000000000000000000000000000000
NEXT_PUBLIC_HOOK_ROUTER_ADDRESS=0x0000000000000000000000000000000000000000
NEXT_PUBLIC_SKU_REGISTRY_ADDRESS=0x0000000000000000000000000000000000000000
NEXT_PUBLIC_XVOID_VAULT_ADDRESS=0x0000000000000000000000000000000000000000
NEXT_PUBLIC_PSX_PLEDGE_VAULT_ADDRESS=0x0000000000000000000000000000000000000000

# Tokens
NEXT_PUBLIC_VOID_TOKEN_ADDRESS=0x0000000000000000000000000000000000000000
NEXT_PUBLIC_PSX_TOKEN_ADDRESS=0x0000000000000000000000000000000000000000
NEXT_PUBLIC_USDC_TOKEN_ADDRESS=0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913

# Server
PORT=3001
WS_PORT=8080
```

---

## Testing Your Implementation

### 1. Test Session Routes

```bash
# Login
curl -X POST http://localhost:3001/api/session/login \
  -H "Content-Type: application/json" \
  -d '{"address":"0x1234..."}'

# Check session
curl http://localhost:3001/api/session/me \
  -H "x-wallet-address: 0x1234..."
```

### 2. Test Jukebox Routes

```bash
# Get queue
curl http://localhost:3001/api/jukebox/queue

# Add song
curl -X POST http://localhost:3001/api/jukebox/add \
  -H "Content-Type: application/json" \
  -H "x-wallet-address: 0x1234..." \
  -d '{"youtubeUrl":"https://youtube.com/watch?v=dQw4w9WgXcQ"}'
```

### 3. Test WebSocket

```javascript
const ws = new WebSocket('ws://localhost:8080');

ws.onopen = () => {
  ws.send(JSON.stringify({
    type: 'connect',
    address: '0x1234...',
    position: { x: 0, y: 0, z: 0 }
  }));
};

ws.onmessage = (event) => {
  console.log('Received:', JSON.parse(event.data));
};
```

---

## Next Steps

1. Copy the route implementations to your `server/routes.ts`
2. Create database schema with Drizzle or Prisma
3. Set up environment variables
4. Test each endpoint individually
5. Integrate with frontend components

---

**Last Updated:** November 8, 2025  
**Compatibility:** Express 4+, PostgreSQL 14+, Node.js 18+
