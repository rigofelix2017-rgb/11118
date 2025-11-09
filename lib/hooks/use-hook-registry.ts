"use client"

import { useState, useEffect } from "react"
import { createBrowserClient } from "@supabase/ssr"
import { useAccount } from "wagmi"

const supabase = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

export type HookStatus = "pending" | "approved" | "active" | "inactive" | "removed"
export type HookType = "defi" | "gaming" | "social" | "nft" | "entertainment" | "infrastructure" | "other"

export interface RegisteredHook {
  id: string
  hook_address: string
  hook_name: string
  hook_type: HookType
  owner_wallet: string
  property_id?: string
  coordinates_x?: number
  coordinates_y?: number
  coordinates_z?: number
  district?: string
  total_volume: number
  last_30d_volume: number
  peak_daily_volume: number
  status: HookStatus
  approved_at?: string
  approval_proposal_id?: string
  whitelisted_for_signals: boolean
  signals_nft_granted: boolean
  whitelist_threshold_met_at?: string
  last_activity_at: string
  last_tax_payment_at: string
  tax_balance: number
  created_at: string
  updated_at: string
  metadata?: any
}

const SIGNALS_WHITELIST_THRESHOLD = 100000000 // $100M cumulative volume

export function useHookRegistry() {
  const { address } = useAccount()
  const [hooks, setHooks] = useState<RegisteredHook[]>([])
  const [myHooks, setMyHooks] = useState<RegisteredHook[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadHooks()
  }, [address])

  async function loadHooks() {
    try {
      setLoading(true)

      // Load all hooks
      const { data: allData, error: allError } = await supabase
        .from("hook_registry")
        .select("*")
        .order("total_volume", { ascending: false })

      if (allError) throw allError
      setHooks(allData || [])

      // Load user's hooks if wallet connected
      if (address) {
        const { data: myData, error: myError } = await supabase
          .from("hook_registry")
          .select("*")
          .eq("owner_wallet", address)
          .order("created_at", { ascending: false })

        if (myError) throw myError
        setMyHooks(myData || [])
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function registerHook(hookAddress: string, hookName: string, hookType: HookType, metadata?: any) {
    if (!address) throw new Error("Wallet not connected")

    const { data, error } = await supabase
      .from("hook_registry")
      .insert({
        hook_address: hookAddress,
        hook_name: hookName,
        hook_type: hookType,
        owner_wallet: address,
        metadata,
      })
      .select()
      .single()

    if (error) throw error
    await loadHooks()
    return data
  }

  async function assignPropertyToHook(
    hookAddress: string,
    propertyId: string,
    coordinates: { x: number; y: number; z: number },
    district: string,
  ) {
    const { error } = await supabase
      .from("hook_registry")
      .update({
        property_id: propertyId,
        coordinates_x: coordinates.x,
        coordinates_y: coordinates.y,
        coordinates_z: coordinates.z,
        district,
        status: "active",
        updated_at: new Date().toISOString(),
      })
      .eq("hook_address", hookAddress)

    if (error) throw error
    await loadHooks()
  }

  async function recordVolume(hookAddress: string, dailyVolume: number, transactionCount: number, uniqueUsers: number) {
    const today = new Date().toISOString().split("T")[0]

    // Insert or update daily volume
    const { error: volumeError } = await supabase.from("hook_volume_history").upsert({
      hook_address: hookAddress,
      date: today,
      daily_volume: dailyVolume,
      transaction_count: transactionCount,
      unique_users: uniqueUsers,
    })

    if (volumeError) throw volumeError

    // Update hook registry totals
    const hook = hooks.find((h) => h.hook_address === hookAddress)
    if (hook) {
      const newTotalVolume = hook.total_volume + dailyVolume
      const newPeakDaily = Math.max(hook.peak_daily_volume, dailyVolume)

      // Check if threshold met for Signals whitelist
      const shouldWhitelist = newTotalVolume >= SIGNALS_WHITELIST_THRESHOLD && !hook.whitelisted_for_signals

      const updates: any = {
        total_volume: newTotalVolume,
        peak_daily_volume: newPeakDaily,
        last_activity_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

      if (shouldWhitelist) {
        updates.whitelisted_for_signals = true
        updates.whitelist_threshold_met_at = new Date().toISOString()
      }

      const { error: updateError } = await supabase
        .from("hook_registry")
        .update(updates)
        .eq("hook_address", hookAddress)

      if (updateError) throw updateError
    }

    await loadHooks()
  }

  async function payPropertyTax(
    hookAddress: string,
    amount: number,
    periodStart: Date,
    periodEnd: Date,
    txHash?: string,
  ) {
    const hook = hooks.find((h) => h.hook_address === hookAddress)
    if (!hook?.property_id) throw new Error("Hook has no assigned property")

    // Record payment
    const { error: paymentError } = await supabase.from("property_tax_payments").insert({
      hook_address: hookAddress,
      property_id: hook.property_id,
      amount,
      payment_period_start: periodStart.toISOString().split("T")[0],
      payment_period_end: periodEnd.toISOString().split("T")[0],
      transaction_hash: txHash,
    })

    if (paymentError) throw paymentError

    // Update hook tax balance
    const { error: updateError } = await supabase
      .from("hook_registry")
      .update({
        tax_balance: hook.tax_balance + amount,
        last_tax_payment_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("hook_address", hookAddress)

    if (updateError) throw updateError
    await loadHooks()
  }

  async function calculateTaxOwed(hookAddress: string): Promise<number> {
    const hook = hooks.find((h) => h.hook_address === hookAddress)
    if (!hook) return 0

    // Get property price from properties table
    const { data: property } = await supabase.from("properties").select("price").eq("id", hook.property_id).single()

    if (!property) return 0

    // Calculate tax: 1% annual, prorated for days since last payment
    const lastPayment = new Date(hook.last_tax_payment_at)
    const now = new Date()
    const daysSincePayment = Math.floor((now.getTime() - lastPayment.getTime()) / (1000 * 60 * 60 * 24))
    const annualTax = property.price * 0.01 // 1% annual rate
    const dailyTax = annualTax / 365
    const taxOwed = Math.floor(dailyTax * daysSincePayment)

    return Math.max(0, taxOwed - hook.tax_balance)
  }

  async function checkInactiveHooks(): Promise<RegisteredHook[]> {
    // Find hooks inactive for 180+ days
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - 180)

    return hooks.filter((hook) => {
      const lastActivity = new Date(hook.last_activity_at)
      return lastActivity < cutoffDate && hook.status === "active"
    })
  }

  return {
    hooks,
    myHooks,
    loading,
    error,
    registerHook,
    assignPropertyToHook,
    recordVolume,
    payPropertyTax,
    calculateTaxOwed,
    checkInactiveHooks,
    refresh: loadHooks,
  }
}
