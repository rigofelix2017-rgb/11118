# Mobile Testing Guide - void2

Comprehensive mobile testing guide for iOS and Android devices.

## Test Devices

### iOS (Primary)
- **iPhone 14 Pro** (iOS 17+) - Latest flagship
- **iPhone 12** (iOS 15+) - Mid-range
- **iPhone SE (3rd gen)** (iOS 15+) - Small screen
- **iPad Pro 12.9"** (iPadOS 16+) - Large tablet

### Android (Primary)
- **Samsung Galaxy S23** (Android 13+) - Latest flagship
- **Google Pixel 7** (Android 13+) - Stock Android
- **Samsung Galaxy A53** (Android 12+) - Mid-range
- **OnePlus 10 Pro** (Android 13+) - Alternative flagship

### iOS (Secondary)
- iPhone 11 (iOS 15+)
- iPhone XR (iOS 15+)
- iPad Air (iPadOS 15+)

### Android (Secondary)
- Samsung Galaxy S21 (Android 12+)
- Xiaomi 12 (Android 12+)
- Motorola Edge 30 (Android 12+)

## Screen Resolutions

### iOS
- **iPhone SE**: 375x667 (small)
- **iPhone 12/13/14**: 390x844 (standard)
- **iPhone 14 Pro Max**: 430x932 (large)
- **iPad Pro**: 1024x1366 (tablet)

### Android
- **Small**: 360x640 (Galaxy A series)
- **Medium**: 412x915 (Pixel)
- **Large**: 430x932 (Galaxy S series)
- **Tablet**: 800x1280 (Galaxy Tab)

## Mobile-Specific Features

### ✅ Touch Controls
- [ ] Virtual joystick responsive
- [ ] Joystick works in all areas
- [ ] Multi-touch gestures work
- [ ] Touch targets 44x44px minimum
- [ ] No accidental touches
- [ ] Smooth touch tracking

### ✅ Virtual Joystick
- [ ] Appears on touch
- [ ] Follows finger movement
- [ ] Dead zone configured correctly
- [ ] Visual feedback clear
- [ ] Works in landscape
- [ ] Works in portrait
- [ ] Respects safe areas

### ✅ Screen Orientation
- [ ] Landscape mode optimal
- [ ] Portrait mode usable
- [ ] Rotation handled smoothly
- [ ] No layout breaks on rotate
- [ ] Controls reposition correctly
- [ ] Chat stays accessible

### ✅ Keyboard Handling
- [ ] Virtual keyboard doesn't hide game
- [ ] Viewport adjusts correctly
- [ ] Chat scrolls into view
- [ ] Keyboard dismisses properly
- [ ] No input lag

### ✅ Performance
- [ ] 30+ FPS on most devices
- [ ] No overheating (15min+ gameplay)
- [ ] Battery drain acceptable
- [ ] Memory usage stable
- [ ] Smooth animations
- [ ] No stuttering

### ✅ Network
- [ ] Works on 4G/LTE
- [ ] Works on WiFi
- [ ] Handles network switches
- [ ] Offline mode graceful
- [ ] Reconnection works
- [ ] Low bandwidth mode

### ✅ Audio
- [ ] Works with device muted
- [ ] Works with silent mode (iOS)
- [ ] Volume buttons control game
- [ ] Headphones work
- [ ] Bluetooth speakers work
- [ ] No audio lag

## iOS-Specific Testing

### Safari Mobile
- [ ] WebGL renders correctly
- [ ] Audio plays after tap
- [ ] Cookies persist (check ITP)
- [ ] LocalStorage works
- [ ] No white screen on load
- [ ] Home screen web app works

### Notch Support (iPhone X+)
- [ ] Safe areas respected
- [ ] No content under notch
- [ ] UI adapts to notch
- [ ] Landscape notch handled
- [ ] Status bar visible

### iOS Gestures
- [ ] Back swipe doesn't conflict
- [ ] Home indicator visible
- [ ] Pull-to-refresh disabled
- [ ] Pinch-to-zoom disabled
- [ ] No accidental gestures

### iOS Audio Policy
- [ ] Audio resumes after interruption
- [ ] Silent mode respected
- [ ] Ringer switch detected
- [ ] Background audio pauses
- [ ] Earpiece/speaker switch works

## Android-Specific Testing

### Chrome Mobile
- [ ] WebGL renders correctly
- [ ] Audio works immediately
- [ ] Cookies persist
- [ ] Performance good
- [ ] No layout issues

### Navigation Buttons
- [ ] Back button handled
- [ ] Home button handled
- [ ] Recents button handled
- [ ] Gesture navigation works

### Android Keyboard
- [ ] Keyboard doesn't break layout
- [ ] Input fields accessible
- [ ] Keyboard dismisses
- [ ] No viewport zoom

### Android Audio
- [ ] Media volume correct
- [ ] No audio conflicts
- [ ] Headphone detection
- [ ] Bluetooth works

## Testing Checklist

### Initial Load
- [ ] Splash screen displays
- [ ] Assets load progressively
- [ ] No white screen
- [ ] Loading indicator visible
- [ ] Load time < 5 seconds

### Intro Sequence
- [ ] Epilepsy warning readable
- [ ] Beta notice readable
- [ ] Mini game playable on touch
- [ ] Portal animation smooth
- [ ] Skip button accessible
- [ ] Touch targets adequate

### Onboarding
- [ ] Dialog modal centered
- [ ] Text readable (16px+ font)
- [ ] Buttons easy to tap
- [ ] Progress bar visible
- [ ] Steps advance correctly

### Game World
- [ ] 3D world renders
- [ ] Character visible
- [ ] Buildings render
- [ ] Other players visible
- [ ] UI elements positioned
- [ ] No overlap with controls

### Movement Controls
- [ ] Virtual joystick smooth
- [ ] Direction accurate
- [ ] Speed feels right
- [ ] Character rotates correctly
- [ ] Animations play

### Building Interactions
- [ ] Tap buildings to open modal
- [ ] Modal readable on small screens
- [ ] Scrolling works
- [ ] Buttons accessible
- [ ] Close button easy to tap

### Chat System
- [ ] Input field accessible
- [ ] Keyboard doesn't hide chat
- [ ] Messages readable
- [ ] Send button works
- [ ] Emoji keyboard works (iOS)

### Mobile UI
- [ ] All UI elements visible
- [ ] No horizontal scroll
- [ ] Font sizes readable
- [ ] Buttons large enough
- [ ] Colors contrast well
- [ ] Dark mode supported

## Performance Testing

### FPS Monitoring
```typescript
let lastTime = performance.now();
let frameCount = 0;

function measureFPS() {
  const now = performance.now();
  frameCount++;
  
  if (now >= lastTime + 1000) {
    const fps = Math.round((frameCount * 1000) / (now - lastTime));
    console.log(`FPS: ${fps}`);
    frameCount = 0;
    lastTime = now;
  }
  
  requestAnimationFrame(measureFPS);
}
measureFPS();
```

### Memory Monitoring
- Use Chrome DevTools Remote Debugging
- Monitor heap size over time
- Check for memory leaks (15min+ test)
- Target: < 300MB on mobile

### Battery Impact
- Play for 30 minutes
- Monitor battery drain (should be < 30%)
- Check device temperature
- Ensure no thermal throttling

## Remote Debugging

### iOS Safari
1. Enable Web Inspector on iPhone (Settings > Safari > Advanced)
2. Connect iPhone to Mac via USB
3. Open Safari > Develop > [Your iPhone]
4. Inspect web page

### Android Chrome
1. Enable USB Debugging on Android
2. Connect to computer via USB
3. Open chrome://inspect in desktop Chrome
4. Click "Inspect" on your device

## Emulator Testing

### iOS Simulator (Xcode)
```bash
# Open in iOS Simulator
open -a Simulator
# Navigate to localhost:5173 in Safari
```

### Android Emulator (Android Studio)
```bash
# Start emulator
emulator -avd Pixel_7_API_33
# Navigate to localhost:5173 in Chrome
```

### Browser DevTools Device Mode
- Chrome: F12 > Toggle Device Toolbar (Ctrl+Shift+M)
- Test responsive layouts
- Limited touch simulation
- No actual device features

## Common Mobile Issues

### Issue: Viewport Zoom
**Solution**: 
```html
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
```

### Issue: 300ms Touch Delay
**Solution**:
```css
button, a {
  touch-action: manipulation;
}
```

### Issue: Overscroll Bounce (iOS)
**Solution**:
```css
body {
  overscroll-behavior: none;
}
```

### Issue: Keyboard Pushes Content
**Solution**:
```typescript
window.addEventListener('resize', () => {
  // Adjust UI when keyboard appears
  const viewportHeight = window.visualViewport?.height || window.innerHeight;
  document.body.style.height = `${viewportHeight}px`;
});
```

### Issue: Text Too Small
**Solution**: Minimum 16px font for body text, 14px for small text

### Issue: Buttons Too Small
**Solution**: Minimum 44x44px touch targets (Apple HIG), 48x48px (Material Design)

## Accessibility on Mobile

### Screen Readers
- [ ] VoiceOver (iOS) compatible
- [ ] TalkBack (Android) compatible
- [ ] ARIA labels present
- [ ] Navigation logical
- [ ] Buttons describable

### Motor Accessibility
- [ ] Touch targets large enough
- [ ] No precise gestures required
- [ ] Alternative input methods
- [ ] Adjustable sensitivity

### Visual Accessibility
- [ ] High contrast mode
- [ ] Zoom works (if enabled)
- [ ] Color blind friendly
- [ ] Dark mode available

## Network Testing

### Connection Types
- [ ] 4G LTE (fast)
- [ ] 3G (slow)
- [ ] WiFi (fast)
- [ ] Airplane mode (offline)
- [ ] Switch between networks

### Throttling in DevTools
1. Open Chrome DevTools
2. Network tab > Throttling
3. Select "Slow 3G" or "Fast 3G"
4. Test load times and gameplay

## Mobile UX Best Practices

### Touch Targets
- Minimum 44x44px (iOS)
- Minimum 48x48px (Android)
- 8px spacing between targets

### Font Sizes
- Body: 16px minimum
- Small text: 14px minimum
- Headings: 20px+ minimum

### Contrast
- WCAG AA: 4.5:1 for normal text
- WCAG AA: 3:1 for large text
- Test in bright sunlight

### Loading States
- Show skeleton screens
- Progressive loading
- Optimistic UI updates
- Clear error messages

## Testing Tools

### BrowserStack
- Test on real devices remotely
- Record sessions
- Screenshot comparison

### Sauce Labs
- Automated mobile testing
- Multiple device coverage

### LambdaTest
- Cross-browser mobile testing
- Real device cloud

### Chrome DevTools
- Device mode
- Network throttling
- Remote debugging

## Sign-Off Checklist

- [ ] Tested on 4+ iOS devices (various sizes)
- [ ] Tested on 4+ Android devices (various manufacturers)
- [ ] Performance acceptable (30+ FPS)
- [ ] Battery drain acceptable (< 30%/hr)
- [ ] No memory leaks detected
- [ ] All gestures work correctly
- [ ] Keyboard doesn't break UI
- [ ] Audio works on all devices
- [ ] Network switching handled
- [ ] Touch controls responsive

---

**Last Updated**: November 2025  
**Tested Devices**: iPhone 14 Pro, Pixel 7, Galaxy S23, iPad Pro  
**Status**: ✅ Mobile optimized and tested
