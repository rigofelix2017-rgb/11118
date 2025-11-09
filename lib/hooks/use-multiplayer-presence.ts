"use client"

import { useEffect, useRef, useState } from "react"
import { useAccount } from "wagmi"
import { getWebSocketClient } from "@/lib/websocket/client"
import type { PlayerUpdateMessage, PlayerJoinMessage, PlayerLeaveMessage, InitMessage } from "@/lib/websocket/types"

export type RemotePlayer = {
  id: string
  x: number
  y: number
  z: number
  ry: number
  wallet?: string | null
}

export function useMultiplayerPresence(
  enabled: boolean,
  playerPosition: { x: number; y: number; z: number },
  playerRotationY: number,
) {
  const { address } = useAccount()
  const [clientId, setClientId] = useState<string | null>(null)
  const [players, setPlayers] = useState<Record<string, RemotePlayer>>({})
  const [connectionStatus, setConnectionStatus] = useState<"disconnected" | "connecting" | "connected">("disconnected")

  const lastSentPosition = useRef({ x: 0, y: 0, z: 0, ry: 0 })
  const pendingUpdate = useRef<NodeJS.Timeout | null>(null)
  const wsClient = useRef<ReturnType<typeof getWebSocketClient> | null>(null)

  useEffect(() => {
    if (!enabled) {
      if (wsClient.current) {
        wsClient.current.disconnect()
        wsClient.current = null
      }
      setClientId(null)
      setPlayers({})
      setConnectionStatus("disconnected")
      return
    }

    if (wsClient.current) return

    try {
      const wsUrl = process.env.NEXT_PUBLIC_MULTIPLAYER_WS_URL || "ws://localhost:8080"

      wsClient.current = getWebSocketClient({
        url: wsUrl,
        reconnectAttempts: 5,
        reconnectDelay: 3000,
        heartbeatInterval: 30000,
      })

      const unsubscribe = wsClient.current.onStateChange((state) => {
        if (state === "connected" || state === "connecting" || state === "disconnected") {
          setConnectionStatus(state)
        }
      })

      wsClient.current.on("system:init", (msg) => {
        const initMsg = msg as InitMessage
        setClientId(initMsg.clientId)

        const map: Record<string, RemotePlayer> = {}
        for (const p of initMsg.players) {
          if (p.playerId === initMsg.clientId) continue
          map[p.playerId] = {
            id: p.playerId,
            x: p.position.x,
            y: p.position.y,
            z: p.position.z,
            ry: p.rotation,
            wallet: p.wallet,
          }
        }
        setPlayers(map)
      })

      wsClient.current.on("player:join", (msg) => {
        const joinMsg = msg as PlayerJoinMessage
        if (joinMsg.playerId === clientId) return

        setPlayers((prev) => ({
          ...prev,
          [joinMsg.playerId]: {
            id: joinMsg.playerId,
            x: joinMsg.position.x,
            y: joinMsg.position.y,
            z: joinMsg.position.z,
            ry: joinMsg.rotation,
            wallet: joinMsg.wallet,
          },
        }))
      })

      wsClient.current.on("player:update", (msg) => {
        const updateMsg = msg as PlayerUpdateMessage
        if (updateMsg.playerId === clientId) return

        setPlayers((prev) => ({
          ...prev,
          [updateMsg.playerId]: {
            id: updateMsg.playerId,
            x: updateMsg.position.x,
            y: updateMsg.position.y,
            z: updateMsg.position.z,
            ry: updateMsg.rotation,
            wallet: updateMsg.wallet,
          },
        }))
      })

      wsClient.current.on("player:leave", (msg) => {
        const leaveMsg = msg as PlayerLeaveMessage
        setPlayers((prev) => {
          const next = { ...prev }
          delete next[leaveMsg.playerId]
          return next
        })
      })

      wsClient.current.connect()

      return () => {
        unsubscribe()
        if (wsClient.current) {
          wsClient.current.disconnect()
          wsClient.current = null
        }
      }
    } catch (err) {
      console.error("[v0] Failed to initialize WebSocket:", err)
      setConnectionStatus("disconnected")
    }
  }, [enabled, clientId])

  useEffect(() => {
    if (!enabled || connectionStatus !== "connected" || !wsClient.current) return

    const dx = Math.abs(playerPosition.x - lastSentPosition.current.x)
    const dy = Math.abs(playerPosition.y - lastSentPosition.current.y)
    const dz = Math.abs(playerPosition.z - lastSentPosition.current.z)
    const dRy = Math.abs(playerRotationY - lastSentPosition.current.ry)

    if (dx > 0.5 || dy > 0.5 || dz > 0.5 || dRy > 0.1) {
      if (pendingUpdate.current) {
        clearTimeout(pendingUpdate.current)
      }

      pendingUpdate.current = setTimeout(() => {
        lastSentPosition.current = {
          x: playerPosition.x,
          y: playerPosition.y,
          z: playerPosition.z,
          ry: playerRotationY,
        }

        wsClient.current?.send({
          type: "player:update",
          playerId: clientId || "",
          position: {
            x: playerPosition.x,
            y: playerPosition.y,
            z: playerPosition.z,
          },
          rotation: playerRotationY,
          wallet: address ?? null,
          timestamp: Date.now(),
        } as PlayerUpdateMessage)
      }, 50)
    }

    return () => {
      if (pendingUpdate.current) {
        clearTimeout(pendingUpdate.current)
      }
    }
  }, [enabled, connectionStatus, playerPosition, playerRotationY, address, clientId])

  return {
    clientId,
    remotePlayers: players,
    connectionStatus,
    playerCount: Object.keys(players).length + (clientId ? 1 : 0),
  }
}
