"use client"

import { useState } from "react"

import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi"
import { parseEther } from "viem"
import { CONTRACT_ADDRESSES, SKU_FACTORY_ABI } from "@/lib/contracts"

export function useSKUSystem() {
  const { address } = useAccount()
  const { writeContract, data: hash, isPending } = useWriteContract()
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash })

  const [skuData, setSKUData] = useState<any>(null)
  const [skuBalance, setSKUBalance] = useState<number>(0)

  const createSKU = (price: string, supply: number, metadataURI: string) => {
    writeContract({
      address: CONTRACT_ADDRESSES.SKU_FACTORY as `0x${string}`,
      abi: SKU_FACTORY_ABI,
      functionName: "createSKU",
      args: [parseEther(price), BigInt(supply), metadataURI],
    })
  }

  const purchaseSKU = (skuId: number, quantity: number, value: string) => {
    writeContract({
      address: CONTRACT_ADDRESSES.SKU_FACTORY as `0x${string}`,
      abi: SKU_FACTORY_ABI,
      functionName: "purchaseSKU",
      args: [BigInt(skuId), BigInt(quantity)],
      value: parseEther(value),
    })
  }

  const getSKU = (skuId: number) => {
    setSKUData(null) // Reset data before fetching new SKU
    useReadContract({
      address: CONTRACT_ADDRESSES.SKU_FACTORY as `0x${string}`,
      abi: SKU_FACTORY_ABI,
      functionName: "getSKU",
      args: [BigInt(skuId)],
      onSuccess: (data) => setSKUData(data),
    })
  }

  const getSKUBalance = (skuId: number) => {
    setSKUBalance(0) // Reset balance before fetching new balance
    useReadContract({
      address: CONTRACT_ADDRESSES.SKU_FACTORY as `0x${string}`,
      abi: SKU_FACTORY_ABI,
      functionName: "balanceOf",
      args: address ? [address, BigInt(skuId)] : undefined,
      query: {
        enabled: !!address,
      },
      onSuccess: (data) => setSKUBalance(data ? Number(data) : 0),
    })
  }

  return {
    createSKU,
    purchaseSKU,
    skuData,
    skuBalance,
    isPending,
    isConfirming,
    isSuccess,
  }
}
