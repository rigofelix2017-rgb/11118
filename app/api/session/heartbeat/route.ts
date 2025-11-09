import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(req: Request) {
  const { districtId, x, y, z } = await req.json()
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { data: profile } = await supabase.from("profiles").select("wallet_address").eq("id", user.id).maybeSingle()

  const wallet = profile?.wallet_address ?? null

  const { error } = await supabase.from("player_sessions").upsert(
    {
      profile_id: user.id,
      wallet_address: wallet,
      district_id: districtId,
      x,
      y,
      z,
      is_online: true,
      last_heartbeat: new Date().toISOString(),
    },
    { onConflict: "profile_id" },
  )

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
