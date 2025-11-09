# Mobile Controls Implementation Guide

## Overview

Mobile controls provide touch-based input for mobile devices featuring:
- **Virtual joystick** with camera-relative movement
- **Action buttons** (Interact + Ring Blast)
- **Safe area support** for iPhone notch/dynamic island
- **Performance optimized** (requestAnimationFrame, no jitter)
- **Collision detection** integrated with game engine
- **Network throttling** (20fps, 50ms intervals)

## 🗂️ File Locations

### LAME Package (web3-infrastructure/) - ✅ UPLOADED (Task 2)
**Location**: `web3-infrastructure/components/mobile-controls.tsx`
- ✅ Fixed version with requestAnimationFrame
- ✅ Camera-relative movement
- ✅ No wall clipping
- ✅ Network throttled
- **Status**: Battle-tested, production-ready

### 118-integration/05-mobile-controls/
**Location**: `118-integration/05-mobile-controls/`
- `mobile-controls.tsx` - Virtual joystick component
- `mobile-layout-context.tsx` - Layout provider with safe areas
- `mobile-layout-shell.tsx` - Wrapper for mobile layout
- `use-mobile.tsx` - Mobile detection hook
- `README.md` - Integration guide (602 lines)

**Status**: Complete implementation with documentation

## 🚀 Quick Start (5 Minutes)

### Option A: Use LAME Package (Recommended)

```tsx
import { MobileControls } from '@/web3-infrastructure/components/mobile-controls';
import { useMobile } from '@/web3-infrastructure/hooks/use-mobile';

function GameComponent() {
  const isMobile = useMobile();
  
  const handleMobileMove = (direction: { x: number; y: number }) => {
    // direction.x and direction.y are normalized (-1 to 1)
    const speed = 4;
    player.x += direction.x * speed;
    player.y += direction.y * speed;
  };
  
  return (
    <>
      <Canvas />
      {isMobile && (
        <MobileControls
          onMove={handleMobileMove}
          onInteract={() => console.log('Interact!')}
          onRingBlast={() => console.log('Ring Blast!')}
        />
      )}
    </>
  );
}
```

### Option B: Use from 118-integration

```tsx
import { MobileControls } from '@/118-integration/05-mobile-controls/mobile-controls';
import { useIsMobile } from '@/118-integration/05-mobile-controls/use-mobile';
```

## 🏗️ Architecture

### Problem Solved (OLD vs NEW)

**OLD Implementation (BROKEN):**
```typescript
// ❌ Direct position mutation every 10ms
setInterval(() => {
  currentPlayer.position.x += joystick.x * speed;
  currentPlayer.position.y += joystick.y * speed;
  handleMove(); // Spams network
}, 10);

// Issues:
// - Bypasses game engine (no collision detection)
// - Not camera-relative (wrong direction)
// - Network spam (10ms = 100 updates/sec)
// - Jitter and rubber-banding
// - Wall clipping
```

**NEW Implementation (FIXED):**
```typescript
// ✅ Report intent to game engine
useEffect(() => {
  let rafId: number;
  
  const update = () => {
    if (isJoystickActive) {
      // Report normalized vector (-1 to 1)
      onDirectionChange({ 
        x: normalizedX, 
        y: normalizedY 
      });
    }
    rafId = requestAnimationFrame(update);
  };
  
  update();
  return () => cancelAnimationFrame(rafId);
}, [isJoystickActive]);

// Benefits:
// ✅ Game engine handles collision detection
// ✅ Camera-relative movement
// ✅ Network throttled (50ms, 20fps)
// ✅ Smooth (requestAnimationFrame)
// ✅ No wall clipping
```

### Integration with GameWorld

**GameWorld receives mobile vector:**
```typescript
// In GameWorld.tsx
const mobileVectorRef = useRef({ x: 0, y: 0 });
const isMobileActiveRef = useRef(false);

useImperativeHandle(ref, () => ({
  getGameEngine: () => gameEngineRef.current,
  setMobileVector: (vector: { x: number; y: number }) => {
    mobileVectorRef.current = vector;
    isMobileActiveRef.current = Math.abs(vector.x) > 0.01 || Math.abs(vector.y) > 0.01;
  }
}), []);
```

**Game loop blends mobile + keyboard:**
```typescript
// In game loop (after keyboard movement)
if (isMobileActiveRef.current) {
  const alpha = gameEngine.getCameraAlpha();
  
  // Camera-relative basis vectors
  const forwardX = -Math.cos(alpha);
  const forwardY = -Math.sin(alpha);
  const rightX = -Math.sin(alpha);
  const rightY = Math.cos(alpha);
  
  // Blend mobile vector
  dx += forwardX * mobileVectorRef.current.y + rightX * mobileVectorRef.current.x;
  dy += forwardY * mobileVectorRef.current.y + rightY * mobileVectorRef.current.x;
  
  // Collision detection happens here
  // Network throttle happens here
  // All game engine features work correctly
}
```

## 🎮 Component API

### MobileControls Props

```typescript
interface MobileControlsProps {
  onMove: (direction: { x: number; y: number }) => void;
  onInteract: () => void;
  onRingBlast?: () => void; // Optional
  joystickSize?: number; // Default: 120
  joystickColor?: string; // Default: '#ffffff'
  buttonSize?: number; // Default: 60
}
```

### useMobile Hook

```typescript
function useMobile(): boolean;

// Usage:
const isMobile = useMobile();
// Returns true if screen width < 768px
// Updates on window resize
```

### MobileLayoutProvider

```typescript
interface MobileLayoutContextType {
  isMobile: boolean;
  safeAreaInsets: {
    top: number;
    bottom: number;
    left: number;
    right: number;
  };
}

// Usage:
<MobileLayoutProvider>
  <App />
</MobileLayoutProvider>
```

## 📱 Mobile Layout Integration

### Full App Setup

```tsx
import { MobileLayoutProvider } from '@/contexts/mobile-layout-context';
import { MobileLayoutShell } from '@/components/mobile-layout-shell';

function App() {
  return (
    <MobileLayoutProvider>
      <MobileLayoutShell>
        <YourGameComponent />
      </MobileLayoutShell>
    </MobileLayoutProvider>
  );
}
```

### Safe Area Support (iPhone Notch)

```css
/* Automatic safe area handling */
body {
  padding-top: env(safe-area-inset-top);
  padding-bottom: env(safe-area-inset-bottom);
  padding-left: env(safe-area-inset-left);
  padding-right: env(safe-area-inset-right);
}

/* MobileLayoutShell handles this automatically */
```

### Layout Shell Features

```tsx
function MobileLayoutShell({ children }: { children: React.ReactNode }) {
  const { isMobile, safeAreaInsets } = useMobileLayout();
  
  return (
    <div 
      className="mobile-layout-shell"
      style={{
        paddingTop: safeAreaInsets.top,
        paddingBottom: safeAreaInsets.bottom,
        paddingLeft: safeAreaInsets.left,
        paddingRight: safeAreaInsets.right,
      }}
    >
      {children}
    </div>
  );
}
```

## 🎨 Customization

### Change Joystick Appearance

```tsx
<MobileControls
  joystickSize={150}           // Larger joystick
  joystickColor="#00ff00"      // Green color
  buttonSize={70}              // Larger buttons
  onMove={handleMove}
  onInteract={handleInteract}
  onRingBlast={handleRingBlast}
/>
```

### Custom Joystick Styles

```css
/* Target joystick elements */
.mobile-joystick {
  opacity: 0.8; /* Slightly transparent */
}

.mobile-joystick-base {
  background: rgba(255, 255, 255, 0.2);
  border: 2px solid rgba(255, 255, 255, 0.4);
}

.mobile-joystick-stick {
  background: radial-gradient(circle, #ffffff, #cccccc);
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
}

.mobile-action-button {
  background: rgba(0, 255, 0, 0.3);
  border: 2px solid rgba(0, 255, 0, 0.6);
}
```

### Conditional Button Display

```tsx
function GameControls() {
  const isMobile = useMobile();
  const [canInteract, setCanInteract] = useState(false);
  
  return (
    <>
      {isMobile && (
        <MobileControls
          onMove={handleMove}
          onInteract={canInteract ? handleInteract : undefined}
          onRingBlast={handleRingBlast}
        />
      )}
    </>
  );
}
```

## 🔧 Integration Patterns

### Pattern 1: Direct GameWorld Integration

```tsx
function Game() {
  const gameWorldRef = useRef<GameWorldRef>(null);
  const isMobile = useMobile();
  
  const handleMobileMove = (direction: { x: number; y: number }) => {
    gameWorldRef.current?.setMobileVector(direction);
  };
  
  return (
    <>
      <GameWorld ref={gameWorldRef} />
      {isMobile && (
        <MobileControls
          onMove={handleMobileMove}
          onInteract={() => gameWorldRef.current?.interact()}
          onRingBlast={() => gameWorldRef.current?.ringBlast()}
        />
      )}
    </>
  );
}
```

### Pattern 2: State-Based Movement

```tsx
function Game() {
  const [mobileVector, setMobileVector] = useState({ x: 0, y: 0 });
  const isMobile = useMobile();
  
  useEffect(() => {
    // Update player position every frame
    const interval = setInterval(() => {
      if (Math.abs(mobileVector.x) > 0.01 || Math.abs(mobileVector.y) > 0.01) {
        updatePlayerPosition(mobileVector);
      }
    }, 50); // 20fps network throttle
    
    return () => clearInterval(interval);
  }, [mobileVector]);
  
  return (
    <>
      <Canvas />
      {isMobile && (
        <MobileControls
          onMove={setMobileVector}
          onInteract={handleInteract}
        />
      )}
    </>
  );
}
```

### Pattern 3: Babylon.js Integration

```tsx
function BabylonGame() {
  const sceneRef = useRef<Scene>(null);
  const playerRef = useRef<Mesh>(null);
  const isMobile = useMobile();
  
  const handleMobileMove = (direction: { x: number; y: number }) => {
    if (!playerRef.current || !sceneRef.current) return;
    
    const camera = sceneRef.current.activeCamera as ArcRotateCamera;
    const cameraAngle = camera.alpha;
    
    // Camera-relative movement
    const forward = new Vector3(-Math.cos(cameraAngle), 0, -Math.sin(cameraAngle));
    const right = new Vector3(-Math.sin(cameraAngle), 0, Math.cos(cameraAngle));
    
    const movement = forward.scale(direction.y).add(right.scale(direction.x));
    playerRef.current.position.addInPlace(movement.scale(0.1));
  };
  
  return (
    <>
      <BabylonScene ref={sceneRef} />
      {isMobile && (
        <MobileControls
          onMove={handleMobileMove}
          onInteract={handleInteract}
        />
      )}
    </>
  );
}
```

## 🐛 Troubleshooting

### Issue 1: Joystick movement in wrong direction

**Problem**: Movement doesn't match camera view

**Solution**: Ensure camera-relative calculations:
```typescript
// ❌ Wrong - absolute movement
const dx = direction.x * speed;
const dy = direction.y * speed;

// ✅ Correct - camera-relative
const alpha = camera.alpha;
const forwardX = -Math.cos(alpha);
const forwardY = -Math.sin(alpha);
const rightX = -Math.sin(alpha);
const rightY = Math.cos(alpha);

const dx = forwardX * direction.y + rightX * direction.x;
const dy = forwardY * direction.y + rightY * direction.x;
```

### Issue 2: Player clips through walls

**Problem**: Collision detection not working

**Solution**: Route through game engine:
```typescript
// ❌ Wrong - direct position mutation
player.position.x += direction.x;

// ✅ Correct - use game engine
gameWorldRef.current?.setMobileVector(direction);
// Game engine handles collision detection
```

### Issue 3: Jitter and rubber-banding

**Problem**: Too many network updates

**Solution**: Use game engine's throttle (already built-in):
```typescript
// Game engine throttles to 50ms (20fps) automatically
// No need to throttle in mobile controls
```

### Issue 4: Controls not showing on mobile

**Problem**: Detection not working

**Solution**: Check hook implementation:
```typescript
const isMobile = useMobile();
console.log('Is mobile:', isMobile); // Should be true on mobile

// Fallback:
const isMobile = window.innerWidth < 768;
```

### Issue 5: Joystick stuck after releasing

**Problem**: Touch events not cleaning up

**Solution**: Ensure proper cleanup:
```typescript
useEffect(() => {
  const handleTouchEnd = () => {
    setIsJoystickActive(false);
    onMove({ x: 0, y: 0 }); // Reset to zero
  };
  
  window.addEventListener('touchend', handleTouchEnd);
  return () => window.removeEventListener('touchend', handleTouchEnd);
}, []);
```

## 🧪 Testing Checklist

### Desktop Testing (Chrome DevTools)

1. Open Chrome DevTools (F12)
2. Toggle device toolbar (Ctrl+Shift+M)
3. Select mobile device (iPhone 12, Pixel 5, etc.)
4. Reload page
5. Verify:
   - [ ] Joystick appears in bottom-left
   - [ ] Action buttons appear in bottom-right
   - [ ] Joystick responds to mouse drag
   - [ ] Buttons respond to clicks
   - [ ] Movement is camera-relative
   - [ ] No wall clipping

### Mobile Testing (Real Devices)

**iOS (iPhone/iPad):**
- [ ] Safari: Joystick touch works
- [ ] Safari: Buttons work
- [ ] Safari: Safe area insets respected (notch)
- [ ] Chrome iOS: Controls work
- [ ] Landscape mode: Layout adjusts

**Android:**
- [ ] Chrome: Joystick touch works
- [ ] Chrome: Buttons work
- [ ] Firefox: Controls work
- [ ] Samsung Internet: Controls work
- [ ] Landscape mode: Layout adjusts

### Performance Testing

- [ ] No lag during movement
- [ ] requestAnimationFrame smooth (60fps)
- [ ] Network updates throttled (20fps, 50ms)
- [ ] Memory stable (no leaks)
- [ ] Battery usage acceptable

## 📚 API Reference

### MobileControls Component

```typescript
interface MobileControlsProps {
  onMove: (direction: { x: number; y: number }) => void;
  onInteract: () => void;
  onRingBlast?: () => void;
  joystickSize?: number; // Default: 120px
  joystickColor?: string; // Default: '#ffffff'
  buttonSize?: number; // Default: 60px
  className?: string;
}

// Direction vector:
// { x: -1 to 1, y: -1 to 1 }
// (0, 0) = no movement
// (1, 0) = right
// (0, 1) = forward
// (-1, 0) = left
// (0, -1) = backward
```

### useMobile Hook

```typescript
function useMobile(): boolean;

// Returns:
// - true if window.innerWidth < 768
// - Updates on window resize
// - Debounced (200ms)
```

### MobileLayoutProvider

```typescript
interface MobileLayoutContextType {
  isMobile: boolean;
  safeAreaInsets: {
    top: number;
    bottom: number;
    left: number;
    right: number;
  };
}

function useMobileLayout(): MobileLayoutContextType;
```

## 🚀 Deployment

### Production Checklist

- [ ] LAME package included (web3-infrastructure/)
- [ ] OR 05-mobile-controls/ files copied
- [ ] Mobile detection working
- [ ] Safe area insets configured
- [ ] Touch events tested on real devices
- [ ] Camera-relative movement verified
- [ ] Collision detection working
- [ ] Network throttle (50ms) confirmed
- [ ] Performance acceptable (60fps UI, 20fps network)

### Build Configuration

```json
// package.json
{
  "dependencies": {
    "react": "^18.0.0",
    "react-dom": "^18.0.0"
  }
}
```

### CSS Requirements

```css
/* Required for touch handling */
* {
  touch-action: manipulation; /* Prevent double-tap zoom */
}

/* Optional: Prevent text selection during joystick drag */
.mobile-joystick {
  -webkit-user-select: none;
  user-select: none;
}
```

## 💡 Best Practices

### 1. Always Check Mobile State

```tsx
const isMobile = useMobile();

return (
  <>
    <Canvas />
    {isMobile && <MobileControls {...props} />}
  </>
);
```

### 2. Use Camera-Relative Movement

```typescript
// Always calculate relative to camera
const alpha = camera.alpha;
const forward = new Vector3(-Math.cos(alpha), 0, -Math.sin(alpha));
const right = new Vector3(-Math.sin(alpha), 0, Math.cos(alpha));
```

### 3. Route Through Game Engine

```typescript
// Don't bypass collision detection
gameWorldRef.current?.setMobileVector(direction);
```

### 4. Throttle Network Updates

```typescript
// Game engine already throttles to 50ms
// No need to throttle in mobile controls
```

### 5. Clean Up Event Listeners

```typescript
useEffect(() => {
  const handleTouchEnd = () => setJoystickActive(false);
  window.addEventListener('touchend', handleTouchEnd);
  return () => window.removeEventListener('touchend', handleTouchEnd);
}, []);
```

## 📖 Related Documentation

**LAME Package**:
- `web3-infrastructure/components/mobile-controls.tsx` ✅ UPLOADED (Task 2)
- `web3-infrastructure/hooks/use-mobile.tsx` ✅ UPLOADED (Task 2)
- `web3-infrastructure/contexts/mobile-layout-context.tsx` ✅ UPLOADED (Task 2)
- `LAME-INTEGRATION-GUIDE.md` - LAME package usage

**118-Integration**:
- `118-integration/05-mobile-controls/README.md` (602 lines)
- `118-integration/05-mobile-controls/mobile-controls.tsx`
- `118-integration/05-mobile-controls/use-mobile.tsx`
- `118-integration/05-mobile-controls/mobile-layout-context.tsx`
- `118-integration/05-mobile-controls/mobile-layout-shell.tsx`

**Fixes**:
- `MOBILE-CONTROLS-FIX-PLAN.md` (370 lines) - Architecture fix details
- `MOBILE-UX-OVERHAUL-MASTER-PLAN.md` - Comprehensive UX plan

---

**Status**: ✅ Complete and uploaded to 11118 (Week 2 - Task 6)
**Last Updated**: 2024 (Week 2 upload)
**Files**: 1 component + 1 hook + 2 contexts + 1 shell
**LAME Package**: ✅ Already includes fixed mobile-controls.tsx
