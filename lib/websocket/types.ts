export type WebSocketConnectionState = "disconnected" | "connecting" | "connected" | "reconnecting" | "error"

export type WebSocketConfig = {
  url: string
  reconnectAttempts?: number
  reconnectDelay?: number
  heartbeatInterval?: number
  messageQueueSize?: number
}

// Player presence messages
export type PlayerUpdateMessage = {
  type: "player:update"
  playerId: string
  position: { x: number; y: number; z: number }
  rotation: number
  wallet?: string | null
  timestamp: number
}

export type PlayerJoinMessage = {
  type: "player:join"
  playerId: string
  position: { x: number; y: number; z: number }
  rotation: number
  wallet?: string | null
  timestamp: number
}

export type PlayerLeaveMessage = {
  type: "player:leave"
  playerId: string
  timestamp: number
}

// Chat messages
export type ChatMessage = {
  type: "chat:message"
  messageId: string
  senderId: string
  senderName: string
  content: string
  channel: "global" | "proximity" | "zone"
  zoneId?: string
  timestamp: number
}

// System messages
export type HeartbeatMessage = {
  type: "system:heartbeat"
  timestamp: number
}

export type HeartbeatAckMessage = {
  type: "system:heartbeat:ack"
  timestamp: number
  serverTime: number
}

export type InitMessage = {
  type: "system:init"
  clientId: string
  players: Array<{
    playerId: string
    position: { x: number; y: number; z: number }
    rotation: number
    wallet?: string | null
  }>
  timestamp: number
}

export type ErrorMessage = {
  type: "system:error"
  code: string
  message: string
  timestamp: number
}

// New message types
export type VoiceSignalMessage = {
  type: "voice:signal"
  senderId: string
  targetId: string
  signal: any // WebRTC signal data
  timestamp: number
}

export type TipMessage = {
  type: "tip:sent"
  senderId: string
  recipientId: string
  amount: number
  txHash: string
  timestamp: number
}

export type JukeboxVoteMessage = {
  type: "jukebox:vote"
  voterId: string
  trackId: string
  timestamp: number
}

export type WebSocketMessage =
  | PlayerUpdateMessage
  | PlayerJoinMessage
  | PlayerLeaveMessage
  | ChatMessage
  | HeartbeatMessage
  | HeartbeatAckMessage
  | InitMessage
  | ErrorMessage
  | VoiceSignalMessage
  | TipMessage
  | JukeboxVoteMessage
