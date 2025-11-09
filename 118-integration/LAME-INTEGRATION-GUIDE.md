# LAME Package Integration Guide

## Overview

The **LAME Package** (web3-infrastructure/) provides the foundation for Web3 integration in the 11118 ecosystem. It's a lightweight, battle-tested package extracted from void2 with **NO Babylon.js dependencies**.

**Repository**: https://github.com/rigofelix2017-rgb/lame

---

## What's Included

### Components
- ✅ **base-wallet-connect.tsx** - Base Mainnet wallet integration
- ✅ **beta-notice-modal.tsx** - Beta disclaimer (retro terminal style)
- ✅ **epilepsy-warning-modal.tsx** - Health warning modal
- ✅ **mobile-controls.tsx** - Touch joystick for mobile
- ✅ **void-splash-screen.tsx** - Complete intro orchestrator
- ✅ **gasless-transaction.tsx** - Paymaster integration
- ✅ **void-stages/** - 4 intro stages:
  - void-stage-gears-unlocking.tsx (1476 lines - terminal + gears)
  - void-stage1-awakening.tsx (interactive awakening)
  - void-stage4-minigame.tsx (consciousness fragments)
  - void-stage5-portal.tsx (transition effect)

### Hooks
- ✅ **use-websocket.ts** - WebSocket with auto-reconnect
- ✅ **use-player-state.ts** - Player lifecycle management
- ✅ **use-chat-handler.ts** - Chat message processing
- ✅ **use-connection-state.ts** - Ping/error/rate-limit handling
- ✅ **use-session.ts** - HTTP session management
- ✅ **use-mobile.tsx** - Mobile device detection

### Contexts
- ✅ **web3-providers.tsx** - Wagmi + RainbowKit + CDP providers
- ✅ **mobile-layout-context.tsx** - Keyboard detection, safe areas

### Library
- ✅ **wagmi-config.ts** - Wagmi 2+ setup for Base mainnet/testnet
- ✅ **paymaster-config.ts** - Coinbase Paymaster (gasless transactions)

### Shared
- ✅ **schema.ts** - TypeScript types for WebSocket messages
- ✅ **constants.ts** - Shared constants

---

## Installation

### Option 1: Direct Copy (Recommended)
```bash
# Copy web3-infrastructure from 11118 repo
cp -r web3-infrastructure/ /path/to/your-project/
```

### Option 2: Clone from LAME Repo
```bash
git clone https://github.com/rigofelix2017-rgb/lame.git
cd lame
cp -r * /path/to/your-project/web3-infrastructure/
```

---

## Dependencies

Install required packages:

```bash
npm install @coinbase/onchainkit \
  @coinbase/wallet-sdk \
  wagmi@^2.0.0 \
  viem@^2.0.0 \
  @tanstack/react-query \
  framer-motion \
  react@^18.0.0 \
  react-dom@^18.0.0
```

---

## Basic Integration

### 1. Wrap App with Providers

```tsx
// app/layout.tsx or pages/_app.tsx
import { Web3Providers } from '@/web3-infrastructure/contexts/web3-providers';
import '@coinbase/onchainkit/styles.css';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Web3Providers>
          {children}
        </Web3Providers>
      </body>
    </html>
  );
}
```

### 2. Add Intro Sequence

```tsx
// pages/game.tsx
import { useState } from 'react';
import { VoidSplashScreen } from '@/web3-infrastructure/components/void-splash-screen';
import { BaseWalletConnect } from '@/web3-infrastructure/components/base-wallet-connect';

export default function Game() {
  const [showIntro, setShowIntro] = useState(true);
  const [showWallet, setShowWallet] = useState(false);

  if (showIntro) {
    return (
      <VoidSplashScreen 
        onComplete={() => {
          setShowIntro(false);
          setShowWallet(true);
        }}
      />
    );
  }

  if (showWallet) {
    return (
      <BaseWalletConnect 
        onConnect={() => {
          setShowWallet(false);
          // Now show your game
        }}
      />
    );
  }

  return <YourGame />;
}
```

### 3. Add Mobile Controls

```tsx
// components/game-interface.tsx
import { MobileControls } from '@/web3-infrastructure/components/mobile-controls';
import { useIsMobile } from '@/web3-infrastructure/hooks/use-mobile';

export function GameInterface() {
  const isMobile = useIsMobile();

  return (
    <>
      {/* Your game UI */}
      
      {isMobile && (
        <MobileControls
          onMove={(position) => {
            // Update player position
            console.log('Mobile move:', position);
          }}
        />
      )}
    </>
  );
}
```

### 4. WebSocket Connection

```tsx
// hooks/use-game-connection.ts
import { useWebSocket } from '@/web3-infrastructure/hooks/use-websocket';
import { usePlayerState } from '@/web3-infrastructure/hooks/use-player-state';

export function useGameConnection() {
  const { isConnected, sendMessage } = useWebSocket(
    'ws://localhost:3001',
    ['player_update', 'chat_message']
  );

  const { handlePlayerMessage } = usePlayerState({
    setCurrentPlayer: (player) => console.log('Current player:', player),
    setPlayers: (players) => console.log('All players:', players),
    sendMessage
  });

  return { isConnected, sendMessage };
}
```

---

## Advanced Features

### Gasless Transactions (Paymaster)

```tsx
import { useGaslessTransaction } from '@/web3-infrastructure/components/gasless-transaction';

export function TippingButton() {
  const { sendGaslessTransaction, isLoading } = useGaslessTransaction();

  const handleTip = async () => {
    await sendGaslessTransaction({
      to: '0x...',
      value: parseEther('0.001'),
      functionName: 'tip',
      args: ['0x...']
    });
  };

  return (
    <button onClick={handleTip} disabled={isLoading}>
      Send Tip (Gasless)
    </button>
  );
}
```

### Session Management

```tsx
import { useSession } from '@/web3-infrastructure/hooks/use-session';

export function GameLoader() {
  const { session, isLoading, hasSession } = useSession();

  if (isLoading) {
    return <div>Checking session...</div>;
  }

  if (hasSession) {
    // Auto-reconnect with existing session
    return <Game sessionData={session} />;
  }

  // Show intro for new users
  return <IntroSequence />;
}
```

---

## Configuration

### Environment Variables

```env
# .env.local
VITE_WS_URL=ws://localhost:3001
VITE_ENABLE_TESTNET=true
VITE_CDP_PROJECT_ID=your_coinbase_project_id
```

### Wagmi Config Customization

```typescript
// lib/wagmi-config.ts
import { createConfig } from 'wagmi';
import { base, baseSepolia } from 'wagmi/chains';

const config = createConfig({
  chains: [base, baseSepolia],
  // ... rest of config
});
```

---

## Compatibility with 118-integration

### What's Different?

| Feature | LAME Package | 118-integration |
|---------|--------------|-----------------|
| Purpose | Foundation | Complete features |
| Size | Lightweight (~500KB) | Feature-rich (~2MB) |
| Dependencies | Minimal | Full stack |
| Babylon.js | ❌ None | ✅ Required |
| Mobile Controls | ✅ Basic | ✅ Enhanced |
| Intro System | ✅ Complete | ✅ Same |
| Jukebox | ❌ Not included | ✅ Complete |
| Tipping | ❌ Not included | ✅ Complete |
| Housing | ❌ Not included | ✅ Complete |
| Proximity Chat | ❌ Not included | ✅ Complete |

### Integration Strategy

**Option A: LAME Foundation + 118 Features**
```
1. Install LAME for foundation (wallet, intro, mobile)
2. Add 118-integration features on top
3. Best for: Full-featured applications
```

**Option B: LAME Only**
```
1. Use LAME as-is for lightweight integration
2. Add custom features as needed
3. Best for: Minimal Web3 integration
```

**Option C: 118-integration Only**
```
1. Install full 118-integration package
2. Includes everything
3. Best for: Complete metaverse experience
```

---

## Testing

### Run Intro Sequence Test

```bash
# In your project
npm run dev

# Navigate to /test-intro
# Should see: Beta Notice → Epilepsy Warning → Gears → Mini-game → Portal
```

### Test Mobile Controls

```bash
# Open on mobile device or use Chrome DevTools mobile emulation
# Should see joystick in bottom-left corner
```

### Test WebSocket Connection

```bash
# Start your WebSocket server
npm run server

# Open browser console
# Should see: "WebSocket connected" message
```

---

## Troubleshooting

### Issue 1: Intro Doesn't Show
**Cause**: Cookies already set from previous visit
**Fix**: Clear cookies or use incognito mode

### Issue 2: Mobile Controls Not Appearing
**Cause**: Device not detected as mobile
**Fix**: Check `useIsMobile()` hook, ensure viewport width < 768px

### Issue 3: WebSocket Connection Failed
**Cause**: Server not running or wrong URL
**Fix**: Check `VITE_WS_URL` environment variable

### Issue 4: Wagmi Provider Error
**Cause**: Missing OnchainKit or Wagmi dependencies
**Fix**: `npm install @coinbase/onchainkit wagmi@^2.0.0 viem@^2.0.0`

---

## Migration from void2

If you're migrating from void2:

1. **Remove Babylon.js imports** - LAME has none
2. **Update WebSocket hooks** - Use LAME versions
3. **Update mobile controls** - Use LAME component
4. **Keep your game logic** - LAME is just infrastructure

```typescript
// Before (void2)
import { MobileControls } from '@/components/mobile-controls';
import { useWebSocket } from '@/hooks/use-websocket';

// After (LAME)
import { MobileControls } from '@/web3-infrastructure/components/mobile-controls';
import { useWebSocket } from '@/web3-infrastructure/hooks/use-websocket';
```

---

## Production Deployment

### Checklist

- [ ] Set `VITE_ENABLE_TESTNET=false` for mainnet
- [ ] Configure Coinbase CDP Project ID
- [ ] Test intro sequence on production URL
- [ ] Verify cookies work (HTTPS, SameSite)
- [ ] Test mobile controls on real devices
- [ ] Check WebSocket connection to production server
- [ ] Enable error tracking (Sentry, etc.)

### Performance Optimization

```typescript
// Lazy load intro stages
const VoidStageGearsUnlocking = lazy(() => 
  import('@/web3-infrastructure/components/void-stages/void-stage-gears-unlocking')
);
```

---

## Examples

### Minimal Integration
See: `web3-infrastructure/EXAMPLE-INTEGRATION.tsx`

### Base Mainnet Integration
See: `web3-infrastructure/EXAMPLE-BASE-INTEGRATION.tsx`

### Full Integration with 118
See: `118-integration/examples/full-integration.tsx`

---

## Support

- **Issues**: https://github.com/rigofelix2017-rgb/lame/issues
- **Documentation**: `web3-infrastructure/README.md`
- **Mobile Controls Guide**: `web3-infrastructure/MOBILE-CONTROLS-GUIDE.md`
- **Intro System Guide**: `web3-infrastructure/INTRO-SYSTEM-GUIDE.md`

---

## Next Steps

1. ✅ Install LAME package
2. ✅ Wrap app with Web3Providers
3. ✅ Add intro sequence
4. ✅ Test on localhost
5. ✅ Add 118-integration features (if needed)
6. ✅ Deploy to production

---

**Status**: Production-ready
**Version**: 1.0.0 (Extracted from void2)
**License**: MIT
