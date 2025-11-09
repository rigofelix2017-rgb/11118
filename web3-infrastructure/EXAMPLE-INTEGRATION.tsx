/**
 * EXAMPLE: How to integrate Web3 infrastructure into your React app
 * NO GAME ENGINE - Just authentication, sockets, chat, and intro screens
 */

import React, { useState, useCallback } from 'react';
import { useWebSocket } from './hooks/use-websocket';
import { usePlayerState, storeAuthDataForSession } from './hooks/use-player-state';
import { useChatHandler } from './hooks/use-chat-handler';
import { useConnectionState } from './hooks/use-connection-state';
import { useSession } from './hooks/use-session';
import { Player, ChatMessage, ClientMessage } from './shared/schema';

// Intro components
import { BetaNoticeModal } from './components/beta-notice-modal';
import { EpilepsyWarningModal } from './components/epilepsy-warning-modal';
import { VoidSplashScreen } from './components/void-splash-screen';

// Cookie utilities (implement these or use your own)
const BETA_NOTICE_COOKIE = 'void2_beta_acknowledged';
const EPILEPSY_WARNING_COOKIE = 'void2_epilepsy_acknowledged';

const isCookieTrue = (name: string) => {
  return document.cookie.split('; ').find(row => row.startsWith(name))?.split('=')[1] === 'true';
};

const setCookie = (name: string, value: string, days: number) => {
  const expires = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toUTCString();
  document.cookie = `${name}=${value}; expires=${expires}; path=/`;
};

export function MinimalApp() {
  // Intro state
  const [betaNoticeAcknowledged, setBetaNoticeAcknowledged] = useState(() => 
    isCookieTrue(BETA_NOTICE_COOKIE)
  );
  const [epilepsyWarningAcknowledged, setEpilepsyWarningAcknowledged] = useState(() => 
    isCookieTrue(EPILEPSY_WARNING_COOKIE)
  );
  const [voidIntroCompleted, setVoidIntroCompleted] = useState(false);

  // State
  const [currentPlayer, setCurrentPlayer] = useState<Player | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [proximityChatMessages, setProximityChatMessages] = useState<ChatMessage[]>([]);
  const [nearbyPlayers, setNearbyPlayers] = useState<string[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'connecting' | 'disconnected'>('disconnected');
  const [error, setError] = useState<string | null>(null);
  const [ping, setPing] = useState<number>(0);
  const [isRateLimited, setIsRateLimited] = useState(false);

  // Check for existing session
  const { session, hasSession } = useSession();

  // Message handlers
  const { handlePlayerMessage } = usePlayerState({
    setCurrentPlayer,
    setPlayers,
    setChatMessages,
    setConnectionStatus,
    setError,
    sendMessage: (msg: ClientMessage) => sendMessage(msg), // Will be defined below
  });

  const { handleChatMessage } = useChatHandler({
    setChatMessages,
    setProximityChatMessages,
    setNearbyPlayers,
  });

  const { handleConnectionMessage } = useConnectionState({
    setPing,
    setError,
    setIsRateLimited,
  });

  // Unified message handler
  const handleWebSocketMessage = useCallback((message: any) => {
    handlePlayerMessage(message);
    handleChatMessage(message);
    handleConnectionMessage(message);
  }, [handlePlayerMessage, handleChatMessage, handleConnectionMessage]);

  // WebSocket connection
  const { sendMessage, isConnected } = useWebSocket(handleWebSocketMessage);

  // Connect wallet (example - implement your own wallet logic)
  const handleConnectWallet = async () => {
    // Check for dev mode
    const urlParams = new URLSearchParams(window.location.search);
    const devMode = urlParams.get('devmode') === 'true';

    if (devMode) {
      // Dev mode bypass
      const testWallet = '0xDEV45n0dh0000000000000000000000000000000';
      const timestamp = Date.now();
      const nonce = `coinbase_auth_${timestamp}`;
      const signature = `coinbase_${testWallet.slice(2, 8)}_${timestamp}`;

      // Store for session creation
      storeAuthDataForSession({
        walletAddress: testWallet,
        signature,
        nonce,
      });

      // Send to server
      sendMessage({
        type: 'connect_account',
        data: {
          walletAddress: testWallet,
          signature,
          nonce,
        },
      });
    } else {
      // TODO: Implement real Coinbase CDP wallet or other wallet integration
      console.log('Implement wallet connection logic here');
    }
  };

  // Send chat message
  const handleSendChat = (message: string) => {
    sendMessage({
      type: 'chat',
      data: { message },
    });
  };

  // Send proximity chat message
  const handleSendProximityChat = (message: string) => {
    sendMessage({
      type: 'proximity_chat',
      data: { message },
    });
  };

  // Update player position (if you have movement)
  const handleMove = (position: { x: number; y: number }) => {
    sendMessage({
      type: 'move',
      data: { position },
    });
  };

  // Intro flow - show beta notice first
  if (!betaNoticeAcknowledged) {
    return (
      <BetaNoticeModal
        onAcknowledge={() => {
          setBetaNoticeAcknowledged(true);
          setCookie(BETA_NOTICE_COOKIE, 'true', 365);
        }}
      />
    );
  }

  // Then epilepsy warning
  if (!epilepsyWarningAcknowledged) {
    return (
      <EpilepsyWarningModal
        onAcknowledge={() => {
          setEpilepsyWarningAcknowledged(true);
          setCookie(EPILEPSY_WARNING_COOKIE, 'true', 365);
        }}
      />
    );
  }

  // Then VOID intro sequence
  if (!voidIntroCompleted) {
    return (
      <VoidSplashScreen
        onComplete={() => {
          setVoidIntroCompleted(true);
        }}
      />
    );
  }

  // Main app UI (after intro complete)
  return (
    <div>
      <h1>Web3 Infrastructure Demo</h1>
      
      {/* Connection status */}
      <div>
        <p>Status: {connectionStatus}</p>
        <p>Connected: {isConnected ? 'Yes' : 'No'}</p>
        <p>Ping: {ping}ms</p>
        {error && <p style={{ color: 'red' }}>Error: {error}</p>}
      </div>

      {/* Session info */}
      {hasSession && (
        <div>
          <p>Session: {session?.sessionId}</p>
          <p>Wallet: {session?.walletAddress}</p>
        </div>
      )}

      {/* Connect button */}
      {!currentPlayer && (
        <button onClick={handleConnectWallet}>
          Connect Wallet {window.location.search.includes('devmode=true') && '(Dev Mode)'}
        </button>
      )}

      {/* Player info */}
      {currentPlayer && (
        <div>
          <h2>You: {currentPlayer.displayName}</h2>
          <p>Position: ({currentPlayer.position.x}, {currentPlayer.position.y})</p>
          <p>Color: {currentPlayer.color}</p>
        </div>
      )}

      {/* Other players */}
      <div>
        <h3>Online Players ({players.length})</h3>
        <ul>
          {players.map(player => (
            <li key={player.id}>
              {player.displayName} - 
              Position: ({player.position.x}, {player.position.y}) -
              {nearbyPlayers.includes(player.id) && ' 🔊 Nearby'}
            </li>
          ))}
        </ul>
      </div>

      {/* Chat */}
      <div>
        <h3>Global Chat</h3>
        <div style={{ border: '1px solid black', height: '200px', overflow: 'auto' }}>
          {chatMessages.map(msg => (
            <div key={msg.id}>
              <strong>{msg.displayName}:</strong> {msg.message}
            </div>
          ))}
        </div>
        <input
          type="text"
          placeholder="Type a message..."
          disabled={!currentPlayer || isRateLimited}
          onKeyPress={(e) => {
            if (e.key === 'Enter') {
              handleSendChat((e.target as HTMLInputElement).value);
              (e.target as HTMLInputElement).value = '';
            }
          }}
        />
      </div>

      {/* Proximity chat */}
      <div>
        <h3>Proximity Chat (Nearby: {nearbyPlayers.length})</h3>
        <div style={{ border: '1px solid green', height: '150px', overflow: 'auto' }}>
          {proximityChatMessages.map(msg => (
            <div key={msg.id}>
              <strong>{msg.displayName}:</strong> {msg.message}
            </div>
          ))}
        </div>
        <input
          type="text"
          placeholder="Proximity message..."
          disabled={!currentPlayer || isRateLimited}
          onKeyPress={(e) => {
            if (e.key === 'Enter') {
              handleSendProximityChat((e.target as HTMLInputElement).value);
              (e.target as HTMLInputElement).value = '';
            }
          }}
        />
      </div>

      {/* Movement example (if you want) */}
      <div>
        <h3>Move (Example)</h3>
        <button onClick={() => handleMove({ x: Math.random() * 2000, y: Math.random() * 2000 })}>
          Random Move
        </button>
      </div>
    </div>
  );
}
