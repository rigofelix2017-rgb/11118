// Web3 Hook for NFT Operations
// Handles NFT balance, transfers, and minting

import { useState, useEffect } from 'react';
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { formatUnits } from 'viem';

// Property NFT Contract address
const PROPERTY_NFT_ADDRESS = process.env.NEXT_PUBLIC_PROPERTY_NFT_ADDRESS as `0x${string}`;

// ERC-721 NFT ABI (simplified)
const NFT_ABI = [
  {
    name: 'balanceOf',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'owner', type: 'address' }],
    outputs: [{ name: 'balance', type: 'uint256' }]
  },
  {
    name: 'ownerOf',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'tokenId', type: 'uint256' }],
    outputs: [{ name: 'owner', type: 'address' }]
  },
  {
    name: 'tokenURI',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'tokenId', type: 'uint256' }],
    outputs: [{ name: 'uri', type: 'string' }]
  },
  {
    name: 'transferFrom',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'from', type: 'address' },
      { name: 'to', type: 'address' },
      { name: 'tokenId', type: 'uint256' }
    ],
    outputs: []
  },
  {
    name: 'mint',
    type: 'function',
    stateMutability: 'payable',
    inputs: [
      { name: 'to', type: 'address' },
      { name: 'tokenURI', type: 'string' }
    ],
    outputs: [{ name: 'tokenId', type: 'uint256' }]
  },
  {
    name: 'tokensOfOwner',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'owner', type: 'address' }],
    outputs: [{ name: 'tokenIds', type: 'uint256[]' }]
  }
] as const;

export interface NFTMetadata {
  name: string;
  description: string;
  image: string;
  attributes: { trait_type: string; value: string | number }[];
}

export interface NFT {
  tokenId: bigint;
  owner: string;
  tokenURI: string;
  metadata?: NFTMetadata;
}

// Hook to get NFT balance
export function useNFTBalance(address?: `0x${string}`) {
  const { data: balance, isLoading, error, refetch } = useReadContract({
    address: PROPERTY_NFT_ADDRESS,
    abi: NFT_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
  });

  return {
    balance: balance ? Number(balance) : 0,
    isLoading,
    error,
    refetch,
  };
}

// Hook to get all NFTs owned by address
export function useNFTs(ownerAddress?: `0x${string}`) {
  const [nfts, setNfts] = useState<NFT[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { data: tokenIds } = useReadContract({
    address: PROPERTY_NFT_ADDRESS,
    abi: NFT_ABI,
    functionName: 'tokensOfOwner',
    args: ownerAddress ? [ownerAddress] : undefined,
  });

  useEffect(() => {
    const fetchNFTData = async () => {
      if (!tokenIds || tokenIds.length === 0) {
        setNfts([]);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        const nftPromises = tokenIds.map(async (tokenId) => {
          // Fetch token URI
          const uriResponse = await fetch(`/api/nfts/${tokenId}/metadata`);
          const metadata = await uriResponse.json();

          return {
            tokenId,
            owner: ownerAddress!,
            tokenURI: metadata.tokenURI,
            metadata: metadata.data,
          };
        });

        const fetchedNFTs = await Promise.all(nftPromises);
        setNfts(fetchedNFTs);
      } catch (err: any) {
        console.error('Fetch NFT data error:', err);
        setError(err.message || 'Failed to fetch NFT data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchNFTData();
  }, [tokenIds, ownerAddress]);

  return {
    nfts,
    isLoading,
    error,
  };
}

// Hook to transfer NFT
export function useTransferNFT() {
  const { address } = useAccount();
  const [isTransferring, setIsTransferring] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { writeContract, data: hash } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const transferNFT = async (
    to: `0x${string}`,
    tokenId: bigint
  ) => {
    if (!address) {
      setError('Wallet not connected');
      return;
    }

    try {
      setIsTransferring(true);
      setError(null);

      writeContract({
        address: PROPERTY_NFT_ADDRESS,
        abi: NFT_ABI,
        functionName: 'transferFrom',
        args: [address, to, tokenId],
      });
    } catch (err: any) {
      console.error('Transfer error:', err);
      setError(err.message || 'Failed to transfer NFT');
    } finally {
      setIsTransferring(false);
    }
  };

  return {
    transferNFT,
    isTransferring: isTransferring || isConfirming,
    isSuccess,
    error,
    txHash: hash,
  };
}

// Hook to mint new NFT
export function useMintNFT() {
  const { address } = useAccount();
  const [isMinting, setIsMinting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { writeContract, data: hash } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const mintNFT = async (
    metadata: NFTMetadata,
    recipient?: `0x${string}`
  ) => {
    if (!address && !recipient) {
      setError('Wallet not connected');
      return;
    }

    try {
      setIsMinting(true);
      setError(null);

      // Upload metadata to IPFS (in production)
      const metadataResponse = await fetch('/api/nfts/upload-metadata', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(metadata),
      });

      const { tokenURI } = await metadataResponse.json();

      // Mint NFT
      writeContract({
        address: PROPERTY_NFT_ADDRESS,
        abi: NFT_ABI,
        functionName: 'mint',
        args: [recipient || address!, tokenURI],
      });
    } catch (err: any) {
      console.error('Mint error:', err);
      setError(err.message || 'Failed to mint NFT');
    } finally {
      setIsMinting(false);
    }
  };

  return {
    mintNFT,
    isMinting: isMinting || isConfirming,
    isSuccess,
    error,
    txHash: hash,
  };
}

// Hook to check if address owns specific NFT
export function useOwnsNFT(tokenId?: bigint) {
  const { address } = useAccount();

  const { data: owner, isLoading } = useReadContract({
    address: PROPERTY_NFT_ADDRESS,
    abi: NFT_ABI,
    functionName: 'ownerOf',
    args: tokenId ? [tokenId] : undefined,
  });

  return {
    ownsNFT: owner === address,
    owner,
    isLoading,
  };
}
