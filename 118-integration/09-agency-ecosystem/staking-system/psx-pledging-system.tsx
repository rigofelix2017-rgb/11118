/**
 * PSX Pledging System
 * 
 * Convert PSX tokens to VOID at a fixed rate (1 PSX = 100 VOID)
 * Locks PSX permanently to mint VOID
 * 
 * Features:
 * - 1 PSX = 100 VOID conversion rate
 * - PSX locked permanently in pledge vault
 * - VOID minted from reserved supply (47.5% of total)
 * - Benefits existing PSX holders while bootstrapping VOID liquidity
 */

import React, { useState, useEffect } from 'react';
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseEther, formatEther, Address } from 'viem';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { ArrowRight } from 'lucide-react';

// Contract ABIs
const PLEDGE_VAULT_ABI = [
  {
    inputs: [{ name: 'psxAmount', type: 'uint256' }],
    name: 'pledgePSX',
    outputs: [{ name: 'voidAmount', type: 'uint256' }],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [{ name: 'account', type: 'address' }],
    name: 'getPledgeInfo',
    outputs: [
      { name: 'totalPledged', type: 'uint256' },
      { name: 'totalReceived', type: 'uint256' }
    ],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [],
    name: 'getVaultStats',
    outputs: [
      { name: 'totalPSXLocked', type: 'uint256' },
      { name: 'totalVOIDMinted', type: 'uint256' },
      { name: 'voidRemaining', type: 'uint256' }
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

const VOID_TOKEN_ABI = [
  {
    inputs: [{ name: 'account', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function'
  }
] as const;

// Contract addresses
const CONTRACTS = {
  PLEDGE_VAULT: '0x0000000000000000000000000000000000000000' as Address,
  PSX_TOKEN: '0x0000000000000000000000000000000000000000' as Address,
  VOID_TOKEN: '0x0000000000000000000000000000000000000000' as Address,
};

const CONVERSION_RATE = 100; // 1 PSX = 100 VOID

export function PSXPledgingSystem() {
  const { address } = useAccount();
  const { toast } = useToast();
  const [psxAmount, setPsxAmount] = useState('');
  const [pledgeDialogOpen, setPledgeDialogOpen] = useState(false);

  // Read PSX balance
  const { data: psxBalance } = useReadContract({
    address: CONTRACTS.PSX_TOKEN,
    abi: PSX_TOKEN_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
  });

  // Read VOID balance
  const { data: voidBalance } = useReadContract({
    address: CONTRACTS.VOID_TOKEN,
    abi: VOID_TOKEN_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
  });

  // Read pledge info
  const { data: pledgeInfo, refetch: refetchPledge } = useReadContract({
    address: CONTRACTS.PLEDGE_VAULT,
    abi: PLEDGE_VAULT_ABI,
    functionName: 'getPledgeInfo',
    args: address ? [address] : undefined,
  });

  // Read vault stats
  const { data: vaultStats } = useReadContract({
    address: CONTRACTS.PLEDGE_VAULT,
    abi: PLEDGE_VAULT_ABI,
    functionName: 'getVaultStats',
  });

  // Approve PSX
  const { writeContract: approvePSX, data: approveHash } = useWriteContract();
  const { isLoading: isApproving, isSuccess: approveSuccess } = useWaitForTransactionReceipt({
    hash: approveHash,
  });

  // Pledge PSX
  const { writeContract: pledgePSX, data: pledgeHash } = useWriteContract();
  const { isLoading: isPledging, isSuccess: pledgeSuccess } = useWaitForTransactionReceipt({
    hash: pledgeHash,
  });

  // Handle pledge success
  useEffect(() => {
    if (pledgeSuccess) {
      const voidReceived = parseFloat(psxAmount) * CONVERSION_RATE;
      toast({
        title: 'Pledge Successful!',
        description: `Pledged ${psxAmount} PSX → Received ${voidReceived} VOID`,
      });
      refetchPledge();
      setPledgeDialogOpen(false);
      setPsxAmount('');
    }
  }, [pledgeSuccess]);

  const handleApprove = () => {
    if (!psxAmount) return;

    approvePSX({
      address: CONTRACTS.PSX_TOKEN,
      abi: PSX_TOKEN_ABI,
      functionName: 'approve',
      args: [CONTRACTS.PLEDGE_VAULT, parseEther(psxAmount)],
    });
  };

  const handlePledge = () => {
    if (!psxAmount) return;

    pledgePSX({
      address: CONTRACTS.PLEDGE_VAULT,
      abi: PLEDGE_VAULT_ABI,
      functionName: 'pledgePSX',
      args: [parseEther(psxAmount)],
    });
  };

  const voidToReceive = psxAmount ? parseFloat(psxAmount) * CONVERSION_RATE : 0;

  const userPledgeInfo = pledgeInfo ? {
    totalPledged: pledgeInfo[0],
    totalReceived: pledgeInfo[1],
  } : null;

  const vaultStatsData = vaultStats ? {
    totalPSXLocked: vaultStats[0],
    totalVOIDMinted: vaultStats[1],
    voidRemaining: vaultStats[2],
  } : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold">PSX Pledging System</h2>
          <p className="text-muted-foreground">
            Convert PSX to VOID at 1:100 ratio • PSX locked permanently
          </p>
        </div>
        <div className="flex gap-2">
          <Badge variant="outline">
            PSX: {psxBalance ? formatEther(psxBalance) : '0'}
          </Badge>
          <Badge variant="secondary">
            VOID: {voidBalance ? formatEther(voidBalance) : '0'}
          </Badge>
        </div>
      </div>

      {/* Vault Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total PSX Locked</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {vaultStatsData ? formatEther(vaultStatsData.totalPSXLocked) : '0'}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Permanently locked in vault
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total VOID Minted</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {vaultStatsData ? formatEther(vaultStatsData.totalVOIDMinted) : '0'}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              From PSX pledging
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>VOID Remaining</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {vaultStatsData ? formatEther(vaultStatsData.voidRemaining) : '0'}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Available to mint
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Pledge Interface */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Pledge Form */}
        <Card>
          <CardHeader>
            <CardTitle>Pledge PSX for VOID</CardTitle>
            <CardDescription>
              Conversion rate: 1 PSX = 100 VOID
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>PSX Amount to Pledge</Label>
              <Input
                type="number"
                value={psxAmount}
                onChange={(e) => setPsxAmount(e.target.value)}
                placeholder="100"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Available: {psxBalance ? formatEther(psxBalance) : '0'} PSX
              </p>
            </div>

            {psxAmount && (
              <div className="p-4 bg-muted rounded-lg">
                <div className="flex items-center justify-between mb-4">
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">You Pledge</p>
                    <p className="text-2xl font-bold">{psxAmount} PSX</p>
                  </div>
                  <ArrowRight className="h-6 w-6 text-muted-foreground" />
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">You Receive</p>
                    <p className="text-2xl font-bold text-green-600">
                      {voidToReceive.toLocaleString()} VOID
                    </p>
                  </div>
                </div>

                <div className="border-t pt-3 space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Conversion Rate:</span>
                    <span className="font-medium">1 PSX = 100 VOID</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">PSX Status:</span>
                    <span className="font-medium">Locked Forever</span>
                  </div>
                </div>
              </div>
            )}

            <Button
              className="w-full"
              onClick={() => setPledgeDialogOpen(true)}
              disabled={!psxAmount || parseFloat(psxAmount) <= 0}
            >
              Pledge PSX
            </Button>

            <div className="p-4 bg-yellow-100 dark:bg-yellow-900/20 rounded-lg">
              <p className="text-sm font-medium">⚠️ Important</p>
              <ul className="text-sm text-muted-foreground mt-2 space-y-1">
                <li>• PSX tokens are locked permanently</li>
                <li>• VOID tokens minted immediately</li>
                <li>• Cannot reverse this action</li>
                <li>• Benefits PSX holders with instant VOID liquidity</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Your Pledge History */}
        <Card>
          <CardHeader>
            <CardTitle>Your Pledge History</CardTitle>
            <CardDescription>Total PSX pledged and VOID received</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {userPledgeInfo && userPledgeInfo.totalPledged > 0 ? (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 border rounded-lg">
                    <p className="text-sm text-muted-foreground mb-1">Total PSX Pledged</p>
                    <p className="text-2xl font-bold">
                      {formatEther(userPledgeInfo.totalPledged)}
                    </p>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <p className="text-sm text-muted-foreground mb-1">Total VOID Received</p>
                    <p className="text-2xl font-bold text-green-600">
                      {formatEther(userPledgeInfo.totalReceived)}
                    </p>
                  </div>
                </div>

                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-sm font-medium mb-2">Benefits Unlocked:</p>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>✅ VOID tokens for ecosystem use</li>
                    <li>✅ Access to metaverse land</li>
                    <li>✅ Stake VOID for yield (25-125% APY)</li>
                    <li>✅ Purchase SKUs and services</li>
                    <li>✅ Participate in governance</li>
                  </ul>
                </div>
              </>
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground mb-2">No pledges yet</p>
                <p className="text-sm text-muted-foreground">
                  Convert PSX to VOID to get started
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Why Pledge? */}
      <Card>
        <CardHeader>
          <CardTitle>Why Pledge PSX?</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="p-4 border rounded-lg">
              <h4 className="font-medium mb-2">🌐 Access Metaverse</h4>
              <p className="text-sm text-muted-foreground">
                VOID is the primary currency for land, houses, and business licenses
              </p>
            </div>
            <div className="p-4 border rounded-lg">
              <h4 className="font-medium mb-2">💰 Earn Yield</h4>
              <p className="text-sm text-muted-foreground">
                Stake VOID for 25-125% APY from all ecosystem activity
              </p>
            </div>
            <div className="p-4 border rounded-lg">
              <h4 className="font-medium mb-2">🎮 Buy Content</h4>
              <p className="text-sm text-muted-foreground">
                Purchase games, items, and SKUs with VOID tokens
              </p>
            </div>
            <div className="p-4 border rounded-lg">
              <h4 className="font-medium mb-2">🏆 Early Adopter</h4>
              <p className="text-sm text-muted-foreground">
                Get VOID before public launch and price discovery
              </p>
            </div>
            <div className="p-4 border rounded-lg">
              <h4 className="font-medium mb-2">📈 Value Accrual</h4>
              <p className="text-sm text-muted-foreground">
                VOID grows with ecosystem - all fees distributed to holders
              </p>
            </div>
            <div className="p-4 border rounded-lg">
              <h4 className="font-medium mb-2">🔒 Deflationary</h4>
              <p className="text-sm text-muted-foreground">
                PSX locked forever reduces supply, potentially increasing value
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Pledge Dialog */}
      <Dialog open={pledgeDialogOpen} onOpenChange={setPledgeDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm PSX Pledge</DialogTitle>
            <DialogDescription>
              ⚠️ PSX will be locked permanently - this cannot be reversed
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="p-4 bg-muted rounded-lg">
              <div className="flex justify-between mb-2">
                <span className="text-sm">PSX to Pledge:</span>
                <span className="text-sm font-medium">{psxAmount} PSX</span>
              </div>
              <div className="flex justify-between mb-2">
                <span className="text-sm">VOID to Receive:</span>
                <span className="text-sm font-medium text-green-600">
                  {voidToReceive.toLocaleString()} VOID
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Conversion Rate:</span>
                <span className="text-sm font-medium">1:100</span>
              </div>
            </div>

            <div className="p-4 bg-red-100 dark:bg-red-900/20 rounded-lg">
              <p className="text-sm font-medium">⚠️ Warning: Permanent Lock</p>
              <p className="text-sm text-muted-foreground mt-2">
                Your PSX tokens will be locked in the vault permanently. 
                You cannot retrieve them. Only proceed if you're certain.
              </p>
            </div>

            <div className="p-4 bg-green-100 dark:bg-green-900/20 rounded-lg">
              <p className="text-sm font-medium">✅ What You Get</p>
              <ul className="text-sm text-muted-foreground mt-2 space-y-1">
                <li>• {voidToReceive.toLocaleString()} VOID tokens immediately</li>
                <li>• Access to entire VOID ecosystem</li>
                <li>• Ability to stake for 25-125% APY</li>
                <li>• Purchase land, SKUs, and services</li>
              </ul>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setPledgeDialogOpen(false)}>
              Cancel
            </Button>
            {!approveSuccess ? (
              <Button onClick={handleApprove} disabled={isApproving}>
                {isApproving ? 'Approving...' : 'Approve PSX'}
              </Button>
            ) : (
              <Button onClick={handlePledge} disabled={isPledging} variant="destructive">
                {isPledging ? 'Pledging...' : 'Confirm Pledge'}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
