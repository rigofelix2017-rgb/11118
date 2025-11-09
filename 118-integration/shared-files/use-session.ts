import { useQuery } from '@tanstack/react-query';
import { useState, useEffect } from 'react';

interface SessionData {
  sessionId: string;
  walletAddress: string;
  lastActive: string;
}

/**
 * Enhanced session hook with timeout fallback
 * 
 * CRITICAL FIX: Prevents intro sequence race condition where component
 * renders before session check completes, causing flash/skip bugs.
 * 
 * Features:
 * - 5-second timeout fallback for slow API calls
 * - Better error handling
 * - Warning logs for timeout scenarios
 * - Prevents stuck loading states in production
 */
export function useSession() {
  const [hasTimedOut, setHasTimedOut] = useState(false);
  
  const { data, isLoading, error } = useQuery<SessionData>({
    queryKey: ['/api/session/me'],
    retry: false,
    staleTime: 0,
  });

  // Safety timeout - if session check takes > 5 seconds, proceed without session
  // This prevents the intro sequence from being stuck in a loading state
  useEffect(() => {
    if (isLoading) {
      const timeout = setTimeout(() => {
        console.warn('⚠️ Session check timeout (5s) - proceeding without session');
        console.warn('   This is usually caused by slow API responses or network issues');
        console.warn('   The intro sequence will display normally for first-time users');
        setHasTimedOut(true);
      }, 5000);
      
      return () => clearTimeout(timeout);
    }
  }, [isLoading]);

  return {
    session: data || null,
    isLoading: isLoading && !hasTimedOut,
    hasSession: !!data && !error,
    hasTimedOut, // Expose timeout state for debugging
  };
}
