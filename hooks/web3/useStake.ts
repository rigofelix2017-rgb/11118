// Web3 Hook for Staking System
// Handles VOID token staking and rewards

import { useState } from 'react';
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseUnits, formatUnits } from 'viem';

// Staking Contract address
const STAKING_CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_STAKING_CONTRACT_ADDRESS as `0x${string}`;

// Staking Contract ABI
const STAKING_ABI = [
  {
    name: 'stake',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'amount', type: 'uint256' }],
    outputs: []
  },
  {
    name: 'unstake',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'amount', type: 'uint256' }],
    outputs: []
  },
  {
    name: 'claimRewards',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [],
    outputs: []
  },
  {
    name: 'getStakedAmount',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'user', type: 'address' }],
    outputs: [{ name: 'amount', type: 'uint256' }]
  },
  {
    name: 'getPendingRewards',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'user', type: 'address' }],
    outputs: [{ name: 'rewards', type: 'uint256' }]
  },
  {
    name: 'getStakingInfo',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'user', type: 'address' }],
    outputs: [
      {
        type: 'tuple',
        components: [
          { name: 'stakedAmount', type: 'uint256' },
          { name: 'rewardDebt', type: 'uint256' },
          { name: 'lastStakeTime', type: 'uint256' },
          { name: 'pendingRewards', type: 'uint256' }
        ]
      }
    ]
  },
  {
    name: 'getAPY',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: 'apy', type: 'uint256' }]
  }
] as const;

export interface StakingInfo {
  stakedAmount: string;
  rewardDebt: string;
  lastStakeTime: number;
  pendingRewards: string;
}

// Hook to get staking info
export function useStakingInfo() {
  const { address } = useAccount();

  const { data, isLoading, error, refetch } = useReadContract({
    address: STAKING_CONTRACT_ADDRESS,
    abi: STAKING_ABI,
    functionName: 'getStakingInfo',
    args: address ? [address] : undefined,
  });

  const stakingInfo: StakingInfo | null = data ? {
    stakedAmount: formatUnits(data.stakedAmount, 18),
    rewardDebt: formatUnits(data.rewardDebt, 18),
    lastStakeTime: Number(data.lastStakeTime),
    pendingRewards: formatUnits(data.pendingRewards, 18),
  } : null;

  return {
    stakingInfo,
    isLoading,
    error,
    refetch,
  };
}

// Hook to get current APY
export function useStakingAPY() {
  const { data: apy, isLoading } = useReadContract({
    address: STAKING_CONTRACT_ADDRESS,
    abi: STAKING_ABI,
    functionName: 'getAPY',
  });

  return {
    apy: apy ? Number(apy) / 100 : 0, // Convert basis points to percentage
    isLoading,
  };
}

// Hook to stake tokens
export function useStake() {
  const [isStaking, setIsStaking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { writeContract, data: hash } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const stake = async (amount: number) => {
    try {
      setIsStaking(true);
      setError(null);

      const amountInWei = parseUnits(amount.toString(), 18);

      writeContract({
        address: STAKING_CONTRACT_ADDRESS,
        abi: STAKING_ABI,
        functionName: 'stake',
        args: [amountInWei],
      });
    } catch (err: any) {
      console.error('Stake error:', err);
      setError(err.message || 'Failed to stake tokens');
    } finally {
      setIsStaking(false);
    }
  };

  return {
    stake,
    isStaking: isStaking || isConfirming,
    isSuccess,
    error,
    txHash: hash,
  };
}

// Hook to unstake tokens
export function useUnstake() {
  const [isUnstaking, setIsUnstaking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { writeContract, data: hash } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const unstake = async (amount: number) => {
    try {
      setIsUnstaking(true);
      setError(null);

      const amountInWei = parseUnits(amount.toString(), 18);

      writeContract({
        address: STAKING_CONTRACT_ADDRESS,
        abi: STAKING_ABI,
        functionName: 'unstake',
        args: [amountInWei],
      });
    } catch (err: any) {
      console.error('Unstake error:', err);
      setError(err.message || 'Failed to unstake tokens');
    } finally {
      setIsUnstaking(false);
    }
  };

  return {
    unstake,
    isUnstaking: isUnstaking || isConfirming,
    isSuccess,
    error,
    txHash: hash,
  };
}

// Hook to claim staking rewards
export function useClaimRewards() {
  const [isClaiming, setIsClaiming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { writeContract, data: hash } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const claimRewards = async () => {
    try {
      setIsClaiming(true);
      setError(null);

      writeContract({
        address: STAKING_CONTRACT_ADDRESS,
        abi: STAKING_ABI,
        functionName: 'claimRewards',
      });
    } catch (err: any) {
      console.error('Claim error:', err);
      setError(err.message || 'Failed to claim rewards');
    } finally {
      setIsClaiming(false);
    }
  };

  return {
    claimRewards,
    isClaiming: isClaiming || isConfirming,
    isSuccess,
    error,
    txHash: hash,
  };
}

// Combined staking management hook
export function useStaking() {
  const { stakingInfo, isLoading: infoLoading, refetch } = useStakingInfo();
  const { apy, isLoading: apyLoading } = useStakingAPY();
  const { stake, isStaking, error: stakeError } = useStake();
  const { unstake, isUnstaking, error: unstakeError } = useUnstake();
  const { claimRewards, isClaiming, error: claimError } = useClaimRewards();

  return {
    // Data
    stakingInfo,
    apy,
    isLoading: infoLoading || apyLoading,
    
    // Actions
    stake,
    unstake,
    claimRewards,
    refetch,
    
    // State
    isStaking,
    isUnstaking,
    isClaiming,
    
    // Errors
    error: stakeError || unstakeError || claimError,
  };
}
