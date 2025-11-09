"use client"

import type { WebSocketMessage, WebSocketConnectionState, WebSocketConfig, HeartbeatMessage } from "./types"

export class EnhancedWebSocketClient {
  private ws: WebSocket | null = null
  private config: Required<WebSocketConfig>
  private reconnectAttempt = 0
  private reconnectTimer: NodeJS.Timeout | null = null
  private heartbeatTimer: NodeJS.Timeout | null = null
  private lastHeartbeat = 0
  private messageHandlers: Map<string, Set<(msg: WebSocketMessage) => void>> = new Map()
  private stateChangeHandlers: Set<(state: WebSocketConnectionState) => void> = new Set()
  private _state: WebSocketConnectionState = "disconnected"

  constructor(config: WebSocketConfig) {
    this.config = {
      url: config.url,
      reconnectAttempts: config.reconnectAttempts ?? 5,
      reconnectDelay: config.reconnectDelay ?? 3000,
      heartbeatInterval: config.heartbeatInterval ?? 30000,
      messageQueueSize: config.messageQueueSize ?? 100,
    }
  }

  get state(): WebSocketConnectionState {
    return this._state
  }

  private setState(state: WebSocketConnectionState) {
    if (this._state === state) return
    this._state = state
    this.stateChangeHandlers.forEach((handler) => handler(state))
  }

  connect() {
    if (this.ws) return

    this.setState("connecting")
    console.log("[v0] Connecting to WebSocket:", this.config.url)

    try {
      this.ws = new WebSocket(this.config.url)

      this.ws.onopen = () => {
        console.log("[v0] WebSocket connected")
        this.setState("connected")
        this.reconnectAttempt = 0
        this.startHeartbeat()
      }

      this.ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data)
          this.handleMessage(message)
        } catch (err) {
          console.error("[v0] Failed to parse WebSocket message:", err)
        }
      }

      this.ws.onerror = (error) => {
        console.error("[v0] WebSocket error:", error)
        this.setState("error")
      }

      this.ws.onclose = () => {
        console.log("[v0] WebSocket closed")
        this.cleanup()
        this.attemptReconnect()
      }
    } catch (err) {
      console.error("[v0] Failed to create WebSocket:", err)
      this.setState("error")
    }
  }

  disconnect() {
    this.cleanup()
    if (this.ws) {
      this.ws.close()
      this.ws = null
    }
    this.setState("disconnected")
  }

  send(message: Partial<WebSocketMessage>) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.warn("[v0] Cannot send message, WebSocket not connected")
      return false
    }

    try {
      this.ws.send(JSON.stringify(message))
      return true
    } catch (err) {
      console.error("[v0] Failed to send WebSocket message:", err)
      return false
    }
  }

  on(messageType: string, handler: (msg: WebSocketMessage) => void) {
    if (!this.messageHandlers.has(messageType)) {
      this.messageHandlers.set(messageType, new Set())
    }
    this.messageHandlers.get(messageType)!.add(handler)
  }

  off(messageType: string, handler: (msg: WebSocketMessage) => void) {
    const handlers = this.messageHandlers.get(messageType)
    if (handlers) {
      handlers.delete(handler)
    }
  }

  onStateChange(handler: (state: WebSocketConnectionState) => void) {
    this.stateChangeHandlers.add(handler)
    return () => this.stateChangeHandlers.delete(handler)
  }

  private handleMessage(message: WebSocketMessage) {
    // Handle heartbeat responses
    if (message.type === "system:heartbeat:ack") {
      this.lastHeartbeat = Date.now()
    }

    // Notify all handlers for this message type
    const handlers = this.messageHandlers.get(message.type)
    if (handlers) {
      handlers.forEach((handler) => handler(message))
    }

    // Notify wildcard handlers
    const wildcardHandlers = this.messageHandlers.get("*")
    if (wildcardHandlers) {
      wildcardHandlers.forEach((handler) => handler(message))
    }
  }

  private startHeartbeat() {
    this.stopHeartbeat()

    this.heartbeatTimer = setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.send({
          type: "system:heartbeat",
          timestamp: Date.now(),
        } as HeartbeatMessage)

        // Check if we received a heartbeat response
        const timeSinceLastHeartbeat = Date.now() - this.lastHeartbeat
        if (timeSinceLastHeartbeat > this.config.heartbeatInterval * 2) {
          console.warn("[v0] Heartbeat timeout, reconnecting...")
          this.disconnect()
          this.connect()
        }
      }
    }, this.config.heartbeatInterval)

    this.lastHeartbeat = Date.now()
  }

  private stopHeartbeat() {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer)
      this.heartbeatTimer = null
    }
  }

  private attemptReconnect() {
    if (this.reconnectAttempt >= this.config.reconnectAttempts) {
      console.error("[v0] Max reconnect attempts reached")
      this.setState("error")
      return
    }

    this.reconnectAttempt++
    this.setState("reconnecting")

    const delay = this.config.reconnectDelay * this.reconnectAttempt
    console.log(`[v0] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempt}/${this.config.reconnectAttempts})`)

    this.reconnectTimer = setTimeout(() => {
      this.connect()
    }, delay)
  }

  private cleanup() {
    this.stopHeartbeat()

    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer)
      this.reconnectTimer = null
    }
  }
}

// Singleton instance
let wsClient: EnhancedWebSocketClient | null = null

export function getWebSocketClient(config?: WebSocketConfig): EnhancedWebSocketClient {
  if (!wsClient && config) {
    wsClient = new EnhancedWebSocketClient(config)
  }

  if (!wsClient) {
    throw new Error("WebSocket client not initialized. Provide config on first call.")
  }

  return wsClient
}
