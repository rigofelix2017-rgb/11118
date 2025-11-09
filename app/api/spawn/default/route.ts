import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET() {
  const supabase = await createClient()

  // Pick spawn ring near HQ
  const { data: rings } = await supabase.from("spawn_rings").select("*").eq("landmark_code", "psx-hq").limit(1)

  const ring = rings?.[0]
  if (!ring) {
    return NextResponse.json({
      districtId: "spawn-zone",
      x: 0,
      y: 0,
      z: -6,
    })
  }

  // Random angle + radius inside ring
  const angle = Math.random() * 2 * Math.PI
  const radius = Number(ring.inner_radius) + Math.random() * (Number(ring.outer_radius) - Number(ring.inner_radius))

  const spawnX = Number(ring.center_x) + radius * Math.cos(angle)
  const spawnZ = Number(ring.center_z) + radius * Math.sin(angle)

  return NextResponse.json({
    districtId: ring.district_id,
    x: spawnX,
    y: Number(ring.center_y),
    z: spawnZ,
  })
}
