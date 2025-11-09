// Web3 Hook for Governance/DAO System
// Handles proposal creation, voting, and execution

import { useState, useEffect } from 'react';
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseUnits } from 'viem';

// Governance Contract address
const GOVERNANCE_CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_GOVERNANCE_CONTRACT_ADDRESS as `0x${string}`;

// Governance Contract ABI
const GOVERNANCE_ABI = [
  {
    name: 'createProposal',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'title', type: 'string' },
      { name: 'description', type: 'string' },
      { name: 'duration', type: 'uint256' }
    ],
    outputs: [{ name: 'proposalId', type: 'uint256' }]
  },
  {
    name: 'vote',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'proposalId', type: 'uint256' },
      { name: 'support', type: 'bool' }
    ],
    outputs: []
  },
  {
    name: 'executeProposal',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'proposalId', type: 'uint256' }],
    outputs: []
  },
  {
    name: 'getProposal',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'proposalId', type: 'uint256' }],
    outputs: [
      {
        type: 'tuple',
        components: [
          { name: 'id', type: 'uint256' },
          { name: 'proposer', type: 'address' },
          { name: 'title', type: 'string' },
          { name: 'description', type: 'string' },
          { name: 'votesFor', type: 'uint256' },
          { name: 'votesAgainst', type: 'uint256' },
          { name: 'startTime', type: 'uint256' },
          { name: 'endTime', type: 'uint256' },
          { name: 'executed', type: 'bool' },
          { name: 'cancelled', type: 'bool' }
        ]
      }
    ]
  },
  {
    name: 'hasVoted',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: 'proposalId', type: 'uint256' },
      { name: 'voter', type: 'address' }
    ],
    outputs: [{ name: 'voted', type: 'bool' }]
  },
  {
    name: 'getVotingPower',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'voter', type: 'address' }],
    outputs: [{ name: 'power', type: 'uint256' }]
  },
  {
    name: 'getActiveProposals',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: 'proposalIds', type: 'uint256[]' }]
  }
] as const;

export interface Proposal {
  id: bigint;
  proposer: string;
  title: string;
  description: string;
  votesFor: string;
  votesAgainst: string;
  startTime: number;
  endTime: number;
  executed: boolean;
  cancelled: boolean;
}

// Hook to create a proposal
export function useCreateProposal() {
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { writeContract, data: hash } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const createProposal = async (
    title: string,
    description: string,
    durationDays: number = 7
  ) => {
    try {
      setIsCreating(true);
      setError(null);

      const durationSeconds = BigInt(durationDays * 24 * 60 * 60);

      writeContract({
        address: GOVERNANCE_CONTRACT_ADDRESS,
        abi: GOVERNANCE_ABI,
        functionName: 'createProposal',
        args: [title, description, durationSeconds],
      });
    } catch (err: any) {
      console.error('Create proposal error:', err);
      setError(err.message || 'Failed to create proposal');
    } finally {
      setIsCreating(false);
    }
  };

  return {
    createProposal,
    isCreating: isCreating || isConfirming,
    isSuccess,
    error,
    txHash: hash,
  };
}

// Hook to vote on a proposal
export function useVote() {
  const [isVoting, setIsVoting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { writeContract, data: hash } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const vote = async (proposalId: bigint, support: boolean) => {
    try {
      setIsVoting(true);
      setError(null);

      writeContract({
        address: GOVERNANCE_CONTRACT_ADDRESS,
        abi: GOVERNANCE_ABI,
        functionName: 'vote',
        args: [proposalId, support],
      });
    } catch (err: any) {
      console.error('Vote error:', err);
      setError(err.message || 'Failed to cast vote');
    } finally {
      setIsVoting(false);
    }
  };

  return {
    vote,
    isVoting: isVoting || isConfirming,
    isSuccess,
    error,
    txHash: hash,
  };
}

// Hook to get proposal details
export function useProposal(proposalId?: bigint) {
  const { data, isLoading, error, refetch } = useReadContract({
    address: GOVERNANCE_CONTRACT_ADDRESS,
    abi: GOVERNANCE_ABI,
    functionName: 'getProposal',
    args: proposalId ? [proposalId] : undefined,
  });

  const proposal: Proposal | null = data ? {
    id: data.id,
    proposer: data.proposer,
    title: data.title,
    description: data.description,
    votesFor: data.votesFor.toString(),
    votesAgainst: data.votesAgainst.toString(),
    startTime: Number(data.startTime),
    endTime: Number(data.endTime),
    executed: data.executed,
    cancelled: data.cancelled,
  } : null;

  return {
    proposal,
    isLoading,
    error,
    refetch,
  };
}

// Hook to check if user has voted
export function useHasVoted(proposalId?: bigint) {
  const { address } = useAccount();

  const { data: hasVoted, isLoading } = useReadContract({
    address: GOVERNANCE_CONTRACT_ADDRESS,
    abi: GOVERNANCE_ABI,
    functionName: 'hasVoted',
    args: proposalId && address ? [proposalId, address] : undefined,
  });

  return {
    hasVoted: hasVoted || false,
    isLoading,
  };
}

// Hook to get user's voting power
export function useVotingPower() {
  const { address } = useAccount();

  const { data: votingPower, isLoading } = useReadContract({
    address: GOVERNANCE_CONTRACT_ADDRESS,
    abi: GOVERNANCE_ABI,
    functionName: 'getVotingPower',
    args: address ? [address] : undefined,
  });

  return {
    votingPower: votingPower ? votingPower.toString() : '0',
    isLoading,
  };
}

// Hook to get all active proposals
export function useActiveProposals() {
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { data: proposalIds } = useReadContract({
    address: GOVERNANCE_CONTRACT_ADDRESS,
    abi: GOVERNANCE_ABI,
    functionName: 'getActiveProposals',
  });

  useEffect(() => {
    const fetchProposals = async () => {
      if (!proposalIds || proposalIds.length === 0) {
        setProposals([]);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        // Fetch details for each proposal
        const response = await fetch('/api/governance/proposals', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ proposalIds: proposalIds.map(id => id.toString()) }),
        });

        const data = await response.json();
        setProposals(data);
      } catch (err: any) {
        console.error('Fetch proposals error:', err);
        setError(err.message || 'Failed to fetch proposals');
      } finally {
        setIsLoading(false);
      }
    };

    fetchProposals();
  }, [proposalIds]);

  return {
    proposals,
    isLoading,
    error,
  };
}

// Combined governance hook
export function useGovernance() {
  const { createProposal, isCreating, error: createError } = useCreateProposal();
  const { vote, isVoting, error: voteError } = useVote();
  const { votingPower, isLoading: powerLoading } = useVotingPower();
  const { proposals, isLoading: proposalsLoading } = useActiveProposals();

  return {
    // Data
    votingPower,
    proposals,
    isLoading: powerLoading || proposalsLoading,
    
    // Actions
    createProposal,
    vote,
    
    // State
    isCreating,
    isVoting,
    
    // Errors
    error: createError || voteError,
  };
}
