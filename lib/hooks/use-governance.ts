"use client"

import { useState, useEffect } from "react"
import { createBrowserClient } from "@supabase/ssr"
import { useAccount } from "wagmi"

const supabase = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

export type ProposalType = "business_approval" | "bad_actor_removal" | "parameter_change" | "district_allocation"
export type ProposalStatus = "active" | "passed" | "rejected" | "executed"

export interface Proposal {
  id: string
  proposal_type: ProposalType
  title: string
  description: string
  hook_address?: string
  property_id?: string
  target_wallet?: string
  proposer_wallet: string
  created_at: string
  voting_ends_at: string
  votes_for: number
  votes_against: number
  status: ProposalStatus
  executed_at?: string
  metadata?: any
}

export interface Vote {
  id: string
  proposal_id: string
  voter_wallet: string
  vote_direction: "for" | "against"
  voting_power: number
  voted_at: string
}

export function useGovernance() {
  const { address } = useAccount()
  const [proposals, setProposals] = useState<Proposal[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadProposals()
  }, [])

  async function loadProposals() {
    try {
      setLoading(true)
      const { data, error } = await supabase.from("proposals").select("*").order("created_at", { ascending: false })

      if (error) throw error
      setProposals(data || [])
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function createProposal(type: ProposalType, title: string, description: string, metadata?: any) {
    if (!address) throw new Error("Wallet not connected")

    const votingEndsAt = new Date()
    votingEndsAt.setDate(votingEndsAt.getDate() + 7) // 7 day voting period

    const { data, error } = await supabase
      .from("proposals")
      .insert({
        proposal_type: type,
        title,
        description,
        proposer_wallet: address,
        voting_ends_at: votingEndsAt.toISOString(),
        metadata,
        ...metadata, // Spread hook_address, target_wallet, etc.
      })
      .select()
      .single()

    if (error) throw error
    await loadProposals()
    return data
  }

  async function castVote(proposalId: string, direction: "for" | "against", votingPower: number) {
    if (!address) throw new Error("Wallet not connected")

    // Check if already voted
    const { data: existingVote } = await supabase
      .from("votes")
      .select("*")
      .eq("proposal_id", proposalId)
      .eq("voter_wallet", address)
      .single()

    if (existingVote) throw new Error("Already voted on this proposal")

    // Insert vote
    const { error: voteError } = await supabase.from("votes").insert({
      proposal_id: proposalId,
      voter_wallet: address,
      vote_direction: direction,
      voting_power: votingPower,
    })

    if (voteError) throw voteError

    // Update proposal vote counts
    const { error: updateError } = await supabase.rpc("increment_vote_count", {
      p_proposal_id: proposalId,
      p_direction: direction,
      p_amount: votingPower,
    })

    if (updateError) {
      // Fallback: Update manually if RPC doesn't exist
      const proposal = proposals.find((p) => p.id === proposalId)
      if (proposal) {
        const updates =
          direction === "for"
            ? { votes_for: proposal.votes_for + votingPower }
            : { votes_against: proposal.votes_against + votingPower }

        await supabase.from("proposals").update(updates).eq("id", proposalId)
      }
    }

    await loadProposals()
  }

  async function getProposalVotes(proposalId: string): Promise<Vote[]> {
    const { data, error } = await supabase
      .from("votes")
      .select("*")
      .eq("proposal_id", proposalId)
      .order("voted_at", { ascending: false })

    if (error) throw error
    return data || []
  }

  async function checkVotingStatus(proposalId: string): Promise<boolean> {
    if (!address) return false

    const { data } = await supabase
      .from("votes")
      .select("*")
      .eq("proposal_id", proposalId)
      .eq("voter_wallet", address)
      .single()

    return !!data
  }

  return {
    proposals,
    loading,
    error,
    createProposal,
    castVote,
    getProposalVotes,
    checkVotingStatus,
    refresh: loadProposals,
  }
}
