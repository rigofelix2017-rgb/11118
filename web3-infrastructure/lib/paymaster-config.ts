import { createPublicClient, http, type Address } from 'viem';
import { base, baseSepolia } from 'viem/chains';

/**
 * Paymaster configuration for Base gasless transactions
 * 
 * Get your API key from:
 * https://portal.cdp.coinbase.com/
 */

const COINBASE_PAYMASTER_BASE_URL = 'https://api.developer.coinbase.com/rpc/v1';

// Mainnet paymaster
export const paymasterUrl = `${COINBASE_PAYMASTER_BASE_URL}/base/${
  process.env.NEXT_PUBLIC_COINBASE_PAYMASTER_KEY || ''
}`;

// Testnet paymaster
export const paymasterUrlSepolia = `${COINBASE_PAYMASTER_BASE_URL}/base-sepolia/${
  process.env.NEXT_PUBLIC_COINBASE_PAYMASTER_KEY || ''
}`;

/**
 * Public client for Base mainnet with paymaster support
 */
export const basePublicClient = createPublicClient({
  chain: base,
  transport: http(paymasterUrl || 'https://mainnet.base.org'),
});

/**
 * Public client for Base Sepolia testnet with paymaster support
 */
export const baseSepoliaPublicClient = createPublicClient({
  chain: baseSepolia,
  transport: http(paymasterUrlSepolia || 'https://sepolia.base.org'),
});

/**
 * Check if paymaster service is available
 */
export function isPaymasterAvailable(): boolean {
  return !!(
    process.env.NEXT_PUBLIC_COINBASE_PAYMASTER_KEY &&
    process.env.NEXT_PUBLIC_COINBASE_PAYMASTER_KEY.length > 0
  );
}

/**
 * Get paymaster capabilities for a transaction
 */
export function getPaymasterCapabilities(chainId: number) {
  if (!isPaymasterAvailable()) {
    return undefined;
  }

  const url = chainId === base.id ? paymasterUrl : paymasterUrlSepolia;

  return {
    paymasterService: {
      url,
      context: {
        mode: 'SPONSORED', // Free for users
      },
    },
  };
}

/**
 * Estimate gas cost for a transaction
 */
export async function estimateGasCost(
  to: Address,
  data: `0x${string}`,
  chainId: number = baseSepolia.id
) {
  const client = chainId === base.id ? basePublicClient : baseSepoliaPublicClient;

  try {
    const gasEstimate = await client.estimateGas({
      to,
      data,
    });

    const gasPrice = await client.getGasPrice();
    const gasCost = gasEstimate * gasPrice;

    return {
      gasEstimate,
      gasPrice,
      gasCost,
      gasCostInEth: Number(gasCost) / 1e18,
    };
  } catch (error) {
    console.error('Gas estimation failed:', error);
    return null;
  }
}

/**
 * Check if an address is a smart contract wallet
 */
export async function isSmartWallet(
  address: Address,
  chainId: number = baseSepolia.id
): Promise<boolean> {
  const client = chainId === base.id ? basePublicClient : baseSepoliaPublicClient;

  try {
    const code = await client.getBytecode({ address });
    return !!code && code !== '0x';
  } catch (error) {
    console.error('Smart wallet check failed:', error);
    return false;
  }
}

/**
 * Paymaster service configuration
 */
export interface PaymasterConfig {
  url: string;
  context?: {
    mode?: 'SPONSORED' | 'ERC20'; // SPONSORED = free, ERC20 = pay with tokens
    token?: Address; // ERC20 token address (if mode is ERC20)
    sponsorshipPolicy?: string; // Policy ID for conditional sponsorship
  };
}

/**
 * Get paymaster config for sponsored transactions
 */
export function getSponsoredPaymasterConfig(chainId: number): PaymasterConfig {
  const url = chainId === base.id ? paymasterUrl : paymasterUrlSepolia;

  return {
    url,
    context: {
      mode: 'SPONSORED',
    },
  };
}

/**
 * Get paymaster config for ERC20 token payments
 */
export function getERC20PaymasterConfig(
  chainId: number,
  tokenAddress: Address
): PaymasterConfig {
  const url = chainId === base.id ? paymasterUrl : paymasterUrlSepolia;

  return {
    url,
    context: {
      mode: 'ERC20',
      token: tokenAddress,
    },
  };
}
