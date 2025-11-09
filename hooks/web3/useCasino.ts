// Web3 Hook for Casino/Betting System
// Handles provably fair casino games and bets

import { useState } from 'react';
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseUnits, keccak256, toBytes } from 'viem';

// Casino Contract address
const CASINO_CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CASINO_CONTRACT_ADDRESS as `0x${string}`;

// Casino Contract ABI
const CASINO_ABI = [
  {
    name: 'placeBet',
    type: 'function',
    stateMutability: 'payable',
    inputs: [
      { name: 'game', type: 'string' },
      { name: 'betAmount', type: 'uint256' },
      { name: 'prediction', type: 'uint256' }
    ],
    outputs: [{ name: 'betId', type: 'uint256' }]
  },
  {
    name: 'resolveBet',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'betId', type: 'uint256' }],
    outputs: []
  },
  {
    name: 'getBet',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'betId', type: 'uint256' }],
    outputs: [
      {
        type: 'tuple',
        components: [
          { name: 'player', type: 'address' },
          { name: 'game', type: 'string' },
          { name: 'betAmount', type: 'uint256' },
          { name: 'prediction', type: 'uint256' },
          { name: 'result', type: 'uint256' },
          { name: 'winAmount', type: 'uint256' },
          { name: 'isResolved', type: 'bool' },
          { name: 'timestamp', type: 'uint256' }
        ]
      }
    ]
  },
  {
    name: 'getPlayerStats',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'player', type: 'address' }],
    outputs: [
      {
        type: 'tuple',
        components: [
          { name: 'totalBets', type: 'uint256' },
          { name: 'totalWagered', type: 'uint256' },
          { name: 'totalWon', type: 'uint256' },
          { name: 'winCount', type: 'uint256' },
          { name: 'lossCount', type: 'uint256' }
        ]
      }
    ]
  },
  {
    name: 'getHouseEdge',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'game', type: 'string' }],
    outputs: [{ name: 'edge', type: 'uint256' }]
  }
] as const;

export interface Bet {
  player: string;
  game: string;
  betAmount: string;
  prediction: number;
  result: number;
  winAmount: string;
  isResolved: boolean;
  timestamp: number;
}

export interface PlayerStats {
  totalBets: string;
  totalWagered: string;
  totalWon: string;
  winCount: string;
  lossCount: string;
  winRate: number;
  profitLoss: string;
}

export type CasinoGame = 'coinflip' | 'dice' | 'roulette' | 'blackjack' | 'slots';

// Hook to place a bet
export function usePlaceBet() {
  const [isBetting, setIsBetting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { writeContract, data: hash } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const placeBet = async (
    game: CasinoGame,
    betAmount: number,
    prediction: number
  ) => {
    try {
      setIsBetting(true);
      setError(null);

      const amountInWei = parseUnits(betAmount.toString(), 18);

      writeContract({
        address: CASINO_CONTRACT_ADDRESS,
        abi: CASINO_ABI,
        functionName: 'placeBet',
        args: [game, amountInWei, BigInt(prediction)],
        value: amountInWei,
      });
    } catch (err: any) {
      console.error('Place bet error:', err);
      setError(err.message || 'Failed to place bet');
    } finally {
      setIsBetting(false);
    }
  };

  return {
    placeBet,
    isBetting: isBetting || isConfirming,
    isSuccess,
    error,
    txHash: hash,
  };
}

// Hook to get bet details
export function useBet(betId?: bigint) {
  const { data, isLoading, error, refetch } = useReadContract({
    address: CASINO_CONTRACT_ADDRESS,
    abi: CASINO_ABI,
    functionName: 'getBet',
    args: betId ? [betId] : undefined,
  });

  const bet: Bet | null = data ? {
    player: data.player,
    game: data.game,
    betAmount: data.betAmount.toString(),
    prediction: Number(data.prediction),
    result: Number(data.result),
    winAmount: data.winAmount.toString(),
    isResolved: data.isResolved,
    timestamp: Number(data.timestamp),
  } : null;

  return {
    bet,
    isLoading,
    error,
    refetch,
  };
}

// Hook to get player statistics
export function usePlayerStats() {
  const { address } = useAccount();

  const { data, isLoading, error } = useReadContract({
    address: CASINO_CONTRACT_ADDRESS,
    abi: CASINO_ABI,
    functionName: 'getPlayerStats',
    args: address ? [address] : undefined,
  });

  const stats: PlayerStats | null = data ? {
    totalBets: data.totalBets.toString(),
    totalWagered: data.totalWagered.toString(),
    totalWon: data.totalWon.toString(),
    winCount: data.winCount.toString(),
    lossCount: data.lossCount.toString(),
    winRate: Number(data.winCount) / Number(data.totalBets) * 100,
    profitLoss: (Number(data.totalWon) - Number(data.totalWagered)).toString(),
  } : null;

  return {
    stats,
    isLoading,
    error,
  };
}

// Hook to get house edge for a game
export function useHouseEdge(game: CasinoGame) {
  const { data: edge, isLoading } = useReadContract({
    address: CASINO_CONTRACT_ADDRESS,
    abi: CASINO_ABI,
    functionName: 'getHouseEdge',
    args: [game],
  });

  return {
    houseEdge: edge ? Number(edge) / 100 : 0, // Convert basis points to percentage
    isLoading,
  };
}

// Provably fair verification hook
export function useVerifyFairness() {
  const verifyBet = (
    serverSeed: string,
    clientSeed: string,
    nonce: number,
    result: number
  ): boolean => {
    try {
      // Recreate the hash
      const combinedSeed = `${serverSeed}:${clientSeed}:${nonce}`;
      const hash = keccak256(toBytes(combinedSeed));
      
      // Extract result from hash (implementation depends on game logic)
      const hashNumber = BigInt(hash);
      const computedResult = Number(hashNumber % BigInt(100));
      
      return computedResult === result;
    } catch (err) {
      console.error('Verification error:', err);
      return false;
    }
  };

  return {
    verifyBet,
  };
}

// Game-specific hooks

export function useCoinFlip() {
  const { placeBet, isBetting, isSuccess, error } = usePlaceBet();

  const flip = async (betAmount: number, prediction: 'heads' | 'tails') => {
    const predictionValue = prediction === 'heads' ? 0 : 1;
    await placeBet('coinflip', betAmount, predictionValue);
  };

  return {
    flip,
    isFlipping: isBetting,
    isSuccess,
    error,
  };
}

export function useDiceRoll() {
  const { placeBet, isBetting, isSuccess, error } = usePlaceBet();

  const roll = async (betAmount: number, prediction: number) => {
    if (prediction < 1 || prediction > 100) {
      throw new Error('Prediction must be between 1 and 100');
    }
    await placeBet('dice', betAmount, prediction);
  };

  return {
    roll,
    isRolling: isBetting,
    isSuccess,
    error,
  };
}

export function useRoulette() {
  const { placeBet, isBetting, isSuccess, error } = usePlaceBet();

  const spin = async (betAmount: number, prediction: number) => {
    if (prediction < 0 || prediction > 36) {
      throw new Error('Prediction must be between 0 and 36');
    }
    await placeBet('roulette', betAmount, prediction);
  };

  return {
    spin,
    isSpinning: isBetting,
    isSuccess,
    error,
  };
}

// Combined casino hook
export function useCasino() {
  const { placeBet, isBetting, error: betError } = usePlaceBet();
  const { stats, isLoading: statsLoading } = usePlayerStats();
  const { verifyBet } = useVerifyFairness();

  return {
    // Data
    stats,
    isLoading: statsLoading,
    
    // Actions
    placeBet,
    verifyBet,
    
    // State
    isBetting,
    
    // Errors
    error: betError,
  };
}
