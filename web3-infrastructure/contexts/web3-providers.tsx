'use client';

import { ReactNode } from 'react';
import { OnchainKitProvider } from '@coinbase/onchainkit';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WagmiProvider } from 'wagmi';
import { base, baseSepolia } from 'wagmi/chains';
import { config } from '../lib/wagmi-config';

// Create a client outside of component to avoid re-creating on every render
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000, // 1 minute
      retry: 3,
    },
  },
});

interface ProvidersProps {
  children: ReactNode;
  /**
   * Which chain to use by default
   * @default baseSepolia (for testing)
   */
  defaultChain?: typeof base | typeof baseSepolia;
}

/**
 * Main providers wrapper for Base + WalletConnect integration
 * 
 * Includes:
 * - Wagmi (wallet connection management)
 * - React Query (data fetching/caching)
 * - OnchainKit (Base-specific components)
 * 
 * Usage:
 * ```tsx
 * // In your app/layout.tsx or _app.tsx
 * <Providers>
 *   <YourApp />
 * </Providers>
 * ```
 */
export function Providers({ 
  children, 
  defaultChain = baseSepolia 
}: ProvidersProps) {
  // Get OnchainKit API key from environment
  const apiKey = process.env.NEXT_PUBLIC_ONCHAINKIT_API_KEY;

  if (!apiKey) {
    console.warn(
      'OnchainKit API key not found. Get one at https://portal.cdp.coinbase.com/'
    );
  }

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <OnchainKitProvider
          apiKey={apiKey}
          chain={defaultChain}
          config={{
            appearance: {
              name: 'Web3 Infrastructure',
              logo: 'https://yourapp.com/logo.png',
              mode: 'auto', // 'light' | 'dark' | 'auto'
              theme: 'default', // 'default' | 'base' | 'cyberpunk'
            },
          }}
        >
          {children}
        </OnchainKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}

/**
 * Hook to access OnchainKit config
 */
export { useOnchainKit } from '@coinbase/onchainkit';

/**
 * Re-export commonly used hooks
 */
export { 
  useAccount, 
  useConnect, 
  useDisconnect,
  useChainId,
  useSwitchChain,
  useBalance,
  useBlockNumber,
  useReadContract,
  useWriteContract,
  useWatchContractEvent,
} from 'wagmi';

export { useQuery, useMutation } from '@tanstack/react-query';
