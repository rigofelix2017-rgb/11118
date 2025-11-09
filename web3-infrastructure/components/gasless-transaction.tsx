'use client';

import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { useState } from 'react';
import { parseEther, type Address } from 'viem';
import { baseSepolia } from 'wagmi/chains';
import { getPaymasterCapabilities, isPaymasterAvailable } from '../lib/paymaster-config';

interface GaslessTransactionProps {
  /**
   * Contract address to interact with
   */
  contractAddress: Address;
  /**
   * Contract ABI
   */
  contractAbi: any[];
  /**
   * Function name to call
   */
  functionName: string;
  /**
   * Function arguments
   */
  args?: any[];
  /**
   * Value to send (in ETH)
   */
  value?: string;
  /**
   * Callback on success
   */
  onSuccess?: (txHash: string) => void;
  /**
   * Callback on error
   */
  onError?: (error: Error) => void;
  /**
   * Button text
   */
  buttonText?: string;
  /**
   * Custom className
   */
  className?: string;
}

/**
 * Component for sending gasless transactions using Base Paymaster
 * 
 * Features:
 * - Automatic gas sponsorship (free for users)
 * - Transaction status tracking
 * - Fallback to regular transaction if paymaster unavailable
 * - Loading states
 */
export function GaslessTransaction({
  contractAddress,
  contractAbi,
  functionName,
  args = [],
  value,
  onSuccess,
  onError,
  buttonText = 'Send Transaction',
  className = '',
}: GaslessTransactionProps) {
  const { address, isConnected, chainId } = useAccount();
  const [txHash, setTxHash] = useState<`0x${string}` | undefined>();
  const [isSponsored, setIsSponsored] = useState(false);

  const { 
    writeContract, 
    isPending: isWritePending, 
    error: writeError 
  } = useWriteContract();

  const { 
    isLoading: isConfirming, 
    isSuccess: isConfirmed 
  } = useWaitForTransactionReceipt({
    hash: txHash,
  });

  // Check if paymaster is available
  const paymasterAvailable = isPaymasterAvailable();

  // Handle transaction
  const handleTransaction = async () => {
    if (!isConnected || !address) {
      alert('Please connect your wallet first');
      return;
    }

    try {
      // Get paymaster capabilities if available
      const capabilities = paymasterAvailable && chainId
        ? getPaymasterCapabilities(chainId)
        : undefined;

      setIsSponsored(!!capabilities);

      writeContract({
        address: contractAddress,
        abi: contractAbi,
        functionName,
        args,
        value: value ? parseEther(value) : undefined,
        // @ts-ignore - capabilities is experimental
        capabilities,
      }, {
        onSuccess: (hash) => {
          setTxHash(hash);
          onSuccess?.(hash);
        },
        onError: (error) => {
          console.error('Transaction failed:', error);
          onError?.(error as Error);
        }
      });
    } catch (error) {
      console.error('Transaction failed:', error);
      onError?.(error as Error);
    }
  };

  // Show error state
  if (writeError) {
    return (
      <div className={`gasless-transaction error ${className}`}>
        <div className="p-4 border-2 border-red-500/30 rounded-lg bg-red-900/10">
          <p className="text-sm text-red-400">
            Transaction failed: {writeError.message}
          </p>
        </div>
      </div>
    );
  }

  // Show success state
  if (isConfirmed && txHash) {
    const explorerUrl = chainId === baseSepolia.id
      ? `https://sepolia.basescan.org/tx/${txHash}`
      : `https://basescan.org/tx/${txHash}`;

    return (
      <div className={`gasless-transaction success ${className}`}>
        <div className="p-4 border-2 border-green-500/30 rounded-lg bg-green-900/10">
          <p className="text-sm text-green-400 mb-2">Transaction successful!</p>
          {isSponsored && (
            <p className="text-xs text-green-400/60 mb-2">
              ✨ Gas fees sponsored (Free)
            </p>
          )}
          <a
            href={explorerUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-cyan-400 hover:text-cyan-300 underline"
          >
            View on Explorer →
          </a>
        </div>
      </div>
    );
  }

  // Show transaction button
  return (
    <div className={`gasless-transaction ${className}`}>
      <button
        onClick={handleTransaction}
        disabled={!isConnected || isWritePending || isConfirming}
        className="w-full px-6 py-3 rounded-lg font-mono font-bold
                 bg-gradient-to-r from-cyan-600/20 to-blue-600/20
                 border-2 border-cyan-500/40
                 hover:border-cyan-500/60 hover:from-cyan-600/30 hover:to-blue-600/30
                 transition-all duration-200
                 disabled:opacity-50 disabled:cursor-not-allowed
                 relative overflow-hidden group"
        style={{
          boxShadow: '0 0 30px rgba(0, 255, 255, 0.15)',
        }}
      >
        {/* Animated background */}
        <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/0 via-cyan-500/10 to-cyan-500/0 
                      translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
        
        {/* Button content */}
        <div className="relative z-10 flex items-center justify-center gap-2">
          {isWritePending || isConfirming ? (
            <>
              <div className="w-4 h-4 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
              <span className="text-cyan-400">
                {isWritePending ? 'Confirming...' : 'Processing...'}
              </span>
            </>
          ) : (
            <>
              <span className="text-cyan-400">{buttonText}</span>
              {paymasterAvailable && (
                <span className="text-xs text-green-400/80 bg-green-500/10 px-2 py-0.5 rounded">
                  FREE
                </span>
              )}
            </>
          )}
        </div>
      </button>

      {/* Paymaster status */}
      {paymasterAvailable && !isWritePending && !isConfirming && (
        <p className="text-xs text-green-400/60 text-center mt-2">
          ⚡ Gas fees sponsored by Base Paymaster
        </p>
      )}
      
      {!paymasterAvailable && !isWritePending && !isConfirming && (
        <p className="text-xs text-yellow-400/60 text-center mt-2">
          ⚠️ Paymaster not configured (users pay gas)
        </p>
      )}
    </div>
  );
}
