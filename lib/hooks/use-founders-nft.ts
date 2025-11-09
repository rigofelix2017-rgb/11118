"use client"

import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi"
import { parseEther } from "viem"
import { CONTRACT_ADDRESSES, FOUNDERS_NFT_ABI } from "@/lib/contracts"

export function useFoundersNFT() {
  const { address } = useAccount()
  const { writeContract, data: hash, isPending } = useWriteContract()
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash })

  const { data: balance } = useReadContract({
    address: CONTRACT_ADDRESSES.FOUNDERS_NFT as `0x${string}`,
    abi: FOUNDERS_NFT_ABI,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    // @ts-ignore - wagmi types are being weird
    enabled: !!address,
  })

  const { data: schizoMintActive } = useReadContract({
    address: CONTRACT_ADDRESSES.FOUNDERS_NFT as `0x${string}`,
    abi: FOUNDERS_NFT_ABI,
    functionName: "schizoMintActive",
  })

  const { data: whitelistMintActive } = useReadContract({
    address: CONTRACT_ADDRESSES.FOUNDERS_NFT as `0x${string}`,
    abi: FOUNDERS_NFT_ABI,
    functionName: "whitelistMintActive",
  })

  const { data: publicMintActive } = useReadContract({
    address: CONTRACT_ADDRESSES.FOUNDERS_NFT as `0x${string}`,
    abi: FOUNDERS_NFT_ABI,
    functionName: "publicMintActive",
  })

  const { data: whitelistPrice } = useReadContract({
    address: CONTRACT_ADDRESSES.FOUNDERS_NFT as `0x${string}`,
    abi: FOUNDERS_NFT_ABI,
    functionName: "whitelistPrice",
  })

  const { data: publicPrice } = useReadContract({
    address: CONTRACT_ADDRESSES.FOUNDERS_NFT as `0x${string}`,
    abi: FOUNDERS_NFT_ABI,
    functionName: "publicPrice",
  })

  const schizoMint = (quantity: number, proof: `0x${string}`[]) => {
    writeContract({
      address: CONTRACT_ADDRESSES.FOUNDERS_NFT as `0x${string}`,
      abi: FOUNDERS_NFT_ABI,
      functionName: "schizoMint",
      args: [BigInt(quantity), proof],
    })
  }

  const whitelistMint = (quantity: number, proof: `0x${string}`[], value: string) => {
    writeContract({
      address: CONTRACT_ADDRESSES.FOUNDERS_NFT as `0x${string}`,
      abi: FOUNDERS_NFT_ABI,
      functionName: "whitelistMint",
      args: [BigInt(quantity), proof],
      value: parseEther(value),
    })
  }

  const publicMint = (quantity: number, value: string) => {
    writeContract({
      address: CONTRACT_ADDRESSES.FOUNDERS_NFT as `0x${string}`,
      abi: FOUNDERS_NFT_ABI,
      functionName: "publicMint",
      args: [BigInt(quantity)],
      value: parseEther(value),
    })
  }

  // Check if user is eligible for VOID test (3+ NFTs)
  const isVOIDTestEligible = balance ? Number(balance) >= 3 : false

  return {
    balance: balance ? Number(balance) : 0,
    isVOIDTestEligible,
    schizoMintActive: schizoMintActive as boolean,
    whitelistMintActive: whitelistMintActive as boolean,
    publicMintActive: publicMintActive as boolean,
    whitelistPrice: whitelistPrice ? whitelistPrice.toString() : "0",
    publicPrice: publicPrice ? publicPrice.toString() : "0",
    schizoMint,
    whitelistMint,
    publicMint,
    isPending,
    isConfirming,
    isSuccess,
  }
}
