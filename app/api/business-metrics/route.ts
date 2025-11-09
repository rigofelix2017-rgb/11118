import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
          } catch {
            // Handle cookies in server component
          }
        },
      },
    })

    const { searchParams } = new URL(request.url)
    const propertyId = searchParams.get("propertyId")

    let query = supabase.from("business_metrics").select("*").order("transaction_volume", { ascending: false })

    if (propertyId) {
      query = query.eq("property_id", propertyId)
    }

    const { data, error } = await query

    if (error) {
      console.error("[v0] Business metrics fetch error:", error)
      return NextResponse.json({ error: "Failed to fetch metrics" }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error("[v0] Business metrics API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
