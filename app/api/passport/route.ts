import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const address = searchParams.get("address")

    if (!address) {
      return NextResponse.json({ error: "Address required" }, { status: 400 })
    }

    const cookieStore = await cookies()
    const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
        },
      },
    })

    const { data, error } = await supabase.from("passports").select("*").eq("owner_address", address).single()

    if (error && error.code !== "PGRST116") {
      // PGRST116 = no rows returned
      console.error("[v0] Passport fetch error:", error)
      return NextResponse.json({ error: "Failed to fetch passport" }, { status: 500 })
    }

    // Return basic passport if none exists
    if (!data) {
      return NextResponse.json({
        ownerAddress: address,
        tier: "basic",
        canAccessAllDistricts: false,
        customCheckpoints: [],
        propertiesOwned: 0,
        achievements: [],
        reputationScore: 0,
        isActive: true,
      })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error("[v0] Passport API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
