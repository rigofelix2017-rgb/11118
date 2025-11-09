# Intro Sequence - Visual Flow Diagram

## Current Flow (Buggy)

```
┌─────────────────────────────────────────────────────────────┐
│ 1. PAGE LOAD                                                │
│    ├─ React Query starts session check (/api/session/me)   │
│    ├─ Cookie check: isCookieTrue(BETA_NOTICE_COOKIE)       │
│    └─ Cookie check: isCookieTrue(EPILEPSY_WARNING_COOKIE)  │
└─────────────────────────────────────────────────────────────┘
                           ↓
    ╔══════════════════════════════════════════════════════╗
    ║ ⚠️  RACE CONDITION HERE                              ║
    ║ Component renders BEFORE session check completes     ║
    ╚══════════════════════════════════════════════════════╝
                           ↓
┌─────────────────────────────────────────────────────────────┐
│ 2. FIRST RENDER (Too Early!)                               │
│    betaNoticeAcknowledged = false (from cookie)            │
│    epilepsyWarningAcknowledged = false (from cookie)       │
│    voidIntroCompleted = false                              │
└─────────────────────────────────────────────────────────────┘
                           ↓
                    Renders Beta Notice
                           ↓
    ╔══════════════════════════════════════════════════════╗
    ║ ❌ BUG: Session check completes AFTER render         ║
    ║ Auto-skip effect runs, but modals already shown      ║
    ║ Result: Flash of intro content before skip           ║
    ╚══════════════════════════════════════════════════════╝
                           ↓
┌─────────────────────────────────────────────────────────────┐
│ 3. AUTO-SKIP EFFECT (Too Late)                             │
│    if (hasSession) {                                       │
│      setBetaNoticeAcknowledged(true) ← Changes state       │
│      setEpilepsyWarningAcknowledged(true)                  │
│      setVoidIntroCompleted(true)                           │
│    }                                                       │
└─────────────────────────────────────────────────────────────┘
                           ↓
                    Re-render (skips to game)
```

---

## Fixed Flow (Correct)

```
┌─────────────────────────────────────────────────────────────┐
│ 1. PAGE LOAD                                                │
│    ├─ React Query starts session check (/api/session/me)   │
│    ├─ Cookie check: isCookieTrue(BETA_NOTICE_COOKIE)       │
│    └─ Cookie check: isCookieTrue(EPILEPSY_WARNING_COOKIE)  │
└─────────────────────────────────────────────────────────────┘
                           ↓
    ╔══════════════════════════════════════════════════════╗
    ║ ✅ LOADING GUARD (FIX #1)                            ║
    ║ if (isSessionLoading) return <LoadingScreen />       ║
    ║ Component waits for session check                    ║
    ╚══════════════════════════════════════════════════════╝
                           ↓
         ┌─────────────────┴─────────────────┐
         │                                   │
         ↓                                   ↓
┌──────────────────────┐      ┌──────────────────────────────┐
│ Session EXISTS       │      │ NO Session                   │
│ hasSession = true    │      │ hasSession = false           │
└──────────────────────┘      └──────────────────────────────┘
         │                                   │
         ↓                                   ↓
┌──────────────────────┐      ┌──────────────────────────────┐
│ AUTO-SKIP LOGIC      │      │ CHECK COOKIES                │
│ Skip all intros      │      │ if (!betaNoticeAcknowledged) │
│ Go to game directly  │      │   → Show Beta Notice         │
└──────────────────────┘      └──────────────────────────────┘
         │                                   │
         │                                   ↓
         │                    ┌──────────────────────────────┐
         │                    │ User clicks "I Understand"   │
         │                    │ setCookie(BETA_NOTICE, true) │
         │                    │ setBetaNoticeAcknowledged    │
         │                    └──────────────────────────────┘
         │                                   │
         │                                   ↓
         │                    ┌──────────────────────────────┐
         │                    │ if (!epilepsyWarningAck...)  │
         │                    │   → Show Epilepsy Warning    │
         │                    └──────────────────────────────┘
         │                                   │
         │                                   ↓
         │                    ┌──────────────────────────────┐
         │                    │ User clicks "I Understand"   │
         │                    │ setCookie(EPILEPSY, true)    │
         │                    │ setEpilepsyWarningAck...     │
         │                    └──────────────────────────────┘
         │                                   │
         │                                   ↓
         │                    ┌──────────────────────────────┐
         │                    │ if (!voidIntroCompleted)     │
         │                    │   → Show VoidSplashScreen    │
         │                    └──────────────────────────────┘
         │                                   │
         │                                   ↓
         │                    ┌──────────────────────────────┐
         │                    │ VOID INTRO STAGES            │
         │                    │ 1. Gears Unlocking (auto)    │
         │                    │ 2. Mini-game (interactive)   │
         │                    │ 3. Portal (auto)             │
         │                    └──────────────────────────────┘
         │                                   │
         │                                   ↓
         │                    ┌──────────────────────────────┐
         │                    │ onComplete() called          │
         │                    │ setVoidIntroCompleted(true)  │
         │                    └──────────────────────────────┘
         │                                   │
         └───────────────────┬───────────────┘
                             ↓
               ┌──────────────────────────────┐
               │ if (!hasConnected)           │
               │   → Show Wallet Connection   │
               └──────────────────────────────┘
                             ↓
               ┌──────────────────────────────┐
               │ User connects with Coinbase  │
               │ onWalletConnected() called   │
               │ setHasConnected(true)        │
               └──────────────────────────────┘
                             ↓
               ┌──────────────────────────────┐
               │ GAME WORLD RENDER            │
               │ GameInterface + GameWorld    │
               └──────────────────────────────┘
```

---

## State Machine Diagram

```
┌───────────────┐
│  INITIAL      │
│  Loading...   │ ← isSessionLoading = true
└───────┬───────┘
        │
        ↓ (session check completes)
        │
    ┌───┴────┐
    │        │
    ↓        ↓
┌─────┐  ┌────────┐
│ Has │  │   No   │
│ Sess│  │ Session│
└──┬──┘  └───┬────┘
   │         │
   ↓         ↓
┌──────┐  ┌──────────────┐
│ Skip │  │ BETA_NOTICE  │
│  to  │  │ Modal        │
│ Game │  └──────┬───────┘
└──────┘         │
   │             ↓
   │      ┌──────────────┐
   │      │ EPILEPSY_    │
   │      │ WARNING      │
   │      │ Modal        │
   │      └──────┬───────┘
   │             │
   │             ↓
   │      ┌──────────────┐
   │      │ VOID_INTRO   │
   │      │ Stage: Gears │
   │      └──────┬───────┘
   │             │
   │             ↓
   │      ┌──────────────┐
   │      │ VOID_INTRO   │
   │      │ Stage: Game  │
   │      └──────┬───────┘
   │             │
   │             ↓
   │      ┌──────────────┐
   │      │ VOID_INTRO   │
   │      │ Stage: Portal│
   │      └──────┬───────┘
   │             │
   └──────┬──────┘
          │
          ↓
   ┌──────────────┐
   │ WALLET_      │
   │ CONNECTION   │
   └──────┬───────┘
          │
          ↓
   ┌──────────────┐
   │ GAME_WORLD   │
   │ (Playing)    │
   └──────────────┘
```

---

## Cookie Lifecycle

```
FIRST VISIT (No Cookies)
========================
document.cookie = ""
  ↓
Show Beta Notice
  ↓
User clicks "I Understand"
  ↓
setCookie("beta_notice_acknowledged", "true", 365)
  ↓
document.cookie = "beta_notice_acknowledged=true; path=/; max-age=31536000; SameSite=Lax; Secure"
  ↓
Show Epilepsy Warning
  ↓
User clicks "I Understand"
  ↓
setCookie("epilepsy_warning_acknowledged", "true", 365)
  ↓
document.cookie = "beta_notice_acknowledged=true; epilepsy_warning_acknowledged=true; ..."


SECOND VISIT (Cookies Exist, No Session)
=========================================
document.cookie = "beta_notice_acknowledged=true; epilepsy_warning_acknowledged=true"
  ↓
isCookieTrue("beta_notice_acknowledged") = true
isCookieTrue("epilepsy_warning_acknowledged") = true
  ↓
Skip Beta Notice ✅
Skip Epilepsy Warning ✅
  ↓
Show Void Intro (still need to complete)
  ↓
After completion, skip on next visit


THIRD VISIT (Cookies + Session Exist)
======================================
document.cookie = "beta_notice_acknowledged=true; epilepsy_warning_acknowledged=true; session=abc123"
  ↓
/api/session/me returns { sessionId: "abc123", walletAddress: "0x..." }
  ↓
hasSession = true
  ↓
Skip ALL intros ✅✅✅
  ↓
Auto-reconnect to game
```

---

## Session Storage for Void Intro Stages

```
INTERRUPTED INTRO
=================
User on Stage: Mini-game
  ↓
sessionStorage.setItem("void_intro_stage", "minigame")
  ↓
User closes tab/browser
  ↓
User reopens page
  ↓
sessionStorage.getItem("void_intro_stage") = "minigame"
  ↓
Resume from Mini-game stage ✅


COMPLETED INTRO
===============
User completes Portal stage
  ↓
onComplete() called
  ↓
sessionStorage.removeItem("void_intro_stage")
  ↓
Next visit starts from beginning (unless cookies/session skip)
```

---

## Timing Diagram (Race Condition Fix)

### BEFORE (Buggy)
```
Time →
0ms    100ms   200ms   300ms   400ms
│      │       │       │       │
│      │       │       │       │
├─ Component renders (shows Beta Notice)
│      │       │       │       │
│      ├─ Session API call completes
│      │       │       │       │
│      ├─ Auto-skip effect runs
│      │       │       │       │
│      │       ├─ Re-render (skips to game)
│      │       │       │       │
        ↑
    ❌ User sees flash of Beta Notice
```

### AFTER (Fixed)
```
Time →
0ms    100ms   200ms   300ms   400ms
│      │       │       │       │
│      │       │       │       │
├─ Component renders (shows LOADING screen)
│      │       │       │       │
│      ├─ Session API call completes
│      │       │       │       │
│      ├─ Re-render (hasSession = true, skip to game)
│      │       │       │       │
│      │       │       │       │
        ↑
    ✅ User never sees Beta Notice
```

---

## Error Paths

```
SESSION CHECK TIMEOUT
=====================
Page load
  ↓
Session API call starts
  ↓
5 seconds pass (no response)
  ↓
useSession timeout triggers
  ↓
isLoading = false
hasSession = false
  ↓
Proceed to intro sequence (safe fallback)


COOKIE BLOCKED
==============
setCookie("beta_notice_acknowledged", "true")
  ↓
Verify: getCookie("beta_notice_acknowledged")
  ↓
Result: null (cookie blocked)
  ↓
Console warning: "⚠️ Cookie failed to set"
  ↓
User will see intro every time (degraded experience)


PORTAL STAGE HANG
=================
Portal stage starts
  ↓
2000ms timer (normal completion)
  ↓
5000ms safety timer (backup)
  ↓
If animation hangs, safety timer fires
  ↓
Force complete intro
  ↓
Continue to wallet connection
```

---

## Force Skip Hotkey Path

```
User stuck on any intro screen
  ↓
Press: Ctrl + Shift + S
  ↓
Keyboard event listener fires
  ↓
setBetaNoticeAcknowledged(true)
setEpilepsyWarningAcknowledged(true)
setVoidIntroCompleted(true)
  ↓
setCookie(BETA_NOTICE_COOKIE, "true")
setCookie(EPILEPSY_WARNING_COOKIE, "true")
  ↓
Toast notification: "Intro Skipped"
  ↓
Re-render → Wallet connection screen
```

---

## Browser DevTools Flow

```
Clear All State
===============
Application Tab → Cookies → Delete all
  ↓
Application Tab → Session Storage → Clear
  ↓
Console → Type: location.reload()
  ↓
Fresh first-time user experience


Verify Cookie Security
======================
Application Tab → Cookies → Check table
  ├─ Name: beta_notice_acknowledged
  ├─ Value: true
  ├─ Path: /
  ├─ Expires: [1 year from now]
  ├─ SameSite: Lax
  └─ Secure: ✅ (if HTTPS)


Monitor Intro Flow
==================
Console Tab → Filter: "🔍 Intro Flow State"
  ↓
See debug output every state change:
  {
    isSessionLoading: false,
    hasSession: true,
    betaNoticeAcknowledged: true,
    epilepsyWarningAcknowledged: true,
    voidIntroCompleted: true,
    hasConnected: true
  }
```

---

## Production Deploy Checklist

```
Pre-Deploy
==========
☐ Test locally with cleared cookies
☐ Test with existing session
☐ Test force skip hotkey (Ctrl+Shift+S)
☐ Verify console debug messages
☐ Check cookie expiration dates
☐ Test on slow 3G network


Deploy
======
☐ Deploy to staging environment
☐ Test HTTPS cookie security
☐ Verify SameSite=Lax works
☐ Test across browsers (Chrome, Safari, Firefox)
☐ Test on mobile (iOS, Android)
☐ Monitor error logs for 24 hours


Post-Deploy
===========
☐ Check analytics for intro completion rate
☐ Monitor skip rate (should be high for returning users)
☐ Check for cookie-related errors in logs
☐ Verify session persistence across refreshes
☐ Collect user feedback on intro experience
```

---

**Visual Summary:**

```
        ┌──────────────────────┐
        │   PAGE LOAD          │
        └──────────┬───────────┘
                   ↓
        ┌──────────────────────┐
        │   LOADING GUARD      │ ← FIX #1
        │   (Wait for session) │
        └──────────┬───────────┘
                   ↓
        ┌──────────┴───────────┐
        │                      │
        ↓                      ↓
┌───────────────┐    ┌─────────────────┐
│ Has Session   │    │  No Session     │
│ → Skip Intros │    │  → Show Intros  │
└───────┬───────┘    └────────┬────────┘
        │                     │
        │                     ↓
        │          ┌─────────────────────┐
        │          │ Beta → Warning →    │
        │          │ Gears → Game →      │
        │          │ Portal              │
        │          └─────────┬───────────┘
        │                    │
        └────────┬───────────┘
                 ↓
        ┌─────────────────────┐
        │  Wallet Connection  │
        └─────────┬───────────┘
                  ↓
        ┌─────────────────────┐
        │    GAME WORLD       │
        └─────────────────────┘
```

