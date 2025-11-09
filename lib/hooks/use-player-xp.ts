"use client"

import { useEffect, useState } from "react"
import type { PlayerXp } from "@/lib/xp/types"

interface PlayerXpRow {
  id: string
  profile_id: string
  wallet_address: string | null
  total_xp: number
  explorer_xp: number
  builder_xp: number
  operator_xp: number
  level: number
  last_daily_reset: string | null
}

export function usePlayerXp() {
  const [xp, setXp] = useState<PlayerXp | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch("/api/player-xp")
      .then((res) => res.json())
      .then((json) => {
        if (json.error) {
          setError(json.error)
        } else if (json.xp) {
          const row = json.xp as PlayerXpRow
          setXp({
            totalXp: row.total_xp,
            explorerXp: row.explorer_xp,
            builderXp: row.builder_xp,
            operatorXp: row.operator_xp,
            level: row.level,
          })
        }
      })
      .catch((err) => {
        console.error("[v0] Failed to fetch player XP:", err)
        setError("Failed to load XP data")
      })
      .finally(() => setLoading(false))
  }, [])

  return { xp, loading, error }
}
