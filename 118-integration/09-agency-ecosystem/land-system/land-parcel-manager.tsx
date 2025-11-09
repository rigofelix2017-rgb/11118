/**
 * Land Parcel Manager
 * 
 * Comprehensive metaverse land/real estate system that integrates with:
 * - void2 housing system (house-interior.tsx)
 * - VOID token for purchases
 * - PSX token for premium areas (Glizzy World = 100k PSX)
 * - Business licenses
 * - Play-to-earn economy (80% revenue to community)
 */

import React, { useState, useEffect } from 'react';
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseEther, formatEther, Address } from 'viem';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

// Contract ABIs
const LAND_REGISTRY_ABI = [
  {
    inputs: [{ name: 'parcelId', type: 'uint256' }],
    name: 'purchaseParcel',
    outputs: [],
    stateMutability: 'payable',
    type: 'function'
  },
  {
    inputs: [{ name: 'parcelId', type: 'uint256' }, { name: 'licenseType', type: 'uint8' }],
    name: 'purchaseLicense',
    outputs: [],
    stateMutability: 'payable',
    type: 'function'
  },
  {
    inputs: [{ name: 'owner', type: 'address' }],
    name: 'getOwnerParcels',
    outputs: [{ name: '', type: 'uint256[]' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [{ name: 'parcelId', type: 'uint256' }],
    name: 'getParcelDetails',
    outputs: [
      { name: 'owner', type: 'address' },
      { name: 'price', type: 'uint256' },
      { name: 'zone', type: 'uint8' },
      { name: 'hasHouse', type: 'bool' },
      { name: 'businessLicense', type: 'uint8' }
    ],
    stateMutability: 'view',
    type: 'function'
  }
] as const;

const PSX_TOKEN_ABI = [
  {
    inputs: [{ name: 'account', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [{ name: 'spender', type: 'address' }, { name: 'amount', type: 'uint256' }],
    name: 'approve',
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'nonpayable',
    type: 'function'
  }
] as const;

// Contract addresses (update with deployed addresses)
const CONTRACTS = {
  LAND_REGISTRY: '0x0000000000000000000000000000000000000000' as Address,
  VOID_TOKEN: '0x0000000000000000000000000000000000000000' as Address,
  PSX_TOKEN: '0x0000000000000000000000000000000000000000' as Address,
};

// Zone types
enum Zone {
  PUBLIC = 0,
  RESIDENTIAL = 1,
  COMMERCIAL = 2,
  PREMIUM = 3,
  GLIZZY_WORLD = 4 // Requires 100k PSX
}

// Business license types
enum LicenseType {
  NONE = 0,
  RETAIL = 1,
  ENTERTAINMENT = 2,
  SERVICES = 3,
  GAMING = 4
}

interface Parcel {
  id: number;
  owner: Address | null;
  price: bigint;
  zone: Zone;
  hasHouse: boolean;
  businessLicense: LicenseType;
  x: number;
  y: number;
  width: number;
  height: number;
}

interface LandParcelManagerProps {
  onHouseClick?: (parcelId: number) => void; // Opens house-interior.tsx
}

export function LandParcelManager({ onHouseClick }: LandParcelManagerProps) {
  const { address } = useAccount();
  const { toast } = useToast();
  const [selectedParcel, setSelectedParcel] = useState<Parcel | null>(null);
  const [purchaseDialogOpen, setPurchaseDialogOpen] = useState(false);
  const [licenseDialogOpen, setLicenseDialogOpen] = useState(false);
  const [selectedLicense, setSelectedLicense] = useState<LicenseType>(LicenseType.RETAIL);
  const [mapView, setMapView] = useState<'grid' | 'owned'>('grid');
  const [hoveredParcel, setHoveredParcel] = useState<number | null>(null);

  // Read user's PSX balance (for Glizzy World access)
  const { data: psxBalance } = useReadContract({
    address: CONTRACTS.PSX_TOKEN,
    abi: PSX_TOKEN_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
  });

  // Read owned parcels
  const { data: ownedParcelIds, refetch: refetchOwned } = useReadContract({
    address: CONTRACTS.LAND_REGISTRY,
    abi: LAND_REGISTRY_ABI,
    functionName: 'getOwnerParcels',
    args: address ? [address] : undefined,
  });

  // Purchase parcel
  const { writeContract: purchaseParcel, data: purchaseHash } = useWriteContract();
  const { isLoading: isPurchasing, isSuccess: purchaseSuccess } = useWaitForTransactionReceipt({
    hash: purchaseHash,
  });

  // Purchase license
  const { writeContract: purchaseLicense, data: licenseHash } = useWriteContract();
  const { isLoading: isLicensing, isSuccess: licenseSuccess } = useWaitForTransactionReceipt({
    hash: licenseHash,
  });

  // Generate parcel grid (100x100 parcels = 10,000 total)
  const GRID_SIZE = 100;
  const parcels: Parcel[] = React.useMemo(() => {
    const generated: Parcel[] = [];
    for (let y = 0; y < GRID_SIZE; y++) {
      for (let x = 0; x < GRID_SIZE; x++) {
        const id = y * GRID_SIZE + x;
        
        // Define zones based on coordinates
        let zone = Zone.PUBLIC;
        let price = parseEther('100'); // 100 VOID default
        
        // Center area = Premium (higher price)
        if (x >= 40 && x < 60 && y >= 40 && y < 60) {
          zone = Zone.PREMIUM;
          price = parseEther('500');
        }
        // Glizzy World corner (requires 100k PSX)
        else if (x >= 80 && y >= 80) {
          zone = Zone.GLIZZY_WORLD;
          price = parseEther('1000');
        }
        // Commercial zones (near center)
        else if ((x >= 35 && x < 65) || (y >= 35 && y < 65)) {
          zone = Zone.COMMERCIAL;
          price = parseEther('300');
        }
        // Residential zones
        else if ((x >= 20 && x < 80) && (y >= 20 && y < 80)) {
          zone = Zone.RESIDENTIAL;
          price = parseEther('200');
        }
        
        generated.push({
          id,
          owner: null, // Would fetch from contract
          price,
          zone,
          hasHouse: false,
          businessLicense: LicenseType.NONE,
          x,
          y,
          width: 1,
          height: 1,
        });
      }
    }
    return generated;
  }, []);

  // Handle purchase success
  useEffect(() => {
    if (purchaseSuccess) {
      toast({
        title: 'Parcel Purchased!',
        description: `Successfully purchased parcel #${selectedParcel?.id}`,
      });
      refetchOwned();
      setPurchaseDialogOpen(false);
    }
  }, [purchaseSuccess]);

  useEffect(() => {
    if (licenseSuccess) {
      toast({
        title: 'License Acquired!',
        description: `Successfully purchased ${LicenseType[selectedLicense]} license`,
      });
      refetchOwned();
      setLicenseDialogOpen(false);
    }
  }, [licenseSuccess]);

  const handlePurchaseParcel = () => {
    if (!selectedParcel) return;

    // Check PSX balance for Glizzy World
    if (selectedParcel.zone === Zone.GLIZZY_WORLD) {
      const requiredPsx = parseEther('100000'); // 100k PSX
      if (!psxBalance || psxBalance < requiredPsx) {
        toast({
          title: 'Insufficient PSX',
          description: 'Glizzy World requires 100,000 PSX tokens',
          variant: 'destructive',
        });
        return;
      }
    }

    purchaseParcel({
      address: CONTRACTS.LAND_REGISTRY,
      abi: LAND_REGISTRY_ABI,
      functionName: 'purchaseParcel',
      args: [BigInt(selectedParcel.id)],
      value: selectedParcel.price,
    });
  };

  const handlePurchaseLicense = () => {
    if (!selectedParcel) return;

    const licensePrices = {
      [LicenseType.RETAIL]: parseEther('50'),
      [LicenseType.ENTERTAINMENT]: parseEther('75'),
      [LicenseType.SERVICES]: parseEther('50'),
      [LicenseType.GAMING]: parseEther('100'),
    };

    purchaseLicense({
      address: CONTRACTS.LAND_REGISTRY,
      abi: LAND_REGISTRY_ABI,
      functionName: 'purchaseLicense',
      args: [BigInt(selectedParcel.id), selectedLicense],
      value: licensePrices[selectedLicense],
    });
  };

  const getZoneColor = (zone: Zone): string => {
    switch (zone) {
      case Zone.PUBLIC: return 'bg-gray-300';
      case Zone.RESIDENTIAL: return 'bg-green-300';
      case Zone.COMMERCIAL: return 'bg-blue-300';
      case Zone.PREMIUM: return 'bg-purple-400';
      case Zone.GLIZZY_WORLD: return 'bg-yellow-400';
      default: return 'bg-gray-300';
    }
  };

  const canAccessParcel = (parcel: Parcel): boolean => {
    if (parcel.zone !== Zone.GLIZZY_WORLD) return true;
    const requiredPsx = parseEther('100000');
    return psxBalance ? psxBalance >= requiredPsx : false;
  };

  const ownedParcels = parcels.filter(p => 
    ownedParcelIds?.includes(BigInt(p.id))
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold">Metaverse Land Registry</h2>
          <p className="text-muted-foreground">
            Own land, build houses, start businesses • 80% revenue to community
          </p>
        </div>
        <div className="flex gap-2">
          <Badge variant="outline">
            PSX Balance: {psxBalance ? formatEther(psxBalance) : '0'}
          </Badge>
          <Badge variant="secondary">
            Owned Parcels: {ownedParcelIds?.length ?? 0}
          </Badge>
        </div>
      </div>

      {/* View Tabs */}
      <Tabs value={mapView} onValueChange={(v) => setMapView(v as 'grid' | 'owned')}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="grid">Map View</TabsTrigger>
          <TabsTrigger value="owned">My Parcels</TabsTrigger>
        </TabsList>

        {/* Grid Map View */}
        <TabsContent value="grid" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Land Map</CardTitle>
              <CardDescription>
                Click parcels to purchase • Green = Residential • Blue = Commercial • Purple = Premium • Yellow = Glizzy World
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Map Legend */}
              <div className="flex gap-4 mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-gray-300 border" />
                  <span className="text-sm">Public</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-green-300 border" />
                  <span className="text-sm">Residential</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-blue-300 border" />
                  <span className="text-sm">Commercial</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-purple-400 border" />
                  <span className="text-sm">Premium</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-yellow-400 border" />
                  <span className="text-sm">Glizzy World (100k PSX)</span>
                </div>
              </div>

              {/* Simplified grid (show every 5th parcel for performance) */}
              <div className="grid gap-0.5 border" style={{ 
                gridTemplateColumns: `repeat(${GRID_SIZE / 5}, minmax(0, 1fr))`,
                maxWidth: '800px',
                aspectRatio: '1/1'
              }}>
                {parcels.filter((_, i) => i % 5 === 0).map((parcel) => (
                  <button
                    key={parcel.id}
                    className={`
                      ${getZoneColor(parcel.zone)} 
                      border border-gray-400 
                      hover:ring-2 hover:ring-black
                      transition-all
                      ${parcel.owner ? 'opacity-50' : 'opacity-100'}
                      ${hoveredParcel === parcel.id ? 'ring-2 ring-blue-500' : ''}
                    `}
                    onClick={() => {
                      setSelectedParcel(parcel);
                      setPurchaseDialogOpen(true);
                    }}
                    onMouseEnter={() => setHoveredParcel(parcel.id)}
                    onMouseLeave={() => setHoveredParcel(null)}
                    disabled={!!parcel.owner}
                    title={`Parcel #${parcel.id} • ${Zone[parcel.zone]} • ${formatEther(parcel.price)} VOID`}
                  />
                ))}
              </div>

              {hoveredParcel !== null && (
                <div className="mt-2 text-sm text-muted-foreground">
                  Parcel #{hoveredParcel} • {Zone[parcels[hoveredParcel].zone]} • {formatEther(parcels[hoveredParcel].price)} VOID
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Owned Parcels View */}
        <TabsContent value="owned" className="space-y-4">
          {ownedParcels.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">No parcels owned yet</p>
                <Button onClick={() => setMapView('grid')} className="mt-4">
                  Browse Available Land
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {ownedParcels.map((parcel) => (
                <Card key={parcel.id}>
                  <CardHeader>
                    <CardTitle>Parcel #{parcel.id}</CardTitle>
                    <CardDescription>
                      {Zone[parcel.zone]} • ({parcel.x}, {parcel.y})
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm">Zone:</span>
                      <Badge>{Zone[parcel.zone]}</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">House:</span>
                      <Badge variant={parcel.hasHouse ? 'default' : 'outline'}>
                        {parcel.hasHouse ? 'Built' : 'Empty'}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">License:</span>
                      <Badge variant={parcel.businessLicense !== LicenseType.NONE ? 'default' : 'outline'}>
                        {parcel.businessLicense !== LicenseType.NONE 
                          ? LicenseType[parcel.businessLicense]
                          : 'None'
                        }
                      </Badge>
                    </div>
                  </CardContent>
                  <CardFooter className="gap-2">
                    {parcel.hasHouse ? (
                      <Button 
                        onClick={() => onHouseClick?.(parcel.id)}
                        className="flex-1"
                      >
                        Enter House
                      </Button>
                    ) : (
                      <Button 
                        onClick={() => onHouseClick?.(parcel.id)}
                        variant="outline"
                        className="flex-1"
                      >
                        Build House
                      </Button>
                    )}
                    <Button
                      onClick={() => {
                        setSelectedParcel(parcel);
                        setLicenseDialogOpen(true);
                      }}
                      variant="secondary"
                      className="flex-1"
                    >
                      Get License
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Purchase Dialog */}
      <Dialog open={purchaseDialogOpen} onOpenChange={setPurchaseDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Purchase Parcel #{selectedParcel?.id}</DialogTitle>
            <DialogDescription>
              {selectedParcel && Zone[selectedParcel.zone]} zone parcel at ({selectedParcel?.x}, {selectedParcel?.y})
            </DialogDescription>
          </DialogHeader>
          
          {selectedParcel && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Zone</Label>
                  <p className="text-sm font-medium">{Zone[selectedParcel.zone]}</p>
                </div>
                <div>
                  <Label>Price</Label>
                  <p className="text-sm font-medium">{formatEther(selectedParcel.price)} VOID</p>
                </div>
                <div>
                  <Label>Coordinates</Label>
                  <p className="text-sm font-medium">({selectedParcel.x}, {selectedParcel.y})</p>
                </div>
                <div>
                  <Label>Size</Label>
                  <p className="text-sm font-medium">{selectedParcel.width}x{selectedParcel.height}</p>
                </div>
              </div>

              {selectedParcel.zone === Zone.GLIZZY_WORLD && (
                <div className="p-4 bg-yellow-100 dark:bg-yellow-900/20 rounded-lg">
                  <p className="text-sm font-medium">⚠️ Glizzy World Access</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Requires 100,000 PSX tokens to purchase
                  </p>
                  <p className="text-sm mt-2">
                    Your balance: {psxBalance ? formatEther(psxBalance) : '0'} PSX
                  </p>
                </div>
              )}

              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm">
                  <strong>What you can do:</strong>
                </p>
                <ul className="text-sm text-muted-foreground mt-2 space-y-1">
                  <li>• Build a house (connects to house-interior.tsx)</li>
                  <li>• Purchase business license</li>
                  <li>• Start play-to-earn activities</li>
                  <li>• Earn from land appreciation</li>
                </ul>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setPurchaseDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handlePurchaseParcel}
              disabled={isPurchasing || (selectedParcel ? !canAccessParcel(selectedParcel) : true)}
            >
              {isPurchasing ? 'Purchasing...' : `Purchase for ${selectedParcel ? formatEther(selectedParcel.price) : '0'} VOID`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* License Purchase Dialog */}
      <Dialog open={licenseDialogOpen} onOpenChange={setLicenseDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Purchase Business License</DialogTitle>
            <DialogDescription>
              Parcel #{selectedParcel?.id} • Start earning from business activities
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label>License Type</Label>
              <Select 
                value={selectedLicense.toString()} 
                onValueChange={(v) => setSelectedLicense(parseInt(v) as LicenseType)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={LicenseType.RETAIL.toString()}>
                    Retail (50 VOID) - Sell items & SKUs
                  </SelectItem>
                  <SelectItem value={LicenseType.ENTERTAINMENT.toString()}>
                    Entertainment (75 VOID) - Host events
                  </SelectItem>
                  <SelectItem value={LicenseType.SERVICES.toString()}>
                    Services (50 VOID) - Offer services
                  </SelectItem>
                  <SelectItem value={LicenseType.GAMING.toString()}>
                    Gaming (100 VOID) - Run games
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm font-medium">License Benefits:</p>
              <ul className="text-sm text-muted-foreground mt-2 space-y-1">
                <li>• Earn 80% of business revenue (20% to ecosystem)</li>
                <li>• Access to business tools and analytics</li>
                <li>• Listed in metaverse directory</li>
                <li>• Participate in business governance</li>
              </ul>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setLicenseDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handlePurchaseLicense} disabled={isLicensing}>
              {isLicensing ? 'Processing...' : 'Purchase License'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
