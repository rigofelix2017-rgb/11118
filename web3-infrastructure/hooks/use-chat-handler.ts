import { useCallback } from 'react';
import { ServerMessage, ChatMessage } from '../shared/schema';

interface ChatHandlerProps {
  setChatMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
  setProximityChatMessages?: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
  setNearbyPlayers?: React.Dispatch<React.SetStateAction<string[]>>;
}

/**
 * Chat message handling hook
 * Handles global chat and proximity chat
 * 
 * NO GAME ENGINE DEPENDENCIES
 */
export function useChatHandler({ 
  setChatMessages, 
  setProximityChatMessages, 
  setNearbyPlayers 
}: ChatHandlerProps) {
  const handleChatMessage = useCallback((message: ServerMessage) => {
    if (message.type === 'chat_message') {
      // Global chat message
      setChatMessages(prev => [...prev, message.data.message]);
    } else if (message.type === 'proximity_chat_message') {
      // Proximity chat message (only nearby players see it)
      if (setProximityChatMessages) {
        setProximityChatMessages(prev => [...prev, message.data.message]);
      }
      // Update nearby players list
      if (setNearbyPlayers) {
        setNearbyPlayers(message.data.nearbyPlayers);
      }
    } else if (message.type === 'proximity_update') {
      // Proximity update (sent when players move)
      if (setNearbyPlayers) {
        setNearbyPlayers(message.data.nearbyPlayers);
      }
    }
  }, [setChatMessages, setProximityChatMessages, setNearbyPlayers]);

  return { handleChatMessage };
}
