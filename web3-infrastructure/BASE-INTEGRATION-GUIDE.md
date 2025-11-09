# Base Chain Integration Guide

## Overview

Complete WalletConnect integration with Base chain support, including:
- **WalletConnect v2** - Multi-wallet support
- **Base Mainnet & Sepolia** - Official Base networks
- **Coinbase Smart Wallet** - Smart contract wallets
- **Paymaster Service** - Gasless transactions (fee subsidies)
- **OnchainKit** - Base's official React components
- **Account Abstraction (ERC-4337)** - Smart accounts with paymasters

---

## Quick Start

### 1. Install Dependencies

```bash
npm install @coinbase/onchainkit \
  wagmi viem@2.x \
  @tanstack/react-query \
  @reown/appkit @reown/appkit-adapter-wagmi \
  permissionless viem@2.x
```

### 2. Setup WalletConnect Config

```tsx
// lib/wagmi-config.ts
import { http, createConfig } from 'wagmi';
import { base, baseSepolia } from 'wagmi/chains';
import { coinbaseWallet, walletConnect, injected } from 'wagmi/connectors';

const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID!;

export const config = createConfig({
  chains: [base, baseSepolia],
  connectors: [
    coinbaseWallet({
      appName: 'Your App Name',
      preference: 'smartWalletOnly', // Force smart wallets
    }),
    walletConnect({ 
      projectId,
      metadata: {
        name: 'Your App Name',
        description: 'Your app description',
        url: 'https://yourapp.com',
        icons: ['https://yourapp.com/icon.png']
      }
    }),
    injected(), // MetaMask, Rainbow, etc.
  ],
  transports: {
    [base.id]: http(),
    [baseSepolia.id]: http(),
  },
});

declare module 'wagmi' {
  interface Register {
    config: typeof config;
  }
}
```

### 3. Wrap App with Providers

```tsx
// app/providers.tsx
'use client';

import { OnchainKitProvider } from '@coinbase/onchainkit';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WagmiProvider } from 'wagmi';
import { base } from 'wagmi/chains';
import { config } from '@/lib/wagmi-config';

const queryClient = new QueryClient();

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <OnchainKitProvider
          apiKey={process.env.NEXT_PUBLIC_ONCHAINKIT_API_KEY}
          chain={base}
        >
          {children}
        </OnchainKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
```

---

## Base DevKit Integration

### OnchainKit - Official Base Components

```tsx
import {
  ConnectWallet,
  Wallet,
  WalletDropdown,
  WalletDropdownLink,
  WalletDropdownDisconnect,
} from '@coinbase/onchainkit/wallet';
import {
  Address,
  Avatar,
  Name,
  Identity,
  EthBalance,
} from '@coinbase/onchainkit/identity';
import { color } from '@coinbase/onchainkit/theme';

function WalletComponents() {
  return (
    <div className="flex justify-end">
      <Wallet>
        <ConnectWallet>
          <Avatar className="h-6 w-6" />
          <Name />
        </ConnectWallet>
        <WalletDropdown>
          <Identity className="px-4 pt-3 pb-2" hasCopyAddressOnClick>
            <Avatar />
            <Name />
            <Address className={color.foregroundMuted} />
            <EthBalance />
          </Identity>
          <WalletDropdownLink
            icon="wallet"
            href="https://keys.coinbase.com"
          >
            Wallet
          </WalletDropdownLink>
          <WalletDropdownDisconnect />
        </WalletDropdown>
      </Wallet>
    </div>
  );
}
```

### Transaction Components

```tsx
import {
  Transaction,
  TransactionButton,
  TransactionSponsor,
  TransactionStatus,
  TransactionStatusLabel,
  TransactionStatusAction,
} from '@coinbase/onchainkit/transaction';
import type { LifecycleStatus } from '@coinbase/onchainkit/transaction';

function SendTransaction() {
  const contracts = [
    {
      address: '0x...',
      abi: [...],
      functionName: 'mint',
      args: [address, amount],
    },
  ];

  const handleSuccess = (response: TransactionResponse) => {
    console.log('Transaction successful', response);
  };

  return (
    <Transaction
      contracts={contracts}
      onSuccess={handleSuccess}
    >
      <TransactionButton text="Mint NFT" />
      <TransactionSponsor />
      <TransactionStatus>
        <TransactionStatusLabel />
        <TransactionStatusAction />
      </TransactionStatus>
    </Transaction>
  );
}
```

---

## Paymaster Integration (Fee Subsidies)

### Option 1: Base Paymaster (Recommended)

Base provides built-in gasless transactions through Coinbase's paymaster service.

```tsx
// lib/paymaster-config.ts
import { createPublicClient, http } from 'viem';
import { baseSepolia } from 'viem/chains';

export const paymasterUrl = `https://api.developer.coinbase.com/rpc/v1/base-sepolia/${process.env.NEXT_PUBLIC_COINBASE_PAYMASTER_KEY}`;

export const publicClient = createPublicClient({
  chain: baseSepolia,
  transport: http(paymasterUrl),
});
```

### Using with OnchainKit

```tsx
import { Transaction } from '@coinbase/onchainkit/transaction';

function GaslessTransaction() {
  return (
    <Transaction
      contracts={contracts}
      chainId={baseSepolia.id}
      capabilities={{
        paymasterService: {
          url: paymasterUrl,
        },
      }}
    >
      <TransactionButton text="Free Transaction" />
      <TransactionSponsor /> {/* Shows "Sponsored by Base" */}
      <TransactionStatus />
    </Transaction>
  );
}
```

### Option 2: Pimlico Paymaster (ERC-4337)

For advanced use cases with account abstraction:

```bash
npm install permissionless
```

```tsx
// lib/paymaster-pimlico.ts
import { createPimlicoPaymasterClient } from 'permissionless/clients/pimlico';
import { http } from 'viem';
import { baseSepolia } from 'viem/chains';

export const paymasterClient = createPimlicoPaymasterClient({
  transport: http(
    `https://api.pimlico.io/v2/base-sepolia/rpc?apikey=${process.env.NEXT_PUBLIC_PIMLICO_API_KEY}`
  ),
  entryPoint: '0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789',
});

// Sponsor user operations
export async function sponsorUserOperation(userOp: UserOperation) {
  return paymasterClient.sponsorUserOperation({
    userOperation: userOp,
    entryPoint: '0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789',
  });
}
```

---

## Smart Wallet Integration

### Coinbase Smart Wallet

```tsx
import { useSendTransaction } from 'wagmi';
import { useCapabilities, useWriteContracts } from 'wagmi/experimental';

function SmartWalletTransaction() {
  const { data: availableCapabilities } = useCapabilities();
  const { writeContracts } = useWriteContracts();

  const handleSponsoredTx = async () => {
    // Check if paymaster is available
    const capabilities = availableCapabilities?.[baseSepolia.id];
    const paymasterService = capabilities?.paymasterService;

    writeContracts({
      contracts: [
        {
          address: '0x...',
          abi: contractAbi,
          functionName: 'transfer',
          args: [recipient, amount],
        },
      ],
      capabilities: {
        paymasterService: {
          url: paymasterUrl,
        },
      },
    });
  };

  return (
    <button onClick={handleSponsoredTx}>
      Send Gasless Transaction
    </button>
  );
}
```

---

## Complete Example Component

```tsx
'use client';

import { useState } from 'react';
import { useAccount, useConnect, useDisconnect } from 'wagmi';
import { 
  ConnectWallet, 
  Wallet, 
  WalletDropdown, 
  WalletDropdownDisconnect 
} from '@coinbase/onchainkit/wallet';
import { 
  Transaction, 
  TransactionButton, 
  TransactionSponsor,
  TransactionStatus 
} from '@coinbase/onchainkit/transaction';
import { Avatar, Name, Identity, Address } from '@coinbase/onchainkit/identity';

export function BaseWalletConnect() {
  const { address, isConnected } = useAccount();

  if (!isConnected) {
    return (
      <div className="p-4">
        <h2 className="text-xl mb-4">Connect to Base</h2>
        <Wallet>
          <ConnectWallet />
        </Wallet>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      {/* Wallet Info */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl">Base Wallet Connected</h2>
        <Wallet>
          <ConnectWallet>
            <Avatar className="h-6 w-6" />
            <Name />
          </ConnectWallet>
          <WalletDropdown>
            <Identity className="px-4 pt-3 pb-2" hasCopyAddressOnClick>
              <Avatar />
              <Name />
              <Address />
            </Identity>
            <WalletDropdownDisconnect />
          </WalletDropdown>
        </Wallet>
      </div>

      {/* Gasless Transaction Example */}
      <div className="border rounded-lg p-4">
        <h3 className="font-bold mb-2">Send Gasless Transaction</h3>
        <Transaction
          contracts={[
            {
              address: '0xYourContractAddress',
              abi: yourAbi,
              functionName: 'mint',
              args: [address],
            },
          ]}
          capabilities={{
            paymasterService: {
              url: process.env.NEXT_PUBLIC_PAYMASTER_URL,
            },
          }}
        >
          <TransactionButton text="Mint (Free)" />
          <TransactionSponsor />
          <TransactionStatus />
        </Transaction>
      </div>
    </div>
  );
}
```

---

## Environment Variables

```env
# .env.local

# WalletConnect
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id_here

# OnchainKit (Base DevKit)
NEXT_PUBLIC_ONCHAINKIT_API_KEY=your_api_key_here

# Coinbase Paymaster (for gasless transactions)
NEXT_PUBLIC_COINBASE_PAYMASTER_KEY=your_paymaster_key_here

# Pimlico (optional - alternative paymaster)
NEXT_PUBLIC_PIMLICO_API_KEY=your_pimlico_key_here

# Base RPC (optional - custom RPC)
NEXT_PUBLIC_BASE_RPC_URL=https://mainnet.base.org
NEXT_PUBLIC_BASE_SEPOLIA_RPC_URL=https://sepolia.base.org
```

---

## Setup Instructions

### 1. Get WalletConnect Project ID

1. Go to https://cloud.walletconnect.com/
2. Create a new project
3. Copy your Project ID
4. Add to `.env.local` as `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID`

### 2. Get OnchainKit API Key

1. Go to https://portal.cdp.coinbase.com/
2. Sign in with Coinbase account
3. Create new project
4. Copy API key
5. Add to `.env.local` as `NEXT_PUBLIC_ONCHAINKIT_API_KEY`

### 3. Enable Paymaster (Optional)

1. In Coinbase Developer Portal, enable Paymaster
2. Copy Paymaster URL
3. Add to `.env.local` as `NEXT_PUBLIC_COINBASE_PAYMASTER_KEY`

### 4. Configure Base Networks

```tsx
import { base, baseSepolia } from 'wagmi/chains';

// Mainnet
export const baseMainnet = {
  id: 8453,
  name: 'Base',
  rpcUrl: 'https://mainnet.base.org',
  blockExplorer: 'https://basescan.org',
  nativeCurrency: {
    name: 'Ethereum',
    symbol: 'ETH',
    decimals: 18,
  },
};

// Testnet
export const baseSepoliaTestnet = {
  id: 84532,
  name: 'Base Sepolia',
  rpcUrl: 'https://sepolia.base.org',
  blockExplorer: 'https://sepolia.basescan.org',
  nativeCurrency: {
    name: 'Ethereum',
    symbol: 'ETH',
    decimals: 18,
  },
};
```

---

## Base DevKit Features

### 1. Identity Components

```tsx
import { Avatar, Name, Badge, Address } from '@coinbase/onchainkit/identity';

<Identity address={address}>
  <Avatar /> {/* ENS/Basename avatar */}
  <Name /> {/* ENS/Basename name */}
  <Badge /> {/* Verification badge */}
  <Address /> {/* Truncated address */}
</Identity>
```

### 2. Swap Component

```tsx
import { Swap, SwapAmountInput, SwapToggleButton, SwapButton } from '@coinbase/onchainkit/swap';

<Swap>
  <SwapAmountInput
    label="Sell"
    token={usdcToken}
    type="from"
  />
  <SwapToggleButton />
  <SwapAmountInput
    label="Buy"
    token={ethToken}
    type="to"
  />
  <SwapButton />
</Swap>
```

### 3. Basename (Base Username)

```tsx
import { useBasename } from '@coinbase/onchainkit/identity';

function UserProfile() {
  const { data: basename } = useBasename({ address });
  
  return <div>{basename || address}</div>;
}
```

### 4. Token Components

```tsx
import { TokenChip, TokenImage, TokenRow } from '@coinbase/onchainkit/token';

<TokenRow token={usdcToken} amount="100" />
```

---

## Advanced: Account Abstraction (ERC-4337)

For fully gasless experiences with smart contract wallets:

```tsx
import { createSmartAccountClient } from 'permissionless';
import { signerToSmartAccount } from 'permissionless/accounts';

async function createSmartAccount(signer: any) {
  const smartAccount = await signerToSmartAccount(publicClient, {
    signer,
    entryPoint: '0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789',
    factoryAddress: '0x...',
  });

  const smartAccountClient = createSmartAccountClient({
    account: smartAccount,
    chain: baseSepolia,
    transport: http(paymasterUrl),
    sponsorUserOperation: paymasterClient.sponsorUserOperation,
  });

  return smartAccountClient;
}

// Send gasless transaction
const txHash = await smartAccountClient.sendTransaction({
  to: recipient,
  value: parseEther('0.01'),
  data: '0x',
});
```

---

## Testing on Base Sepolia

### Get Test ETH

1. Visit https://www.coinbase.com/faucets/base-ethereum-goerli-faucet
2. Connect wallet
3. Claim test ETH for Base Sepolia

### Verify Transactions

- Base Sepolia Explorer: https://sepolia.basescan.org
- Check gasless transactions show `0 ETH` gas fee

---

## Best Practices

### 1. Always Check Network

```tsx
import { useChainId, useSwitchChain } from 'wagmi';
import { base } from 'wagmi/chains';

function NetworkGuard() {
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();

  if (chainId !== base.id) {
    return (
      <button onClick={() => switchChain({ chainId: base.id })}>
        Switch to Base
      </button>
    );
  }

  return <YourComponent />;
}
```

### 2. Handle Paymaster Failures

```tsx
const handleTransaction = async () => {
  try {
    await sendTransaction({
      capabilities: {
        paymasterService: { url: paymasterUrl },
      },
    });
  } catch (error) {
    // Fallback to regular transaction
    await sendTransaction({});
  }
};
```

### 3. Monitor Gas Sponsorship

```tsx
import { useWriteContracts } from 'wagmi/experimental';

const { data, writeContracts } = useWriteContracts();

// Check if sponsored
const isSponsored = data?.capabilities?.paymasterService?.supported;
```

---

## Useful Base Tools

### 1. Base Names (Basenames)

```bash
npm install @coinbase/onchainkit
```

Register .base.eth names for users:
- https://www.base.org/names

### 2. Base Gas Tracker

Monitor Base network gas prices:
- https://base.blockscout.com/gas-tracker

### 3. Base Bridge

Official bridge for mainnet:
- https://bridge.base.org/

### 4. Base Scan

Block explorer:
- Mainnet: https://basescan.org
- Sepolia: https://sepolia.basescan.org

### 5. Coinbase Wallet SDK

For deeper integration:
```bash
npm install @coinbase/wallet-sdk
```

---

## Dependencies Summary

```json
{
  "dependencies": {
    "@coinbase/onchainkit": "^0.29.0",
    "@reown/appkit": "^1.0.0",
    "@reown/appkit-adapter-wagmi": "^1.0.0",
    "@tanstack/react-query": "^5.17.19",
    "permissionless": "^0.1.0",
    "viem": "^2.7.0",
    "wagmi": "^2.5.0"
  }
}
```

---

## Migration from Existing Setup

If you have existing Web3 code:

1. **Replace Web3.js/Ethers.js** → Use Wagmi + Viem
2. **Add WalletConnect** → Multi-wallet support
3. **Add OnchainKit** → Pre-built Base components
4. **Enable Paymaster** → Gasless transactions
5. **Test on Base Sepolia** → Before mainnet

---

## Support & Resources

- **Base Docs**: https://docs.base.org
- **OnchainKit Docs**: https://onchainkit.xyz
- **WalletConnect Docs**: https://docs.walletconnect.com
- **Wagmi Docs**: https://wagmi.sh
- **Base Discord**: https://discord.gg/buildonbase

---

## License

Same as parent package (MIT)
