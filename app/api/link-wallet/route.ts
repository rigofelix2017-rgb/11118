import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(req: Request) {
  try {
    const { walletAddress, privyUserId } = await req.json()

    if (!walletAddress) {
      return NextResponse.json({ error: "walletAddress required" }, { status: 400 })
    }

    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Update profile with wallet information
    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        wallet_address: walletAddress.toLowerCase(),
        privy_user_id: privyUserId ?? null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id)

    if (updateError) {
      console.error("[v0] Failed to link wallet:", updateError)
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    // Initialize player XP if not exists
    const { error: xpError } = await supabase.from("player_xp").upsert(
      {
        profile_id: user.id,
        wallet_address: walletAddress.toLowerCase(),
      },
      { onConflict: "profile_id", ignoreDuplicates: true },
    )

    if (xpError) {
      console.error("[v0] Failed to initialize player XP:", xpError)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Link wallet error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
