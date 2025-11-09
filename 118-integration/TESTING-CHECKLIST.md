# Testing Checklist - void2

Comprehensive QA checklist for testing all features before deployment.

## Pre-Launch Testing

### ✅ Intro Sequence
- [ ] Epilepsy warning displays for 3 seconds
- [ ] Beta notice displays for 3 seconds
- [ ] Mini game loads and shows countdown (3-2-1-GO!)
- [ ] Click challenge completes correctly
- [ ] Portal animation plays
- [ ] Intro only shows once (cookie persistence)
- [ ] Skip button works (when enabled)
- [ ] Force skip hotkey works (Ctrl+Shift+S)
- [ ] Session loading doesn't cause flash
- [ ] Stage persistence works on refresh

### ✅ Authentication & Session
- [ ] Embedded wallet created automatically
- [ ] Session cookie persists across refreshes
- [ ] Session timeout fallback (5s max)
- [ ] Cookie security (SameSite, Secure in production)
- [ ] SSR safety (no document errors)
- [ ] Cookie verification warnings

### ✅ Onboarding Flow
- [ ] Onboarding shows for first-time users
- [ ] Step 1: Welcome + wallet confirmation
- [ ] Step 2: Controls tutorial
- [ ] Progress bar displays correctly (Step X of 2)
- [ ] localStorage tracking works
- [ ] onComplete callback fires
- [ ] Onboarding skippable after completion

### ✅ Game World
- [ ] 3D world loads correctly
- [ ] Character spawns at correct position
- [ ] Buildings render properly
- [ ] Other players visible
- [ ] Click detection works on buildings
- [ ] Camera follows player
- [ ] Depth sorting correct (no Z-fighting)

### ✅ Character Movement
- [ ] WASD controls work
- [ ] Click-to-move works (if enabled)
- [ ] Character animations play (idle, walk, run)
- [ ] Collision detection works
- [ ] Movement speed feels right
- [ ] No teleporting or jittering

### ✅ Building System
- [ ] Clicking buildings opens modal
- [ ] Building info displays correctly
- [ ] Category badges show correct colors
- [ ] Status badges accurate
- [ ] Feature cards render properly
- [ ] Action buttons functional
- [ ] Modal closes properly
- [ ] All 7 building types work:
  - [ ] Central Tower
  - [ ] Town Hall
  - [ ] Energy Crystal
  - [ ] Watchtower
  - [ ] Corner Market
  - [ ] Void Monument
  - [ ] Jukebox

### ✅ Audio System
- [ ] Intro music plays during sequence
- [ ] Background music loops in game
- [ ] UI sounds play (click, hover)
- [ ] Volume controls work
- [ ] Mute button works
- [ ] Audio persists across scenes
- [ ] No audio lag or crackling

### ✅ Chat System
- [ ] Chat input works
- [ ] Messages send correctly
- [ ] Messages display with username
- [ ] Chat scrolls properly
- [ ] Timestamps accurate
- [ ] System messages display
- [ ] Chat history persists

### ✅ Mobile Controls
- [ ] Virtual joystick works
- [ ] Touch controls responsive
- [ ] Action buttons functional
- [ ] UI scales correctly
- [ ] No overlap with game elements
- [ ] Landscape mode works
- [ ] Portrait mode works

### ✅ Web3 Integration (LAME)
- [ ] Embedded wallet created
- [ ] Wallet address displays
- [ ] Balance queries work
- [ ] Transaction signing works
- [ ] Smart wallet features functional
- [ ] Error handling graceful

### ✅ Performance
- [ ] FPS stable (30+ fps)
- [ ] No memory leaks
- [ ] Assets load quickly
- [ ] Smooth animations
- [ ] No stuttering during gameplay
- [ ] Network requests efficient

## Browser Compatibility

### Desktop
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)

### Mobile
- [ ] Chrome Mobile (Android)
- [ ] Safari Mobile (iOS)
- [ ] Samsung Internet
- [ ] Firefox Mobile

## Device Testing

### Mobile Devices
- [ ] iPhone 12/13/14 (iOS 15+)
- [ ] Samsung Galaxy S21/S22
- [ ] Google Pixel 6/7
- [ ] iPad (latest)

### Screen Sizes
- [ ] 320px (iPhone SE)
- [ ] 375px (iPhone X/11/12)
- [ ] 414px (iPhone Plus)
- [ ] 768px (iPad)
- [ ] 1024px (Desktop small)
- [ ] 1920px (Desktop large)

## Network Conditions

- [ ] Fast 3G (throttled)
- [ ] Slow 3G (throttled)
- [ ] Offline mode (graceful degradation)
- [ ] Flaky connection (intermittent)
- [ ] High latency (200ms+)

## Edge Cases

### Session & Auth
- [ ] Expired session handling
- [ ] Multiple tabs (same user)
- [ ] Logout and re-login
- [ ] Blocked cookies (incognito)
- [ ] Third-party cookie restrictions

### Interruptions
- [ ] Page refresh during intro
- [ ] Browser back button
- [ ] Tab focus loss
- [ ] Browser minimize
- [ ] Network disconnect

### Error Handling
- [ ] API failures graceful
- [ ] Asset load failures
- [ ] WebGL not supported
- [ ] Audio blocked by browser
- [ ] LocalStorage quota exceeded

## Accessibility

- [ ] Keyboard navigation works
- [ ] Screen reader compatible
- [ ] High contrast mode
- [ ] Focus indicators visible
- [ ] ARIA labels present
- [ ] Color blind friendly

## Security

- [ ] HTTPS enforced in production
- [ ] Cookies secure with SameSite
- [ ] No XSS vulnerabilities
- [ ] No CSRF vulnerabilities
- [ ] API endpoints authenticated
- [ ] Rate limiting in place

## Deployment Readiness

- [ ] Environment variables set
- [ ] Production build tested
- [ ] Database migrations complete
- [ ] CDN configured
- [ ] Error tracking enabled (Sentry/etc)
- [ ] Analytics configured
- [ ] Monitoring dashboards set up

## Critical Bugs Fixed

- [x] Intro sequence race condition (session timeout)
- [x] Cookie persistence in production (SameSite/Secure)
- [x] Stage persistence on refresh
- [x] Portal timeout fallback
- [x] Force skip hotkey
- [x] Debug logging available
- [x] Session timeout fallback

## Post-Launch Monitoring

- [ ] Error rates normal (<1%)
- [ ] Server response times good (<200ms)
- [ ] User retention metrics
- [ ] Conversion funnel tracking
- [ ] Performance metrics (Core Web Vitals)
- [ ] User feedback collection

## Sign-Off

- [ ] **Developer**: All features tested and working
- [ ] **QA**: All critical paths verified
- [ ] **Product**: Acceptance criteria met
- [ ] **Security**: Security review complete
- [ ] **DevOps**: Deployment plan approved

---

**Last Updated**: November 2025  
**Version**: 1.0  
**Status**: ✅ Ready for Production
