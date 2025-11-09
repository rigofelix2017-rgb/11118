# Intro Sequence - Implementation Fixes

This document contains the actual code changes needed to fix the intro sequence issues.

---

## Fix 1: Add Session Loading Guard

**File**: `client/src/pages/game.tsx`
**Line**: Insert at line 500 (before modal render conditions)

### Before
```typescript
// Show beta notice modal first (only for new/logged-out users)
if (!betaNoticeAcknowledged) {
  return (
    <BetaNoticeModal
```

### After
```typescript
// CRITICAL: Wait for session check to complete before rendering anything
if (isSessionLoading) {
  return (
    <div className="fixed inset-0 bg-black flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="text-cyan-400 font-mono text-xl animate-pulse">
          INITIALIZING VOID...
        </div>
        <div className="text-cyan-400/60 font-mono text-sm">
          Checking authentication...
        </div>
      </div>
    </div>
  );
}

// OPTIMIZATION: If user has active session, skip all intro modals
if (hasSession && session) {
  console.log('✅ Active session detected - bypassing intro sequence');
  // Continue to game render below (don't return here)
  // The existing auto-skip effect will handle state cleanup
}

// Show beta notice modal first (only for new/logged-out users without session)
if (!betaNoticeAcknowledged) {
  return (
    <BetaNoticeModal
```

---

## Fix 2: Improve Cookie Security & Verification

**File**: `client/src/lib/cookie-utils.ts`
**Replace entire file**

### New Implementation
```typescript
// Cookie utility functions
export const BETA_NOTICE_COOKIE = "beta_notice_acknowledged";
export const EPILEPSY_WARNING_COOKIE = "epilepsy_warning_acknowledged";
export const COOKIE_MAX_AGE = 60 * 60 * 24 * 365; // 1 year

/**
 * Get a cookie value by name
 */
export function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null; // SSR safety
  
  try {
    const cookies = document.cookie.split(';');
    for (const cookie of cookies) {
      const [cookieName, cookieValue] = cookie.trim().split('=');
      if (cookieName === name) {
        return cookieValue;
      }
    }
  } catch (error) {
    console.error(`Failed to read cookie '${name}':`, error);
  }
  return null;
}

/**
 * Set a cookie with name, value, and optional max age
 * Now includes proper security flags for production
 */
export function setCookie(name: string, value: string, maxAge: number = COOKIE_MAX_AGE): void {
  if (typeof document === 'undefined') return; // SSR safety
  
  try {
    const isProduction = window.location.protocol === 'https:';
    const secureFlag = isProduction ? ' Secure;' : '';
    const cookieString = `${name}=${value}; path=/; max-age=${maxAge}; SameSite=Lax;${secureFlag}`;
    
    document.cookie = cookieString;
    
    // Verify cookie was set successfully
    const verified = getCookie(name) === value;
    if (!verified) {
      console.warn(`⚠️ Cookie '${name}' failed to set. Browser may be blocking cookies.`);
    } else {
      console.log(`✅ Cookie '${name}' set successfully (expires in ${maxAge / (60 * 60 * 24)} days)`);
    }
  } catch (error) {
    console.error(`Failed to set cookie '${name}':`, error);
  }
}

/**
 * Check if a boolean cookie is set to true
 */
export function isCookieTrue(name: string): boolean {
  return getCookie(name) === 'true';
}

/**
 * Delete a cookie by name
 */
export function deleteCookie(name: string): void {
  if (typeof document === 'undefined') return;
  
  try {
    document.cookie = `${name}=; path=/; max-age=0`;
    console.log(`🗑️ Cookie '${name}' deleted`);
  } catch (error) {
    console.error(`Failed to delete cookie '${name}':`, error);
  }
}
```

---

## Fix 3: Add Stage Persistence to VoidSplashScreen

**File**: `client/src/components/void-splash-screen.tsx`
**Lines**: 14-17

### Before
```typescript
export function VoidSplashScreen({ onComplete }: VoidSplashScreenProps) {
  const [currentStage, setCurrentStage] = useState<VoidStage>('gears');
  const [stageProgress, setStageProgress] = useState(0);
  const [isSkippable, setIsSkippable] = useState(false);
  const isAdvancing = useRef(false);
```

### After
```typescript
export function VoidSplashScreen({ onComplete }: VoidSplashScreenProps) {
  // Persist stage to sessionStorage so interrupted intros can resume
  const [currentStage, setCurrentStage] = useState<VoidStage>(() => {
    try {
      const saved = sessionStorage.getItem('void_intro_stage');
      if (saved && ['gears', 'minigame', 'portal'].includes(saved)) {
        console.log(`📖 Resuming intro from stage: ${saved}`);
        return saved as VoidStage;
      }
    } catch (error) {
      console.warn('Failed to read intro stage from sessionStorage:', error);
    }
    return 'gears';
  });
  
  const [stageProgress, setStageProgress] = useState(0);
  const [isSkippable, setIsSkippable] = useState(false);
  const isAdvancing = useRef(false);

  // Persist current stage to sessionStorage
  useEffect(() => {
    try {
      if (currentStage !== 'complete') {
        sessionStorage.setItem('void_intro_stage', currentStage);
      } else {
        // Clear on completion
        sessionStorage.removeItem('void_intro_stage');
      }
    } catch (error) {
      console.warn('Failed to persist intro stage to sessionStorage:', error);
    }
  }, [currentStage]);
```

---

## Fix 4: Add Safety Timeout to Portal Stage

**File**: `client/src/components/void-splash-screen.tsx`
**Lines**: 30-38

### Before
```typescript
// Show connection splash after portal stage completes
useEffect(() => {
  if (currentStage === 'portal') {
    // Give a brief moment for portal animation then show connection splash
    const timer = setTimeout(() => {
      setCurrentStage('complete');
      onComplete();
    }, 2000);
    return () => clearTimeout(timer);
  }
}, [currentStage, onComplete]);
```

### After
```typescript
// Show connection splash after portal stage completes
useEffect(() => {
  if (currentStage === 'portal') {
    // Give a brief moment for portal animation then show connection splash
    const timer = setTimeout(() => {
      console.log('✅ Portal stage complete - moving to connection');
      setCurrentStage('complete');
      onComplete();
    }, 2000);
    
    // Safety timeout - force completion if animation hangs
    const safetyTimer = setTimeout(() => {
      console.warn('⚠️ Portal stage timeout (5s) - forcing completion');
      setCurrentStage('complete');
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

## Fix 5: Add Force Skip Hotkey (Emergency Escape)

**File**: `client/src/pages/game.tsx`
**Add after line 118** (in Game component, after useWebSocket)

### New Code
```typescript
// Emergency skip hotkey (Ctrl+Shift+S) for production debugging
useEffect(() => {
  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.ctrlKey && e.shiftKey && e.key === 'S') {
      console.log('🚀 FORCE SKIP: Bypassing all intro screens');
      
      // Skip all intros
      setBetaNoticeAcknowledged(true);
      setEpilepsyWarningAcknowledged(true);
      setVoidIntroCompleted(true);
      
      // Persist skip to cookies
      setCookie(BETA_NOTICE_COOKIE, 'true', 365);
      setCookie(EPILEPSY_WARNING_COOKIE, 'true', 365);
      
      toast({
        title: 'Intro Skipped',
        description: 'All intro screens bypassed',
        duration: 2000
      });
    }
  };
  
  window.addEventListener('keydown', handleKeyDown);
  return () => window.removeEventListener('keydown', handleKeyDown);
}, [toast]);
```

---

## Fix 6: Add Debug Console Messages

**File**: `client/src/pages/game.tsx`
**Add after line 135** (after auto-skip effect)

### New Code
```typescript
// Debug effect - track intro flow state
useEffect(() => {
  const state = {
    isSessionLoading,
    hasSession,
    sessionAddress: session?.walletAddress,
    betaNoticeAcknowledged,
    epilepsyWarningAcknowledged,
    voidIntroCompleted,
    hasConnected,
    walletAddress
  };
  
  console.log('🔍 Intro Flow State:', state);
}, [
  isSessionLoading,
  hasSession,
  session,
  betaNoticeAcknowledged,
  epilepsyWarningAcknowledged,
  voidIntroCompleted,
  hasConnected,
  walletAddress
]);
```

---

## Fix 7: Add Session Check Timeout Fallback

**File**: `client/src/hooks/use-session.ts`
**Replace entire file**

### New Implementation
```typescript
import { useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';

interface SessionData {
  sessionId: string;
  walletAddress: string;
  lastActive: string;
}

export function useSession() {
  const [hasTimedOut, setHasTimedOut] = useState(false);
  
  const { data, isLoading, error } = useQuery<SessionData>({
    queryKey: ['/api/session/me'],
    retry: false,
    staleTime: 0,
  });

  // Safety timeout - if session check takes > 5 seconds, proceed without session
  useEffect(() => {
    if (isLoading) {
      const timeout = setTimeout(() => {
        console.warn('⚠️ Session check timeout (5s) - proceeding without session');
        setHasTimedOut(true);
      }, 5000);
      return () => clearTimeout(timeout);
    }
  }, [isLoading]);

  return {
    session: data || null,
    isLoading: isLoading && !hasTimedOut,
    hasSession: !!data && !error,
  };
}
```

---

## Testing Script

Add this to `package.json` scripts:

```json
{
  "scripts": {
    "test:intro": "echo 'Testing intro sequence:' && echo '1. Clear cookies' && echo '2. Check console for debug messages' && echo '3. Verify flow: Beta → Warning → Gears → Minigame → Portal → Wallet'"
  }
}
```

---

## Browser Console Test Commands

Run these in browser DevTools console:

```javascript
// 1. Check current cookies
console.table({
  beta: document.cookie.includes('beta_notice_acknowledged=true'),
  epilepsy: document.cookie.includes('epilepsy_warning_acknowledged=true')
});

// 2. Clear all intro cookies
document.cookie = 'beta_notice_acknowledged=; path=/; max-age=0';
document.cookie = 'epilepsy_warning_acknowledged=; path=/; max-age=0';
sessionStorage.removeItem('void_intro_stage');
console.log('🗑️ All intro cookies cleared');

// 3. Check session
fetch('/api/session/me', { credentials: 'include' })
  .then(r => r.json())
  .then(d => console.log('Session:', d))
  .catch(e => console.log('No session:', e));

// 4. Force skip (same as Ctrl+Shift+S)
window.dispatchEvent(new KeyboardEvent('keydown', {
  key: 'S',
  ctrlKey: true,
  shiftKey: true
}));
```

---

## Rollout Plan

### Phase 1: Local Testing (Day 1-2)
1. Apply Fix 1 (Session loading guard)
2. Apply Fix 2 (Cookie security)
3. Test with cleared cookies
4. Verify console debug messages

### Phase 2: Enhanced Persistence (Day 3-4)
5. Apply Fix 3 (Stage persistence)
6. Apply Fix 4 (Portal timeout)
7. Apply Fix 5 (Force skip hotkey)
8. Test interrupted intro flows

### Phase 3: Production Deploy (Day 5)
9. Apply Fix 6 (Debug logging)
10. Apply Fix 7 (Session timeout)
11. Deploy to production
12. Monitor console logs in production

### Phase 4: Verification (Day 6-7)
13. Cross-browser testing
14. Mobile device testing
15. Network throttling tests
16. Cookie persistence verification

---

## Success Metrics

Track these in analytics:

```typescript
// Add to each stage completion
analytics.track('intro_stage_completed', {
  stage: currentStage,
  duration: Date.now() - stageStartTime,
  skipped: wasSkipped
});

// Track skip rate
analytics.track('intro_skipped', {
  stage: currentStage,
  method: 'hotkey' | 'session' | 'cookie'
});
```

---

**Status**: Ready for implementation
**Priority**: 🔥🔥🔥 CRITICAL
**Estimated Time**: 1-2 days for core fixes
