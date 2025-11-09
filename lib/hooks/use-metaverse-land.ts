"use client"

import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi"
import { parseEther } from "viem"
import { CONTRACT_ADDRESSES, METAVERSE_LAND_ABI } from "@/lib/contracts"

export function useMetaverseLand() {
  const { address } = useAccount()
  const { writeContract, data: hash, isPending } = useWriteContract()
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash })

  const { data: ownedParcels } = useReadContract({
    address: CONTRACT_ADDRESSES.METAVERSE_LAND as `0x${string}`,
    abi: METAVERSE_LAND_ABI,
    functionName: "getParcelsByOwner",
    args: address ? [address] : undefined,
    // @ts-ignore - wagmi types are being weird
    enabled: !!address,
  })

  const buyParcel = (tokenId: number, value: string) => {
    writeContract({
      address: CONTRACT_ADDRESSES.METAVERSE_LAND as `0x${string}`,
      abi: METAVERSE_LAND_ABI,
      functionName: "buyParcel",
      args: [BigInt(tokenId)],
      value: parseEther(value),
    })
  }

  const listParcel = (tokenId: number, price: string) => {
    writeContract({
      address: CONTRACT_ADDRESSES.METAVERSE_LAND as `0x${string}`,
      abi: METAVERSE_LAND_ABI,
      functionName: "listParcel",
      args: [BigInt(tokenId), parseEther(price)],
    })
  }

  return {
    ownedParcels: ownedParcels as bigint[] | undefined,
    buyParcel,
    listParcel,
    isPending,
    isConfirming,
    isSuccess,
  }
}
