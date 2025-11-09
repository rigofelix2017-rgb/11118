"use client"

import { useState, useEffect } from "react"
import { useAccount } from "wagmi"

export interface Passport {
  tier: 1 | 2 | 3
  isFounder: boolean
  founderNftCount: number
  canAccessPremium: boolean
  canAccessGlizzyWorld: boolean
  canAccessFounderDistrict: boolean
  reputationScore: number
  achievements: string[]
  badges: string[]
}

export function usePassportSystem() {
  const { address } = useAccount()
  const [passport, setPassport] = useState<Passport | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!address) {
      setPassport(null)
      setIsLoading(false)
      return
    }

    fetchPassport()
  }, [address])

  const fetchPassport = async () => {
    if (!address) return

    try {
      const response = await fetch(`/api/passport?address=${address}`)
      const data = await response.json()
      setPassport(data.passport)
    } catch (error) {
      console.error("[v0] Failed to fetch passport:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const checkDistrictAccess = async (districtId: string): Promise<{ allowed: boolean; reason?: string }> => {
    if (!address) {
      return { allowed: false, reason: "Wallet not connected" }
    }

    try {
      const response = await fetch("/api/passport/check-access", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address, districtId }),
      })
      const data = await response.json()
      return data
    } catch (error) {
      console.error("[v0] Failed to check district access:", error)
      return { allowed: false, reason: "Failed to verify access" }
    }
  }

  const purchasePassport = async (tier: 1 | 2 | 3): Promise<boolean> => {
    if (!address) return false

    try {
      const response = await fetch("/api/passport/purchase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address, tier }),
      })
      const data = await response.json()

      if (data.success) {
        await fetchPassport()
        return true
      }
      return false
    } catch (error) {
      console.error("[v0] Failed to purchase passport:", error)
      return false
    }
  }

  return {
    passport,
    isLoading,
    checkDistrictAccess,
    purchasePassport,
    hasPassport: !!passport,
  }
}
