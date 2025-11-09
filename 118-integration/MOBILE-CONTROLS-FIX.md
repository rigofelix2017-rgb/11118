# Mobile Controls Architecture Fix

## Current Problem

**Issue:** Mobile joystick bypasses the game engine, causing:
- Jitter and rubber-banding
- Wall clipping (no collision detection)
- Non-camera-relative movement
- Network spam (sends every 10ms instead of 50ms throttle)

**Root Cause:** 
- `mobile-controls.tsx` uses `setInterval(10ms)` to directly mutate player position
- `game-interface.tsx` adds deltas to `currentPlayer.position` and calls `handleMove`
- This bypasses `GameWorld`'s camera-relative movement, collision checks, and network throttle

**Keyboard players don't have this issue** because `GameWorld` handles:
- Camera-relative movement calculations
- Collision detection with walls/objects
- 20fps network throttle (50ms)
- Run speed modifiers
- Proper position normalization

---

## Solution: 3-Phase Implementation

### Phase 1: Add Mobile Vector to GameWorld ✅

Add refs to store mobile joystick state in `game-world.tsx`:

```typescript
// After existing refs (around line 150)
const mobileVectorRef = useRef<{x: number; y: number}>({ x: 0, y: 0 });
const isMobileActiveRef = useRef(false);
```

Expose setter via useImperativeHandle:

```typescript
// In useImperativeHandle (around line 180)
useImperativeHandle(ref, () => ({
  getGameEngine: () => gameEngineRef.current,
  setMobileVector: (vector: { x: number; y: number }) => {
    mobileVectorRef.current = vector;
    isMobileActiveRef.current = Math.abs(vector.x) > 0.01 || Math.abs(vector.y) > 0.01;
  }
}), []);
```

Blend mobile input into game loop (after line 360):

```typescript
// After keyboard movement calculation
if (isMobileActiveRef.current) {
  const alpha = gameEngineRef.current?.getCameraAlpha() || 0;
  
  const forwardX = -Math.cos(alpha);
  const forwardY = -Math.sin(alpha);
  const rightX = -Math.sin(alpha);
  const rightY = Math.cos(alpha);
  
  dx += forwardX * mobileVectorRef.current.y + rightX * mobileVectorRef.current.x;
  dy += forwardY * mobileVectorRef.current.y + rightY * mobileVectorRef.current.x;
}
```

---

### Phase 2: Refactor MobileControls ✅

Change interface from delta-based to vector-based:

```typescript
interface MobileControlsProps {
  onDirectionChange: (vector: { x: number; y: number }) => void; // CHANGED
  onInteract: () => void;
  onRingBlast: () => void;
}
```

Replace `setInterval` with `requestAnimationFrame`:

```typescript
useEffect(() => {
  if (joystick.isActive) {
    const updateFrame = () => {
      const direction = currentDirectionRef.current;
      
      // Emit normalized vector ([-1, 1] range)
      onDirectionChange({
        x: direction.x,
        y: direction.y
      });
      
      requestRef.current = requestAnimationFrame(updateFrame);
    };
    
    requestRef.current = requestAnimationFrame(updateFrame);
    
    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  } else {
    onDirectionChange({ x: 0, y: 0 });
    
    if (requestRef.current) {
      cancelAnimationFrame(requestRef.current);
      requestRef.current = null;
    }
  }
}, [joystick.isActive, onDirectionChange]);
```

---

### Phase 3: Update GameInterface ✅

Replace `handleMobileMove` with new handler:

```typescript
const handleMobileDirectionChange = useCallback((vector: { x: number; y: number }) => {
  if (gameWorldRef.current) {
    gameWorldRef.current.setMobileVector?.(vector);
  }
}, []);
```

Update MobileControls usage:

```typescript
<MobileControls
  onDirectionChange={handleMobileDirectionChange}
  onInteract={handleMobileInteract}
  onRingBlast={handleMobileRingBlast}
/>
```

---

## Backward-Compatible Adapter (LAME Package)

For repos without Babylon engine integration:

```typescript
// mobile-controls-adapter.tsx
import { MobileControls } from './mobile-controls';
import { useCallback, useRef } from 'react';

interface MobileControlsAdapterProps {
  onMove: (direction: { x: number; y: number }) => void;
  onInteract: () => void;
  onAction?: () => void;
}

export function MobileControlsAdapter({
  onMove,
  onInteract,
  onAction
}: MobileControlsAdapterProps) {
  const lastUpdateRef = useRef(Date.now());
  
  const handleDirectionChange = useCallback((vector: { x: number; y: number }) => {
    const now = Date.now();
    const deltaTime = now - lastUpdateRef.current;
    
    if (deltaTime < 50) return; // Throttle to 20fps
    
    lastUpdateRef.current = now;
    
    const moveSpeed = 4.3;
    onMove({
      x: vector.x * moveSpeed,
      y: vector.y * moveSpeed
    });
  }, [onMove]);
  
  return (
    <MobileControls
      onDirectionChange={handleDirectionChange}
      onInteract={onInteract}
      onRingBlast={onAction || (() => {})}
    />
  );
}
```

---

## Benefits After Fix

### Performance
- ✅ Network: 100 msgs/sec → 20 msgs/sec (80% reduction)
- ✅ 60fps (requestAnimationFrame) vs ~100fps (setInterval)
- ✅ Stops when tab backgrounded

### Gameplay
- ✅ Camera-relative movement
- ✅ Collision detection works
- ✅ Run speed modifiers apply
- ✅ No wall clipping or rubber-banding

---

## Testing Checklist

- [ ] Desktop: Verify keyboard controls still work
- [ ] iOS: Drag joystick, verify camera-relative movement
- [ ] Android: Test joystick smoothness
- [ ] Simultaneous WASD + joystick input
- [ ] Network throttle (verify 20fps in dev tools)
- [ ] Wall collision detection works
- [ ] No rubber-banding during movement

---

**Status:** Ready for implementation  
**Estimated Time:** 1-2 days  
**Risk:** Low (can be feature-flagged and rolled back)
