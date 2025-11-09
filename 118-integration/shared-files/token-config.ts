// token-config.ts
// Copy this file to: src/lib/token-config.ts

import { base, baseSepolia } from 'wagmi/chains';

export interface TokenConfig {
  address: `0x${string}`;
  symbol: string;
  name: string;
  decimals: number;
  icon?: string;
}

export const SUPPORTED_TOKENS: Record<string, TokenConfig> = {
  USDC: {
    address: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', // Base mainnet
    symbol: 'USDC',
    name: 'USD Coin',
    decimals: 6,
    icon: '💵'
  },
  ETH: {
    address: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE', // Native ETH placeholder
    symbol: 'ETH',
    name: 'Ethereum',
    decimals: 18,
    icon: '⟠'
  },
  VOID: {
    address: '0x0000000000000000000000000000000000000000', // TODO: Deploy VOID token
    symbol: 'VOID',
    name: 'VOID Token',
    decimals: 18,
    icon: '🌑'
  },
  PSX: {
    address: '0x0000000000000000000000000000000000000000', // TODO: Deploy PSX token
    symbol: 'PSX',
    name: 'PSX Token',
    decimals: 18,
    icon: '🎮'
  }
};

// Testnet tokens (Base Sepolia)
export const TESTNET_TOKENS: Record<string, TokenConfig> = {
  USDC: {
    address: '0x036CbD53842c5426634e7929541eC2318f3dCF7e', // Base Sepolia USDC
    symbol: 'USDC',
    name: 'USD Coin (Testnet)',
    decimals: 6,
    icon: '💵'
  },
  ETH: {
    address: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
    symbol: 'ETH',
    name: 'Ethereum (Sepolia)',
    decimals: 18,
    icon: '⟠'
  },
  VOID: {
    address: '0x0000000000000000000000000000000000000000', // TODO: Deploy testnet VOID
    symbol: 'VOID',
    name: 'VOID Token (Testnet)',
    decimals: 18,
    icon: '🌑'
  },
  PSX: {
    address: '0x0000000000000000000000000000000000000000', // TODO: Deploy testnet PSX
    symbol: 'PSX',
    name: 'PSX Token (Testnet)',
    decimals: 18,
    icon: '🎮'
  }
};

/**
 * Get tokens for current chain
 */
export function getTokensForChain(chainId: number): Record<string, TokenConfig> {
  if (chainId === baseSepolia.id) {
    return TESTNET_TOKENS;
  }
  return SUPPORTED_TOKENS;
}

/**
 * Get token config by symbol
 */
export function getTokenConfig(symbol: string, chainId: number = base.id): TokenConfig | null {
  const tokens = getTokensForChain(chainId);
  return tokens[symbol] || null;
}

/**
 * Format token amount with proper decimals
 */
export function formatTokenAmount(amount: bigint, decimals: number): string {
  const divisor = BigInt(10 ** decimals);
  const whole = amount / divisor;
  const fraction = amount % divisor;
  
  if (fraction === 0n) {
    return whole.toString();
  }
  
  const fractionStr = fraction.toString().padStart(decimals, '0').replace(/0+$/, '');
  return `${whole}.${fractionStr}`;
}

/**
 * Parse token amount from string
 */
export function parseTokenAmount(amount: string, decimals: number): bigint {
  const [whole, fraction = '0'] = amount.split('.');
  const paddedFraction = fraction.padEnd(decimals, '0').slice(0, decimals);
  return BigInt(whole + paddedFraction);
}

export default SUPPORTED_TOKENS;
