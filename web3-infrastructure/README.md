# Web3 Infrastructure Package

**Bare-bones Web3/WebSocket infrastructure extracted from VOID2**

This package contains ONLY the authentication, WebSocket, and onchain integration code - **NO game engine, NO 3D rendering, NO Babylon.js**.

## What's Included

### ✅ Base Chain Integration 🔵
- WalletConnect v2 (300+ wallet support)
- Base Mainnet & Sepolia support
- OnchainKit components (official Base devkit)
- Paymaster service (gasless transactions)
- Smart wallet support (ERC-4337)
- Coinbase Smart Wallet integration
- Network detection & switching

### ✅ Intro & Onboarding
- Beta notice modal (retro terminal theme)
- Epilepsy warning modal (health & safety)
- VOID splash screen (multi-stage animated intro)
- Interactive consciousness gathering puzzle
- Skip functionality (ESC key + button)
- Cookie persistence (skip on repeat visits)

### ✅ Mobile Controls 📱
- Virtual joystick (smooth 360° movement)
- Action buttons (customizable touch controls)
- Safe area support (iPhone notch, home indicator)
- Keyboard detection (auto-layout adjustment)
- Performance mode (optimized for mobile)
- Overlay management (hide controls when menus open)

### ✅ Authentication & Sessions
- Coinbase CDP embedded wallet integration
- Dev mode bypass (`?devmode=true`)
- HTTP session management (express-session)
- Signature verification (Coinbase + ECDSA)

### ✅ WebSocket Infrastructure
- Persistent WebSocket connection with auto-reconnect
- Heartbeat/ping monitoring
- Message typing (client/server schemas)
- Connection state management

### ✅ Proximity Chat System
- Global chat (all players)
- Proximity chat (nearby players only)
- Nearby players detection
- Chat rate limiting

### ✅ Onchain Integrations
- Tipping contract (send ETH to other players)
- Jukebox contract (purchase songs with cryptocurrency)
- Blockchain event listeners
- Transaction verification

### ✅ UI Screens
- Beta notice
- Epilepsy warning
- VOID intro animation
- Connection status screens

## What's NOT Included

❌ Babylon.js 3D engine  
❌ Character rendering system  
❌ Game world/city generation  
❌ Animation state machines  
❌ Camera controllers  
❌ Physics/collision detection  

## File Structure

```
web3-infrastructure/
├── hooks/                    # React hooks for Web3/WebSocket
│   ├── use-websocket.ts     # WebSocket connection hook
│   ├── use-player-state.ts  # Player state management
│   ├── use-chat-handler.ts  # Chat message handling
│   ├── use-connection-state.ts
│   ├── use-session.ts       # Session management
│   └── use-mobile.tsx       # 📱 Mobile detection (768px breakpoint)
├── components/              # UI components (NO GAME ENGINE)
│   ├── beta-notice-modal.tsx        # Beta notice
│   ├── epilepsy-warning-modal.tsx   # Health warning
│   ├── void-splash-screen.tsx       # Intro coordinator
│   ├── mobile-controls.tsx          # 📱 Virtual joystick + action buttons
│   └── void-stages/                 # VOID intro stages
│       ├── void-stage-gears-unlocking.tsx    # Stage 1
│       ├── void-stage4-minigame.tsx          # Stage 2 (puzzle)
│       └── void-stage5-portal.tsx            # Stage 3
├── contexts/                # React contexts
│   └── mobile-layout-context.tsx    # 📱 Mobile layout, safe areas, keyboard detection
├── server/
│   ├── routes.ts            # WebSocket + HTTP routes (cleaned)
│   ├── storage.ts           # Data persistence layer
│   └── session-utils.ts     # Session helpers
├── shared/
│   ├── schema.ts            # TypeScript types (no game types)
│   └── constants.ts         # Config constants
├── components/
│   ├── intro-screens/       # Beta, epilepsy, VOID intro
│   └── connection-splash/   # Connection UI
└── contracts/               # Smart contracts
    ├── TippingWithTokens.sol
    └── JukeboxContract.sol
```

## Usage

This is infrastructure code you can integrate into ANY React/Express app:

1. **Drop in the hooks** - use them in your React components
2. **Add server routes** - integrate WebSocket/HTTP endpoints
3. **Connect wallet** - Coinbase CDP or any EVM wallet
4. **Send messages** - use typed WebSocket communication

No game engine required. No 3D rendering. Just Web3 + sockets.

## Key Features

### Dev Mode Bypass
```typescript
// URL: http://localhost:5000/?devmode=true
// Auto-creates test wallet: 0xDEV45n0dh0000000000000000000000000000000
```

### WebSocket Messages
```typescript
// Client -> Server
{ type: 'connect_account', data: { walletAddress, signature, nonce } }
{ type: 'chat', data: { message: 'Hello!' } }
{ type: 'proximity_chat', data: { message: 'Nearby message' } }
{ type: 'move', data: { position: { x: 100, y: 200 } } }

// Server -> Client
{ type: 'account_initialized', data: { player, players, chatHistory } }
{ type: 'user_joined', data: { player } }
{ type: 'chat_message', data: { message } }
{ type: 'proximity_update', data: { nearbyPlayers: ['id1', 'id2'] } }
```

### Proximity Detection
```typescript
// Server calculates distance between players
// Players within PROXIMITY_RADIUS see each other's messages
const PROXIMITY_RADIUS = 300; // pixels/units
```

### Onchain Tipping
```typescript
// Tip another player with ETH
const tx = await tipPlayer(recipientAddress, amount);
// Server verifies transaction on blockchain
// Triggers tip animation (you provide your own UI)
```

## Dependencies

**Minimal dependencies - no game engine bloat:**

```json
{
  "dependencies": {
    "express": "^4.18.2",
    "ws": "^8.16.0",
    "ethers": "^6.10.0",
    "express-session": "^1.18.0",
    "zod": "^3.22.4",
    "@tanstack/react-query": "^5.17.19",
    "framer-motion": "^11.0.0",
    "lucide-react": "^0.320.0"
  }
}
```

**NOT NEEDED:**
- ❌ `@babylonjs/core`
- ❌ `@babylonjs/loaders`
- ❌ `@babylonjs/materials`
- ❌ Any 3D rendering libraries

## Environment Variables

```env
# Wallet & Auth
COINBASE_CDP_API_KEY=your_key_here
COINBASE_CDP_API_SECRET=your_secret_here

# Session
SESSION_SECRET=your_secret_here

# Blockchain
PROVIDER_URL=https://base-sepolia.g.alchemy.com/v2/YOUR_KEY
PRIVATE_KEY=0x...
TIPPING_CONTRACT_ADDRESS=0x...
JUKEBOX_CONTRACT_ADDRESS=0x...

# Storage
USE_IN_MEMORY_STORAGE=true  # or set DATABASE_URL
```

## Integration Example

```typescript
// Your React component
import { useWebSocket } from './hooks/use-websocket';
import { usePlayerState } from './hooks/use-player-state';

function MyApp() {
  const [currentPlayer, setCurrentPlayer] = useState(null);
  const [players, setPlayers] = useState([]);
  
  const { handlePlayerMessage } = usePlayerState({
    setCurrentPlayer,
    setPlayers,
    // ... other handlers
  });
  
  const { sendMessage, isConnected } = useWebSocket(handlePlayerMessage);
  
  // Connect wallet
  const handleConnect = async () => {
    const wallet = await yourWalletLogic();
    sendMessage({
      type: 'connect_account',
      data: { 
        walletAddress: wallet.address,
        signature: wallet.signature,
        nonce: wallet.nonce
      }
    });
  };
  
  return <YourUI />;
}
```

## 📱 Mobile Support

Complete touch controls with virtual joystick and action buttons. See **[MOBILE-CONTROLS-GUIDE.md](./MOBILE-CONTROLS-GUIDE.md)** for full documentation.

```tsx
import { MobileLayoutProvider } from './contexts/mobile-layout-context';
import { MobileControls } from './components/mobile-controls';

<MobileLayoutProvider>
  <YourApp />
  <MobileControls
    onMove={(direction) => handleMove(direction)}
    onInteract={() => console.log('Interact')}
    onAction={() => console.log('Action')}
  />
</MobileLayoutProvider>
```

**Features:**
- ✅ Smooth 360° joystick (left side)
- ✅ Customizable action buttons (right side)
- ✅ iPhone safe area support (notch, home indicator)
- ✅ Keyboard detection (auto-layout when typing)
- ✅ Auto-hidden on desktop (>768px)
- ✅ Overlay management (hide when menus open)

## 📚 Documentation

- **📘 [COMPLETE-PACKAGE.md](./COMPLETE-PACKAGE.md)** - Main comprehensive guide (START HERE)
- **[INTRO-SYSTEM-GUIDE.md](./INTRO-SYSTEM-GUIDE.md)** - Detailed intro system docs
- **📱 [MOBILE-CONTROLS-GUIDE.md](./MOBILE-CONTROLS-GUIDE.md)** - Mobile joystick & touch controls
- **[EXAMPLE-INTEGRATION.tsx](./EXAMPLE-INTEGRATION.tsx)** - Working example with intro
- **[EXTRACTION-SUMMARY.md](./EXTRACTION-SUMMARY.md)** - Technical details
- **[FILE-STRUCTURE.txt](./FILE-STRUCTURE.txt)** - Visual file tree

## 📚 Documentation

- **📘 [COMPLETE-PACKAGE.md](./COMPLETE-PACKAGE.md)** - Main comprehensive guide (START HERE)
- **🔵 [BASE-INTEGRATION-GUIDE.md](./BASE-INTEGRATION-GUIDE.md)** - WalletConnect + Base + Paymaster
- **[INTRO-SYSTEM-GUIDE.md](./INTRO-SYSTEM-GUIDE.md)** - Detailed intro system docs
- **📱 [MOBILE-CONTROLS-GUIDE.md](./MOBILE-CONTROLS-GUIDE.md)** - Mobile joystick & touch controls
- **[EXAMPLE-INTEGRATION.tsx](./EXAMPLE-INTEGRATION.tsx)** - Working example with intro
- **[EXAMPLE-BASE-INTEGRATION.tsx](./EXAMPLE-BASE-INTEGRATION.tsx)** - Complete Base chain example
- **[EXTRACTION-SUMMARY.md](./EXTRACTION-SUMMARY.md)** - Technical details
- **[FILE-STRUCTURE.txt](./FILE-STRUCTURE.txt)** - Visual file tree

## 🚀 Quick Start

### 1. Clone or Copy Files

```bash
git clone https://github.com/rigofelix2017-rgb/lame.git
cd lame
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Setup Environment Variables

```bash
cp .env.example .env.local
```

Edit `.env.local` and add your API keys:
- **WalletConnect Project ID**: https://cloud.walletconnect.com/
- **OnchainKit API Key**: https://portal.cdp.coinbase.com/
- **Paymaster Key**: Enable in Coinbase Developer Portal

### 4. Run the Example

```bash
npm run dev
```

Visit http://localhost:3000 and connect your wallet!

## License

MIT - extracted from VOID2 project
