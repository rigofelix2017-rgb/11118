"use client"

// This replaces the problematic EventEmitter2 implementation with native EventTarget

export type MessageType =
  | "ping"
  | "pong"
  | "player_move"
  | "player_join"
  | "player_leave"
  | "chat_message"
  | "voice_signal"
  | "tip_sent"
  | "jukebox_vote"

export interface WebSocketMessage {
  type: MessageType
  payload?: any
  timestamp: number
}

export class SafeWebSocketClient extends EventTarget {
  private ws: WebSocket | null = null
  private url: string
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5
  private reconnectDelay = 1000
  private heartbeatInterval: NodeJS.Timeout | null = null
  private messageQueue: WebSocketMessage[] = []

  constructor(url: string) {
    super()
    this.url = url
  }

  connect(): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      return
    }

    try {
      this.ws = new WebSocket(this.url)

      this.ws.onopen = () => {
        this.reconnectAttempts = 0
        this.startHeartbeat()
        this.flushMessageQueue()
        this.dispatchEvent(new CustomEvent("connected"))
      }

      this.ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data)
          this.dispatchEvent(new CustomEvent("message", { detail: message }))
        } catch (error) {
          console.error("[WebSocket] Failed to parse message:", error)
        }
      }

      this.ws.onerror = (error) => {
        this.dispatchEvent(new CustomEvent("error", { detail: error }))
      }

      this.ws.onclose = () => {
        this.stopHeartbeat()
        this.dispatchEvent(new CustomEvent("disconnected"))
        this.attemptReconnect()
      }
    } catch (error) {
      console.error("[WebSocket] Connection failed:", error)
      this.attemptReconnect()
    }
  }

  send(type: MessageType, payload?: any): void {
    const message: WebSocketMessage = {
      type,
      payload,
      timestamp: Date.now(),
    }

    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message))
    } else {
      this.messageQueue.push(message)
    }
  }

  disconnect(): void {
    this.stopHeartbeat()
    this.ws?.close()
    this.ws = null
  }

  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      this.send("ping")
    }, 30000) // 30 seconds
  }

  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval)
      this.heartbeatInterval = null
    }
  }

  private flushMessageQueue(): void {
    while (this.messageQueue.length > 0) {
      const message = this.messageQueue.shift()
      if (message && this.ws?.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify(message))
      }
    }
  }

  private attemptReconnect(): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++
      const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1)
      setTimeout(() => this.connect(), delay)
    }
  }
}
