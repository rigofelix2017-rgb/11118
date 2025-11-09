"use client"

import { useState, useEffect } from "react"
import { createBrowserClient } from "@/lib/supabase/client"

export type Property = {
  id: string
  parcel_id: number
  district_id: string
  property_type: "residential" | "commercial" | "special"
  center_x: number
  center_z: number
  size_x: number
  size_z: number
  owner_address: string | null
  purchased_at: string | null
  base_price: number
  current_price: number
  price_multiplier: number
  status: "available" | "owned" | "pending" | "inactive"
  for_sale: boolean
  created_at: string
  updated_at: string
  last_tax_payment: string | null
  tax_rate: number
}

export function useProperties(districtId?: string) {
  const [properties, setProperties] = useState<Property[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchProperties() {
      try {
        const supabase = createBrowserClient()
        let query = supabase.from("properties").select("*").order("parcel_id", { ascending: true })

        if (districtId) {
          query = query.eq("district_id", districtId)
        }

        const { data, error: fetchError } = await query

        if (fetchError) throw fetchError
        setProperties(data || [])
      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchProperties()
  }, [districtId])

  return { properties, loading, error }
}

export function useProperty(parcelId: number) {
  const [property, setProperty] = useState<Property | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchProperty() {
      try {
        const supabase = createBrowserClient()
        const { data, error: fetchError } = await supabase
          .from("properties")
          .select("*")
          .eq("parcel_id", parcelId)
          .single()

        if (fetchError) throw fetchError
        setProperty(data)
      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchProperty()
  }, [parcelId])

  return { property, loading, error }
}

export function usePropertiesForSale(limit = 20) {
  const [properties, setProperties] = useState<Property[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchProperties() {
      try {
        const supabase = createBrowserClient()
        const { data, error: fetchError } = await supabase
          .from("properties")
          .select("*")
          .eq("for_sale", true)
          .eq("status", "available")
          .order("current_price", { ascending: true })
          .limit(limit)

        if (fetchError) throw fetchError
        setProperties(data || [])
      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchProperties()
  }, [limit])

  return { properties, loading, error }
}

export function useUserProperties(walletAddress: string) {
  const [properties, setProperties] = useState<Property[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchProperties() {
      if (!walletAddress) {
        setProperties([])
        setLoading(false)
        return
      }

      try {
        const supabase = createBrowserClient()
        const { data, error: fetchError } = await supabase
          .from("properties")
          .select("*")
          .eq("owner_address", walletAddress.toLowerCase())
          .order("purchased_at", { ascending: false })

        if (fetchError) throw fetchError
        setProperties(data || [])
      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchProperties()
  }, [walletAddress])

  return { properties, loading, error, refetch: () => {} }
}

export function getPropertyAtCoordinates(x: number, z: number, properties: Property[]): Property | null {
  for (const property of properties) {
    const halfX = property.size_x / 2
    const halfZ = property.size_z / 2

    if (
      x >= property.center_x - halfX &&
      x <= property.center_x + halfX &&
      z >= property.center_z - halfZ &&
      z <= property.center_z + halfZ
    ) {
      return property
    }
  }
  return null
}
