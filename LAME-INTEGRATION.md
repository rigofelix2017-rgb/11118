# LAME Package Integration Documentation

This document describes the integration of the "lame" repository infrastructure package into the VOID Metaverse.

## Overview

The VOID Metaverse has been enhanced with modular Web3 infrastructure components from the [lame repository](https://github.com/rigofelix2017-rgb/lame). These components provide a sophisticated onboarding experience, advanced mobile controls, and robust multiplayer networking.

## Integrated Features

### 1. Enhanced Intro System

**Location:** `components/intro/`

**Components:**
- `IntroSequence.tsx` - Main orchestrator with localStorage persistence
- `EpilepsyWarning.tsx` - Photosensitivity warning screen
- `ConsciousnessPuzzle.tsx` - Interactive puzzle minigame
- `VOIDSplash.tsx` - Dramatic splash screen with glitch effects

**Features:**
- Multi-stage onboarding flow
- Interactive consciousness-gathering puzzle (click 12 cells to proceed)
- Cookie persistence to skip intro for returning users
- Photosensitivity warning for accessibility compliance
- Dramatic animations and visual effects

**Usage:**
\`\`\`tsx
import { IntroSequence } from "@/components/intro/IntroSequence"

<IntroSequence onComplete={() => setIntroComplete(true)} />
\`\`\`

**Flow:**
1. Epilepsy Warning → User must acknowledge
2. Consciousness Puzzle → Interactive minigame
3. VOID Splash → 4-second animated logo
4. Main App → localStorage marks as completed

---

### 2. Advanced Mobile Controls

**Location:** `components/mobile-touch-controls.tsx`

**Features:**
- Virtual joystick with visual feedback
- Safe area support for iOS notch and home indicator
- Keyboard detection with automatic UI adjustment
- Landscape mode optimization
- Multiple quick-access buttons (sprint, action, map, chat)
- Enhanced touch handling with proper event cancellation

**New Hooks:**
- `hooks/use-safe-area.ts` - Detects safe area insets
- `hooks/use-keyboard-height.ts` - Monitors virtual keyboard state
- `hooks/use-orientation.ts` - Tracks device orientation

**Usage:**
\`\`\`tsx
import { MobileTouchControls } from "@/components/mobile-touch-controls"
import { useSafeArea } from "@/hooks/use-safe-area"

const safeArea = useSafeArea()
<MobileTouchControls onMove={handleMove} onSprint={handleSprint} visible={isMobile} />
\`\`\`

**Responsive Behavior:**
- Portrait: Compact controls, some UI hidden
- Landscape: Expanded controls, all features visible
- Keyboard open: Controls shift up automatically
- iOS safe areas: Respects notch and home indicator

---

### 3. Enhanced WebSocket Infrastructure

**Location:** `lib/websocket/`

**Components:**
- `types.ts` - Comprehensive message type definitions
- `client.ts` - Robust WebSocket client with reconnection

**Features:**
- Typed message system for type safety
- Automatic reconnection with exponential backoff
- Heartbeat monitoring to detect dead connections
- Message queue processing
- Connection state management
- Event-based message handlers

**Message Types:**
- `player:update` - Player position/rotation updates
- `player:join` - New player connected
- `player:leave` - Player disconnected
- `chat:message` - Chat messages (global, proximity, zone)
- `system:init` - Initial connection data
- `system:heartbeat` - Connection health check
- `system:error` - Error notifications

**Usage:**
\`\`\`tsx
import { getWebSocketClient } from "@/lib/websocket/client"
import type { PlayerUpdateMessage } from "@/lib/websocket/types"

const ws = getWebSocketClient({
  url: "ws://localhost:8080",
  reconnectAttempts: 5,
  heartbeatInterval: 30000,
})

ws.on("player:update", (msg) => {
  const update = msg as PlayerUpdateMessage
  console.log("Player moved:", update.playerId, update.position)
})

ws.connect()
\`\`\`

**Configuration:**
\`\`\`typescript
type WebSocketConfig = {
  url: string
  reconnectAttempts?: number // Default: 5
  reconnectDelay?: number // Default: 3000ms
  heartbeatInterval?: number // Default: 30000ms
  messageQueueSize?: number // Default: 100
}
\`\`\`

---

## Migration from Original System

### Before (Original)
\`\`\`typescript
// Basic WebSocket with manual reconnection
const ws = new WebSocket(url)
ws.onmessage = (e) => {
  const msg = JSON.parse(e.data)
  // No typing, manual handling
}
\`\`\`

### After (Enhanced)
\`\`\`typescript
// Typed WebSocket with automatic reconnection
const ws = getWebSocketClient({ url })
ws.on("player:update", (msg: PlayerUpdateMessage) => {
  // Fully typed, automatic handling
})
ws.connect()
\`\`\`

---

## Architecture Patterns

### 1. Intro System
- **Pattern:** State machine with localStorage persistence
- **State Flow:** disconnected → warning → puzzle → splash → complete
- **Persistence:** `localStorage.getItem("void_intro_seen")`

### 2. Mobile Controls
- **Pattern:** Responsive hooks + composition
- **Adaptation:** Safe areas + keyboard + orientation
- **Touch Handling:** Proper event prevention and cleanup

### 3. WebSocket Client
- **Pattern:** Singleton with event emitters
- **Reconnection:** Exponential backoff (3s, 6s, 9s, 12s, 15s)
- **Health Check:** Heartbeat every 30s, timeout if no response for 60s

---

## Environment Variables

\`\`\`env
# WebSocket multiplayer server URL
NEXT_PUBLIC_MULTIPLAYER_WS_URL=ws://localhost:8080

# Optional: Custom heartbeat interval (ms)
NEXT_PUBLIC_WS_HEARTBEAT_INTERVAL=30000
\`\`\`

---

## Testing the Integration

### 1. Test Intro Sequence
1. Clear localStorage: `localStorage.removeItem("void_intro_seen")`
2. Refresh page
3. Complete all intro stages
4. Verify localStorage is set
5. Refresh again - intro should be skipped

### 2. Test Mobile Controls
1. Open Chrome DevTools
2. Toggle device toolbar (Cmd+Shift+M)
3. Select iPhone 14 Pro (has notch)
4. Verify joystick respects safe areas
5. Rotate to landscape - verify controls adapt
6. Focus input field - verify keyboard detection

### 3. Test WebSocket
1. Start local WebSocket server on port 8080
2. Open app in multiple tabs
3. Move character in one tab
4. Verify position updates in other tabs
5. Disconnect server - verify reconnection attempts
6. Monitor console for heartbeat logs

---

## Performance Considerations

### Intro System
- **Bundle Size:** +12KB (gzipped)
- **Runtime:** Single render, removed after completion
- **Optimization:** localStorage check prevents unnecessary renders

### Mobile Controls
- **Touch Events:** Uses `passive: false` for joystick only
- **RAF Throttling:** Position updates limited to 60fps
- **Memory:** Cleanup on unmount prevents leaks

### WebSocket
- **Message Rate:** Position updates throttled to 20Hz (50ms)
- **Queue Processing:** Batched at 60fps to prevent blocking
- **Reconnection:** Exponential backoff prevents server spam

---

## Future Enhancements

### Potential Additions from "lame"
1. **Onchain Integrations**
   - Tipping contract for player-to-player tips
   - Jukebox contract for music voting
   - Blockchain event listeners

2. **Advanced Chat**
   - Voice chat via WebRTC
   - Chat bubbles above players
   - Emoji reactions

3. **Coinbase CDP Wallet**
   - Embedded wallet integration
   - Signature verification
   - Dev mode bypass

---

## Troubleshooting

### Intro Stuck on Puzzle
- Check browser console for errors
- Verify all 12 cells are clickable
- Clear localStorage and try again

### Mobile Controls Not Responsive
- Check safe area insets in DevTools
- Verify `use-mobile` hook returns true
- Test on actual device (simulator may differ)

### WebSocket Not Connecting
- Verify server is running on correct port
- Check CORS settings on server
- Look for connection errors in console
- Verify `NEXT_PUBLIC_MULTIPLAYER_WS_URL` is set

### Reconnection Loop
- Check server health
- Verify heartbeat responses are sent
- Increase `reconnectDelay` if server is slow

---

## Credits

Original infrastructure package: [rigofelix2017-rgb/lame](https://github.com/rigofelix2017-rgb/lame)

Integrated into VOID Metaverse with adaptations for:
- Next.js 16 app router
- React 19 features
- Existing multiplayer system
- Y2K/cyberpunk design system

---

## Support

For issues related to the lame integration:
1. Check this documentation first
2. Review console logs for errors
3. Test in isolation (create minimal repro)
4. Consult original lame repository docs

---

Last Updated: 2025
Integration Version: 1.0.0
