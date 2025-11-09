# 🚨 Prerequisites & Missing Dependencies Guide

## Critical Information Before Integration

**IMPORTANT**: The 118-integration package is **FRONTEND-ONLY** and has significant dependencies on:
1. Backend Express server routes
2. Shared TypeScript configuration
3. UI component libraries
4. Smart contract deployments

**This package WILL NOT work out-of-the-box** without the supporting infrastructure detailed below.

---

## 📋 Table of Contents

1. [TypeScript Configuration](#typescript-configuration)
2. [UI Component Dependencies](#ui-component-dependencies)
3. [Backend Server Requirements](#backend-server-requirements)
4. [Smart Contract Dependencies](#smart-contract-dependencies)
5. [Shared Files to Copy](#shared-files-to-copy)
6. [Feature-Specific Requirements](#feature-specific-requirements)
7. [Quick Integration Checklist](#quick-integration-checklist)

---

## 🔧 TypeScript Configuration

### Required Path Aliases

All components use these TypeScript path aliases. Add to your `tsconfig.json`:

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"],
      "@/components/*": ["./src/components/*"],
      "@/lib/*": ["./src/lib/*"],
      "@/hooks/*": ["./src/hooks/*"],
      "@/contexts/*": ["./src/contexts/*"],
      "@/utils/*": ["./src/utils/*"],
      "@shared/*": ["./shared/*"]
    }
  }
}
```

### Vite Configuration (if using Vite)

```typescript
// vite.config.ts
import path from 'path';

export default {
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@shared': path.resolve(__dirname, './shared')
    }
  }
}
```

---

## 🎨 UI Component Dependencies

### Required shadcn/ui Components

Every feature assumes you have installed these shadcn components:

```bash
npx shadcn-ui@latest init
npx shadcn-ui@latest add button
npx shadcn-ui@latest add card
npx shadcn-ui@latest add input
npx shadcn-ui@latest add label
npx shadcn-ui@latest add dialog
npx shadcn-ui@latest add tabs
npx shadcn-ui@latest add badge
npx shadcn-ui@latest add slider
npx shadcn-ui@latest add toast
npx shadcn-ui@latest add select
npx shadcn-ui@latest add checkbox
```

### Required Utility Functions

The components expect these utilities to exist:

**`src/lib/utils.ts`** (or `src/utils.ts`):
```typescript
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

**Dependencies:**
```bash
npm install clsx tailwind-merge
```

### Toast Hook

**`src/hooks/use-toast.ts`**:
```typescript
// This comes from shadcn/ui toast component
// Install with: npx shadcn-ui@latest add toast
import { toast } from "@/components/ui/use-toast"
export { toast }
```

---

## 🖥️ Backend Server Requirements

### ⚠️ CRITICAL: Required Express Server Routes

**The frontend components WILL FAIL** without these backend endpoints. You must implement them.

#### 1. Session Management Routes

**Required by:** Smart wallet, player state, intro system

```typescript
// server/routes.ts

// POST /api/session/login
// Body: { address: string, authData?: any }
// Returns: { success: boolean, sessionId: string }

// GET /api/session/me
// Returns: { 
//   address: string | null, 
//   isNew: boolean,
//   hasCompletedIntro: boolean 
// }

// POST /api/session/logout
// Returns: { success: boolean }
```

#### 2. Jukebox Routes

**Required by:** 01-jukebox-system

```typescript
// GET /api/jukebox/queue
// Returns: Array<{ 
//   id: number, 
//   youtubeUrl: string, 
//   title: string,
//   addedBy: string,
//   addedAt: Date 
// }>

// POST /api/jukebox/add
// Body: { youtubeUrl: string }
// Returns: { success: boolean, songId: number }

// GET /api/jukebox/price
// Returns: { priceInUSDC: string }

// GET /api/jukebox/server-time
// Returns: { serverTime: number }

// POST /api/jukebox/skip
// Body: { songId: number }
// Returns: { success: boolean }
```

#### 3. Wallet Routes

**Required by:** 04-smart-wallet

```typescript
// GET /api/wallet/is-new?address={address}
// Returns: { isNew: boolean }

// POST /api/wallet/complete-onboarding
// Body: { address: string }
// Returns: { success: boolean }
```

#### 4. Tipping Routes

**Required by:** 02-tipping-system

```typescript
// GET /api/tips/received
// Returns: Array<{
//   id: number,
//   from: string,
//   amount: string,
//   token: string,
//   timestamp: Date
// }>

// GET /api/tips/sent
// Returns: Array<{
//   id: number,
//   to: string,
//   amount: string,
//   token: string,
//   timestamp: Date
// }>
```

#### 5. Housing Routes

**Required by:** 03-housing-system

```typescript
// GET /api/houses/:address
// Returns: {
//   theme: string,
//   furniture: Array<FurnitureItem>,
//   privacy: 'public' | 'private' | 'friends'
// }

// POST /api/houses/save
// Body: { furniture: Array<FurnitureItem>, theme: string, privacy: string }
// Returns: { success: boolean }
```

#### 6. Agency Ecosystem Routes

**Required by:** 09-agency-ecosystem

```typescript
// GET /api/land/parcels
// Returns: Array<Parcel>

// GET /api/land/owned/:address
// Returns: Array<Parcel>

// GET /api/sku/marketplace
// Returns: Array<SKU>

// GET /api/sku/owned/:address
// Returns: Array<SKU>
```

### Database Schema Requirements

If you implement the backend routes, you'll need these database tables:

```sql
-- Sessions
CREATE TABLE sessions (
  id SERIAL PRIMARY KEY,
  address VARCHAR(42) NOT NULL,
  session_id VARCHAR(255) UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Jukebox Queue
CREATE TABLE jukebox_queue (
  id SERIAL PRIMARY KEY,
  youtube_url TEXT NOT NULL,
  title TEXT NOT NULL,
  added_by VARCHAR(42) NOT NULL,
  added_at TIMESTAMP DEFAULT NOW(),
  played BOOLEAN DEFAULT FALSE
);

-- Tips
CREATE TABLE tips (
  id SERIAL PRIMARY KEY,
  from_address VARCHAR(42) NOT NULL,
  to_address VARCHAR(42) NOT NULL,
  amount VARCHAR(78) NOT NULL,
  token VARCHAR(42) NOT NULL,
  tx_hash VARCHAR(66),
  timestamp TIMESTAMP DEFAULT NOW()
);

-- Houses
CREATE TABLE houses (
  id SERIAL PRIMARY KEY,
  owner_address VARCHAR(42) UNIQUE NOT NULL,
  theme VARCHAR(50),
  furniture JSONB,
  privacy VARCHAR(20),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

---

## 📦 Shared Files to Copy

### 1. Token Configuration

**REQUIRED by:** 02-tipping-system, 09-agency-ecosystem

**Create:** `src/lib/token-config.ts`

```typescript
// Token configuration for tipping and agency ecosystem
import { Address } from 'viem';

export const SUPPORTED_TOKENS = {
  USDC: {
    address: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913' as Address, // Base mainnet
    decimals: 6,
    symbol: 'USDC',
    name: 'USD Coin',
    icon: '💵'
  },
  ETH: {
    address: '0x0000000000000000000000000000000000000000' as Address, // Native ETH
    decimals: 18,
    symbol: 'ETH',
    name: 'Ethereum',
    icon: '💎'
  },
  PSX: {
    address: '0x0000000000000000000000000000000000000000' as Address, // REPLACE WITH ACTUAL
    decimals: 18,
    symbol: 'PSX',
    name: 'PSX Token',
    icon: '🎮'
  },
  VOID: {
    address: '0x0000000000000000000000000000000000000000' as Address, // REPLACE WITH ACTUAL
    decimals: 18,
    symbol: 'VOID',
    name: 'VOID Token',
    icon: '🌀'
  }
} as const;

export type TokenSymbol = keyof typeof SUPPORTED_TOKENS;

export function getTokenByAddress(address: string): TokenSymbol | undefined {
  return Object.entries(SUPPORTED_TOKENS).find(
    ([_, token]) => token.address.toLowerCase() === address.toLowerCase()
  )?.[0] as TokenSymbol | undefined;
}
```

### 2. Wagmi Configuration

**REQUIRED by:** All features using Web3

**Create:** `src/lib/wagmi-config.ts`

```typescript
import { createConfig, http } from 'wagmi';
import { base, baseSepolia } from 'wagmi/chains';
import { coinbaseWallet } from 'wagmi/connectors';

export const wagmiConfig = createConfig({
  chains: [base, baseSepolia],
  connectors: [
    coinbaseWallet({
      appName: 'Your App Name',
      preference: 'smartWalletOnly',
    }),
  ],
  transports: {
    [base.id]: http(),
    [baseSepolia.id]: http(),
  },
});
```

### 3. Mobile Layout Context

**REQUIRED by:** 05-mobile-controls (118 version)

**Create:** `src/contexts/mobile-layout-context.tsx`

```typescript
import React, { createContext, useContext, useState } from 'react';

interface MobileLayoutContextType {
  isKeyboardOpen: boolean;
  setIsKeyboardOpen: (open: boolean) => void;
  bottomInset: number;
}

const MobileLayoutContext = createContext<MobileLayoutContextType>({
  isKeyboardOpen: false,
  setIsKeyboardOpen: () => {},
  bottomInset: 0,
});

export function MobileLayoutProvider({ children }: { children: React.ReactNode }) {
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);
  const bottomInset = isKeyboardOpen ? 0 : 
    typeof window !== 'undefined' ? 
      parseInt(getComputedStyle(document.documentElement).getPropertyValue('--sab') || '0') : 
      0;

  return (
    <MobileLayoutContext.Provider value={{ isKeyboardOpen, setIsKeyboardOpen, bottomInset }}>
      {children}
    </MobileLayoutContext.Provider>
  );
}

export const useMobileLayout = () => useContext(MobileLayoutContext);
```

### 4. Player State Hook

**REQUIRED by:** Intro system, session management

**Create:** `src/hooks/use-player-state.ts`

```typescript
import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';

export function usePlayerState() {
  const { address, isConnected } = useAccount();
  const [isNew, setIsNew] = useState(true);
  const [hasCompletedIntro, setHasCompletedIntro] = useState(false);

  useEffect(() => {
    if (address && isConnected) {
      // Call your backend to check player state
      fetch(`/api/session/me`)
        .then(res => res.json())
        .then(data => {
          setIsNew(data.isNew ?? true);
          setHasCompletedIntro(data.hasCompletedIntro ?? false);
        })
        .catch(err => {
          console.error('Failed to fetch player state:', err);
        });
    }
  }, [address, isConnected]);

  const markIntroComplete = async () => {
    if (address) {
      await fetch('/api/session/complete-intro', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address })
      });
      setHasCompletedIntro(true);
    }
  };

  return {
    isNew,
    hasCompletedIntro,
    markIntroComplete,
  };
}
```

---

## 🔐 Smart Contract Dependencies

### Agency Ecosystem (09-agency-ecosystem)

**CRITICAL**: The UI ships with placeholder addresses (`0x000...`). You MUST:

1. **Deploy these contracts to your target network:**
   - `LandRegistry.sol` (ERC-721 land parcels)
   - `HookRouter.sol` (V4 hooks fee distribution)
   - `SKURegistry.sol` (content distribution - TO BE CREATED)
   - `XVoidVault.sol` (staking vault - TO BE CREATED)
   - `PSXPledgeVault.sol` (pledging system - TO BE CREATED)
   - `VOID` token (ERC-20)
   - `PSX` token (ERC-20)

2. **Update contract addresses** in:
   - `118-integration/09-agency-ecosystem/land-system/land-parcel-manager.tsx`
   - `118-integration/09-agency-ecosystem/sku-system/sku-inventory-system.tsx`
   - `118-integration/09-agency-ecosystem/staking-system/xvoid-staking-vault.tsx`
   - `118-integration/09-agency-ecosystem/staking-system/psx-pledging-system.tsx`
   - `src/lib/token-config.ts`

Search for `0x0000000000000000000000000000000000000000` and replace with actual deployed addresses.

### Jukebox & Tipping Contracts

**From void2 (already deployed on Base mainnet):**
- Jukebox: `0x5026a8ff0CF9c29CDd17661a2E09Fd3417c05311`
- Tipping: `0xfD81b26d6a2F555E3B9613e478FD0DF27d3a168C`

You can:
- **Option A**: Reuse existing contracts (tested in production)
- **Option B**: Deploy your own versions (fork from void2)

Update addresses in:
- `118-integration/01-jukebox-system/jukebox-contract.ts`
- `118-integration/02-tipping-system/tipping-contract.ts`

---

## 📝 Feature-Specific Requirements

### 01-jukebox-system

**Backend Routes Needed:**
- `GET /api/jukebox/queue`
- `POST /api/jukebox/add`
- `GET /api/jukebox/price`
- `GET /api/jukebox/server-time`
- `POST /api/jukebox/skip`

**External APIs:**
- YouTube Data API v3 key (for video metadata)

**Database Tables:**
- `jukebox_queue`

**Environment Variables:**
```bash
YOUTUBE_API_KEY=your_youtube_api_key
JUKEBOX_CONTRACT_ADDRESS=0x5026...
```

### 02-tipping-system

**Backend Routes Needed:**
- `GET /api/tips/received`
- `GET /api/tips/sent`

**Required Files:**
- `src/lib/token-config.ts` (see above)

**Database Tables:**
- `tips`

**Environment Variables:**
```bash
TIPPING_CONTRACT_ADDRESS=0xfD81...
```

### 03-housing-system

**Backend Routes Needed:**
- `GET /api/houses/:address`
- `POST /api/houses/save`

**Database Tables:**
- `houses`

**IPFS/Storage:**
- Optional: IPFS for storing house images
- Or use base64 data URLs (simpler)

### 04-smart-wallet

**Backend Routes Needed:**
- `GET /api/wallet/is-new`
- `POST /api/wallet/complete-onboarding`
- `POST /api/session/login`

**External APIs:**
- Coinbase Developer Platform (CDP) project ID

**Environment Variables:**
```bash
NEXT_PUBLIC_CDP_PROJECT_ID=your_coinbase_project_id
```

### 05-mobile-controls

**118 Version Requires:**
- `src/contexts/mobile-layout-context.tsx`
- `src/utils.ts` (cn function)
- Ring Blast action handler (if using)

**LAME Version (web3-infrastructure):**
- Self-contained, no extra dependencies
- Only requires callback props

**Choose one version** based on your needs.

### 06-ui-sounds

**Dependencies:**
- Web Audio API (built-in browser)
- No backend required ✅

**Environment Variables:**
None required.

### 07-proximity-chat

**Backend Routes Needed:**
- WebSocket server for real-time chat
- `POST /api/chat/message`
- `GET /api/chat/history`

**Database Tables:**
- `chat_messages`

**WebSocket Implementation:**
```typescript
// server/websocket.ts
import { WebSocketServer } from 'ws';

const wss = new WebSocketServer({ port: 8080 });

wss.on('connection', (ws) => {
  ws.on('message', (data) => {
    const message = JSON.parse(data.toString());
    // Broadcast to nearby players based on position
    broadcast(message, message.position);
  });
});
```

### 09-agency-ecosystem

**Backend Routes Needed:**
- `GET /api/land/parcels`
- `GET /api/land/owned/:address`
- `GET /api/sku/marketplace`
- `GET /api/sku/owned/:address`
- `POST /api/staking/stake`
- `POST /api/staking/unstake`

**Required Files:**
- `src/lib/token-config.ts`
- All 5 smart contracts deployed

**Database Tables:**
- `land_parcels`
- `sku_inventory`
- `staking_positions`
- `psx_pledges`

**Environment Variables:**
```bash
NEXT_PUBLIC_LAND_REGISTRY_ADDRESS=0x...
NEXT_PUBLIC_HOOK_ROUTER_ADDRESS=0x...
NEXT_PUBLIC_SKU_REGISTRY_ADDRESS=0x...
NEXT_PUBLIC_XVOID_VAULT_ADDRESS=0x...
NEXT_PUBLIC_PSX_PLEDGE_VAULT_ADDRESS=0x...
NEXT_PUBLIC_VOID_TOKEN_ADDRESS=0x...
NEXT_PUBLIC_PSX_TOKEN_ADDRESS=0x...
```

---

## ✅ Quick Integration Checklist

Before attempting to run ANY feature from this package, verify:

### Phase 1: Environment Setup
- [ ] Node.js 18+ installed
- [ ] TypeScript 5+ installed
- [ ] Tailwind CSS configured
- [ ] Path aliases configured in tsconfig.json/vite.config.ts

### Phase 2: UI Dependencies
- [ ] shadcn/ui initialized and components installed
- [ ] `src/lib/utils.ts` created with `cn` function
- [ ] clsx and tailwind-merge installed

### Phase 3: Web3 Setup
- [ ] Wagmi configured (`src/lib/wagmi-config.ts`)
- [ ] WagmiConfig provider wrapped around app
- [ ] Token config created (`src/lib/token-config.ts`)
- [ ] Coinbase CDP project ID obtained (for smart wallet)

### Phase 4: Backend Implementation
- [ ] Express server created (or Next.js API routes)
- [ ] All required API routes implemented (see Backend Server Requirements)
- [ ] PostgreSQL database set up
- [ ] Database schema created
- [ ] WebSocket server for proximity chat (if using)

### Phase 5: Smart Contracts
- [ ] Agency ecosystem contracts deployed (if using)
- [ ] Contract addresses updated in all `.tsx` files
- [ ] Jukebox/Tipping contract addresses updated
- [ ] Token addresses updated in `token-config.ts`

### Phase 6: Environment Variables
- [ ] `.env` file created with all required variables
- [ ] API keys obtained (YouTube, CDP, etc.)
- [ ] Contract addresses added
- [ ] Database connection string configured

### Phase 7: Testing
- [ ] Run `npm install` to install all dependencies
- [ ] Run `npm run dev` to start dev server
- [ ] Test each feature individually
- [ ] Check browser console for 404 errors (missing backend routes)
- [ ] Check for TypeScript errors (missing imports)

---

## 🚨 Common Integration Failures

### Error: "Cannot find module '@/components/ui/button'"

**Solution:**
```bash
npx shadcn-ui@latest add button
```

### Error: "Cannot find module '@/lib/token-config'"

**Solution:** Create `src/lib/token-config.ts` as shown above.

### Error: "404 Not Found: /api/session/login"

**Solution:** Implement the backend Express routes (see Backend Server Requirements).

### Error: "Cannot read property 'cn' of undefined"

**Solution:** Create `src/lib/utils.ts` with the `cn` function.

### Error: Contract interaction fails with 0x000... address

**Solution:** Deploy smart contracts and update addresses in the component files.

### Error: "useToast is not a function"

**Solution:**
```bash
npx shadcn-ui@latest add toast
```

---

## 📚 Additional Resources

- **shadcn/ui Installation**: https://ui.shadcn.com/docs/installation
- **Wagmi Documentation**: https://wagmi.sh/
- **Vite Path Aliases**: https://vitejs.dev/config/shared-options.html#resolve-alias
- **Express.js Guide**: https://expressjs.com/en/guide/routing.html
- **Coinbase Developer Platform**: https://portal.cdp.coinbase.com/

---

## 🤝 Support

If you encounter issues not covered in this guide:

1. Check that ALL prerequisites are met (use checklist above)
2. Search for the error message in this document
3. Verify backend routes are implemented and returning correct data
4. Check browser console and network tab for API errors
5. Ensure smart contracts are deployed and addresses are updated

---

**Last Updated:** November 8, 2025  
**Package Version:** 1.0.0  
**Compatibility:** React 18+, TypeScript 5+, Wagmi 2+
