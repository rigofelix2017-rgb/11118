import { http, createConfig } from 'wagmi';
import { base, baseSepolia } from 'wagmi/chains';
import { coinbaseWallet, walletConnect, injected } from 'wagmi/connectors';

// Get from https://cloud.walletconnect.com/
const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || '';

if (!projectId) {
  console.warn('WalletConnect Project ID not found. Get one at https://cloud.walletconnect.com/');
}

/**
 * Wagmi configuration for Base chain with multiple wallet connectors
 * 
 * Supports:
 * - Coinbase Smart Wallet (recommended for Base)
 * - WalletConnect v2 (multi-wallet support)
 * - Injected wallets (MetaMask, Rainbow, etc.)
 */
export const config = createConfig({
  chains: [base, baseSepolia],
  connectors: [
    // Coinbase Smart Wallet - Recommended for Base
    coinbaseWallet({
      appName: 'Web3 Infrastructure',
      appLogoUrl: 'https://yourapp.com/logo.png',
      preference: 'smartWalletOnly', // Force smart contract wallets
      // preference: 'all', // Allow both EOA and smart wallets
    }),
    
    // WalletConnect - Support for 300+ wallets
    walletConnect({
      projectId,
      metadata: {
        name: 'Web3 Infrastructure',
        description: 'Bare-bones Web3 infrastructure with Base support',
        url: 'https://github.com/rigofelix2017-rgb/lame',
        icons: ['https://yourapp.com/icon.png'],
      },
      showQrModal: true,
    }),
    
    // Injected - MetaMask, Rainbow, Brave, etc.
    injected({
      target: 'metaMask',
    }),
  ],
  
  // RPC transports for each chain
  transports: {
    [base.id]: http(process.env.NEXT_PUBLIC_BASE_RPC_URL || 'https://mainnet.base.org'),
    [baseSepolia.id]: http(process.env.NEXT_PUBLIC_BASE_SEPOLIA_RPC_URL || 'https://sepolia.base.org'),
  },
  
  // SSR support
  ssr: true,
});

// TypeScript module augmentation for type safety
declare module 'wagmi' {
  interface Register {
    config: typeof config;
  }
}
