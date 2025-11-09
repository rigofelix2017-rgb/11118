# Component Compatibility Matrix

## Overview

This document maps differences between the **lame package** (web3-infrastructure) and **118-integration package** to prevent integration conflicts.

---

## Package Comparison

| Aspect | lame (web3-infrastructure) | 118-integration |
|--------|---------------------------|-----------------|
| **Purpose** | Web3 foundation + mobile base | Full feature systems |
| **Size** | ~8 files | 34+ files |
| **Scope** | Wallet, intro, mobile controls | Jukebox, tipping, housing, agency ecosystem |
| **Dependencies** | Minimal | Extensive (backend, database, contracts) |
| **Self-Contained** | ✅ Yes | ❌ No (requires setup) |

---

## Component Version Differences

### 1. Mobile Controls ⚠️ CONFLICT RISK

**File:** `mobile-controls.tsx`

#### lame Version (web3-infrastructure/components/mobile-controls.tsx)
```typescript
// Lines 22-199: Self-contained, no external dependencies
interface MobileControlsProps {
  onMove: (direction: { x: number; y: number }) => void;
  onInteract?: () => void;
  onAction?: () => void;
}

// Simple component with callbacks only
// No styling utilities imported
// No additional actions
```

**Characteristics:**
- ✅ Self-contained
- ✅ No dependencies on app utilities
- ✅ Callback-based API
- ✅ Basic 3 actions: move, interact, action

---

#### 118 Version (118-integration/05-mobile-controls/mobile-controls.tsx)
```typescript
// Lines 18-299: Enhanced version with dependencies
import { cn } from '@/lib/utils'; // REQUIRES utils.ts
import { useMobileLayout } from '@/contexts/mobile-layout-context'; // REQUIRES context

interface MobileControlsProps {
  onMove: (direction: { x: number; y: number }) => void;
  onInteract?: () => void;
  onAction?: () => void;
  onRingBlast?: () => void; // NEW ACTION
  onMenuToggle?: () => void;
}

// Enhanced component with:
// - Ring Blast action button
// - Menu toggle button
// - Safe area insets
// - Keyboard detection
// - Improved styling with cn() utility
```

**Characteristics:**
- ❌ Requires `@/lib/utils` (cn function)
- ❌ Requires `@/contexts/mobile-layout-context`
- ✅ More actions (Ring Blast, Menu)
- ✅ Better keyboard handling
- ✅ iOS safe area support

---

### Migration Strategy: Mobile Controls

**Option A: Use lame version (simple)**
```typescript
// Use if you want:
// - No dependencies
// - Basic functionality only
// - Quick integration

import { MobileControls } from '@/web3-infrastructure/components/mobile-controls';

<MobileControls
  onMove={handleMove}
  onInteract={handleInteract}
  onAction={handleAction}
/>
```

**Option B: Use 118 version (enhanced)**
```typescript
// Use if you want:
// - Ring Blast feature
// - Better keyboard detection
// - iOS safe area support

// FIRST: Copy dependencies
// - shared-files/utils.ts → src/lib/utils.ts
// - shared-files/mobile-layout-context.tsx → src/contexts/mobile-layout-context.tsx

import { MobileControls } from '@/118-integration/05-mobile-controls/mobile-controls';

<MobileControls
  onMove={handleMove}
  onInteract={handleInteract}
  onAction={handleAction}
  onRingBlast={handleRingBlast} // NEW
  onMenuToggle={handleMenuToggle} // NEW
/>
```

**Option C: Hybrid approach**
```typescript
// Use lame version but add cn() utility
// Copy only utils.ts, skip mobile-layout-context

// In mobile-controls.tsx:
// Remove: import { useMobileLayout } from '@/contexts/mobile-layout-context';
// Keep: import { cn } from '@/lib/utils';
// Remove: Ring Blast and Menu buttons
```

---

## Shared Component Status

| Component | lame Package | 118-integration | Recommendation |
|-----------|-------------|-----------------|----------------|
| mobile-controls.tsx | ✅ Included | ✅ Included (enhanced) | **Use 118 if you need Ring Blast** |
| coinbase-auth.tsx | ✅ Included | ✅ Included (same) | Use either (identical) |
| wallet-connection.tsx | ✅ Included | ✅ Included (same) | Use either (identical) |
| intro-system.tsx | ✅ Included | ❌ Not included | Use lame version |
| jukebox.tsx | ❌ Not included | ✅ Included | Use 118 version |
| tipping-modal.tsx | ❌ Not included | ✅ Included | Use 118 version |
| housing-system.tsx | ❌ Not included | ✅ Included | Use 118 version |

---

## Unique to lame Package

### 1. Intro System
- **Files:** `intro-stages.tsx`, `void-intro-system.tsx`
- **Purpose:** VOID-themed onboarding flow
- **Status:** NOT in 118-integration
- **Action:** Use lame version if you want VOID intro

### 2. Session Management (Basic)
- **Files:** `use-session.ts`, `use-player-state.ts`
- **Purpose:** Simple session tracking
- **Status:** Different implementation in 118
- **Difference:** 
  - lame: Client-side only, localStorage
  - 118: Server-backed, database sessions

---

## Unique to 118-integration

### 1. Jukebox System
- **Files:** 4 files (jukebox.tsx, global-audio-player.tsx, etc.)
- **Purpose:** Onchain music player
- **Status:** NOT in lame
- **Dependencies:** Backend routes, YouTube API, smart contract

### 2. Tipping System
- **Files:** 3 files (tipping-modal.tsx, tips-management-modal.tsx, etc.)
- **Purpose:** Multi-token tipping
- **Status:** NOT in lame
- **Dependencies:** Backend routes, smart contract, token-config.ts

### 3. Housing System
- **Files:** 3 files (house-interior.tsx, furniture-shop.tsx, etc.)
- **Purpose:** Player homes with 2.5D editor
- **Status:** NOT in lame
- **Dependencies:** Backend routes, database

### 4. Agency Ecosystem
- **Files:** 10+ files (land, SKU, staking, contracts)
- **Purpose:** Complete creator economy
- **Status:** NOT in lame
- **Dependencies:** 5 smart contracts, extensive backend

### 5. Proximity Chat
- **Files:** 1 file (proximity-chat-interface.tsx)
- **Purpose:** Distance-based chat
- **Status:** NOT in lame
- **Dependencies:** WebSocket server, backend routes

### 6. UI Sounds
- **Files:** 2 files (synth-audio-engine.ts, use-ui-sounds.ts)
- **Purpose:** Web Audio synthesis
- **Status:** NOT in lame
- **Dependencies:** None (self-contained)

---

## Integration Scenarios

### Scenario 1: Use Both Packages ✅ RECOMMENDED

**Why:** Get best of both worlds
- lame: Foundation (wallet, intro, basic mobile)
- 118: Features (jukebox, tips, housing)

**Steps:**
```bash
# 1. Install lame package
npm install @your-org/web3-infrastructure

# 2. Copy 118-integration features
cp -r 118-integration/01-jukebox-system src/components/
cp -r 118-integration/02-tipping-system src/components/
# ... etc

# 3. Use lame's intro system
import { VoidIntroSystem } from '@/web3-infrastructure/components/void-intro-system';

# 4. Use 118's features
import { Jukebox } from '@/components/01-jukebox-system/jukebox';
```

**Conflicts to Watch:**
- ⚠️ Both have `mobile-controls.tsx` → Choose one version
- ⚠️ Both have `use-player-state.ts` → 118 version is server-backed, more robust
- ⚠️ Both have `coinbase-auth.tsx` → Identical, use either

---

### Scenario 2: 118-integration Only

**Why:** Want only features, not foundation

**Trade-offs:**
- ❌ No intro system (must create your own)
- ❌ No VOID-themed onboarding
- ✅ Full control over wallet integration
- ✅ All features included

**Steps:**
```bash
# 1. Copy shared files first
cp -r 118-integration/shared-files/* src/

# 2. Copy features
cp -r 118-integration/* src/components/

# 3. Implement your own intro
# (No pre-built intro in 118-integration)
```

---

### Scenario 3: lame Only (Foundation Only)

**Why:** Want just wallet + mobile, build features yourself

**What You Get:**
- ✅ Wallet connection (Coinbase + injected)
- ✅ Mobile controls (basic)
- ✅ Intro system (VOID-themed)
- ✅ Session management (client-side)

**What You Miss:**
- ❌ Jukebox
- ❌ Tipping
- ❌ Housing
- ❌ Agency ecosystem
- ❌ All other features

---

## Dependency Resolution

### If Both Packages Installed

**Conflict 1: mobile-controls.tsx**
```typescript
// package.json aliases
{
  "imports": {
    "#mobile-controls-basic": "./web3-infrastructure/components/mobile-controls.tsx",
    "#mobile-controls-enhanced": "./118-integration/05-mobile-controls/mobile-controls.tsx"
  }
}

// Use in code:
import { MobileControls } from '#mobile-controls-enhanced'; // 118 version
// OR
import { MobileControls } from '#mobile-controls-basic'; // lame version
```

**Conflict 2: use-player-state.ts**
```typescript
// Recommendation: Use 118 version (server-backed)
import { usePlayerState } from '@/118-integration/shared-files/use-player-state';

// lame version is client-only, less robust
```

**Conflict 3: coinbase-auth.tsx**
```typescript
// Identical files - use either
import { CoinbaseAuth } from '@/web3-infrastructure/components/coinbase-auth';
// OR
import { CoinbaseAuth } from '@/118-integration/04-smart-wallet/coinbase-auth';
```

---

## Version Evolution Timeline

### v0.1 (lame - Initial)
- Basic wallet connection
- Simple mobile controls (3 actions)
- Client-side session management
- VOID intro system

### v1.0 (118-integration - Full Features)
- Enhanced mobile controls (5 actions)
- Server-backed sessions
- 9 complete feature systems
- Agency ecosystem
- **No intro system** (assumes wallet already connected)

### Future (v2.0?)
- Merge both packages
- Configurable intro (optional VOID theme)
- Unified mobile controls with feature flags
- Single source of truth for shared components

---

## Decision Matrix

| Use Case | Recommended Package | Reason |
|----------|-------------------|--------|
| New project, want full features | 118-integration + lame intro | Best of both |
| Just need wallet connection | lame only | Simpler |
| Already have wallet system | 118-integration only | Features only |
| Building custom game | lame only | Foundation only |
| Want everything | Both packages | Maximum features |

---

## Testing Both Packages Together

```typescript
// app/layout.tsx - Combine both

import { WagmiProvider } from 'wagmi';
import { wagmiConfig } from '@/lib/wagmi-config'; // From 118 shared-files
import { MobileLayoutProvider } from '@/contexts/mobile-layout-context'; // From 118 shared-files
import { VoidIntroSystem } from '@/web3-infrastructure/components/void-intro-system'; // From lame

export default function RootLayout({ children }) {
  return (
    <WagmiProvider config={wagmiConfig}>
      <MobileLayoutProvider>
        <VoidIntroSystem>
          {children}
        </VoidIntroSystem>
      </MobileLayoutProvider>
    </WagmiProvider>
  );
}
```

```typescript
// app/page.tsx - Use features from both

import { MobileControls } from '@/118-integration/05-mobile-controls/mobile-controls'; // Enhanced version
import { Jukebox } from '@/118-integration/01-jukebox-system/jukebox';
import { TippingModal } from '@/118-integration/02-tipping-system/tipping-modal';

export default function Game() {
  return (
    <>
      <GameWorld />
      <Jukebox /> {/* From 118 */}
      <TippingModal /> {/* From 118 */}
      <MobileControls
        onMove={handleMove}
        onInteract={handleInteract}
        onAction={handleAction}
        onRingBlast={handleRingBlast} // From 118 enhanced version
      />
    </>
  );
}
```

---

## Common Mistakes

### ❌ Mistake 1: Importing from Wrong Package
```typescript
// DON'T: Mix imports randomly
import { MobileControls } from '@/web3-infrastructure/components/mobile-controls';
import { usePlayerState } from '@/118-integration/shared-files/use-player-state';
// Now mobile controls can't access player state!
```

**Fix:** Use matching versions
```typescript
// DO: Use 118 versions together
import { MobileControls } from '@/118-integration/05-mobile-controls/mobile-controls';
import { usePlayerState } from '@/118-integration/shared-files/use-player-state';
```

---

### ❌ Mistake 2: Duplicate Dependencies
```typescript
// DON'T: Install both if they conflict
npm install @your-org/web3-infrastructure
npm install @your-org/118-integration
// Both have mobile-controls.tsx!
```

**Fix:** Use package aliases or copy files
```typescript
// DO: Copy files and rename
cp 118-integration/05-mobile-controls/mobile-controls.tsx src/components/mobile-controls-enhanced.tsx
```

---

### ❌ Mistake 3: Missing Shared Files
```typescript
// DON'T: Use 118 components without shared files
import { Jukebox } from '@/118-integration/01-jukebox-system/jukebox';
// ERROR: Cannot find module '@/lib/utils'
```

**Fix:** Copy shared files first
```bash
# DO: Copy dependencies before components
cp -r 118-integration/shared-files/* src/
```

---

## Cheat Sheet

### "Should I use lame or 118 for...?"

| Feature | Use Package | Reasoning |
|---------|------------|-----------|
| Wallet connection | Either | Identical |
| Intro flow | **lame** | Only lame has it |
| Mobile controls (basic) | **lame** | Simpler, no deps |
| Mobile controls (Ring Blast) | **118** | Enhanced features |
| Jukebox | **118** | Only 118 has it |
| Tipping | **118** | Only 118 has it |
| Housing | **118** | Only 118 has it |
| Session management | **118** | Server-backed, better |
| UI sounds | **118** | Only 118 has it |

---

## Next Steps

1. Decide which package(s) to use
2. If using both, resolve mobile-controls.tsx conflict
3. Copy shared files from 118-integration/shared-files/
4. Import components from chosen package
5. Test integration thoroughly

---

**Last Updated:** November 8, 2025  
**lame Version:** 1.0.0  
**118-integration Version:** 1.0.0
