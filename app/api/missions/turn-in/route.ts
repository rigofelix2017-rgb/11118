import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(req: Request) {
  const { missionId } = await req.json()
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { data: missionRow, error: pErr } = await supabase
    .from("player_missions")
    .select("*, mission_templates(*)")
    .eq("id", missionId)
    .eq("profile_id", user.id)
    .maybeSingle()

  if (pErr || !missionRow) {
    return NextResponse.json({ error: "Mission not found" }, { status: 404 })
  }

  if (missionRow.status !== "completed") {
    return NextResponse.json({ error: "Mission not completed yet" }, { status: 400 })
  }

  const tpl = missionRow.mission_templates

  // Grant XP
  const { error: xpErr } = await supabase.rpc("grant_xp", {
    p_profile_id: user.id,
    p_track: tpl.track,
    p_amount: tpl.xp_reward,
    p_event_type: "npc_mission",
    p_metadata: { mission_code: tpl.code },
  })

  if (xpErr) {
    return NextResponse.json({ error: xpErr.message }, { status: 500 })
  }

  // Mark turned in
  const { error: uErr } = await supabase
    .from("player_missions")
    .update({ status: "turned_in", updated_at: new Date().toISOString() })
    .eq("id", missionId)

  if (uErr) return NextResponse.json({ error: uErr.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}
