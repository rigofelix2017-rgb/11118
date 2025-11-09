import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { fromDistrict, toDistrict, type, cost } = body

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

    // TODO: Get user address from session/wallet
    const userAddress = "0x..." // Placeholder

    // Check daily limit
    const { data: teleportCheck, error: checkError } = await supabase.rpc("check_teleport_limit", {
      user_addr: userAddress,
    })

    if (checkError || !teleportCheck) {
      return NextResponse.json({ error: "Daily teleport limit reached" }, { status: 429 })
    }

    // Record teleport
    const { error } = await supabase.from("teleport_history").insert({
      user_address: userAddress,
      from_district: fromDistrict,
      to_district: toDistrict,
      teleport_type: type,
      void_cost: cost,
    })

    if (error) {
      console.error("[v0] Teleport recording error:", error)
      return NextResponse.json({ error: "Failed to record teleport" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Teleport API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
