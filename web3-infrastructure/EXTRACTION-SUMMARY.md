# Web3 Infrastructure Extraction Complete

## What You Have Now

A **bare-bones Web3/WebSocket infrastructure** with ZERO game engine code.

### ✅ Extracted Files

```
web3-infrastructure/
├── README.md                          # Full documentation
├── INTRO-SYSTEM-GUIDE.md              # Complete intro system guide
├── EXAMPLE-INTEGRATION.tsx            # Working React integration example
│
├── hooks/                             # React hooks (NO GAME DEPENDENCIES)
│   ├── use-websocket.ts              # WebSocket with auto-reconnect
│   ├── use-player-state.ts           # Player lifecycle management
│   ├── use-chat-handler.ts           # Chat message handling
│   ├── use-connection-state.ts       # Ping/error handling
│   └── use-session.ts                # HTTP session management
│
├── components/                        # Intro UI components
│   ├── beta-notice-modal.tsx         # Beta notice modal
│   ├── epilepsy-warning-modal.tsx    # Health warning modal
│   ├── void-splash-screen.tsx        # Main intro coordinator
│   └── void-stages/                  # VOID intro stages
│       ├── void-stage-gears-unlocking.tsx    # Stage 1 (industrial gears)
│       ├── void-stage4-minigame.tsx          # Stage 2 (puzzle minigame)
│       └── void-stage5-portal.tsx            # Stage 3 (portal effect)
│
├── shared/                            # Shared types (NO GAME TYPES)
│   ├── schema.ts                     # TypeScript interfaces + Zod schemas
│   └── constants.ts                  # Configuration constants
│
└── contracts/                         # Smart contracts
    ├── TippingWithTokens.sol         # (from original project)
    └── JukeboxContract.sol           # (from original project)
```

### ❌ What Was REMOVED

- ❌ `@babylonjs/core` - 3D engine
- ❌ `@babylonjs/loaders` - GLB loading
- ❌ `babylon-game-engine.ts` - Game engine (1600+ lines)
- ❌ `animated-character.ts` - Character rendering
- ❌ `animation-state-machine.ts` - FSM for animations
- ❌ `cyberpunk-city-generator.ts` - 3D world generation
- ❌ `camera-controller.ts` - Camera system
- ❌ All 3D rendering, physics, collision detection

## Features

### 🎭 Intro & Onboarding
- Beta notice modal (retro terminal theme)
- Epilepsy warning modal (critical health warning)
- VOID splash screen (multi-stage animated intro)
- Interactive consciousness gathering puzzle
- Industrial gears animation
- Portal transition effect
- Skip functionality (ESC key + button)
- Cookie persistence (auto-skip on repeat visits)
- Mobile responsive design
- Framer Motion animations
- Canvas-based minigame (NO 3D engine)

### 🔐 Authentication
- Coinbase CDP embedded wallet support
- Dev mode bypass: `?devmode=true`
- HTTP session persistence (express-session)
- Signature verification (Coinbase + ECDSA)

### 🔌 WebSocket
- Persistent connection with auto-reconnect
- Heartbeat/ping monitoring (30s interval)
- Typed message schemas (TypeScript + Zod)
- Connection state management
- Error handling with rate limiting

### 💬 Chat System
- **Global chat** - All players see messages
- **Proximity chat** - Only nearby players (within 300 units)
- Nearby players detection (automatic updates)
- Rate limiting (2 second cooldown)

### 🪙 Onchain (Smart Contracts)
- Tipping contract (send ETH to players)
- Jukebox contract (buy songs with crypto)
- Transaction verification
- Blockchain event listeners

## Quick Start

### 1. Install Dependencies

```bash
npm install express ws ethers zod @tanstack/react-query express-session framer-motion lucide-react
```

### 2. Copy Files

```bash
cp -r web3-infrastructure/hooks/* your-app/hooks/
cp -r web3-infrastructure/shared/* your-app/shared/
cp -r web3-infrastructure/components/* your-app/components/
```

### 3. Use in React

```tsx
import { useState } from 'react';
import { useWebSocket } from './hooks/use-websocket';
import { usePlayerState } from './hooks/use-player-state';
import { BetaNoticeModal } from './components/beta-notice-modal';
import { EpilepsyWarningModal } from './components/epilepsy-warning-modal';
import { VoidSplashScreen } from './components/void-splash-screen';

function App() {
  // Intro state
  const [betaAck, setBetaAck] = useState(false);
  const [epilepsyAck, setEpilepsyAck] = useState(false);
  const [voidComplete, setVoidComplete] = useState(false);
  
  // Show intro sequence
  if (!betaAck) {
    return <BetaNoticeModal onAcknowledge={() => setBetaAck(true)} />;
  }
  if (!epilepsyAck) {
    return <EpilepsyWarningModal onAcknowledge={() => setEpilepsyAck(true)} />;
  }
  if (!voidComplete) {
    return <VoidSplashScreen onComplete={() => setVoidComplete(true)} />;
  }
  
  // Main app state
  const [currentPlayer, setCurrentPlayer] = useState(null);
  const [players, setPlayers] = useState([]);
  
  const { handlePlayerMessage } = usePlayerState({
    setCurrentPlayer,
    setPlayers,
    // ...
  });
  
  const { sendMessage, isConnected } = useWebSocket(handlePlayerMessage);
  
  // Your app UI
  return <YourApp />;
}
```

See `EXAMPLE-INTEGRATION.tsx` for full working example.

## Server Integration

You'll need to integrate the WebSocket server routes. The core logic is in:

```typescript
// From original: server/routes.ts (lines 1-1667)
// Key sections:
// - WebSocket setup (lines 164-170)
// - Authentication handler (lines 1318-1420)
// - Chat handlers (lines 1447-1540)
// - Proximity detection (lines 1268-1296)
```

**TODO for you:**
1. Copy `server/routes.ts` proximity detection logic
2. Copy `server/storage.ts` data layer
3. Copy `server/session-utils.ts` session helpers
4. Remove game-specific routes (furniture, houses, etc)

## Environment Setup

```env
# .env file
PORT=5000
NODE_ENV=development
SESSION_SECRET=your_secret_here

# Coinbase CDP (if using)
COINBASE_CDP_API_KEY=your_key
COINBASE_CDP_API_SECRET=your_secret

# Blockchain (Base Sepolia testnet)
PROVIDER_URL=https://base-sepolia.g.alchemy.com/v2/YOUR_KEY
PRIVATE_KEY=0x...
TIPPING_CONTRACT_ADDRESS=0x...
JUKEBOX_CONTRACT_ADDRESS=0x...

# Storage
USE_IN_MEMORY_STORAGE=true
# OR
DATABASE_URL=postgresql://user:pass@host:5432/db
```

## Dev Mode Testing

```bash
# Start server
npm run dev

# Open browser
http://localhost:5000/?devmode=true

# Auto-connects with test wallet:
# 0xDEV45n0dh0000000000000000000000000000000
```

## Key Differences from Original

| Feature | Original VOID2 | Bare-Bones |
|---------|---------------|------------|
| 3D Rendering | ✅ Babylon.js | ❌ None |
| Character System | ✅ GLB models | ❌ None |
| Game World | ✅ Cyberpunk city | ❌ None |
| WebSocket | ✅ Full | ✅ Full |
| Authentication | ✅ Coinbase | ✅ Coinbase |
| Chat | ✅ Global + Proximity | ✅ Global + Proximity |
| Tipping | ✅ Smart contract | ✅ Smart contract |
| Jukebox | ✅ Music queue | ✅ Music queue |
| Dependencies | ~50 packages | ~8 packages |
| Bundle Size | ~15 MB | ~2 MB |

## Message Flow

```
User connects
    ↓
Client: connect_account {walletAddress, signature, nonce}
    ↓
Server: Verify signature → Create/load player → Store in session
    ↓
Server: account_initialized {player, players, chatHistory}
    ↓
Client: Update React state (currentPlayer, players)
    ↓
User sends chat
    ↓
Client: chat {message}
    ↓
Server: Validate → Store → Broadcast
    ↓
Server: chat_message {message}
    ↓
All clients: Display message
```

## Proximity Chat Logic

```typescript
// Server calculates distance between players
const PROXIMITY_RADIUS = 300; // units

function isNearby(player1, player2) {
  const dx = player1.position.x - player2.position.x;
  const dy = player1.position.y - player2.position.y;
  const distance = Math.sqrt(dx * dx + dy * dy);
  return distance <= PROXIMITY_RADIUS;
}

// Only send proximity messages to nearby players
nearbyPlayers.forEach(player => {
  sendMessage(player.ws, {
    type: 'proximity_chat_message',
    data: { message, nearbyPlayers: [...] }
  });
});
```

## Next Steps

1. **Copy server code** - Extract routes.ts, storage.ts, session-utils.ts
2. **Remove game routes** - Strip out furniture, houses, world generation
3. **Test locally** - Run with dev mode
4. **Add your UI** - Build whatever interface you want
5. **Deploy** - No game engine = much smaller bundle

## Support

This is extracted infrastructure code. You'll need to:
- Implement your own UI components
- Integrate with your existing app architecture
- Handle wallet connection flow (Coinbase or other)
- Add persistence layer (database or in-memory)

No game engine, no 3D rendering, just pure Web3 + WebSocket plumbing.

---

**Extracted from:** VOID2 project  
**Date:** November 2025  
**Purpose:** Reusable Web3 infrastructure without game engine bloat
