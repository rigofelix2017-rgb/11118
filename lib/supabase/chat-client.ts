import { createBrowserClient } from "@supabase/ssr"

let supabaseClient: ReturnType<typeof createBrowserClient> | null = null

export function getSupabaseChatClient() {
  if (!supabaseClient) {
    supabaseClient = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    )
  }
  return supabaseClient
}

export async function sendProximityMessage(
  walletAddress: string,
  username: string,
  message: string,
  district: string | null,
  position: { x: number; z: number },
) {
  const supabase = getSupabaseChatClient()
  const { data, error } = await supabase.from("proximity_chat_messages").insert({
    sender_wallet: walletAddress,
    sender_username: username,
    message,
    district,
    position_x: position.x,
    position_z: position.z,
  })

  if (error) {
    console.error("[v0] Error sending proximity message:", error)
    return null
  }
  return data
}

export async function sendGlobalMessage(walletAddress: string, username: string, message: string) {
  const supabase = getSupabaseChatClient()
  const { data, error } = await supabase.from("global_chat_messages").insert({
    sender_wallet: walletAddress,
    sender_username: username,
    message,
  })

  if (error) {
    console.error("[v0] Error sending global message:", error)
    return null
  }
  return data
}

export async function subscribeToProximityChat(district: string | null, callback: (message: any) => void) {
  const supabase = getSupabaseChatClient()

  const subscription = supabase
    .channel("proximity_chat")
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "proximity_chat_messages",
        filter: district ? `district=eq.${district}` : undefined,
      },
      (payload) => callback(payload.new),
    )
    .subscribe()

  return subscription
}

export async function subscribeToGlobalChat(callback: (message: any) => void) {
  const supabase = getSupabaseChatClient()

  const subscription = supabase
    .channel("global_chat")
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "global_chat_messages",
      },
      (payload) => callback(payload.new),
    )
    .subscribe()

  return subscription
}
