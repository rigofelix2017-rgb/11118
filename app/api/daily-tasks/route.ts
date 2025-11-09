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

    const today = new Date().toISOString().slice(0, 10)

    // Fetch existing tasks for today
    let { data: tasks, error } = await supabase
      .from("daily_tasks")
      .select("*, daily_task_templates(*)")
      .eq("profile_id", user.id)
      .eq("date", today)

    if (error) {
      console.error("[v0] Failed to fetch daily tasks:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // If no tasks exist for today, spawn them from templates
    if (!tasks || tasks.length === 0) {
      const { data: templates, error: tErr } = await supabase
        .from("daily_task_templates")
        .select("*")
        .eq("is_active", true)

      if (tErr || !templates) {
        console.error("[v0] Failed to fetch task templates:", tErr)
        return NextResponse.json({ error: tErr?.message }, { status: 500 })
      }

      const inserts = templates.map((tpl) => ({
        profile_id: user.id,
        template_id: tpl.id,
        date: today,
      }))

      const { data: newTasks, error: nErr } = await supabase
        .from("daily_tasks")
        .insert(inserts)
        .select("*, daily_task_templates(*)")

      if (nErr) {
        console.error("[v0] Failed to create daily tasks:", nErr)
        return NextResponse.json({ error: nErr.message }, { status: 500 })
      }

      tasks = newTasks
    }

    return NextResponse.json({ tasks })
  } catch (error) {
    console.error("[v0] Daily tasks error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
