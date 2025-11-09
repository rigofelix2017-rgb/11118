"use client"

import { useEffect, useState } from "react"
import type { DailyTask } from "@/lib/xp/types"

interface DailyTaskRow {
  id: string
  profile_id: string
  template_id: string
  date: string
  progress_value: number
  completed: boolean
  claimed: boolean
  daily_task_templates: {
    code: string
    title: string
    description: string
    track: string
    xp_reward: number
    target_value: number
  }
}

export function useDailyTasks() {
  const [tasks, setTasks] = useState<DailyTask[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch("/api/daily-tasks")
      .then((res) => res.json())
      .then((json) => {
        if (json.error) {
          setError(json.error)
        } else if (json.tasks) {
          const mapped = (json.tasks as DailyTaskRow[]).map((t) => ({
            id: t.id,
            label: t.daily_task_templates.title,
            description: t.daily_task_templates.description,
            xpReward: t.daily_task_templates.xp_reward,
            progress: t.progress_value,
            target: t.daily_task_templates.target_value,
            completed: t.completed,
            track: t.daily_task_templates.track as "explorer" | "builder" | "operator",
          }))
          setTasks(mapped)
        }
      })
      .catch((err) => {
        console.error("[v0] Failed to fetch daily tasks:", err)
        setError("Failed to load tasks")
      })
      .finally(() => setLoading(false))
  }, [])

  return { tasks, loading, error }
}
