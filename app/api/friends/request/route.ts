import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(req: Request) {
  const { targetProfileId } = await req.json()
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (!targetProfileId) return NextResponse.json({ error: "targetProfileId required" }, { status: 400 })
  if (targetProfileId === user.id) return NextResponse.json({ error: "Cannot add yourself" }, { status: 400 })

  const { error } = await supabase.from("friends").upsert(
    {
      requester_id: user.id,
      addressee_id: targetProfileId,
      status: "pending",
    },
    {
      onConflict: "requester_id,addressee_id",
    },
  )

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
