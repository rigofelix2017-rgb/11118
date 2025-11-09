# Browser Compatibility Guide - void2

Detailed browser compatibility matrix and testing guidelines for void2 deployment.

## Supported Browsers

### ✅ Fully Supported (Tier 1)

**Desktop**:
- **Chrome 90+** (Recommended)
- **Firefox 88+**
- **Safari 14+** (macOS/iOS)
- **Edge 90+** (Chromium-based)

**Mobile**:
- **Chrome Mobile 90+** (Android)
- **Safari Mobile 14+** (iOS)

### ⚠️ Partially Supported (Tier 2)

**Desktop**:
- **Opera 76+** (most features work)
- **Brave 1.24+** (privacy settings may affect cookies)

**Mobile**:
- **Samsung Internet 14+** (WebGL performance varies)
- **Firefox Mobile 88+** (virtual joystick needs testing)

### ❌ Not Supported

- Internet Explorer (all versions - EOL)
- Safari < 14 (WebGL issues)
- Chrome < 90 (missing APIs)
- Old Android browsers (< Android 8)

## Feature Compatibility Matrix

| Feature | Chrome | Firefox | Safari | Edge | Mobile Chrome | Mobile Safari |
|---------|--------|---------|--------|------|---------------|---------------|
| WebGL 2.0 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Canvas 2D | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Web Audio API | ✅ | ✅ | ✅ | ✅ | ✅ | ⚠️ (requires interaction) |
| LocalStorage | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| SessionStorage | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Cookies | ✅ | ✅ | ⚠️ (ITP restrictions) | ✅ | ✅ | ⚠️ (ITP restrictions) |
| IndexedDB | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| WebSockets | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Touch Events | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Pointer Events | ✅ | ✅ | ⚠️ (limited) | ✅ | ✅ | ⚠️ (limited) |
| Service Workers | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Web3 (MetaMask) | ✅ | ✅ | ⚠️ (extension required) | ✅ | ⚠️ (needs app) | ⚠️ (needs app) |

## Known Browser Issues

### Safari (Desktop & Mobile)

**Issue**: Intelligent Tracking Prevention (ITP)
- **Impact**: Cookies may expire after 7 days
- **Solution**: Use SameSite=Lax, localStorage fallback
- **Code**: Already implemented in cookie-utils.ts

**Issue**: Audio requires user interaction
- **Impact**: Background music won't autoplay
- **Solution**: Play audio on first click/touch
- **Code**: Audio system handles this

**Issue**: WebGL performance
- **Impact**: Lower FPS on some devices
- **Solution**: Reduce particle effects, lower resolution

### Firefox

**Issue**: Canvas performance slower than Chrome
- **Impact**: May see slight FPS drop
- **Solution**: Optimize render loops, use OffscreenCanvas

**Issue**: Different cookie handling
- **Impact**: Cookie persistence varies
- **Solution**: Test thoroughly, use verification

### Mobile Browsers

**Issue**: Virtual keyboard covers UI
- **Impact**: Chat input may be obscured
- **Solution**: Use viewport height fixes, scroll into view

**Issue**: Touch event delays (300ms)
- **Impact**: Input feels sluggish
- **Solution**: Use touch-action CSS, FastClick (if needed)

**Issue**: Memory constraints
- **Impact**: Game may crash on low-end devices
- **Solution**: Limit asset sizes, aggressive cleanup

## Testing Checklist

### Chrome (Desktop)
- [ ] All features work at 60fps
- [ ] DevTools show no console errors
- [ ] Network tab shows efficient requests
- [ ] Memory usage stable (<500MB)
- [ ] Audio plays correctly
- [ ] Cookies persist across sessions

### Firefox (Desktop)
- [ ] WebGL rendering correct
- [ ] Audio works (no crackling)
- [ ] Cookies persist
- [ ] Performance acceptable (30+ fps)
- [ ] No privacy warnings
- [ ] Extensions don't break game

### Safari (Desktop)
- [ ] WebGL works (no white screen)
- [ ] Audio plays after interaction
- [ ] ITP doesn't break session
- [ ] Performance acceptable
- [ ] No webkit-specific bugs
- [ ] High DPI displays render correctly

### Edge (Desktop)
- [ ] All Chrome features work
- [ ] No Edge-specific issues
- [ ] Cookies work correctly
- [ ] Performance matches Chrome

### Chrome Mobile (Android)
- [ ] Touch controls responsive
- [ ] Virtual joystick works
- [ ] Screen rotation handled
- [ ] No layout issues
- [ ] Audio works
- [ ] Performance acceptable (30+ fps)

### Safari Mobile (iOS)
- [ ] Touch events work
- [ ] Audio requires tap (acceptable)
- [ ] No white screen of death
- [ ] Landscape mode works
- [ ] Notch handled correctly (iPhone X+)
- [ ] Performance acceptable

## Browser-Specific Fixes

### Safari Audio Fix

```typescript
// Already implemented in audio system
const enableAudio = () => {
  if (!audioStarted) {
    audioContext.resume();
    audioStarted = true;
  }
};

// Call on first user interaction
document.addEventListener('touchstart', enableAudio, { once: true });
document.addEventListener('click', enableAudio, { once: true });
```

### Safari Cookie Fix

```typescript
// Already implemented in cookie-utils.ts
export function setCookie(name: string, value: string, maxAge: number = COOKIE_MAX_AGE): void {
  if (typeof document === 'undefined') return;
  
  const isProduction = typeof window !== 'undefined' && window.location.protocol === 'https:';
  const secureFlag = isProduction ? ' Secure;' : '';
  const cookieString = `${name}=${value}; path=/; max-age=${maxAge}; SameSite=Lax;${secureFlag}`;
  
  document.cookie = cookieString;
  
  // Verify with fallback to localStorage
  const verified = getCookie(name) === value;
  if (!verified && typeof window !== 'undefined') {
    localStorage.setItem(`fallback_${name}`, value);
  }
}
```

### Mobile Viewport Fix

```html
<!-- Already in index.html -->
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="mobile-web-app-capable" content="yes">
```

### iOS Notch Safe Area

```css
/* Already in global CSS */
body {
  padding: env(safe-area-inset-top) env(safe-area-inset-right) env(safe-area-inset-bottom) env(safe-area-inset-left);
}
```

## Performance Targets

| Browser | Target FPS | Max Memory | Load Time |
|---------|-----------|------------|-----------|
| Chrome Desktop | 60 fps | 500 MB | < 3s |
| Firefox Desktop | 60 fps | 600 MB | < 4s |
| Safari Desktop | 60 fps | 500 MB | < 4s |
| Edge Desktop | 60 fps | 500 MB | < 3s |
| Chrome Mobile | 30 fps | 300 MB | < 5s |
| Safari Mobile | 30 fps | 300 MB | < 5s |

## Debugging Tools

### Chrome DevTools
- **Performance**: Record gameplay, analyze FPS
- **Memory**: Heap snapshots, check for leaks
- **Network**: Monitor API calls, asset loading
- **Console**: Check for errors, warnings

### Firefox Developer Tools
- **Performance**: Similar to Chrome
- **Network**: Request monitoring
- **Storage**: Inspect cookies, localStorage

### Safari Web Inspector
- **Timelines**: Performance profiling
- **Storage**: Cookie inspection
- **Console**: Error logging
- **Resources**: Asset loading

## Progressive Enhancement

**Core Features** (work everywhere):
- 2D canvas rendering
- Basic movement (WASD)
- Chat system
- Building modals

**Enhanced Features** (modern browsers):
- WebGL effects
- Advanced audio
- Particle systems
- Smooth animations

**Fallbacks**:
- WebGL → Canvas 2D
- Web Audio → HTML5 Audio
- Cookies → localStorage
- WebSockets → Long polling (if needed)

## User Agent Detection

```typescript
// Not recommended, use feature detection instead
const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
const isChrome = /Chrome/.test(navigator.userAgent);

// Better: Feature detection
const hasWebGL = !!document.createElement('canvas').getContext('webgl2');
const hasAudio = typeof AudioContext !== 'undefined';
const hasCookies = navigator.cookieEnabled;
```

## Testing Commands

```bash
# Run cross-browser tests
npm run test:browsers

# Start dev server for mobile testing
npm run dev -- --host

# Build for production
npm run build

# Preview production build
npm run preview
```

## Browser Support Policy

**Updates**:
- Test on latest 2 versions of each browser
- Monitor usage analytics
- Drop support when < 1% users

**Communication**:
- Show warning for unsupported browsers
- Provide download links for modern browsers
- Graceful degradation where possible

---

**Last Updated**: November 2025  
**Tested Browsers**: Chrome 120, Firefox 121, Safari 17, Edge 120  
**Status**: ✅ All Tier 1 browsers tested and working
