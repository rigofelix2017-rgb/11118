/**
 * SKU Inventory System
 * 
 * Universal content distribution where creators mint SKUs (games, items, merch, etc.)
 * and earn 45% on every sale. Buy once, use everywhere across all ecosystem products.
 * 
 * Features:
 * - Creators mint SKUs with metadata (name, description, price, files)
 * - Users purchase SKUs with VOID tokens
 * - Automatic 45% royalty to creators via V4 hooks
 * - CDN integration for content delivery (10% to CDN partners)
 * - On-chain ownership tracking
 * - Cross-product compatibility
 */

import React, { useState, useEffect } from 'react';
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseEther, formatEther, Address } from 'viem';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';

// Contract ABIs
const SKU_REGISTRY_ABI = [
  {
    inputs: [
      { name: 'name', type: 'string' },
      { name: 'description', type: 'string' },
      { name: 'price', type: 'uint256' },
      { name: 'contentHash', type: 'bytes32' },
      { name: 'category', type: 'uint8' }
    ],
    name: 'mintSKU',
    outputs: [{ name: 'skuId', type: 'uint256' }],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [{ name: 'skuId', type: 'uint256' }],
    name: 'purchaseSKU',
    outputs: [],
    stateMutability: 'payable',
    type: 'function'
  },
  {
    inputs: [{ name: 'owner', type: 'address' }],
    name: 'getOwnedSKUs',
    outputs: [{ name: '', type: 'uint256[]' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [{ name: 'creator', type: 'address' }],
    name: 'getCreatorSKUs',
    outputs: [{ name: '', type: 'uint256[]' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [{ name: 'skuId', type: 'uint256' }],
    name: 'getSKUDetails',
    outputs: [
      { name: 'name', type: 'string' },
      { name: 'description', type: 'string' },
      { name: 'creator', type: 'address' },
      { name: 'price', type: 'uint256' },
      { name: 'sales', type: 'uint256' },
      { name: 'revenue', type: 'uint256' },
      { name: 'category', type: 'uint8' }
    ],
    stateMutability: 'view',
    type: 'function'
  }
] as const;

// Contract addresses
const CONTRACTS = {
  SKU_REGISTRY: '0x0000000000000000000000000000000000000000' as Address,
  VOID_TOKEN: '0x0000000000000000000000000000000000000000' as Address,
  HOOK_ROUTER: '0x0000000000000000000000000000000000000000' as Address,
};

// SKU Categories
enum SKUCategory {
  GAME = 0,
  ITEM = 1,
  SKIN = 2,
  MERCH = 3,
  MUSIC = 4,
  ART = 5,
  UTILITY = 6,
  OTHER = 7
}

interface SKU {
  id: number;
  name: string;
  description: string;
  creator: Address;
  price: bigint;
  sales: number;
  revenue: bigint;
  category: SKUCategory;
  contentHash: string;
  imageUrl?: string;
}

interface SKUInventorySystemProps {
  userAddress?: Address;
}

export function SKUInventorySystem({ userAddress }: SKUInventorySystemProps) {
  const { address } = useAccount();
  const { toast } = useToast();
  const [view, setView] = useState<'browse' | 'owned' | 'create'>('browse');
  const [selectedSKU, setSelectedSKU] = useState<SKU | null>(null);
  const [purchaseDialogOpen, setPurchaseDialogOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<SKUCategory | 'all'>('all');

  // Create SKU form
  const [newSKU, setNewSKU] = useState({
    name: '',
    description: '',
    price: '',
    category: SKUCategory.GAME,
    file: null as File | null,
  });

  // Read owned SKUs
  const { data: ownedSKUIds, refetch: refetchOwned } = useReadContract({
    address: CONTRACTS.SKU_REGISTRY,
    abi: SKU_REGISTRY_ABI,
    functionName: 'getOwnedSKUs',
    args: address ? [address] : undefined,
  });

  // Read creator SKUs
  const { data: creatorSKUIds } = useReadContract({
    address: CONTRACTS.SKU_REGISTRY,
    abi: SKU_REGISTRY_ABI,
    functionName: 'getCreatorSKUs',
    args: address ? [address] : undefined,
  });

  // Mint SKU
  const { writeContract: mintSKU, data: mintHash } = useWriteContract();
  const { isLoading: isMinting, isSuccess: mintSuccess } = useWaitForTransactionReceipt({
    hash: mintHash,
  });

  // Purchase SKU
  const { writeContract: purchaseSKU, data: purchaseHash } = useWriteContract();
  const { isLoading: isPurchasing, isSuccess: purchaseSuccess } = useWaitForTransactionReceipt({
    hash: purchaseHash,
  });

  // Handle mint success
  useEffect(() => {
    if (mintSuccess) {
      toast({
        title: 'SKU Created!',
        description: 'Your SKU has been minted successfully',
      });
      setNewSKU({
        name: '',
        description: '',
        price: '',
        category: SKUCategory.GAME,
        file: null,
      });
    }
  }, [mintSuccess]);

  // Handle purchase success
  useEffect(() => {
    if (purchaseSuccess) {
      toast({
        title: 'SKU Purchased!',
        description: `${selectedSKU?.name} added to your inventory`,
      });
      refetchOwned();
      setPurchaseDialogOpen(false);
    }
  }, [purchaseSuccess]);

  const handleMintSKU = async () => {
    if (!newSKU.name || !newSKU.price || !newSKU.file) {
      toast({
        title: 'Missing Information',
        description: 'Please fill in all fields',
        variant: 'destructive',
      });
      return;
    }

    try {
      // Upload file to IPFS/CDN (mock implementation)
      const contentHash = '0x' + Array(64).fill(0).map(() => 
        Math.floor(Math.random() * 16).toString(16)
      ).join(''); // Mock hash

      mintSKU({
        address: CONTRACTS.SKU_REGISTRY,
        abi: SKU_REGISTRY_ABI,
        functionName: 'mintSKU',
        args: [
          newSKU.name,
          newSKU.description,
          parseEther(newSKU.price),
          contentHash as `0x${string}`,
          newSKU.category,
        ],
      });
    } catch (error) {
      console.error('Error minting SKU:', error);
      toast({
        title: 'Mint Failed',
        description: 'Failed to mint SKU',
        variant: 'destructive',
      });
    }
  };

  const handlePurchaseSKU = () => {
    if (!selectedSKU) return;

    purchaseSKU({
      address: CONTRACTS.SKU_REGISTRY,
      abi: SKU_REGISTRY_ABI,
      functionName: 'purchaseSKU',
      args: [BigInt(selectedSKU.id)],
      value: selectedSKU.price,
    });
  };

  // Mock SKU data (would fetch from contract)
  const allSKUs: SKU[] = [
    {
      id: 1,
      name: 'Retro Racer N64',
      description: 'Classic racing game with N64 engine',
      creator: '0x1234567890123456789012345678901234567890' as Address,
      price: parseEther('100'),
      sales: 150,
      revenue: parseEther('15000'),
      category: SKUCategory.GAME,
      contentHash: '0xabcd...',
      imageUrl: '/skus/retro-racer.png',
    },
    {
      id: 2,
      name: 'Neon Sword Skin',
      description: 'Glowing neon sword for metaverse battles',
      creator: '0x2345678901234567890123456789012345678901' as Address,
      price: parseEther('25'),
      sales: 320,
      revenue: parseEther('8000'),
      category: SKUCategory.SKIN,
      contentHash: '0xdef0...',
      imageUrl: '/skus/neon-sword.png',
    },
    {
      id: 3,
      name: 'LoFi Beats Vol. 1',
      description: 'Chill beats for your metaverse',
      creator: '0x3456789012345678901234567890123456789012' as Address,
      price: parseEther('10'),
      sales: 500,
      revenue: parseEther('5000'),
      category: SKUCategory.MUSIC,
      contentHash: '0x1234...',
      imageUrl: '/skus/lofi-beats.png',
    },
  ];

  const filteredSKUs = selectedCategory === 'all' 
    ? allSKUs 
    : allSKUs.filter(sku => sku.category === selectedCategory);

  const ownedSKUs = allSKUs.filter(sku => 
    ownedSKUIds?.includes(BigInt(sku.id))
  );

  const createdSKUs = allSKUs.filter(sku => 
    creatorSKUIds?.includes(BigInt(sku.id))
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold">SKU Inventory System</h2>
          <p className="text-muted-foreground">
            Universal content distribution • Buy once, use everywhere • Creators earn 45%
          </p>
        </div>
        <div className="flex gap-2">
          <Badge variant="outline">Owned: {ownedSKUIds?.length ?? 0}</Badge>
          <Badge variant="secondary">Created: {creatorSKUIds?.length ?? 0}</Badge>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={view} onValueChange={(v) => setView(v as any)}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="browse">Browse SKUs</TabsTrigger>
          <TabsTrigger value="owned">My Inventory</TabsTrigger>
          <TabsTrigger value="create">Create SKU</TabsTrigger>
        </TabsList>

        {/* Browse SKUs */}
        <TabsContent value="browse" className="space-y-4">
          {/* Category Filter */}
          <div className="flex gap-2">
            <Button
              variant={selectedCategory === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedCategory('all')}
            >
              All
            </Button>
            {Object.keys(SKUCategory).filter(k => isNaN(Number(k))).map((cat) => (
              <Button
                key={cat}
                variant={selectedCategory === SKUCategory[cat as keyof typeof SKUCategory] ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedCategory(SKUCategory[cat as keyof typeof SKUCategory])}
              >
                {cat}
              </Button>
            ))}
          </div>

          {/* SKU Grid */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredSKUs.map((sku) => (
              <Card key={sku.id} className="overflow-hidden">
                <div className="aspect-video bg-muted" />
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-lg">{sku.name}</CardTitle>
                    <Badge>{SKUCategory[sku.category]}</Badge>
                  </div>
                  <CardDescription className="line-clamp-2">
                    {sku.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Price:</span>
                      <span className="font-medium">{formatEther(sku.price)} VOID</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Sales:</span>
                      <span className="font-medium">{sku.sales}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Creator Revenue:</span>
                      <span className="font-medium">{formatEther(sku.revenue)} VOID</span>
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button
                    className="w-full"
                    onClick={() => {
                      setSelectedSKU(sku);
                      setPurchaseDialogOpen(true);
                    }}
                  >
                    Purchase for {formatEther(sku.price)} VOID
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* My Inventory */}
        <TabsContent value="owned" className="space-y-4">
          {ownedSKUs.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">No SKUs owned yet</p>
                <Button onClick={() => setView('browse')} className="mt-4">
                  Browse SKUs
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {ownedSKUs.map((sku) => (
                <Card key={sku.id}>
                  <div className="aspect-video bg-muted" />
                  <CardHeader>
                    <CardTitle className="text-lg">{sku.name}</CardTitle>
                    <CardDescription>{sku.description}</CardDescription>
                  </CardHeader>
                  <CardFooter>
                    <Button className="w-full">Use in Game</Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Create SKU */}
        <TabsContent value="create" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Create New SKU</CardTitle>
              <CardDescription>
                Mint a new SKU and earn 45% on every sale • Content delivered via CDN
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Name</Label>
                <Input
                  value={newSKU.name}
                  onChange={(e) => setNewSKU({ ...newSKU, name: e.target.value })}
                  placeholder="Retro Racer N64"
                />
              </div>

              <div>
                <Label>Description</Label>
                <Textarea
                  value={newSKU.description}
                  onChange={(e) => setNewSKU({ ...newSKU, description: e.target.value })}
                  placeholder="Describe your SKU..."
                  rows={3}
                />
              </div>

              <div>
                <Label>Price (VOID)</Label>
                <Input
                  type="number"
                  value={newSKU.price}
                  onChange={(e) => setNewSKU({ ...newSKU, price: e.target.value })}
                  placeholder="100"
                />
              </div>

              <div>
                <Label>Category</Label>
                <select
                  className="w-full border rounded-md p-2"
                  value={newSKU.category}
                  onChange={(e) => setNewSKU({ ...newSKU, category: parseInt(e.target.value) as SKUCategory })}
                >
                  {Object.keys(SKUCategory).filter(k => isNaN(Number(k))).map((cat) => (
                    <option key={cat} value={SKUCategory[cat as keyof typeof SKUCategory]}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <Label>Upload File</Label>
                <Input
                  type="file"
                  onChange={(e) => setNewSKU({ ...newSKU, file: e.target.files?.[0] || null })}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Upload your game, item, or content file (max 500MB)
                </p>
              </div>

              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm font-medium">Revenue Split:</p>
                <ul className="text-sm text-muted-foreground mt-2 space-y-1">
                  <li>• You earn: 45% of every sale</li>
                  <li>• CDN partners: 10%</li>
                  <li>• Ecosystem fees: 45% (distributed via V4 hooks)</li>
                </ul>
              </div>
            </CardContent>
            <CardFooter>
              <Button
                className="w-full"
                onClick={handleMintSKU}
                disabled={isMinting || !newSKU.name || !newSKU.price || !newSKU.file}
              >
                {isMinting ? 'Minting...' : 'Mint SKU'}
              </Button>
            </CardFooter>
          </Card>

          {/* Creator Stats */}
          {createdSKUs.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Your Creator Stats</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">SKUs Created</p>
                    <p className="text-2xl font-bold">{createdSKUs.length}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Sales</p>
                    <p className="text-2xl font-bold">
                      {createdSKUs.reduce((sum, sku) => sum + sku.sales, 0)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Revenue</p>
                    <p className="text-2xl font-bold">
                      {formatEther(createdSKUs.reduce((sum, sku) => sum + sku.revenue, 0n))} VOID
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Purchase Dialog */}
      <Dialog open={purchaseDialogOpen} onOpenChange={setPurchaseDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Purchase SKU</DialogTitle>
            <DialogDescription>{selectedSKU?.name}</DialogDescription>
          </DialogHeader>

          {selectedSKU && (
            <div className="space-y-4">
              <div className="aspect-video bg-muted rounded-lg" />
              
              <div>
                <p className="text-sm font-medium">{selectedSKU.description}</p>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Price:</span>
                  <p className="font-medium">{formatEther(selectedSKU.price)} VOID</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Category:</span>
                  <p className="font-medium">{SKUCategory[selectedSKU.category]}</p>
                </div>
              </div>

              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm font-medium">What you get:</p>
                <ul className="text-sm text-muted-foreground mt-2 space-y-1">
                  <li>• Permanent ownership of this SKU</li>
                  <li>• Use in all ecosystem products</li>
                  <li>• Instant delivery via CDN</li>
                  <li>• Support creator (45% goes to them)</li>
                </ul>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setPurchaseDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handlePurchaseSKU} disabled={isPurchasing}>
              {isPurchasing ? 'Purchasing...' : `Purchase for ${selectedSKU ? formatEther(selectedSKU.price) : '0'} VOID`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
