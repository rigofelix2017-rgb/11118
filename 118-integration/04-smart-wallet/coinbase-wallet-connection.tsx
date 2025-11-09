import { useState } from 'react';
import { CoinbaseAuth } from './coinbase-auth';
import { storeAuthDataForSession } from '@/hooks/use-player-state';
import { ClientMessage } from '@shared/schema';

interface CoinbaseWalletConnectionProps {
  onWalletConnected: (walletAddress: string) => void;
  sendMessage: (message: ClientMessage) => void;
  isConnected: boolean;
}

export function CoinbaseWalletConnection({ 
  onWalletConnected, 
  sendMessage, 
  isConnected 
}: CoinbaseWalletConnectionProps) {
  const [isModalOpen, setIsModalOpen] = useState(true);
  const [showDevBypass, setShowDevBypass] = useState(false);

  console.log('🔄 CoinbaseWalletConnection rendered, modal open:', isModalOpen);

  const handleAuthenticated = (walletAddress: string) => {
    console.log('🎮 Wallet authenticated, connecting to game...', walletAddress);
    
    // Generate authentication data for the game server
    const nonce = `coinbase_auth_${Date.now()}`;
    const signature = `coinbase_${walletAddress.slice(2, 8)}_${Date.now()}`;
    
    // Store auth data for session creation
    storeAuthDataForSession({
      walletAddress,
      signature,
      nonce
    });

    // Send connect_account message to game server
    sendMessage({
      type: 'connect_account',
      data: {
        walletAddress,
        signature,
        nonce
      }
    });

    // Notify parent that wallet is connected
    onWalletConnected(walletAddress);
    
    // Close the modal
    setIsModalOpen(false);
  };

  const handleDevBypass = () => {
    // Generate a random test wallet address
    const randomId = Math.random().toString(36).substring(2, 8);
    const testWallet = `0xDEV${randomId}${'0'.repeat(34)}`.slice(0, 42);
    console.log('🔧 DEV BYPASS - Using test wallet:', testWallet);
    handleAuthenticated(testWallet);
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-black">
      {/* Dev bypass button - bottom right corner */}
      <button
        onClick={() => setShowDevBypass(true)}
        onDoubleClick={handleDevBypass}
        className="fixed bottom-4 right-4 px-4 py-2 bg-red-600 text-white font-mono text-xs border-2 border-red-400 hover:bg-red-700 transition-colors z-50"
        data-testid="button-dev-bypass"
      >
        {showDevBypass ? 'DOUBLE-CLICK TO BYPASS' : 'DEV MODE'}
      </button>
      
      <CoinbaseAuth 
        onAuthenticated={handleAuthenticated}
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
      />
    </div>
  );
}