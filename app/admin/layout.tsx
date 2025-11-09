import type React from "react"
import { requireRole } from "@/lib/auth-utils"
import { createClient } from "@/lib/supabase/server"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { redirect } from "next/navigation"

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Require governance member or founder role
  const profile = await requireRole(["governance_member", "founder"])

  const handleSignOut = async () => {
    "use server"
    const supabase = await createClient()
    await supabase.auth.signOut()
    redirect("/auth/login")
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b bg-background">
        <div className="container flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-6">
            <Link href="/admin" className="text-lg font-semibold">
              PSX-VOID Admin
            </Link>
            <nav className="flex gap-4">
              <Link href="/admin" className="text-sm text-muted-foreground hover:text-foreground">
                Dashboard
              </Link>
              {profile.role === "founder" && (
                <Link href="/admin/founder" className="text-sm text-muted-foreground hover:text-foreground">
                  Founder Portal
                </Link>
              )}
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">
              {profile.display_name} ({profile.role})
            </span>
            <form action={handleSignOut}>
              <Button type="submit" variant="outline" size="sm">
                Sign Out
              </Button>
            </form>
          </div>
        </div>
      </header>
      <main className="flex-1">{children}</main>
    </div>
  )
}
