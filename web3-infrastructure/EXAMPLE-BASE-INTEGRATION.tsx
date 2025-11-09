/**
 * COMPLETE EXAMPLE: Base Chain + WalletConnect + Gasless Transactions
 * 
 * This example shows how to integrate:
 * - WalletConnect (multi-wallet support)
 * - Base chain (mainnet + sepolia)
 * - OnchainKit components
 * - Paymaster (gasless transactions)
 * - Mobile controls
 * - Intro system
 */

'use client';

import { useState } from 'react';
import { Providers } from './contexts/web3-providers';
import { BaseWalletConnect } from './components/base-wallet-connect';
import { GaslessTransaction } from './components/gasless-transaction';
import { MobileLayoutProvider } from './contexts/mobile-layout-context';
import { MobileControls } from './components/mobile-controls';
import { VoidSplashScreen } from './components/void-splash-screen';
import { baseSepolia } from 'wagmi/chains';

// Example: Simple NFT minting contract
const NFT_CONTRACT_ADDRESS = '0xYourContractAddressHere' as const;
const NFT_ABI = [
  {
    name: 'mint',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'to', type: 'address' }],
    outputs: [],
  },
];

/**
 * Main App Component
 */
function BaseIntegrationExample() {
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [showIntro, setShowIntro] = useState(true);
  const [playerPosition, setPlayerPosition] = useState({ x: 0, y: 0 });

  // Handle intro completion
  const handleIntroComplete = () => {
    setShowIntro(false);
  };

  // Handle wallet connection
  const handleWalletConnect = (address: string) => {
    console.log('Wallet connected:', address);
    setWalletAddress(address);
  };

  // Handle wallet disconnect
  const handleWalletDisconnect = () => {
    console.log('Wallet disconnected');
    setWalletAddress(null);
  };

  // Handle mobile movement
  const handleMove = (direction: { x: number; y: number }) => {
    setPlayerPosition((prev) => ({
      x: prev.x + direction.x,
      y: prev.y + direction.y,
    }));
  };

  // Handle mint success
  const handleMintSuccess = (txHash: string) => {
    console.log('NFT minted! Transaction:', txHash);
    alert(`NFT minted successfully! TX: ${txHash}`);
  };

  // Handle mint error
  const handleMintError = (error: Error) => {
    console.error('Mint failed:', error);
    alert(`Mint failed: ${error.message}`);
  };

  // Show intro
  if (showIntro) {
    return (
      <VoidSplashScreen
        onComplete={handleIntroComplete}
      />
    );
  }

  // Main app
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 text-white">
      {/* Header */}
      <header className="p-4 border-b border-cyan-500/20 bg-slate-900/50 backdrop-blur">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold text-cyan-400">
            Base Integration Example
          </h1>
          <div className="w-80">
            <BaseWalletConnect
              onConnect={handleWalletConnect}
              onDisconnect={handleWalletDisconnect}
              requireChain={baseSepolia}
            />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto p-6">
        {!walletAddress ? (
          // Not connected state
          <div className="text-center py-20">
            <h2 className="text-4xl font-bold text-cyan-400 mb-4">
              Welcome to Base
            </h2>
            <p className="text-lg text-cyan-600 mb-8">
              Connect your wallet to get started
            </p>
            <div className="max-w-md mx-auto">
              <BaseWalletConnect
                onConnect={handleWalletConnect}
                requireChain={baseSepolia}
              />
            </div>
          </div>
        ) : (
          // Connected state
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Wallet Info Card */}
            <div className="border-2 border-cyan-500/30 rounded-lg p-6 bg-slate-800/50">
              <h3 className="text-xl font-bold text-cyan-400 mb-4">
                Wallet Info
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-cyan-600">Address:</span>
                  <span className="text-cyan-400 font-mono">
                    {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-cyan-600">Network:</span>
                  <span className="text-cyan-400">Base Sepolia</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-cyan-600">Position:</span>
                  <span className="text-cyan-400 font-mono">
                    ({playerPosition.x.toFixed(0)}, {playerPosition.y.toFixed(0)})
                  </span>
                </div>
              </div>
            </div>

            {/* Gasless Transaction Card */}
            <div className="border-2 border-cyan-500/30 rounded-lg p-6 bg-slate-800/50">
              <h3 className="text-xl font-bold text-cyan-400 mb-4">
                Mint NFT (Gasless)
              </h3>
              <p className="text-sm text-cyan-600 mb-4">
                Mint an NFT using Base Paymaster - completely free!
              </p>
              <GaslessTransaction
                contractAddress={NFT_CONTRACT_ADDRESS}
                contractAbi={NFT_ABI}
                functionName="mint"
                args={[walletAddress]}
                onSuccess={handleMintSuccess}
                onError={handleMintError}
                buttonText="Mint NFT (Free)"
              />
            </div>

            {/* Features Card */}
            <div className="border-2 border-cyan-500/30 rounded-lg p-6 bg-slate-800/50 md:col-span-2">
              <h3 className="text-xl font-bold text-cyan-400 mb-4">
                Integrated Features
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <h4 className="font-bold text-green-400 mb-2">✅ Wallet</h4>
                  <ul className="space-y-1 text-cyan-600">
                    <li>• WalletConnect v2</li>
                    <li>• Coinbase Smart Wallet</li>
                    <li>• MetaMask support</li>
                    <li>• Network switching</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-bold text-green-400 mb-2">✅ Base</h4>
                  <ul className="space-y-1 text-cyan-600">
                    <li>• OnchainKit components</li>
                    <li>• Paymaster (gasless)</li>
                    <li>• Smart wallet support</li>
                    <li>• Base Sepolia testnet</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-bold text-green-400 mb-2">✅ Mobile</h4>
                  <ul className="space-y-1 text-cyan-600">
                    <li>• Virtual joystick</li>
                    <li>• Action buttons</li>
                    <li>• Safe area support</li>
                    <li>• Keyboard detection</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Mobile Controls (auto-hidden on desktop) */}
      <MobileControls
        onMove={handleMove}
        onInteract={() => console.log('Interact')}
        onAction={() => console.log('Action')}
      />

      {/* Footer */}
      <footer className="mt-20 p-6 border-t border-cyan-500/20 bg-slate-900/50 text-center">
        <p className="text-sm text-cyan-600">
          Built with Base + WalletConnect + OnchainKit
        </p>
        <p className="text-xs text-cyan-600/60 mt-2">
          View on{' '}
          <a
            href="https://github.com/rigofelix2017-rgb/lame"
            target="_blank"
            rel="noopener noreferrer"
            className="text-cyan-400 hover:text-cyan-300 underline"
          >
            GitHub
          </a>
        </p>
      </footer>
    </div>
  );
}

/**
 * Root component with all providers
 */
export default function App() {
  return (
    <Providers defaultChain={baseSepolia}>
      <MobileLayoutProvider>
        <BaseIntegrationExample />
      </MobileLayoutProvider>
    </Providers>
  );
}

/**
 * USAGE INSTRUCTIONS:
 * 
 * 1. Install dependencies:
 *    npm install @coinbase/onchainkit wagmi viem@2.x @tanstack/react-query
 * 
 * 2. Set environment variables (.env.local):
 *    NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id
 *    NEXT_PUBLIC_ONCHAINKIT_API_KEY=your_api_key
 *    NEXT_PUBLIC_COINBASE_PAYMASTER_KEY=your_paymaster_key
 * 
 * 3. Get API keys:
 *    - WalletConnect: https://cloud.walletconnect.com/
 *    - OnchainKit: https://portal.cdp.coinbase.com/
 *    - Paymaster: Enable in Coinbase Developer Portal
 * 
 * 4. Deploy your contract to Base Sepolia:
 *    - Update NFT_CONTRACT_ADDRESS with your contract
 *    - Update NFT_ABI with your contract ABI
 * 
 * 5. Test:
 *    - npm run dev
 *    - Connect wallet
 *    - Mint NFT (gasless!)
 * 
 * FEATURES DEMONSTRATED:
 * ✅ Multi-wallet connection (WalletConnect, Coinbase, MetaMask)
 * ✅ Network detection and switching
 * ✅ Gasless transactions with Base Paymaster
 * ✅ Transaction status tracking
 * ✅ Mobile controls integration
 * ✅ VOID intro system
 * ✅ OnchainKit components
 * ✅ TypeScript type safety
 * ✅ Error handling
 * ✅ Loading states
 */
