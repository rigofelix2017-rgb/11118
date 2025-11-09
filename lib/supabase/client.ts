"use client"

import { createBrowserClient as createBrowserClientFromSSR } from "@supabase/ssr"

export { createBrowserClientFromSSR as createBrowserClient }

export function createClient() {
  // Check if running in browser environment
  if (typeof window === "undefined") {
    throw new Error("createClient should only be called in browser environment")
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn("[v0] Supabase environment variables not configured")
    return null as any
  }

  try {
    return createBrowserClientFromSSR(supabaseUrl, supabaseAnonKey)
  } catch (error) {
    console.error("[v0] Failed to create Supabase client:", error)
    return null as any
  }
}
