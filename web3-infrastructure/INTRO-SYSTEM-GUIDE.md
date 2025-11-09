# VOID Intro System

Complete intro sequence with beta notice, epilepsy warning, and interactive VOID puzzle minigame.

## 🎭 Intro Flow

```
User Loads App
    ↓
Beta Notice Modal
    ↓
Epilepsy Warning Modal  
    ↓
VOID Splash Screen
    ├── Stage 1: Gears Unlocking (industrial animation)
    ├── Stage 2: Minigame (consciousness gathering puzzle)
    └── Stage 3: Portal (transition effect)
    ↓
Connection Splash / Main App
```

## 📁 Components

### 1. Beta Notice Modal
**File:** `components/beta-notice-modal.tsx`

Displays early access warning with retro terminal aesthetic.

```tsx
import { BetaNoticeModal } from './components/beta-notice-modal';

<BetaNoticeModal onAcknowledge={() => setShowBeta(false)} />
```

**Features:**
- Animated entrance
- Retro green terminal theme
- Single acknowledgment button
- Auto-saves to cookie after acknowledgment

---

### 2. Epilepsy Warning Modal
**File:** `components/epilepsy-warning-modal.tsx`

Critical health warning about flashing lights.

```tsx
import { EpilepsyWarningModal } from './components/epilepsy-warning-modal';

<EpilepsyWarningModal onAcknowledge={() => setShowWarning(false)} />
```

**Features:**
- Yellow warning theme
- AlertTriangle icon
- Clear health notice
- Mobile responsive
- Cookie persistence

---

### 3. VOID Splash Screen (Main Intro)
**File:** `components/void-splash-screen.tsx`

Multi-stage animated intro sequence.

```tsx
import { VoidSplashScreen } from './components/void-splash-screen';

<VoidSplashScreen onComplete={() => setIntroComplete(true)} />
```

**Stages:**
1. **Gears** - Industrial mechanical animation (auto-advances)
2. **Minigame** - Interactive consciousness gathering puzzle
3. **Portal** - Transition effect (auto-advances to app)

**Features:**
- Skippable from minigame stage onward (ESC key or button)
- Smooth transitions between stages
- Progress tracking
- Framer Motion animations

---

## 🎮 Minigame Puzzle

### Stage 2: Consciousness Gathering

**File:** `components/void-stages/void-stage4-minigame.tsx`

Interactive HTML5 canvas puzzle where users gather consciousness fragments.

**Gameplay:**
1. Consciousness fragments explode from center
2. Fragments scatter across screen
3. User clicks to gather nearby fragments (150px radius)
4. Gather 60+ fragments to complete
5. Remaining fragments auto-gather and coalesce
6. Orb reforms with dramatic effects

**Controls:**
- **Click** - Gather nearby fragments
- **ESC** - Skip to next stage
- **Skip Button** - Bottom right corner

**Visual Effects:**
- Particle explosions
- Fragment pulsing/glowing
- Gather radius indicator on hover
- Reformation animation with multiple layers
- Lightning bolts and screen shake on completion
- Color morphing during finale

**Audio:**
- Bubble sound when orb reforms
- Consciousness fragment sound per gathered piece
- Ambient void sounds

---

## 🔧 Technical Details

### Dependencies

```json
{
  "dependencies": {
    "framer-motion": "^11.0.0",
    "lucide-react": "^0.320.0"
  }
}
```

### Cookie Storage

Intro acknowledgments saved to cookies to prevent repeated displays:

```typescript
// From lib/cookie-utils.ts
const BETA_NOTICE_COOKIE = 'void2_beta_acknowledged';
const EPILEPSY_WARNING_COOKIE = 'void2_epilepsy_acknowledged';

setCookie(BETA_NOTICE_COOKIE, 'true', 365); // 1 year
```

### State Management

```tsx
const [betaNoticeAcknowledged, setBetaNoticeAcknowledged] = useState(() => 
  isCookieTrue(BETA_NOTICE_COOKIE)
);

const [epilepsyWarningAcknowledged, setEpilepsyWarningAcknowledged] = useState(() => 
  isCookieTrue(EPILEPSY_WARNING_COOKIE)
);

const [voidIntroCompleted, setVoidIntroCompleted] = useState(false);
```

### Render Logic

```tsx
// Show beta notice first
if (!betaNoticeAcknowledged) {
  return <BetaNoticeModal onAcknowledge={() => {
    setBetaNoticeAcknowledged(true);
    setCookie(BETA_NOTICE_COOKIE, 'true', 365);
  }} />;
}

// Then epilepsy warning
if (!epilepsyWarningAcknowledged) {
  return <EpilepsyWarningModal onAcknowledge={() => {
    setEpilepsyWarningAcknowledged(true);
    setCookie(EPILEPSY_WARNING_COOKIE, 'true', 365);
  }} />;
}

// Then VOID intro sequence
if (!voidIntroCompleted) {
  return <VoidSplashScreen onComplete={() => {
    setVoidIntroCompleted(true);
  }} />;
}

// Finally show main app
return <YourMainApp />;
```

---

## 🎨 Styling

### Theme Colors

```css
/* Retro green terminal theme */
--retro-green: #00ff00;
--retro-cyan: #00ffff;
--retro-black: #000000;

/* Warning theme */
--warning-yellow: #fbbf24; /* yellow-400 */
--warning-red: #f87171; /* red-400 */
```

### CSS Classes Used

```css
.retro-button {
  background: black;
  border: 4px solid var(--retro-green);
  color: var(--retro-green);
  font-family: monospace;
  text-shadow: 0 0 10px rgba(0, 255, 0, 0.8);
  box-shadow: 0 0 20px rgba(0, 255, 0, 0.3);
}

.retro-button:hover {
  background: var(--retro-green);
  color: black;
}
```

---

## 🎬 Animation Timings

### Beta Notice
- Fade in: 0ms
- Scale up: 100ms delay, 300ms duration
- Text cascade: 200-600ms delays
- Button: 800ms delay

### Epilepsy Warning
- Fade in: 0ms
- Scale up: 100ms delay, 300ms duration
- Icon pulse: 300ms delay
- Text cascade: 400-700ms delays
- Button: 800ms delay

### VOID Splash Stages
- **Gears Stage:** 8-12 seconds (auto-advance)
- **Minigame:** User-controlled (2-60 seconds typical)
- **Portal:** 2 seconds (auto-advance)

### Minigame Phases
1. **Fragmentation:** 4 seconds (orb pulse + explosion)
2. **Exploration:** User triggered (click to advance)
3. **Gathering:** User controlled (click to gather)
4. **Reformation:** 15-20 seconds (automatic)
5. **Complete:** 6 seconds (dramatic finale)

---

## 🔊 Audio Integration

The minigame includes audio effects:

```tsx
// Use UI sounds hook
const { playConsciousnessFragment, playVoidAmbience } = useUISounds();

// Play ambient sound
playVoidAmbience?.(0.5, 20); // 50% volume, 20s duration

// Play fragment gather sound
playConsciousnessFragment?.();

// Bubble sound on reformation
const bubbleAudio = new Audio(bubbleSound);
bubbleAudio.volume = 0.6;
bubbleAudio.play();
```

**Audio Files Needed:**
- `bubble_iMw0wu6_1758195358381.mp3` - Orb reformation sound
- Consciousness fragment sound (via useUISounds hook)
- Void ambience (via useUISounds hook)

---

## 📱 Mobile Responsive

All components include mobile-specific styling:

```tsx
// Button text - hide on mobile
<span className="hidden md:inline">[ I UNDERSTAND - CONTINUE ]</span>
<span className="md:hidden">[ CONTINUE ]</span>

// Padding adjustments
className="p-4 md:p-8"

// Text sizes
className="text-sm md:text-lg"

// Icon sizes
className="w-12 h-12 md:w-16 md:h-16"
```

---

## 🎯 Skip Functionality

Users can skip the intro:

### During Minigame Stage
1. **ESC Key** - Press Escape to skip
2. **Skip Button** - Click ">>> SKIP <<<" button (bottom right)

### Auto-Skip on Repeat Visits
Once cookies are set, intro skips automatically on next visit.

### Manual Skip Implementation

```tsx
const skipToConnectionSplash = useCallback(() => {
  setCurrentStage('complete');
  onComplete();
}, [onComplete]);

// ESC key handler
useEffect(() => {
  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape' && isSkippable) {
      skipToConnectionSplash();
    }
  };
  window.addEventListener('keydown', handleKeyDown);
  return () => window.removeEventListener('keydown', handleKeyDown);
}, [isSkippable, skipToConnectionSplash]);
```

---

## 🐛 Common Issues

### Issue: Audio doesn't play
**Cause:** Browser autoplay restrictions  
**Fix:** User must interact with page first (click/key press)

### Issue: Canvas not responsive
**Cause:** Canvas dimensions not updating on resize  
**Fix:** Included resize handler in minigame component

### Issue: Cookies not persisting
**Cause:** Cookie domain/path misconfiguration  
**Fix:** Set cookie path to '/' and verify domain

### Issue: Animations stuttering
**Cause:** Too many particles or complex rendering  
**Fix:** Particle count capped at 150, opacity culling enabled

---

## 🎓 Usage Example

Complete integration example:

```tsx
import { useState } from 'react';
import { BetaNoticeModal } from './components/beta-notice-modal';
import { EpilepsyWarningModal } from './components/epilepsy-warning-modal';
import { VoidSplashScreen } from './components/void-splash-screen';
import { isCookieTrue, setCookie } from './lib/cookie-utils';

const BETA_NOTICE_COOKIE = 'void2_beta_acknowledged';
const EPILEPSY_WARNING_COOKIE = 'void2_epilepsy_acknowledged';

export function App() {
  const [betaAck, setBetaAck] = useState(() => isCookieTrue(BETA_NOTICE_COOKIE));
  const [epilepsyAck, setEpilepsyAck] = useState(() => isCookieTrue(EPILEPSY_WARNING_COOKIE));
  const [voidComplete, setVoidComplete] = useState(false);

  // Beta notice
  if (!betaAck) {
    return <BetaNoticeModal onAcknowledge={() => {
      setBetaAck(true);
      setCookie(BETA_NOTICE_COOKIE, 'true', 365);
    }} />;
  }

  // Epilepsy warning
  if (!epilepsyAck) {
    return <EpilepsyWarningModal onAcknowledge={() => {
      setEpilepsyAck(true);
      setCookie(EPILEPSY_WARNING_COOKIE, 'true', 365);
    }} />;
  }

  // VOID intro
  if (!voidComplete) {
    return <VoidSplashScreen onComplete={() => setVoidComplete(true)} />;
  }

  // Main app
  return <YourMainApp />;
}
```

---

## 📦 File Checklist

```
web3-infrastructure/
└── components/
    ├── beta-notice-modal.tsx          ✅ Beta notice
    ├── epilepsy-warning-modal.tsx     ✅ Health warning
    ├── void-splash-screen.tsx         ✅ Main intro coordinator
    └── void-stages/
        ├── void-stage-gears-unlocking.tsx   ✅ Stage 1 (gears)
        ├── void-stage4-minigame.tsx         ✅ Stage 2 (puzzle)
        └── void-stage5-portal.tsx           ✅ Stage 3 (portal)
```

---

## 🚀 Quick Start

1. Copy all component files to your project
2. Install dependencies: `npm install framer-motion lucide-react`
3. Add cookie utilities or use your own
4. Implement the rendering logic (see Usage Example)
5. Customize colors/text as needed

**Total experience time:** 30-90 seconds (skippable after 10s)

---

## 🎉 Features Summary

✅ Professional onboarding flow  
✅ Health & safety warnings  
✅ Interactive puzzle minigame  
✅ Retro terminal aesthetic  
✅ Fully skippable  
✅ Mobile responsive  
✅ Cookie persistence  
✅ Smooth animations  
✅ Audio integration  
✅ Progressive enhancement  

**NO GAME ENGINE REQUIRED** - Pure React + Canvas + Framer Motion
