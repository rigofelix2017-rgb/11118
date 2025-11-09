# Intro Sequence Troubleshooting Guide

## Problem
Warning and mini-game sometimes show up, but when published they don't display consistently.

---

## Intro Flow Sequence

### Complete Flow Chart
```
1. Page Load
   ↓
2. Session Check (useSession hook)
   ↓
3A. Has Session? → Auto-skip all intros → Go to game
   ↓
3B. No Session? → Continue to intro sequence
   ↓
4. Beta Notice Modal
   ↓
5. Epilepsy Warning Modal
   ↓
6. Void Intro Stages:
   ├── Stage 1: Gears Unlocking
   ├── Stage 2: Mini-game
   └── Stage 3: Portal
   ↓
7. Coinbase Wallet Connection
   ↓
8. Game World
```

---

## Issue Analysis

### Root Causes of Inconsistent Behavior

**1. Race Condition: Session Check vs Render**
- **Problem**: `useSession()` is async via React Query
- **Symptom**: Sometimes renders intro before session check completes
- **Location**: `client/src/pages/game.tsx:36-40`

**2. Cookie Timing Issues**
- **Problem**: Cookies set but not read immediately on next load
- **Symptom**: Warning/epilepsy modals flash even for returning users
- **Location**: `client/src/lib/cookie-utils.ts:27-29`

**3. State Initialization Race**
- **Problem**: Multiple state initializers run simultaneously
- **Symptom**: Intros skip inconsistently based on timing
- **Location**: `client/src/pages/game.tsx:121-135`

**4. Production vs Development Differences**
- **Problem**: Published version may have different timing due to:
  - Server-side rendering
  - Different build optimizations
  - Cookie security settings (SameSite, Secure)
  - Network latency

---

## Segmented Code Breakdown

### SEGMENT 1: Session Check & Auto-Skip Logic
**File**: `client/src/pages/game.tsx`
**Lines**: 32-135

#### Current Implementation
```typescript
// Line 32-40: State initialization
export default function Game() {
  const { session, isLoading: isSessionLoading, hasSession } = useSession();
  
  const [betaNoticeAcknowledged, setBetaNoticeAcknowledged] = useState(() => isCookieTrue(BETA_NOTICE_COOKIE));
  const [epilepsyWarningAcknowledged, setEpilepsyWarningAcknowledged] = useState(() => isCookieTrue(EPILEPSY_WARNING_COOKIE));
  const [voidIntroCompleted, setVoidIntroCompleted] = useState(false);
  // ...
}

// Line 121-135: Auto-skip effect
useEffect(() => {
  if (!isSessionLoading && hasSession && session) {
    console.log('🚀 Valid session found - auto-skipping all intros');
    
    setBetaNoticeAcknowledged(true);
    setEpilepsyWarningAcknowledged(true);
    setVoidIntroCompleted(true);
    
    setCookie(BETA_NOTICE_COOKIE, 'true', 365);
    setCookie(EPILEPSY_WARNING_COOKIE, 'true', 365);
  }
}, [isSessionLoading, hasSession, session]);
```

#### Issues
1. ❌ **No loading guard**: Renders before `isSessionLoading` completes
2. ❌ **Cookie sync delay**: Cookies set in effect, but state initialized from cookies before effect runs
3. ❌ **Flash of content**: Intros render briefly before auto-skip

#### Required Fixes
```typescript
// Add loading guard at top of render
if (isSessionLoading) {
  return (
    <div className="fixed inset-0 bg-black flex items-center justify-center">
      <div className="text-cyan-400 font-mono">INITIALIZING...</div>
    </div>
  );
}
```

---

### SEGMENT 2: Cookie Persistence & Reading
**File**: `client/src/lib/cookie-utils.ts`
**Lines**: 1-32

#### Current Implementation
```typescript
export function setCookie(name: string, value: string, maxAge: number = COOKIE_MAX_AGE): void {
  document.cookie = `${name}=${value}; path=/; max-age=${maxAge}`;
}

export function isCookieTrue(name: string): boolean {
  return getCookie(name) === 'true';
}
```

#### Issues
1. ❌ **Missing security flags**: No `Secure`, `SameSite` attributes
2. ❌ **Production cookie issues**: HTTPS/cross-origin may block cookies
3. ❌ **No domain specification**: May not work across subdomains

#### Required Fixes
```typescript
export function setCookie(name: string, value: string, maxAge: number = COOKIE_MAX_AGE): void {
  const isProduction = window.location.protocol === 'https:';
  const secureFlag = isProduction ? 'Secure;' : '';
  document.cookie = `${name}=${value}; path=/; max-age=${maxAge}; SameSite=Lax; ${secureFlag}`;
}
```

---

### SEGMENT 3: Render Condition Logic
**File**: `client/src/pages/game.tsx`
**Lines**: 500-540

#### Current Implementation
```typescript
// Show beta notice modal first (only for new/logged-out users)
if (!betaNoticeAcknowledged) {
  return <BetaNoticeModal onAcknowledge={() => {
    setCookie(BETA_NOTICE_COOKIE, 'true');
    setBetaNoticeAcknowledged(true);
  }} />;
}

// Show epilepsy warning after beta notice is acknowledged
if (!epilepsyWarningAcknowledged) {
  return <EpilepsyWarningModal onAcknowledge={() => {
    setCookie(EPILEPSY_WARNING_COOKIE, 'true');
    setEpilepsyWarningAcknowledged(true);
  }} />;
}

// Show void intro after epilepsy warning is acknowledged
if (!voidIntroCompleted) {
  return <VoidSplashScreen onComplete={handleVoidIntroComplete} />;
}
```

#### Issues
1. ❌ **No session check guard**: Renders modals even when session exists
2. ❌ **Multiple render paths**: Confusing flow with overlapping conditions
3. ❌ **Missing loading state**: No indication when checking session

#### Required Fixes
```typescript
// Add session loading guard FIRST
if (isSessionLoading) {
  return <LoadingScreen />;
}

// Skip all intros if session exists
if (hasSession) {
  // Go directly to game
  return <GameWorld />;
}

// Then show intro sequence for new users
if (!betaNoticeAcknowledged) {
  return <BetaNoticeModal />;
}
// ... rest of sequence
```

---

### SEGMENT 4: VoidSplashScreen Stage Management
**File**: `client/src/components/void-splash-screen.tsx`
**Lines**: 1-60

#### Current Implementation
```typescript
export function VoidSplashScreen({ onComplete }: VoidSplashScreenProps) {
  const [currentStage, setCurrentStage] = useState<VoidStage>('gears');
  const [stageProgress, setStageProgress] = useState(0);
  const [isSkippable, setIsSkippable] = useState(false);

  // Enable skipping when minigame stage begins
  useEffect(() => {
    if (currentStage === 'minigame') {
      setIsSkippable(true);
    }
  }, [currentStage]);

  // Show connection splash after portal stage completes
  useEffect(() => {
    if (currentStage === 'portal') {
      const timer = setTimeout(() => {
        setCurrentStage('complete');
        onComplete();
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [currentStage, onComplete]);
```

#### Issues
1. ❌ **No persistence**: Stages reset on unmount
2. ❌ **Timing-dependent**: 2000ms delay may cause issues
3. ❌ **No error handling**: If stage transitions fail, user is stuck

#### Required Fixes
```typescript
// Add stage persistence
const [currentStage, setCurrentStage] = useState<VoidStage>(() => {
  const saved = sessionStorage.getItem('void_intro_stage');
  return (saved as VoidStage) || 'gears';
});

useEffect(() => {
  sessionStorage.setItem('void_intro_stage', currentStage);
}, [currentStage]);

// Add timeout safety
useEffect(() => {
  if (currentStage === 'portal') {
    const timer = setTimeout(() => {
      setCurrentStage('complete');
      onComplete();
    }, 2000);
    
    // Safety timeout - force complete after 5 seconds
    const safetyTimer = setTimeout(() => {
      console.warn('⚠️ Portal stage timeout - forcing completion');
      onComplete();
    }, 5000);
    
    return () => {
      clearTimeout(timer);
      clearTimeout(safetyTimer);
    };
  }
}, [currentStage, onComplete]);
```

---

## Critical Fixes Required

### Fix 1: Add Session Loading Guard
**Priority**: 🔥🔥🔥 CRITICAL
**File**: `client/src/pages/game.tsx`
**Location**: Line 500 (before all modal renders)

```typescript
// ADD THIS FIRST - Before any modal renders
if (isSessionLoading) {
  return (
    <div className="fixed inset-0 bg-black flex items-center justify-center">
      <div className="text-cyan-400 font-mono animate-pulse">
        INITIALIZING VOID...
      </div>
    </div>
  );
}

// ADD THIS SECOND - Skip intros if session exists
if (hasSession && session) {
  // Don't render any intro modals, go straight to game connection
  // (existing game render logic below)
}

// THEN show intro sequence for new users (existing code)
if (!betaNoticeAcknowledged) {
  return <BetaNoticeModal />;
}
```

### Fix 2: Improve Cookie Security
**Priority**: 🔥🔥 HIGH
**File**: `client/src/lib/cookie-utils.ts`
**Location**: Line 23

```typescript
export function setCookie(name: string, value: string, maxAge: number = COOKIE_MAX_AGE): void {
  const isProduction = window.location.protocol === 'https:';
  const secureFlag = isProduction ? 'Secure;' : '';
  const cookieString = `${name}=${value}; path=/; max-age=${maxAge}; SameSite=Lax; ${secureFlag}`;
  
  document.cookie = cookieString;
  
  // Verify cookie was set
  const verified = getCookie(name) === value;
  if (!verified) {
    console.warn(`⚠️ Cookie '${name}' failed to set. Check browser settings.`);
  }
}
```

### Fix 3: Add Stage Persistence
**Priority**: 🔥 MEDIUM
**File**: `client/src/components/void-splash-screen.tsx`
**Location**: Line 14

```typescript
const [currentStage, setCurrentStage] = useState<VoidStage>(() => {
  try {
    const saved = sessionStorage.getItem('void_intro_stage');
    return (saved as VoidStage) || 'gears';
  } catch (error) {
    console.warn('Failed to read stage from sessionStorage:', error);
    return 'gears';
  }
});

useEffect(() => {
  try {
    sessionStorage.setItem('void_intro_stage', currentStage);
  } catch (error) {
    console.warn('Failed to persist stage to sessionStorage:', error);
  }
}, [currentStage]);
```

### Fix 4: Add Skip All Button (Production Escape Hatch)
**Priority**: 🔥 MEDIUM
**File**: `client/src/pages/game.tsx`
**Location**: Add to all intro modals

```typescript
// Add to BetaNoticeModal, EpilepsyWarningModal, VoidSplashScreen
const skipAllIntros = () => {
  setBetaNoticeAcknowledged(true);
  setEpilepsyWarningAcknowledged(true);
  setVoidIntroCompleted(true);
  setCookie(BETA_NOTICE_COOKIE, 'true', 365);
  setCookie(EPILEPSY_WARNING_COOKIE, 'true', 365);
};

// Add hidden skip button (Ctrl+Shift+S)
useEffect(() => {
  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.ctrlKey && e.shiftKey && e.key === 'S') {
      console.log('🚀 Force skipping all intros');
      skipAllIntros();
    }
  };
  window.addEventListener('keydown', handleKeyDown);
  return () => window.removeEventListener('keydown', handleKeyDown);
}, []);
```

---

## Testing Checklist

### Phase 1: Local Development Testing

- [ ] **Test 1: First-time user flow**
  - Clear all cookies and localStorage
  - Refresh page
  - Verify: Beta Notice → Epilepsy Warning → Gears → Mini-game → Portal → Wallet
  - Check console for `INITIALIZING...` message

- [ ] **Test 2: Returning user flow**
  - Complete intro once
  - Refresh page
  - Verify: Should skip directly to wallet/game
  - Check cookies in DevTools (Application tab)

- [ ] **Test 3: Session persistence**
  - Connect wallet and enter game
  - Refresh page
  - Verify: Should skip all intros and auto-reconnect
  - Check console for `🚀 Valid session found`

- [ ] **Test 4: Cookie verification**
  - Check DevTools → Application → Cookies
  - Verify `beta_notice_acknowledged=true` exists
  - Verify `epilepsy_warning_acknowledged=true` exists
  - Check expiration dates (should be 1 year)

### Phase 2: Production Testing

- [ ] **Test 5: HTTPS cookie behavior**
  - Test on published URL
  - Check if cookies have `Secure` flag
  - Verify cookies persist across page reloads

- [ ] **Test 6: Cross-browser testing**
  - Chrome (desktop & mobile)
  - Safari (iOS)
  - Firefox
  - Edge

- [ ] **Test 7: Network conditions**
  - Test with slow 3G throttling
  - Verify loading screen shows during session check
  - Ensure intros don't flash during load

- [ ] **Test 8: Incognito/Private mode**
  - Test in incognito window
  - Should always show full intro sequence
  - Cookies should still work within session

### Phase 3: Edge Cases

- [ ] **Test 9: Interrupted intro**
  - Start intro sequence
  - Close tab mid-intro
  - Reopen and verify it continues from last stage
  - (Requires sessionStorage persistence)

- [ ] **Test 10: Force skip**
  - Press Ctrl+Shift+S during any intro
  - Should immediately skip to wallet connection

- [ ] **Test 11: Session expiry**
  - Connect and play
  - Wait for session to expire (or manually delete session cookie)
  - Refresh page
  - Should NOT show intros (cookies persist)
  - Should show wallet connection

---

## Debug Console Messages

Add these console logs to track intro flow:

```typescript
// In game.tsx useEffect for session check
useEffect(() => {
  console.log('🔍 Session Check:', { 
    isSessionLoading, 
    hasSession, 
    sessionData: session 
  });
}, [isSessionLoading, hasSession, session]);

// In render conditions
if (isSessionLoading) {
  console.log('⏳ Waiting for session check...');
  return <LoadingScreen />;
}

if (hasSession) {
  console.log('✅ Session exists - skipping intros');
}

if (!betaNoticeAcknowledged) {
  console.log('📋 Showing beta notice');
}

if (!epilepsyWarningAcknowledged) {
  console.log('⚠️ Showing epilepsy warning');
}

if (!voidIntroCompleted) {
  console.log('🎮 Showing void intro stages');
}
```

---

## Implementation Order

### Week 1: Critical Fixes
1. ✅ Add session loading guard (Fix 1)
2. ✅ Improve cookie security (Fix 2)
3. ✅ Add debug console messages
4. ✅ Test locally with cleared cookies

### Week 2: Persistence & UX
5. ✅ Add stage persistence to sessionStorage (Fix 3)
6. ✅ Add force skip hotkey (Fix 4)
7. ✅ Test in production environment
8. ✅ Cross-browser testing

### Week 3: Polish
9. ✅ Add loading animations
10. ✅ Improve error handling
11. ✅ Add analytics tracking for intro completion rate
12. ✅ Final QA testing

---

## Known Issues & Workarounds

### Issue 1: Cookies Not Persisting in Production
**Symptom**: Intros show every time in published version
**Cause**: Cookie security settings or cross-origin issues
**Workaround**: Check `SameSite=Lax` and `Secure` flags

### Issue 2: Flash of Intro Content
**Symptom**: Intros briefly appear before auto-skip
**Cause**: Session check takes time, render happens first
**Workaround**: Add loading guard (Fix 1)

### Issue 3: Stuck on Loading Screen
**Symptom**: "INITIALIZING..." never completes
**Cause**: Session API call failing
**Workaround**: Add timeout fallback:
```typescript
useEffect(() => {
  const timeout = setTimeout(() => {
    if (isSessionLoading) {
      console.error('❌ Session check timeout - proceeding without session');
      // Proceed to intros
    }
  }, 5000);
  return () => clearTimeout(timeout);
}, [isSessionLoading]);
```

---

## Success Criteria

✅ **First-time users**: See full intro sequence (Beta → Warning → Gears → Mini-game → Portal → Wallet)
✅ **Returning users**: Skip to wallet/game immediately (no flashes)
✅ **Session users**: Auto-reconnect without any intros
✅ **Production**: Cookies persist across reloads
✅ **All browsers**: Consistent behavior
✅ **No console errors**: Clean debug output

---

**Status**: Ready for implementation  
**Priority**: 🔥🔥🔥 CRITICAL  
**Estimated Time**: 3-5 days
