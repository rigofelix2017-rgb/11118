import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { data: relations, error } = await supabase
    .from("friends")
    .select(
      `
      id,
      status,
      requester_id,
      addressee_id,
      requester:profiles!friends_requester_id_fkey(id, display_name),
      addressee:profiles!friends_addressee_id_fkey(id, display_name)
    `,
    )
    .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`)
    .eq("status", "accepted")

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const friendIds = new Set<string>()
  const friendMap: Record<string, { profileId: string; displayName: string }> = {}

  for (const row of relations ?? []) {
    const friend = row.requester_id === user.id ? row.addressee : row.requester
    friendIds.add(friend.id)
    friendMap[friend.id] = {
      profileId: friend.id,
      displayName: friend.display_name,
    }
  }

  if (friendIds.size === 0) return NextResponse.json({ friends: [] })

  const { data: sessions } = await supabase
    .from("player_sessions")
    .select("*")
    .in("profile_id", Array.from(friendIds))
    .eq("is_online", true)

  const friends = (sessions ?? []).map((s) => ({
    profileId: s.profile_id,
    displayName: friendMap[s.profile_id]?.displayName ?? "Unknown",
    districtId: s.district_id,
    x: s.x,
    y: s.y,
    z: s.z,
  }))

  return NextResponse.json({ friends })
}
