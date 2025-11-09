import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(req: Request) {
  const { targetProfileId } = await req.json()
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  // Confirm friendship
  const { data: relation } = await supabase
    .from("friends")
    .select("id")
    .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`)
    .eq("status", "accepted")
    .limit(1)

  if (!relation || relation.length === 0) {
    return NextResponse.json({ error: "Not friends" }, { status: 403 })
  }

  // Get friend's session
  const { data: session, error: sErr } = await supabase
    .from("player_sessions")
    .select("*")
    .eq("profile_id", targetProfileId)
    .eq("is_online", true)
    .maybeSingle()

  if (sErr || !session) {
    return NextResponse.json({ error: "Friend offline" }, { status: 404 })
  }

  return NextResponse.json({
    districtId: session.district_id,
    x: Number(session.x),
    y: Number(session.y),
    z: Number(session.z),
  })
}
