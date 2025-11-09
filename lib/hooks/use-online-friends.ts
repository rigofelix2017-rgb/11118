"use client"

import useSWR from "swr"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export function useOnlineFriends() {
  const { data, error, mutate } = useSWR("/api/friends/online", fetcher, {
    refreshInterval: 10000, // Poll every 10s
  })

  return {
    friends: data?.friends ?? [],
    loading: !error && !data,
    error,
    mutate,
  }
}
