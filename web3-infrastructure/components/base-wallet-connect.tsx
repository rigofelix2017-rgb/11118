'use client';

import { useAccount, useConnect, useDisconnect, useChainId, useSwitchChain } from 'wagmi';
import { base, baseSepolia } from 'wagmi/chains';
import { useEffect, useState } from 'react';

interface BaseWalletConnectProps {
  /**
   * Callback when wallet connects
   */
  onConnect?: (address: string) => void;
  /**
   * Callback when wallet disconnects
   */
  onDisconnect?: () => void;
  /**
   * Custom className for styling
   */
  className?: string;
  /**
   * Require specific chain (will prompt user to switch)
   */
  requireChain?: typeof base | typeof baseSepolia;
}

/**
 * Simple wallet connect component for Base
 * 
 * Features:
 * - Multi-wallet support (Coinbase, WalletConnect, MetaMask)
 * - Network switching
 * - Connection status
 * - Disconnect functionality
 */
export function BaseWalletConnect({
  onConnect,
  onDisconnect,
  className = '',
  requireChain,
}: BaseWalletConnectProps) {
  const { address, isConnected, connector } = useAccount();
  const { connect, connectors, isPending } = useConnect();
  const { disconnect } = useDisconnect();
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();
  const [isWrongNetwork, setIsWrongNetwork] = useState(false);

  // Check if on correct network
  useEffect(() => {
    if (requireChain && isConnected) {
      setIsWrongNetwork(chainId !== requireChain.id);
    }
  }, [chainId, requireChain, isConnected]);

  // Trigger callbacks
  useEffect(() => {
    if (isConnected && address) {
      onConnect?.(address);
    }
  }, [isConnected, address, onConnect]);

  useEffect(() => {
    if (!isConnected) {
      onDisconnect?.();
    }
  }, [isConnected, onDisconnect]);

  // Handle disconnect
  const handleDisconnect = () => {
    disconnect();
  };

  // Handle network switch
  const handleSwitchNetwork = () => {
    if (requireChain) {
      switchChain({ chainId: requireChain.id });
    }
  };

  // Not connected - show connect buttons
  if (!isConnected) {
    return (
      <div className={`base-wallet-connect ${className}`}>
        <div className="space-y-3">
          <h3 className="text-lg font-bold mb-4">Connect Wallet</h3>
          
          {connectors.map((connector) => (
            <button
              key={connector.uid}
              onClick={() => connect({ connector })}
              disabled={isPending}
              className="w-full px-4 py-3 rounded-lg border-2 border-cyan-500/30 
                       bg-gradient-to-r from-slate-800/50 to-slate-900/50
                       hover:border-cyan-500/60 hover:from-slate-700/50 hover:to-slate-800/50
                       transition-all duration-200 flex items-center justify-between
                       disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                boxShadow: '0 0 20px rgba(0, 255, 255, 0.1)',
              }}
            >
              <span className="font-mono text-cyan-400">
                {connector.name}
              </span>
              {isPending && connector.name === 'Loading...' && (
                <span className="text-xs text-cyan-600">Connecting...</span>
              )}
            </button>
          ))}
        </div>

        <div className="mt-4 text-xs text-cyan-600/60 text-center">
          Supports Base Mainnet & Sepolia Testnet
        </div>
      </div>
    );
  }

  // Connected but wrong network
  if (isWrongNetwork && requireChain) {
    return (
      <div className={`base-wallet-connect ${className}`}>
        <div className="p-4 border-2 border-yellow-500/30 rounded-lg bg-yellow-900/10">
          <h3 className="text-yellow-400 font-bold mb-2">Wrong Network</h3>
          <p className="text-sm text-yellow-400/80 mb-4">
            Please switch to {requireChain.name}
          </p>
          <button
            onClick={handleSwitchNetwork}
            className="w-full px-4 py-2 rounded-lg bg-yellow-500/20 border border-yellow-500/40
                     hover:bg-yellow-500/30 transition-colors text-yellow-400 font-mono"
          >
            Switch to {requireChain.name}
          </button>
        </div>
      </div>
    );
  }

  // Connected - show status
  return (
    <div className={`base-wallet-connect ${className}`}>
      <div className="p-4 border-2 border-green-500/30 rounded-lg bg-gradient-to-r from-green-900/10 to-emerald-900/10">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-sm text-green-400 font-mono">Connected</span>
          </div>
          <button
            onClick={handleDisconnect}
            className="text-xs text-red-400/80 hover:text-red-400 transition-colors"
          >
            Disconnect
          </button>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-cyan-600">Wallet:</span>
            <span className="text-xs text-cyan-400 font-mono">
              {connector?.name}
            </span>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-xs text-cyan-600">Address:</span>
            <span className="text-xs text-cyan-400 font-mono">
              {address?.slice(0, 6)}...{address?.slice(-4)}
            </span>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-xs text-cyan-600">Network:</span>
            <span className="text-xs text-cyan-400 font-mono">
              {chainId === base.id ? 'Base' : 'Base Sepolia'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
