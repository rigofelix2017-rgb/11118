// use-player-state.ts
// Copy this file to: src/hooks/use-player-state.ts

'use client';

import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';

interface PlayerState {
  address: string | null;
  isConnected: boolean;
  isNew: boolean;
  hasCompletedIntro: boolean;
  isLoading: boolean;
}

/**
 * Hook to manage player session state
 * Integrates with backend session endpoints
 */
export function usePlayerState() {
  const { address, isConnected } = useAccount();
  const [state, setState] = useState<PlayerState>({
    address: null,
    isConnected: false,
    isNew: true,
    hasCompletedIntro: false,
    isLoading: true,
  });

  useEffect(() => {
    if (!address || !isConnected) {
      setState({
        address: null,
        isConnected: false,
        isNew: true,
        hasCompletedIntro: false,
        isLoading: false,
      });
      return;
    }

    // Fetch session data from backend
    const fetchSession = async () => {
      try {
        const response = await fetch('/api/session/me', {
          headers: {
            'x-wallet-address': address,
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch session');
        }

        const data = await response.json();
        
        setState({
          address,
          isConnected: true,
          isNew: data.isNew ?? true,
          hasCompletedIntro: data.hasCompletedIntro ?? false,
          isLoading: false,
        });
      } catch (error) {
        console.error('Session fetch error:', error);
        setState(prev => ({ ...prev, isLoading: false }));
      }
    };

    fetchSession();

    // Poll every 30 seconds to keep session alive
    const interval = setInterval(fetchSession, 30000);

    return () => clearInterval(interval);
  }, [address, isConnected]);

  /**
   * Store auth data after wallet connection
   */
  const storeAuthData = async (authData?: any) => {
    if (!address) return;

    try {
      const response = await fetch('/api/session/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          address,
          authData,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to store auth data');
      }

      const data = await response.json();
      
      setState(prev => ({
        ...prev,
        isNew: data.isNew ?? true,
      }));
    } catch (error) {
      console.error('Auth storage error:', error);
    }
  };

  /**
   * Mark intro as completed
   */
  const completeIntro = async () => {
    if (!address) return;

    try {
      const response = await fetch('/api/session/complete-intro', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ address }),
      });

      if (!response.ok) {
        throw new Error('Failed to complete intro');
      }

      setState(prev => ({
        ...prev,
        hasCompletedIntro: true,
        isNew: false,
      }));
    } catch (error) {
      console.error('Complete intro error:', error);
    }
  };

  /**
   * Logout and clear session
   */
  const logout = async () => {
    if (!address) return;

    try {
      await fetch('/api/session/logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ address }),
      });
    } catch (error) {
      console.error('Logout error:', error);
    }

    setState({
      address: null,
      isConnected: false,
      isNew: true,
      hasCompletedIntro: false,
      isLoading: false,
    });
  };

  return {
    ...state,
    storeAuthData,
    completeIntro,
    logout,
  };
}

export default usePlayerState;
