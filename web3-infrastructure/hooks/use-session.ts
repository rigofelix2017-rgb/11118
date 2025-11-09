import { useQuery } from '@tanstack/react-query';

interface SessionData {
  sessionId: string;
  walletAddress: string;
  lastActive: string;
}

/**
 * Session management hook
 * Checks for existing HTTP session (for auto-login)
 * 
 * NO GAME ENGINE DEPENDENCIES
 */
export function useSession() {
  const { data, isLoading, error } = useQuery<SessionData>({
    queryKey: ['/api/session/me'],
    retry: false,
    staleTime: 0,
  });

  return {
    session: data || null,
    isLoading,
    hasSession: !!data && !error,
  };
}
