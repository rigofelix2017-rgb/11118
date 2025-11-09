import { requireRole } from "@/lib/auth-utils"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { UserManagementTable } from "@/components/user-management-table"
import { ActivityLogTable } from "@/components/activity-log-table"

export default async function FounderPortalPage() {
  await requireRole(["founder"])

  const supabase = await createClient()

  // Get all users with their profiles
  const { data: users } = await supabase.from("profiles").select("*").order("created_at", { ascending: false })

  // Get recent activity
  const { data: activities } = await supabase
    .from("activity_log")
    .select(`
      *,
      profiles:user_id (
        display_name,
        email
      )
    `)
    .order("created_at", { ascending: false })
    .limit(20)

  // Get statistics
  const { count: totalUsers } = await supabase.from("profiles").select("*", { count: "exact", head: true })

  const { count: foundersCount } = await supabase
    .from("profiles")
    .select("*", { count: "exact", head: true })
    .eq("role", "founder")

  const { count: governanceCount } = await supabase
    .from("profiles")
    .select("*", { count: "exact", head: true })
    .eq("role", "governance_member")

  const { count: regularUsersCount } = await supabase
    .from("profiles")
    .select("*", { count: "exact", head: true })
    .eq("role", "user")

  return (
    <div className="container py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Founder Portal</h1>
        <p className="text-muted-foreground">Advanced system administration and user management</p>
      </div>

      <div className="mb-8 grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Total Users</CardDescription>
            <CardTitle className="text-4xl">{totalUsers || 0}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Founders</CardDescription>
            <CardTitle className="text-4xl">{foundersCount || 0}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Governance Members</CardDescription>
            <CardTitle className="text-4xl">{governanceCount || 0}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Regular Users</CardDescription>
            <CardTitle className="text-4xl">{regularUsersCount || 0}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <div className="mb-8">
        <Card>
          <CardHeader>
            <CardTitle>User Management</CardTitle>
            <CardDescription>Manage user roles and permissions</CardDescription>
          </CardHeader>
          <CardContent>
            <UserManagementTable users={users || []} />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>System activity log and audit trail</CardDescription>
        </CardHeader>
        <CardContent>
          <ActivityLogTable activities={activities || []} />
        </CardContent>
      </Card>
    </div>
  )
}
