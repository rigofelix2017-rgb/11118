// wagmi-config.ts
// Copy this file to: src/lib/wagmi-config.ts

import { http, createConfig } from 'wagmi';
import { base, baseSepolia } from 'wagmi/chains';
import { coinbaseWallet, injected } from 'wagmi/connectors';

/**
 * Wagmi configuration for Web3 wallet connections
 * Supports Coinbase Smart Wallet + browser injected wallets
 */
export const wagmiConfig = createConfig({
  chains: [base, baseSepolia],
  connectors: [
    coinbaseWallet({
      appName: 'PSX-VOID Game',
      preference: 'smartWalletOnly', // Coinbase Smart Wallet (embedded)
    }),
    injected(), // MetaMask, Rainbow, etc.
  ],
  transports: {
    [base.id]: http(),
    [baseSepolia.id]: http(),
  },
  ssr: true, // Enable server-side rendering support
});

/**
 * Chain configuration helpers
 */
export const SUPPORTED_CHAINS = [base, baseSepolia];

export function getChainById(chainId: number) {
  return SUPPORTED_CHAINS.find(chain => chain.id === chainId);
}

export function isTestnet(chainId: number): boolean {
  return chainId === baseSepolia.id;
}

/**
 * RPC endpoints (optional - for fallback)
 */
export const RPC_URLS = {
  [base.id]: 'https://mainnet.base.org',
  [baseSepolia.id]: 'https://sepolia.base.org',
};

/**
 * Block explorers
 */
export const BLOCK_EXPLORERS = {
  [base.id]: 'https://basescan.org',
  [baseSepolia.id]: 'https://sepolia.basescan.org',
};

export function getExplorerUrl(chainId: number, type: 'tx' | 'address', hash: string): string {
  const baseUrl = BLOCK_EXPLORERS[chainId] || BLOCK_EXPLORERS[base.id];
  return `${baseUrl}/${type}/${hash}`;
}

export default wagmiConfig;
