import { requireRole } from "@/lib/auth-utils"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default async function AdminDashboard() {
  await requireRole(["governance_member", "founder"])

  const supabase = await createClient()

  // Get all proposals with creator info
  const { data: proposals } = await supabase
    .from("governance_proposals")
    .select(`
      *,
      profiles:proposed_by (
        display_name,
        email
      )
    `)
    .order("created_at", { ascending: false })

  // Get statistics
  const { count: totalProposals } = await supabase
    .from("governance_proposals")
    .select("*", { count: "exact", head: true })

  const { count: pendingProposals } = await supabase
    .from("governance_proposals")
    .select("*", { count: "exact", head: true })
    .eq("status", "pending")

  const { count: totalMembers } = await supabase
    .from("profiles")
    .select("*", { count: "exact", head: true })
    .in("role", ["governance_member", "founder"])

  return (
    <div className="container py-8 px-4">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Governance Dashboard</h1>
          <p className="text-muted-foreground">Manage proposals and oversee platform governance</p>
        </div>
        <Button asChild>
          <Link href="/governance/new-proposal">New Proposal</Link>
        </Button>
      </div>

      <div className="mb-8 grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Total Proposals</CardDescription>
            <CardTitle className="text-4xl">{totalProposals || 0}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Pending Review</CardDescription>
            <CardTitle className="text-4xl">{pendingProposals || 0}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Governance Members</CardDescription>
            <CardTitle className="text-4xl">{totalMembers || 0}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Proposals</CardTitle>
          <CardDescription>Latest governance proposals and their status</CardDescription>
        </CardHeader>
        <CardContent>
          {!proposals || proposals.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No proposals yet. Create the first one!</p>
          ) : (
            <div className="space-y-4">
              {proposals.map((proposal: any) => (
                <Link key={proposal.id} href={`/governance/proposal/${proposal.id}`} className="block">
                  <div className="flex items-start justify-between rounded-lg border p-4 hover:bg-accent transition-colors">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold">{proposal.title}</h3>
                        <Badge
                          variant={
                            proposal.status === "approved"
                              ? "default"
                              : proposal.status === "rejected"
                                ? "destructive"
                                : "secondary"
                          }
                        >
                          {proposal.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-2">{proposal.description}</p>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span>Proposed by {proposal.profiles?.display_name || "Unknown"}</span>
                        <span>{new Date(proposal.created_at).toLocaleDateString()}</span>
                        <span className="flex items-center gap-2">
                          <span className="text-green-600">{proposal.votes_for} for</span>
                          <span className="text-red-600">{proposal.votes_against} against</span>
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
