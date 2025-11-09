"use client"

import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi"
import { parseEther, formatEther } from "viem"
import { CONTRACT_ADDRESSES, VOID_TOKEN_ABI } from "@/lib/contracts"

export function useVOIDToken() {
  const { address } = useAccount()
  const { writeContract, data: hash, isPending } = useWriteContract()
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash })

  const { data: balance } = useReadContract({
    address: CONTRACT_ADDRESSES.VOID_TOKEN as `0x${string}`,
    abi: VOID_TOKEN_ABI,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    // @ts-ignore - wagmi types are being weird
    enabled: !!address,
  })

  const { data: tradingEnabled } = useReadContract({
    address: CONTRACT_ADDRESSES.VOID_TOKEN as `0x${string}`,
    abi: VOID_TOKEN_ABI,
    functionName: "tradingEnabled",
  })

  const transfer = (to: string, amount: string) => {
    writeContract({
      address: CONTRACT_ADDRESSES.VOID_TOKEN as `0x${string}`,
      abi: VOID_TOKEN_ABI,
      functionName: "transfer",
      args: [to as `0x${string}`, parseEther(amount)],
    })
  }

  const approve = (spender: string, amount: string) => {
    writeContract({
      address: CONTRACT_ADDRESSES.VOID_TOKEN as `0x${string}`,
      abi: VOID_TOKEN_ABI,
      functionName: "approve",
      args: [spender as `0x${string}`, parseEther(amount)],
    })
  }

  return {
    balance: balance ? formatEther(balance as bigint) : "0",
    tradingEnabled: tradingEnabled as boolean,
    transfer,
    approve,
    isPending,
    isConfirming,
    isSuccess,
  }
}
