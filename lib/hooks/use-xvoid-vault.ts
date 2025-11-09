"use client"

import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi"
import { parseEther, formatEther } from "viem"
import { CONTRACT_ADDRESSES, XVOID_VAULT_ABI } from "@/lib/contracts"

export function useXVOIDVault() {
  const { address } = useAccount()
  const { writeContract, data: hash, isPending } = useWriteContract()
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash })

  const { data: stakeInfo } = useReadContract({
    address: CONTRACT_ADDRESSES.XVOID_VAULT as `0x${string}`,
    abi: XVOID_VAULT_ABI,
    functionName: "getStakeInfo",
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
    },
  })

  const { data: totalStaked } = useReadContract({
    address: CONTRACT_ADDRESSES.XVOID_VAULT as `0x${string}`,
    abi: XVOID_VAULT_ABI,
    functionName: "totalStakedVOID",
  })

  const { data: totalRewards } = useReadContract({
    address: CONTRACT_ADDRESSES.XVOID_VAULT as `0x${string}`,
    abi: XVOID_VAULT_ABI,
    functionName: "totalRewardsDistributed",
  })

  const stake = (amount: string, lockPeriod: number) => {
    writeContract({
      address: CONTRACT_ADDRESSES.XVOID_VAULT as `0x${string}`,
      abi: XVOID_VAULT_ABI,
      functionName: "stake",
      args: [parseEther(amount), BigInt(lockPeriod)],
    })
  }

  const unstake = () => {
    writeContract({
      address: CONTRACT_ADDRESSES.XVOID_VAULT as `0x${string}`,
      abi: XVOID_VAULT_ABI,
      functionName: "unstake",
    })
  }

  const parsedStakeInfo = stakeInfo
    ? {
        stakedAmount: formatEther(stakeInfo[0] as bigint),
        xVoidBalance: formatEther(stakeInfo[1] as bigint),
        lockEnd: new Date(Number(stakeInfo[2]) * 1000),
        multiplier: Number(stakeInfo[3]) / 100,
        isLocked: stakeInfo[4] as boolean,
      }
    : null

  // Calculate estimated APY (30% of fees to stakers)
  const estimatedAPY =
    totalStaked && totalRewards
      ? (Number(formatEther(totalRewards as bigint)) / Number(formatEther(totalStaked as bigint))) * 100 * 0.3
      : 0

  return {
    stakeInfo: parsedStakeInfo,
    totalStaked: totalStaked ? formatEther(totalStaked as bigint) : "0",
    totalRewards: totalRewards ? formatEther(totalRewards as bigint) : "0",
    estimatedAPY,
    stake,
    unstake,
    isPending,
    isConfirming,
    isSuccess,
  }
}
