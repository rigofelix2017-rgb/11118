import { useEffect, useRef, useState, useCallback } from 'react';
import { ClientMessage, ServerMessage } from '../shared/schema';

export interface UseWebSocketReturn {
  socket: WebSocket | null;
  isConnected: boolean;
  sendMessage: (message: ClientMessage) => void;
  lastMessage: ServerMessage | null;
  error: string | null;
}

/**
 * WebSocket hook with auto-reconnect and heartbeat
 * NO GAME ENGINE DEPENDENCIES
 */
export function useWebSocket(onMessage?: (message: ServerMessage) => void): UseWebSocketReturn {
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<ServerMessage | null>(null);
  const [error, setError] = useState<string | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();
  const heartbeatIntervalRef = useRef<NodeJS.Timeout>();

  const connect = useCallback(() => {
    try {
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const wsUrl = `${protocol}//${window.location.host}/ws`;
      
      console.log('🔗 Attempting WebSocket connection to:', wsUrl);
      const ws = new WebSocket(wsUrl);
      
      ws.onopen = () => {
        console.log('✅ WebSocket connected to:', wsUrl);
        setIsConnected(true);
        setError(null);
        setSocket(ws);
        
        // Wait for handshake - log warning if no initial message within 10 seconds  
        const handshakeTimeout = setTimeout(() => {
          console.warn('⚠️ WebSocket handshake taking longer than expected - no initial message received within 10s');
        }, 10000);
        
        // Clear handshake timeout when we receive the first message
        const originalOnMessage = ws.onmessage;
        ws.onmessage = (event) => {
          clearTimeout(handshakeTimeout);
          ws.onmessage = originalOnMessage; // Restore original handler
          console.log('🎉 WebSocket handshake completed - received first message');
          originalOnMessage?.call(ws, event);
        };
        
        // Start heartbeat (30 second interval)
        heartbeatIntervalRef.current = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({
              type: 'heartbeat',
              data: {}
            }));
          }
        }, 30000);
      };
      
      ws.onmessage = (event) => {
        try {
          const message: ServerMessage = JSON.parse(event.data);
          setLastMessage(message);
          onMessage?.(message);
        } catch (err) {
          console.error('Failed to parse WebSocket message:', err);
        }
      };
      
      ws.onclose = (event) => {
        console.log('WebSocket disconnected', event.code, event.reason);
        setIsConnected(false);
        setSocket(null);
        
        if (heartbeatIntervalRef.current) {
          clearInterval(heartbeatIntervalRef.current);
        }
        
        // Attempt to reconnect after 3 seconds if not a manual close
        if (event.code !== 1000) {
          setError('Lost connection. Attempting reconnection...');
          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, 3000);
        }
      };
      
      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        setError('Connection error occurred');
      };
      
    } catch (err) {
      console.error('Failed to connect WebSocket:', err);
      setError('Failed to connect to server');
    }
  }, [onMessage]);

  const sendMessage = useCallback((message: ClientMessage) => {
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify(message));
    } else {
      console.warn('WebSocket not connected, cannot send message');
    }
  }, [socket]);

  useEffect(() => {
    connect();
    
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current);
      }
      if (socket) {
        socket.close(1000, 'Component unmounting');
      }
    };
  }, []);

  return {
    socket,
    isConnected,
    sendMessage,
    lastMessage,
    error
  };
}
