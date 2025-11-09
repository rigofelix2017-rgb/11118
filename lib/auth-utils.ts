import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

export type UserRole = "founder" | "governance_member" | "user"

export interface UserProfile {
  id: string
  email: string
  display_name: string | null
  role: UserRole
}

/**
 * Get the current authenticated user and their profile
 * Redirects to login if not authenticated
 */
export async function requireAuth() {
  const supabase = await createClient()

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    redirect("/auth/login")
  }

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()

  if (!profile) {
    redirect("/auth/login")
  }

  return { user, profile: profile as UserProfile }
}

/**
 * Require specific role access
 */
export async function requireRole(allowedRoles: UserRole[]) {
  const { profile } = await requireAuth()

  if (!allowedRoles.includes(profile.role)) {
    redirect("/")
  }

  return profile
}
