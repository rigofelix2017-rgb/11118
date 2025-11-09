import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET() {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data, error } = await supabase.from("player_xp").select("*").eq("profile_id", user.id).maybeSingle()

    if (error) {
      console.error("[v0] Failed to fetch player XP:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // If no XP record exists, create one
    if (!data) {
      const { data: newXp, error: createError } = await supabase
        .from("player_xp")
        .insert({
          profile_id: user.id,
        })
        .select()
        .single()

      if (createError) {
        console.error("[v0] Failed to create player XP:", createError)
        return NextResponse.json({ error: createError.message }, { status: 500 })
      }

      return NextResponse.json({ xp: newXp })
    }

    return NextResponse.json({ xp: data })
  } catch (error) {
    console.error("[v0] Player XP error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
