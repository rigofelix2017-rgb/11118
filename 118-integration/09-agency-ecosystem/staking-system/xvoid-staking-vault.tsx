/**
 * xVOID Staking Vault
 * 
 * Lock VOID tokens to earn sustainable yield from ecosystem activity
 * 
 * Features:
 * - 25-125% APY from real economic activity (no inflation)
 * - Lock multipliers: 0-2 years (up to 5x boost)
 * - Auto-compounding rewards
 * - Earns from ALL ecosystem fees (trading, SKU sales, land purchases, etc.)
 * - Emergency exit with penalty
 */

import React, { useState, useEffect } from 'react';
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseEther, formatEther, Address } from 'viem';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

// Contract ABIs
const XVOID_VAULT_ABI = [
  {
    inputs: [{ name: 'amount', type: 'uint256' }, { name: 'lockDuration', type: 'uint256' }],
    name: 'stake',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [],
    name: 'unstake',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [],
    name: 'claimRewards',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [{ name: 'account', type: 'address' }],
    name: 'getStakeInfo',
    outputs: [
      { name: 'amount', type: 'uint256' },
      { name: 'multiplier', type: 'uint256' },
      { name: 'lockEnd', type: 'uint256' },
      { name: 'rewards', type: 'uint256' }
    ],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [],
    name: 'getTotalStats',
    outputs: [
      { name: 'totalStaked', type: 'uint256' },
      { name: 'totalRewardsDistributed', type: 'uint256' },
      { name: 'currentAPY', type: 'uint256' }
    ],
    stateMutability: 'view',
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
  },
  {
    inputs: [{ name: 'spender', type: 'address' }, { name: 'amount', type: 'uint256' }],
    name: 'approve',
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'nonpayable',
    type: 'function'
  }
] as const;

// Contract addresses
const CONTRACTS = {
  XVOID_VAULT: '0x0000000000000000000000000000000000000000' as Address,
  VOID_TOKEN: '0x0000000000000000000000000000000000000000' as Address,
};

interface StakeInfo {
  amount: bigint;
  multiplier: number;
  lockEnd: number;
  rewards: bigint;
}

export function XVoidStakingVault() {
  const { address } = useAccount();
  const { toast } = useToast();
  const [stakeAmount, setStakeAmount] = useState('');
  const [lockDuration, setLockDuration] = useState(0); // 0-730 days (2 years)
  const [stakeDialogOpen, setStakeDialogOpen] = useState(false);
  const [unstakeDialogOpen, setUnstakeDialogOpen] = useState(false);

  // Read VOID balance
  const { data: voidBalance } = useReadContract({
    address: CONTRACTS.VOID_TOKEN,
    abi: VOID_TOKEN_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
  });

  // Read stake info
  const { data: stakeInfo, refetch: refetchStake } = useReadContract({
    address: CONTRACTS.XVOID_VAULT,
    abi: XVOID_VAULT_ABI,
    functionName: 'getStakeInfo',
    args: address ? [address] : undefined,
  });

  // Read total stats
  const { data: totalStats } = useReadContract({
    address: CONTRACTS.XVOID_VAULT,
    abi: XVOID_VAULT_ABI,
    functionName: 'getTotalStats',
  });

  // Approve VOID
  const { writeContract: approveVoid, data: approveHash } = useWriteContract();
  const { isLoading: isApproving, isSuccess: approveSuccess } = useWaitForTransactionReceipt({
    hash: approveHash,
  });

  // Stake VOID
  const { writeContract: stakeVoid, data: stakeHash } = useWriteContract();
  const { isLoading: isStaking, isSuccess: stakeSuccess } = useWaitForTransactionReceipt({
    hash: stakeHash,
  });

  // Unstake
  const { writeContract: unstake, data: unstakeHash } = useWriteContract();
  const { isLoading: isUnstaking, isSuccess: unstakeSuccess } = useWaitForTransactionReceipt({
    hash: unstakeHash,
  });

  // Claim rewards
  const { writeContract: claimRewards, data: claimHash } = useWriteContract();
  const { isLoading: isClaiming, isSuccess: claimSuccess } = useWaitForTransactionReceipt({
    hash: claimHash,
  });

  // Handle stake success
  useEffect(() => {
    if (stakeSuccess) {
      toast({
        title: 'Staked Successfully!',
        description: `Staked ${stakeAmount} VOID with ${lockDuration} day lock`,
      });
      refetchStake();
      setStakeDialogOpen(false);
      setStakeAmount('');
    }
  }, [stakeSuccess]);

  // Handle unstake success
  useEffect(() => {
    if (unstakeSuccess) {
      toast({
        title: 'Unstaked Successfully!',
        description: 'Your VOID has been returned',
      });
      refetchStake();
      setUnstakeDialogOpen(false);
    }
  }, [unstakeSuccess]);

  // Handle claim success
  useEffect(() => {
    if (claimSuccess) {
      toast({
        title: 'Rewards Claimed!',
        description: 'Your rewards have been transferred',
      });
      refetchStake();
    }
  }, [claimSuccess]);

  const handleApprove = () => {
    if (!stakeAmount) return;

    approveVoid({
      address: CONTRACTS.VOID_TOKEN,
      abi: VOID_TOKEN_ABI,
      functionName: 'approve',
      args: [CONTRACTS.XVOID_VAULT, parseEther(stakeAmount)],
    });
  };

  const handleStake = () => {
    if (!stakeAmount) return;

    stakeVoid({
      address: CONTRACTS.XVOID_VAULT,
      abi: XVOID_VAULT_ABI,
      functionName: 'stake',
      args: [parseEther(stakeAmount), BigInt(lockDuration * 86400)], // Convert days to seconds
    });
  };

  const handleUnstake = () => {
    unstake({
      address: CONTRACTS.XVOID_VAULT,
      abi: XVOID_VAULT_ABI,
      functionName: 'unstake',
    });
  };

  const handleClaimRewards = () => {
    claimRewards({
      address: CONTRACTS.XVOID_VAULT,
      abi: XVOID_VAULT_ABI,
      functionName: 'claimRewards',
    });
  };

  // Calculate multiplier based on lock duration
  const calculateMultiplier = (days: number): number => {
    // 0 days = 1x, 730 days (2 years) = 5x
    return 1 + (days / 730) * 4;
  };

  const multiplier = calculateMultiplier(lockDuration);

  // Calculate estimated APY
  const baseAPY = totalStats ? Number(totalStats[2]) / 100 : 25; // Default 25% if no data
  const boostedAPY = baseAPY * multiplier;

  // Mock historical data for APY chart
  const apyHistory = [
    { date: 'Jan', apy: 28 },
    { date: 'Feb', apy: 32 },
    { date: 'Mar', apy: 45 },
    { date: 'Apr', apy: 52 },
    { date: 'May', apy: 48 },
    { date: 'Jun', apy: 55 },
  ];

  const currentStake = stakeInfo ? {
    amount: stakeInfo[0],
    multiplier: Number(stakeInfo[1]) / 100,
    lockEnd: Number(stakeInfo[2]),
    rewards: stakeInfo[3],
  } : null;

  const isLocked = currentStake ? currentStake.lockEnd > Date.now() / 1000 : false;
  const daysUntilUnlock = currentStake && isLocked
    ? Math.ceil((currentStake.lockEnd - Date.now() / 1000) / 86400)
    : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold">xVOID Staking Vault</h2>
          <p className="text-muted-foreground">
            Earn sustainable yield from all ecosystem activity • No inflation • Auto-compounding
          </p>
        </div>
        <div className="flex gap-2">
          <Badge variant="outline">
            VOID Balance: {voidBalance ? formatEther(voidBalance) : '0'}
          </Badge>
          <Badge variant="default">
            APY: {baseAPY.toFixed(1)}% - {(baseAPY * 5).toFixed(1)}%
          </Badge>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Staked</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {totalStats ? formatEther(totalStats[0]) : '0'} VOID
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Rewards</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {totalStats ? formatEther(totalStats[1]) : '0'} VOID
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Current APY</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {baseAPY.toFixed(1)}%
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Your Rewards</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {currentStake ? formatEther(currentStake.rewards) : '0'} VOID
            </div>
          </CardContent>
        </Card>
      </div>

      {/* APY Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Historical APY</CardTitle>
          <CardDescription>6-month APY performance</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={apyHistory}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="apy" stroke="#8884d8" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Staking Interface */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Your Stake */}
        <Card>
          <CardHeader>
            <CardTitle>Your Stake</CardTitle>
            <CardDescription>Current staking position</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {currentStake && currentStake.amount > 0 ? (
              <>
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm text-muted-foreground">Staked Amount</span>
                    <span className="text-sm font-medium">{formatEther(currentStake.amount)} VOID</span>
                  </div>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm text-muted-foreground">Multiplier</span>
                    <span className="text-sm font-medium">{currentStake.multiplier.toFixed(2)}x</span>
                  </div>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm text-muted-foreground">Lock Status</span>
                    <Badge variant={isLocked ? 'destructive' : 'default'}>
                      {isLocked ? `Locked (${daysUntilUnlock}d)` : 'Unlocked'}
                    </Badge>
                  </div>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm text-muted-foreground">Pending Rewards</span>
                    <span className="text-sm font-medium text-green-600">
                      {formatEther(currentStake.rewards)} VOID
                    </span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={handleClaimRewards}
                    disabled={isClaiming || currentStake.rewards === 0n}
                    className="flex-1"
                  >
                    {isClaiming ? 'Claiming...' : 'Claim Rewards'}
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => setUnstakeDialogOpen(true)}
                    disabled={isLocked}
                    className="flex-1"
                  >
                    Unstake
                  </Button>
                </div>

                {isLocked && (
                  <p className="text-xs text-muted-foreground">
                    ⚠️ Lock period active. Emergency exit available with 50% penalty.
                  </p>
                )}
              </>
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground mb-4">No active stake</p>
                <Button onClick={() => setStakeDialogOpen(true)}>
                  Start Staking
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Stake Calculator */}
        <Card>
          <CardHeader>
            <CardTitle>Stake Calculator</CardTitle>
            <CardDescription>Estimate your rewards</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Amount to Stake</Label>
              <Input
                type="number"
                value={stakeAmount}
                onChange={(e) => setStakeAmount(e.target.value)}
                placeholder="1000"
              />
            </div>

            <div>
              <Label>Lock Duration: {lockDuration} days ({multiplier.toFixed(2)}x multiplier)</Label>
              <Slider
                value={[lockDuration]}
                onValueChange={(v) => setLockDuration(v[0])}
                max={730}
                step={30}
                className="mt-2"
              />
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>0d (1x)</span>
                <span>1y (3x)</span>
                <span>2y (5x)</span>
              </div>
            </div>

            {stakeAmount && (
              <div className="p-4 bg-muted rounded-lg space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm">Estimated APY:</span>
                  <span className="text-sm font-bold text-green-600">
                    {boostedAPY.toFixed(1)}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Daily Rewards:</span>
                  <span className="text-sm font-medium">
                    {((parseFloat(stakeAmount) * boostedAPY) / 100 / 365).toFixed(2)} VOID
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Monthly Rewards:</span>
                  <span className="text-sm font-medium">
                    {((parseFloat(stakeAmount) * boostedAPY) / 100 / 12).toFixed(2)} VOID
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Yearly Rewards:</span>
                  <span className="text-sm font-bold">
                    {((parseFloat(stakeAmount) * boostedAPY) / 100).toFixed(2)} VOID
                  </span>
                </div>
              </div>
            )}

            <Button
              className="w-full"
              onClick={() => setStakeDialogOpen(true)}
              disabled={!stakeAmount || parseFloat(stakeAmount) <= 0}
            >
              Stake VOID
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Revenue Sources */}
      <Card>
        <CardHeader>
          <CardTitle>Revenue Sources (25% of ecosystem fees)</CardTitle>
          <CardDescription>xVOID stakers earn from all ecosystem activity</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="p-4 border rounded-lg">
              <h4 className="font-medium mb-2">Trading Fees</h4>
              <p className="text-sm text-muted-foreground">
                0.20% fee on all token trades via V4 hooks
              </p>
            </div>
            <div className="p-4 border rounded-lg">
              <h4 className="font-medium mb-2">SKU Sales</h4>
              <p className="text-sm text-muted-foreground">
                25% of fees from SKU purchases and creator revenue
              </p>
            </div>
            <div className="p-4 border rounded-lg">
              <h4 className="font-medium mb-2">Land & Licenses</h4>
              <p className="text-sm text-muted-foreground">
                25% of land purchase and business license fees
              </p>
            </div>
            <div className="p-4 border rounded-lg">
              <h4 className="font-medium mb-2">Business Revenue</h4>
              <p className="text-sm text-muted-foreground">
                Share of business activity in metaverse
              </p>
            </div>
            <div className="p-4 border rounded-lg">
              <h4 className="font-medium mb-2">NFT Royalties</h4>
              <p className="text-sm text-muted-foreground">
                25% of Founders NFT secondary royalties
              </p>
            </div>
            <div className="p-4 border rounded-lg">
              <h4 className="font-medium mb-2">Product Fees</h4>
              <p className="text-sm text-muted-foreground">
                Share of all ecosystem product revenues
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stake Dialog */}
      <Dialog open={stakeDialogOpen} onOpenChange={setStakeDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Stake VOID Tokens</DialogTitle>
            <DialogDescription>
              Lock VOID to earn rewards from ecosystem activity
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="p-4 bg-muted rounded-lg">
              <div className="flex justify-between mb-2">
                <span className="text-sm">Amount:</span>
                <span className="text-sm font-medium">{stakeAmount} VOID</span>
              </div>
              <div className="flex justify-between mb-2">
                <span className="text-sm">Lock Duration:</span>
                <span className="text-sm font-medium">{lockDuration} days</span>
              </div>
              <div className="flex justify-between mb-2">
                <span className="text-sm">Multiplier:</span>
                <span className="text-sm font-medium">{multiplier.toFixed(2)}x</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Estimated APY:</span>
                <span className="text-sm font-bold text-green-600">{boostedAPY.toFixed(1)}%</span>
              </div>
            </div>

            <div className="p-4 bg-yellow-100 dark:bg-yellow-900/20 rounded-lg">
              <p className="text-sm font-medium">⚠️ Important</p>
              <ul className="text-sm text-muted-foreground mt-2 space-y-1">
                <li>• Locked tokens cannot be withdrawn until lock period ends</li>
                <li>• Emergency exit available with 50% penalty</li>
                <li>• Rewards are auto-compounded</li>
                <li>• Lock duration determines your multiplier (1x - 5x)</li>
              </ul>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setStakeDialogOpen(false)}>
              Cancel
            </Button>
            {!approveSuccess ? (
              <Button onClick={handleApprove} disabled={isApproving}>
                {isApproving ? 'Approving...' : 'Approve VOID'}
              </Button>
            ) : (
              <Button onClick={handleStake} disabled={isStaking}>
                {isStaking ? 'Staking...' : 'Stake VOID'}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Unstake Dialog */}
      <Dialog open={unstakeDialogOpen} onOpenChange={setUnstakeDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Unstake VOID</DialogTitle>
            <DialogDescription>
              {isLocked ? 'Emergency exit (50% penalty)' : 'Withdraw your staked VOID'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {currentStake && (
              <>
                <div className="p-4 bg-muted rounded-lg">
                  <div className="flex justify-between mb-2">
                    <span className="text-sm">Staked Amount:</span>
                    <span className="text-sm font-medium">{formatEther(currentStake.amount)} VOID</span>
                  </div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm">Pending Rewards:</span>
                    <span className="text-sm font-medium">{formatEther(currentStake.rewards)} VOID</span>
                  </div>
                  {isLocked && (
                    <div className="flex justify-between">
                      <span className="text-sm">50% Penalty:</span>
                      <span className="text-sm font-medium text-red-600">
                        -{formatEther(currentStake.amount / 2n)} VOID
                      </span>
                    </div>
                  )}
                </div>

                {isLocked && (
                  <div className="p-4 bg-red-100 dark:bg-red-900/20 rounded-lg">
                    <p className="text-sm font-medium">⚠️ Warning: Emergency Exit</p>
                    <p className="text-sm text-muted-foreground mt-2">
                      Lock period active ({daysUntilUnlock} days remaining). 
                      Emergency exit will forfeit 50% of your staked amount.
                    </p>
                  </div>
                )}
              </>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setUnstakeDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant={isLocked ? 'destructive' : 'default'}
              onClick={handleUnstake}
              disabled={isUnstaking}
            >
              {isUnstaking ? 'Processing...' : isLocked ? 'Emergency Exit' : 'Unstake'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
