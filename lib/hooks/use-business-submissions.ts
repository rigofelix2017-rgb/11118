"use client"

import { useState, useEffect } from "react"
import { createBrowserClient } from "@supabase/ssr"
import { useAccount } from "wagmi"

const supabase = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

export type BusinessType = "defi" | "gaming" | "social" | "art_culture" | "entertainment" | "infrastructure" | "other"
export type SubmissionStatus = "pending" | "under_review" | "approved" | "rejected"

export interface BusinessSubmission {
  id: string
  submitter_wallet: string
  submitter_email?: string
  business_name: string
  business_type: BusinessType
  description: string
  hook_address?: string
  hook_deployed: boolean
  estimated_volume: number
  requesting_agency_support: boolean
  agency_services?: string[]
  budget_range?: string
  preferred_district?: string
  property_size: string
  submitted_at: string
  status: SubmissionStatus
  reviewed_by?: string
  reviewed_at?: string
  review_notes?: string
  proposal_id?: string
  website_url?: string
  twitter_url?: string
  discord_url?: string
  whitepaper_url?: string
}

export function useBusinessSubmissions() {
  const { address } = useAccount()
  const [submissions, setSubmissions] = useState<BusinessSubmission[]>([])
  const [mySubmissions, setMySubmissions] = useState<BusinessSubmission[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadSubmissions()
  }, [address])

  async function loadSubmissions() {
    try {
      setLoading(true)

      // Load all submissions
      const { data: allData, error: allError } = await supabase
        .from("business_submissions")
        .select("*")
        .order("submitted_at", { ascending: false })

      if (allError) throw allError
      setSubmissions(allData || [])

      // Load user's submissions if wallet connected
      if (address) {
        const { data: myData, error: myError } = await supabase
          .from("business_submissions")
          .select("*")
          .eq("submitter_wallet", address)
          .order("submitted_at", { ascending: false })

        if (myError) throw myError
        setMySubmissions(myData || [])
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function submitBusiness(data: Partial<BusinessSubmission>) {
    if (!address) throw new Error("Wallet not connected")

    const { data: submission, error } = await supabase
      .from("business_submissions")
      .insert({
        ...data,
        submitter_wallet: address,
      })
      .select()
      .single()

    if (error) throw error
    await loadSubmissions()
    return submission
  }

  async function paySubmissionFee(submissionId: string, amount: number, txHash?: string) {
    const { error } = await supabase.from("submission_fees").insert({
      submission_id: submissionId,
      fee_amount: amount,
      fee_token: "VOID",
      transaction_hash: txHash,
    })

    if (error) throw error
  }

  async function updateSubmissionStatus(submissionId: string, status: SubmissionStatus, reviewNotes?: string) {
    if (!address) throw new Error("Wallet not connected")

    const { error } = await supabase
      .from("business_submissions")
      .update({
        status,
        reviewed_by: address,
        reviewed_at: new Date().toISOString(),
        review_notes: reviewNotes,
      })
      .eq("id", submissionId)

    if (error) throw error
    await loadSubmissions()
  }

  return {
    submissions,
    mySubmissions,
    loading,
    error,
    submitBusiness,
    paySubmissionFee,
    updateSubmissionStatus,
    refresh: loadSubmissions,
  }
}
