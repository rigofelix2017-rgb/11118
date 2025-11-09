"use client"

import { useState } from "react"

export type TeleportType = "instant" | "cab"

export interface TeleportOptions {
  fromDistrict?: string
  toDistrict: string
  type: TeleportType
}

export function useTeleportSystem() {
  const [isProcessing, setIsProcessing] = useState(false)
  const [dailyTeleports, setDailyTeleports] = useState(0)
  const DAILY_LIMIT = 20

  const getTeleportCost = (type: TeleportType): number => {
    return type === "instant" ? 3 : 1
  }

  const canTeleport = (): boolean => {
    return dailyTeleports < DAILY_LIMIT
  }

  const teleport = async (options: TeleportOptions): Promise<{ success: boolean; error?: string }> => {
    if (!canTeleport()) {
      return { success: false, error: "Daily teleport limit reached (20/20)" }
    }

    setIsProcessing(true)

    try {
      const cost = getTeleportCost(options.type)

      // TODO: Integrate with wallet to deduct VOID tokens
      console.log(`[v0] Teleporting to ${options.toDistrict} (${options.type}) - Cost: ${cost} VOID`)

      // Record teleport
      const response = await fetch("/api/teleport", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fromDistrict: options.fromDistrict,
          toDistrict: options.toDistrict,
          type: options.type,
          cost,
        }),
      })

      if (!response.ok) {
        throw new Error("Teleport failed")
      }

      setDailyTeleports((prev) => prev + 1)

      return { success: true }
    } catch (error) {
      console.error("[v0] Teleport error:", error)
      return { success: false, error: "Teleport failed" }
    } finally {
      setIsProcessing(false)
    }
  }

  return {
    teleport,
    canTeleport,
    getTeleportCost,
    dailyTeleports,
    dailyLimit: DAILY_LIMIT,
    remainingTeleports: DAILY_LIMIT - dailyTeleports,
    isProcessing,
  }
}
