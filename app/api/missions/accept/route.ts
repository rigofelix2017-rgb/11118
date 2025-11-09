import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(req: Request) {
  const { missionCode } = await req.json()
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { data: mission, error: mErr } = await supabase
    .from("mission_templates")
    .select("*")
    .eq("code", missionCode)
    .maybeSingle()

  if (mErr || !mission) {
    return NextResponse.json({ error: "Mission not found" }, { status: 404 })
  }

  const { data, error } = await supabase
    .from("player_missions")
    .upsert(
      {
        profile_id: user.id,
        mission_id: mission.id,
        status: "accepted",
        progress: {},
      },
      { onConflict: "profile_id,mission_id" },
    )
    .select("*")
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ mission: data })
}
