// Web3 Hook for Tipping System
// Integrates with Coinbase CDP Smart Wallet

import { useState } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseUnits, formatUnits } from 'viem';

// Contract addresses (update with deployed addresses)
const VOID_TOKEN_ADDRESS = process.env.NEXT_PUBLIC_VOID_TOKEN_ADDRESS as `0x${string}`;
const TIPPING_CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_TIPPING_CONTRACT_ADDRESS as `0x${string}`;

// Tipping Contract ABI (simplified)
const TIPPING_ABI = [
  {
    name: 'tip',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'recipient', type: 'address' },
      { name: 'amount', type: 'uint256' },
      { name: 'message', type: 'string' }
    ],
    outputs: []
  },
  {
    name: 'getTipHistory',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'user', type: 'address' }],
    outputs: [
      {
        type: 'tuple[]',
        components: [
          { name: 'from', type: 'address' },
          { name: 'to', type: 'address' },
          { name: 'amount', type: 'uint256' },
          { name: 'message', type: 'string' },
          { name: 'timestamp', type: 'uint256' }
        ]
      }
    ]
  }
] as const;

export interface TipParams {
  recipient: `0x${string}`;
  amount: number; // In VOID tokens (human-readable)
  message?: string;
}

export interface Tip {
  from: string;
  to: string;
  amount: string;
  message: string;
  timestamp: number;
}

export function useTip() {
  const { address, isConnected } = useAccount();
  const [isTipping, setIsTipping] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { writeContract, data: hash } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const sendTip = async ({ recipient, amount, message = '' }: TipParams) => {
    if (!isConnected || !address) {
      setError('Wallet not connected');
      return;
    }

    try {
      setIsTipping(true);
      setError(null);

      // Convert amount to wei (18 decimals for VOID token)
      const amountInWei = parseUnits(amount.toString(), 18);

      // Call tipping contract
      writeContract({
        address: TIPPING_CONTRACT_ADDRESS,
        abi: TIPPING_ABI,
        functionName: 'tip',
        args: [recipient, amountInWei, message],
      });

      // Note: Transaction confirmation handled by useWaitForTransactionReceipt hook
    } catch (err: any) {
      console.error('Tip error:', err);
      setError(err.message || 'Failed to send tip');
    } finally {
      setIsTipping(false);
    }
  };

  return {
    sendTip,
    isTipping: isTipping || isConfirming,
    isSuccess,
    error,
    txHash: hash,
  };
}

// Hook for fetching tip history
export function useTipHistory(userAddress?: `0x${string}`) {
  const [history, setHistory] = useState<Tip[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchHistory = async () => {
    if (!userAddress) return;

    try {
      setIsLoading(true);
      setError(null);

      // This would use wagmi's useReadContract in production
      // For now, placeholder implementation
      const response = await fetch(`/api/tips/history?address=${userAddress}`);
      const data = await response.json();

      const formattedHistory: Tip[] = data.map((tip: any) => ({
        from: tip.from,
        to: tip.to,
        amount: formatUnits(tip.amount, 18),
        message: tip.message,
        timestamp: tip.timestamp,
      }));

      setHistory(formattedHistory);
    } catch (err: any) {
      console.error('Fetch history error:', err);
      setError(err.message || 'Failed to fetch tip history');
    } finally {
      setIsLoading(false);
    }
  };

  return {
    history,
    isLoading,
    error,
    refetch: fetchHistory,
  };
}

// Hook for tipping stats
export function useTipStats() {
  const { address } = useAccount();
  const [stats, setStats] = useState({
    totalSent: '0',
    totalReceived: '0',
    tipCount: 0,
  });

  const fetchStats = async () => {
    if (!address) return;

    try {
      const response = await fetch(`/api/tips/stats?address=${address}`);
      const data = await response.json();
      setStats(data);
    } catch (err) {
      console.error('Fetch stats error:', err);
    }
  };

  return {
    stats,
    refetch: fetchStats,
  };
}
