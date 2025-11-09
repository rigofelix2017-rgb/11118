import { useCallback } from 'react';
import { ServerMessage, ClientMessage, ChatMessage, Player } from '../shared/schema';

// Store authentication data for session creation
let pendingAuthData: {
  walletAddress: string;
  signature: string;
  nonce: string;
} | null = null;

// Create HTTP session after successful WebSocket authentication
async function createSessionAfterAuth(player: Player): Promise<void> {
  if (!pendingAuthData) {
    console.warn('No auth data available for session creation');
    return;
  }

  try {
    const response = await fetch('/api/session/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(pendingAuthData),
      credentials: 'include', // Include cookies
    });

    if (response.ok) {
      const result = await response.json();
      console.log('✅ Session created successfully:', result.sessionId);
      
      // Clear pending auth data after successful session creation
      pendingAuthData = null;
    } else {
      const error = await response.json();
      console.warn('Session creation failed:', error.error);
    }
  } catch (error) {
    console.warn('Failed to create session:', error);
  }
}

// Store auth data when sending connect_account message
export function storeAuthDataForSession(authData: {
  walletAddress: string;
  signature: string;
  nonce: string;
}) {
  pendingAuthData = authData;
}

interface PlayerStateHandlers {
  setCurrentPlayer: (player: Player | null) => void;
  setPlayers: React.Dispatch<React.SetStateAction<Player[]>>;
  setChatMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
  setConnectionStatus: (status: 'connected' | 'connecting' | 'disconnected') => void;
  setError: (error: string | null) => void;
  sendMessage: (message: ClientMessage) => void;
}

/**
 * Player state management hook
 * Handles WebSocket messages for player lifecycle:
 * - account_initialized: Initial connection
 * - user_joined: New player joined
 * - user_left: Player disconnected
 * - user_moved: Player position updated
 * 
 * NO GAME ENGINE DEPENDENCIES
 */
export function usePlayerState(handlers: PlayerStateHandlers) {
  const {
    setCurrentPlayer,
    setPlayers,
    setChatMessages,
    setConnectionStatus,
    setError,
    sendMessage
  } = handlers;

  const handlePlayerMessage = useCallback((message: ServerMessage) => {
    switch (message.type) {
      case 'account_initialized':
        // Handle unified account initialization
        console.log('🎉 Account initialized - connected to server');
        console.log('🎮 Player data:', message.data.player);
        console.log('👥 Players list:', message.data.players);
        
        setCurrentPlayer(message.data.player);
        setPlayers(message.data.players);
        setChatMessages(message.data.chatHistory);
        setConnectionStatus('connected');
        setError(null);
        
        // Create HTTP session for persistence across browser sessions
        createSessionAfterAuth(message.data.player).catch(err => 
          console.warn('Failed to create session:', err)
        );
        break;

      case 'user_joined':
        setPlayers(prev => {
          const filtered = prev.filter(p => p.id !== message.data.player.id);
          return [...filtered, message.data.player];
        });
        break;

      case 'user_left':
        setPlayers(prev => prev.filter(p => p.id !== message.data.playerId));
        break;

      case 'user_moved':
        setPlayers(prev => prev.map(player => 
          player.id === message.data.playerId
            ? { ...player, position: message.data.position }
            : player
        ));
        break;
    }
  }, [setCurrentPlayer, setPlayers, setChatMessages, setConnectionStatus, setError, sendMessage]);

  return { handlePlayerMessage };
}
