"use client"

import useSWR from "swr"

export interface BusinessMetrics {
  id: string
  propertyId: string
  businessName: string
  licenseType: string
  dailyVisitors: number
  totalVisitors: number
  transactionVolume: number
  skusSold: number
  customerRating: number
  totalRatings: number
  daysInBusiness: number
  businessValue: number
  isForAcquisition: boolean
  acquisitionPrice?: number
}

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export function useBusinessMetrics(propertyId?: string) {
  const { data, error, mutate } = useSWR<BusinessMetrics[]>(
    propertyId ? `/api/business-metrics?propertyId=${propertyId}` : "/api/business-metrics",
    fetcher,
  )

  const getTopBusinesses = (limit = 10) => {
    if (!data) return []
    return [...data].sort((a, b) => b.transactionVolume - a.transactionVolume).slice(0, limit)
  }

  const getBusinessValue = (metrics: BusinessMetrics): number => {
    // Formula: base value + (volume * 0.1) + (visitors * 10) + (rating bonus)
    const volumeValue = metrics.transactionVolume * 0.1
    const visitorValue = metrics.totalVisitors * 10
    const ratingBonus = metrics.customerRating >= 4.5 ? 50000 : 0
    const longevityBonus = metrics.daysInBusiness * 100

    return volumeValue + visitorValue + ratingBonus + longevityBonus
  }

  return {
    businesses: data,
    isLoading: !error && !data,
    isError: error,
    refresh: mutate,
    getTopBusinesses,
    getBusinessValue,
  }
}
