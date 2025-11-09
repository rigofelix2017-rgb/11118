import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { data, error } = await supabase
    .from("friends")
    .select(
      `
      id,
      status,
      requester_id,
      addressee_id,
      requester:profiles!friends_requester_id_fkey(id, display_name, wallet_address),
      addressee:profiles!friends_addressee_id_fkey(id, display_name, wallet_address)
    `,
    )
    .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`)
    .eq("status", "accepted")

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Normalize: return the "other" user as friend
  const friends = (data ?? []).map((row: any) => {
    const friend = row.requester_id === user.id ? row.addressee : row.requester
    return {
      id: row.id,
      status: row.status,
      friendProfileId: friend.id,
      displayName: friend.display_name,
      walletAddress: friend.wallet_address,
    }
  })

  return NextResponse.json({ friends })
}
