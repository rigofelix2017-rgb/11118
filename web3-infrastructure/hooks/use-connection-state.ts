import { useCallback, useRef } from 'react';
import { ServerMessage } from '../shared/schema';

interface ConnectionStateHandlers {
  setPing: (ping: number) => void;
  setError: (error: string | null) => void;
  setIsRateLimited: (isRateLimited: boolean) => void;
}

/**
 * Connection state and error handling hook
 * Handles heartbeat/ping and error messages
 * 
 * NO GAME ENGINE DEPENDENCIES
 */
export function useConnectionState({
  setPing,
  setError,
  setIsRateLimited
}: ConnectionStateHandlers) {
  const pingTimeRef = useRef<number>(0);
  const rateLimitTimeoutRef = useRef<NodeJS.Timeout>();

  const handleConnectionMessage = useCallback((message: ServerMessage) => {
    switch (message.type) {
      case 'heartbeat':
        // Calculate ping time
        const now = Date.now();
        if (pingTimeRef.current > 0) {
          setPing(now - pingTimeRef.current);
        }
        break;

      case 'error':
        setError(message.data.message);
        
        // Handle rate limiting
        if (message.data.code === 'RATE_LIMITED') {
          setIsRateLimited(true);
          if (rateLimitTimeoutRef.current) {
            clearTimeout(rateLimitTimeoutRef.current);
          }
          rateLimitTimeoutRef.current = setTimeout(() => {
            setIsRateLimited(false);
          }, 3000);
        }
        break;
    }
  }, [setPing, setError, setIsRateLimited]);

  // Expose pingTimeRef for external use (for sending heartbeat)
  const setPingTime = useCallback((time: number) => {
    pingTimeRef.current = time;
  }, []);

  return { 
    handleConnectionMessage, 
    setPingTime,
    rateLimitTimeoutRef,
    pingTimeRef
  };
}
