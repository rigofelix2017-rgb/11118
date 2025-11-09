import { requireRole } from "@/lib/auth-utils"
import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { VoteButtons } from "@/components/vote-buttons"
import { UpdateProposalStatus } from "@/components/update-proposal-status"

export default async function ProposalDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const profile = await requireRole(["governance_member", "founder"])
  const supabase = await createClient()
  const { id } = await params

  // Get proposal with creator info
  const { data: proposal } = await supabase
    .from("governance_proposals")
    .select(`
      *,
      profiles:proposed_by (
        display_name,
        email
      )
    `)
    .eq("id", id)
    .single()

  if (!proposal) {
    notFound()
  }

  // Get user's vote if exists
  const { data: userVote } = await supabase
    .from("proposal_votes")
    .select("*")
    .eq("proposal_id", id)
    .eq("user_id", profile.id)
    .single()

  // Get all votes with voter info
  const { data: votes } = await supabase
    .from("proposal_votes")
    .select(`
      *,
      profiles:user_id (
        display_name
      )
    `)
    .eq("proposal_id", id)
    .order("created_at", { ascending: false })

  return (
    <div className="container max-w-4xl py-8 px-4">
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <CardTitle className="text-3xl">{proposal.title}</CardTitle>
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
              <CardDescription>
                Proposed by {proposal.profiles?.display_name || "Unknown"} on{" "}
                {new Date(proposal.created_at).toLocaleDateString()}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-foreground leading-relaxed whitespace-pre-wrap">{proposal.description}</p>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2 mb-6">
        <Card>
          <CardHeader>
            <CardTitle>Voting Results</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-lg">For:</span>
                <span className="text-2xl font-bold text-green-600">{proposal.votes_for}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-lg">Against:</span>
                <span className="text-2xl font-bold text-red-600">{proposal.votes_against}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Your Vote</CardTitle>
          </CardHeader>
          <CardContent>
            <VoteButtons proposalId={id} currentVote={userVote?.vote} userId={profile.id} />
          </CardContent>
        </Card>
      </div>

      {profile.role === "founder" && (
        <Card>
          <CardHeader>
            <CardTitle>Founder Actions</CardTitle>
            <CardDescription>Update proposal status</CardDescription>
          </CardHeader>
          <CardContent>
            <UpdateProposalStatus proposalId={id} currentStatus={proposal.status} />
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Vote History ({votes?.length || 0})</CardTitle>
        </CardHeader>
        <CardContent>
          {!votes || votes.length === 0 ? (
            <p className="text-center text-muted-foreground py-4">No votes yet</p>
          ) : (
            <div className="space-y-2">
              {votes.map((vote: any) => (
                <div key={vote.id} className="flex items-center justify-between rounded-lg border p-3">
                  <span className="font-medium">{vote.profiles?.display_name || "Unknown"}</span>
                  <Badge variant={vote.vote ? "default" : "destructive"}>{vote.vote ? "For" : "Against"}</Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
