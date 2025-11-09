"use client"

import useSWR from "swr"

export type PassportTier = "basic" | "founder" | "premium"

export interface Passport {
  id: string
  ownerAddress: string
  tier: PassportTier
  canAccessAllDistricts: boolean
  customCheckpoints: string[]
  propertiesOwned: number
  achievements: string[]
  reputationScore: number
  isActive: boolean
  issuedAt: string
  expiresAt?: string
}

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export function usePassport(address?: string) {
  const { data, error, mutate } = useSWR<Passport>(address ? `/api/passport?address=${address}` : null, fetcher)

  const canAccessDistrict = (districtId: string, requirements?: string): boolean => {
    if (!data) return false

    // Founders can access everything
    if (data.tier === "founder" || data.canAccessAllDistricts) {
      return true
    }

    // Check specific requirements
    if (requirements?.includes("5+ Founders NFT")) {
      return data.tier === "founder"
    }

    if (requirements?.includes("100k PSX")) {
      // TODO: Check actual PSX balance
      return data.tier === "premium" || data.tier === "founder"
    }

    // Basic passport can access public districts
    return true
  }

  const purchasePassport = async (tier: PassportTier): Promise<boolean> => {
    try {
      const cost = tier === "premium" ? 1000 : 0 // 1000 VOID for premium
      console.log(`[v0] Purchasing ${tier} passport - Cost: ${cost} VOID`)

      const response = await fetch("/api/passport/purchase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tier, cost }),
      })

      if (response.ok) {
        mutate()
        return true
      }
      return false
    } catch (error) {
      console.error("[v0] Passport purchase error:", error)
      return false
    }
  }

  return {
    passport: data,
    isLoading: !error && !data,
    isError: error,
    refresh: mutate,
    canAccessDistrict,
    purchasePassport,
  }
}
