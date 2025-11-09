# Mobile Controls Guide

## Overview

The mobile controls package provides a complete touch-based control system with:
- **Virtual Joystick** - Smooth 360° movement control (left side)
- **Action Buttons** - Customizable touch buttons (right side)
- **Safe Area Support** - iPhone notch and home indicator awareness
- **Keyboard Detection** - Auto-adjusts layout when mobile keyboard appears
- **Performance Mode** - Optimized rendering for mobile devices

---

## Quick Start

### 1. Setup Providers

Wrap your app with the mobile providers:

```tsx
import { MobileLayoutProvider } from './contexts/mobile-layout-context';
import { MobileControls } from './components/mobile-controls';

function App() {
  const handleMove = (direction: { x: number; y: number }) => {
    console.log('Player moving:', direction);
    // Update player position
  };

  const handleInteract = () => {
    console.log('Interact button pressed');
  };

  const handleAction = () => {
    console.log('Action button pressed');
  };

  return (
    <MobileLayoutProvider>
      <YourGameContent />
      
      {/* Mobile Controls Overlay */}
      <MobileControls
        onMove={handleMove}
        onInteract={handleInteract}
        onAction={handleAction}
      />
    </MobileLayoutProvider>
  );
}
```

### 2. Mobile Detection Hook

Use the `useIsMobile` hook to adapt your UI:

```tsx
import { useIsMobile } from './hooks/use-mobile';

function MyComponent() {
  const isMobile = useIsMobile();

  return (
    <div className={isMobile ? 'mobile-layout' : 'desktop-layout'}>
      {isMobile ? <MobileUI /> : <DesktopUI />}
    </div>
  );
}
```

---

## Components

### MobileControls

Virtual joystick and action buttons for mobile devices.

**Props:**
- `onMove: (direction: { x: number; y: number }) => void` - Movement callback
  - `x`: -1 to 1 (left to right)
  - `y`: -1 to 1 (up to down)
  - Called ~100 times per second while joystick is active
- `onInteract?: () => void` - Optional interact button (🔍 icon)
- `onAction?: () => void` - Optional action button (💥 icon)
- `className?: string` - Additional CSS classes

**Features:**
- Automatically hidden on desktop (>768px width)
- Hidden when overlays are open (chat, settings, etc.)
- 50px maximum joystick radius
- Smooth visual feedback with glow effects
- Touch event handling with preventDefault

**Styling:**
- Cyan/aqua theme for joystick (#00ffff)
- Green gradient for joystick knob (#00ff41)
- Purple gradient for action button (#ff00ff)
- Vintage CRT aesthetic with glows and shadows

---

### MobileLayoutProvider

Context provider for mobile-specific layout features.

**Provides:**
```typescript
interface MobileLayoutContextType {
  // Safe area insets (iPhone notch, home indicator)
  safeAreaInsets: {
    top: number;
    bottom: number;
    left: number;
    right: number;
  };
  
  // Viewport state
  viewport: {
    height: number;          // Window height
    visualHeight: number;    // Height minus keyboard
    isKeyboardOpen: boolean; // Is mobile keyboard visible
  };
  
  // Overlay state (null when no overlay)
  activeOverlay: 'chat' | 'social' | 'settings' | null;
  setActiveOverlay: (overlay: ...) => void;
  
  // Performance mode (auto-enabled on mobile)
  isMobilePerformanceMode: boolean;
  setMobilePerformanceMode: (enabled: boolean) => void;
  
  // Mobile detection
  isMobile: boolean;
}
```

**Usage:**
```tsx
import { useMobileLayout } from './contexts/mobile-layout-context';

function MyComponent() {
  const { 
    safeAreaInsets, 
    viewport, 
    activeOverlay,
    setActiveOverlay 
  } = useMobileLayout();

  return (
    <div style={{
      paddingTop: safeAreaInsets.top,
      paddingBottom: safeAreaInsets.bottom
    }}>
      <button onClick={() => setActiveOverlay('chat')}>
        Open Chat
      </button>
    </div>
  );
}
```

---

## Hooks

### useIsMobile

Detects mobile devices using window width.

```tsx
import { useIsMobile } from './hooks/use-mobile';

function ResponsiveComponent() {
  const isMobile = useIsMobile();
  
  return isMobile ? <MobileView /> : <DesktopView />;
}
```

**Detection:**
- Breakpoint: 768px
- Returns `true` if width < 768px
- Listens to window resize events
- Updates automatically on orientation change

### useMobileLayout

Access mobile layout context (see MobileLayoutProvider above).

---

## Movement System

### Joystick Physics

The virtual joystick provides smooth, continuous movement:

```typescript
// Movement speed: 4.3 units per frame (40% faster than keyboard)
const moveSpeed = 4.3;

// Update rate: ~100fps
const updateInterval = 10; // milliseconds

// Direction calculation:
// - deltaX/Y: Joystick offset from center (-50 to 50)
// - normalized: deltaX/Y / maxDistance (50)
// - clamped: -1 to 1
// - Result: { x: -1 to 1, y: -1 to 1 }

onMove({
  x: normalizedX * moveSpeed,
  y: normalizedY * moveSpeed
});
```

### Isometric Movement Mapping

The joystick is designed for isometric game controls:

```
Joystick Direction → Game Movement
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Up-Left (W)       → x-=speed, y-=speed
Down-Right (S)    → x+=speed, y+=speed
Down-Left (A)     → x-=speed, y+=speed
Up-Right (D)      → x+=speed, y-=speed
```

Example integration:

```tsx
const handleMove = (direction: { x: number; y: number }) => {
  // Convert to your coordinate system
  const newX = playerX + direction.x;
  const newY = playerY + direction.y;
  
  // Update player position
  setPlayerPosition({ x: newX, y: newY });
  
  // Or send to server
  socket.emit('move', { x: newX, y: newY });
};
```

---

## Safe Area Handling

### CSS Custom Properties

The provider automatically sets CSS variables:

```css
/* Available in your stylesheets */
--safe-area-top: 44px;     /* iPhone notch */
--safe-area-bottom: 34px;  /* iPhone home indicator */
--safe-area-left: 0px;
--safe-area-right: 0px;
--vh: 1vh;                 /* Corrected viewport height */
```

### Usage in Components

```tsx
function Header() {
  const { safeAreaInsets } = useMobileLayout();
  
  return (
    <header style={{ 
      paddingTop: safeAreaInsets.top,
      height: `calc(60px + ${safeAreaInsets.top}px)`
    }}>
      Your Header
    </header>
  );
}
```

### CSS Example

```css
.mobile-header {
  padding-top: var(--safe-area-top);
  padding-bottom: var(--safe-area-bottom);
}

.fullscreen-mobile {
  height: calc(var(--vh, 1vh) * 100);
}
```

---

## Keyboard Detection

The provider automatically detects when the mobile keyboard appears:

```tsx
function ChatInput() {
  const { viewport } = useMobileLayout();
  
  useEffect(() => {
    if (viewport.isKeyboardOpen) {
      console.log('Keyboard opened!');
      console.log('Available height:', viewport.visualHeight);
    }
  }, [viewport.isKeyboardOpen, viewport.visualHeight]);
  
  return (
    <input 
      type="text"
      style={{
        // Position above keyboard
        bottom: viewport.isKeyboardOpen ? 0 : 'auto'
      }}
    />
  );
}
```

**Keyboard Detection Logic:**
- Triggers when window height changes by >150px
- `viewport.visualHeight` = actual visible height
- `viewport.isKeyboardOpen` = boolean flag
- Debounced by 100ms to avoid rapid updates

---

## Overlay Management

Hide controls when overlays are open:

```tsx
function Game() {
  const { activeOverlay, setActiveOverlay } = useMobileLayout();
  
  return (
    <>
      {/* Controls auto-hide when activeOverlay is not null */}
      <MobileControls onMove={handleMove} />
      
      {/* Chat overlay */}
      {activeOverlay === 'chat' && (
        <ChatOverlay onClose={() => setActiveOverlay(null)} />
      )}
      
      {/* Settings overlay */}
      {activeOverlay === 'settings' && (
        <SettingsOverlay onClose={() => setActiveOverlay(null)} />
      )}
      
      {/* Open overlay buttons */}
      <button onClick={() => setActiveOverlay('chat')}>
        Chat
      </button>
      <button onClick={() => setActiveOverlay('settings')}>
        Settings
      </button>
    </>
  );
}
```

**Supported Overlays:**
- `'chat'` - Chat interface
- `'social'` - Social/friends panel
- `'settings'` - Settings menu
- `null` - No overlay (controls visible)

---

## Performance Mode

Auto-enabled on mobile devices:

```tsx
function GameRenderer() {
  const { isMobilePerformanceMode, setMobilePerformanceMode } = useMobileLayout();
  
  return (
    <Canvas>
      <Renderer
        pixelRatio={isMobilePerformanceMode ? 1 : window.devicePixelRatio}
        shadows={!isMobilePerformanceMode}
        antialias={!isMobilePerformanceMode}
      />
      
      <button onClick={() => setMobilePerformanceMode(!isMobilePerformanceMode)}>
        Toggle Performance Mode
      </button>
    </Canvas>
  );
}
```

**Optimizations:**
- Lower pixel ratio (1x instead of 2x/3x)
- Reduced shadow quality
- Disabled antialiasing
- Lower particle counts
- Simplified shaders

---

## Testing

### Desktop Testing

Test mobile controls on desktop using Chrome DevTools:

1. Open DevTools (F12)
2. Click "Toggle device toolbar" (Ctrl+Shift+M)
3. Select mobile device (iPhone 14 Pro, etc.)
4. Refresh page
5. `useIsMobile()` will return `true`

### Test Checklist

- [ ] Joystick appears on mobile (<768px)
- [ ] Joystick hidden on desktop (>768px)
- [ ] Smooth movement in all directions
- [ ] Action buttons trigger callbacks
- [ ] Controls hidden when overlay opens
- [ ] Safe area insets applied correctly
- [ ] Keyboard detection works
- [ ] Orientation change handled
- [ ] Touch events don't conflict with scrolling

---

## Customization

### Custom Button Icons

```tsx
<MobileControls
  onMove={handleMove}
  onInteract={() => console.log('Custom interact')}
  onAction={() => console.log('Custom action')}
/>
```

Then modify the component to accept custom icons:

```tsx
// In mobile-controls.tsx
interface MobileControlsProps {
  // ... existing props
  interactIcon?: string;  // Custom emoji or icon
  actionIcon?: string;
}

// Usage
<MobileControls
  onMove={handleMove}
  interactIcon="⚔️"  // Sword
  actionIcon="🛡️"   // Shield
/>
```

### Custom Styling

```tsx
<MobileControls
  onMove={handleMove}
  className="custom-controls"
/>
```

```css
/* In your stylesheet */
.custom-controls {
  /* Override joystick colors */
  --joystick-bg: #ff0000;
  --joystick-knob: #ffff00;
  --button-primary: #00ff00;
}
```

### Adjust Movement Speed

```tsx
// In mobile-controls.tsx line ~70
const moveSpeed = 4.3; // Change this value

// Slower: 2.0 (walking speed)
// Default: 4.3 (running speed)
// Faster: 6.0 (sprint speed)
```

### Adjust Joystick Size

```tsx
// In mobile-controls.tsx line ~110
const maxDistance = 50; // Joystick radius in pixels

// Smaller: 30 (compact)
// Default: 50 (comfortable)
// Larger: 70 (easier to use)
```

---

## Best Practices

### 1. Always Wrap with Provider

```tsx
// ✅ CORRECT
<MobileLayoutProvider>
  <App />
  <MobileControls onMove={handleMove} />
</MobileLayoutProvider>

// ❌ WRONG - Will throw error
<App />
<MobileControls onMove={handleMove} />
```

### 2. Prevent Event Bubbling

The controls use `preventDefault()` on all touch events to prevent:
- Accidental scrolling
- Double-tap zoom
- Text selection
- Page refresh gestures

### 3. Handle Rapid Updates

`onMove` is called ~100 times per second. Throttle if needed:

```tsx
import { throttle } from 'lodash';

const handleMove = throttle((direction) => {
  // Your logic here
}, 16); // ~60fps instead of ~100fps
```

### 4. Test on Real Devices

Emulators don't perfectly replicate:
- Touch latency
- Safe area insets
- Keyboard behavior
- Performance characteristics

**Recommended test devices:**
- iPhone 14 Pro (notch, dynamic island)
- iPhone SE (home button, no notch)
- Samsung Galaxy S23 (Android)
- iPad Pro (tablet layout)

### 5. Combine with Keyboard Controls

Desktop users still need keyboard controls:

```tsx
function Game() {
  const isMobile = useIsMobile();
  
  useEffect(() => {
    if (isMobile) return; // Skip keyboard listeners on mobile
    
    const handleKeyDown = (e: KeyboardEvent) => {
      // WASD controls
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isMobile]);
  
  return (
    <>
      {/* Mobile controls (auto-hidden on desktop) */}
      <MobileControls onMove={handleMove} />
      
      {/* Your game */}
      <GameCanvas />
    </>
  );
}
```

---

## Dependencies

```json
{
  "react": "^18.2.0",
  "react-dom": "^18.2.0"
}
```

**No additional dependencies!** 
- Pure CSS styling (no CSS-in-JS libraries)
- Native touch events (no gesture libraries)
- Vanilla React hooks (no external state management)

---

## Browser Support

**Tested and working:**
- ✅ iOS Safari 14+
- ✅ Chrome Mobile 90+
- ✅ Firefox Mobile 90+
- ✅ Samsung Internet 15+
- ✅ Edge Mobile 90+

**Required APIs:**
- `window.matchMedia()` - For breakpoint detection
- `TouchEvent` - For touch handling
- CSS `env(safe-area-inset-*)` - For notch support
- `requestAnimationFrame` - For smooth rendering

---

## Troubleshooting

### Controls Not Appearing

**Check:**
1. Is screen width < 768px?
2. Is `MobileLayoutProvider` wrapping your app?
3. Is `activeOverlay` set to `null`?
4. Is the component mounted?

```tsx
// Debug
const isMobile = useIsMobile();
const { activeOverlay } = useMobileLayout();
console.log({ isMobile, activeOverlay });
// Should log: { isMobile: true, activeOverlay: null }
```

### Joystick Not Moving

**Check:**
1. Is `onMove` callback provided?
2. Are touch events being captured elsewhere?
3. Is CSS `pointer-events` blocking touches?

```tsx
// Add logging
const handleMove = (direction) => {
  console.log('MOVE:', direction);
  // Your logic
};
```

### Poor Performance

**Solutions:**
1. Enable performance mode:
```tsx
const { setMobilePerformanceMode } = useMobileLayout();
setMobilePerformanceMode(true);
```

2. Reduce update frequency:
```tsx
// In mobile-controls.tsx line ~77
const updateInterval = 16; // 60fps instead of 100fps
```

3. Throttle movement callback:
```tsx
const handleMove = throttle(updatePlayerPosition, 16);
```

### Safe Area Not Working

**iOS Setup Required:**

Add to your HTML `<head>`:
```html
<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
```

The `viewport-fit=cover` is essential for `env(safe-area-inset-*)` to work.

### Keyboard Not Detected

**Check:**
1. Are you on a real mobile device? (Desktop won't trigger)
2. Is an `<input>` or `<textarea>` focused?
3. Height change > 150px threshold?

```tsx
// Debug
const { viewport } = useMobileLayout();
console.log({
  height: viewport.height,
  visualHeight: viewport.visualHeight,
  isKeyboardOpen: viewport.isKeyboardOpen
});
```

---

## Examples

### Complete Integration

```tsx
import { MobileLayoutProvider, useMobileLayout } from './contexts/mobile-layout-context';
import { MobileControls } from './components/mobile-controls';
import { useIsMobile } from './hooks/use-mobile';
import { useState } from 'react';

function Game() {
  const [playerPos, setPlayerPos] = useState({ x: 0, y: 0 });
  const { activeOverlay, setActiveOverlay } = useMobileLayout();
  const isMobile = useIsMobile();

  const handleMove = (direction: { x: number; y: number }) => {
    setPlayerPos(prev => ({
      x: prev.x + direction.x,
      y: prev.y + direction.y
    }));
  };

  const handleInteract = () => {
    console.log('Interact at:', playerPos);
  };

  const handleAction = () => {
    console.log('Action!');
  };

  return (
    <div className="game-container">
      {/* Game Canvas */}
      <canvas width={800} height={600} />
      
      {/* Player Info */}
      <div className="player-info">
        Position: ({playerPos.x.toFixed(1)}, {playerPos.y.toFixed(1)})
        <br />
        Device: {isMobile ? 'Mobile' : 'Desktop'}
      </div>
      
      {/* Mobile Controls */}
      <MobileControls
        onMove={handleMove}
        onInteract={handleInteract}
        onAction={handleAction}
      />
      
      {/* UI Buttons */}
      {!activeOverlay && (
        <button onClick={() => setActiveOverlay('chat')}>
          Chat
        </button>
      )}
      
      {/* Chat Overlay */}
      {activeOverlay === 'chat' && (
        <div className="chat-overlay">
          <button onClick={() => setActiveOverlay(null)}>Close</button>
          <div className="chat-messages">...</div>
        </div>
      )}
    </div>
  );
}

function App() {
  return (
    <MobileLayoutProvider>
      <Game />
    </MobileLayoutProvider>
  );
}

export default App;
```

---

## License

Same as parent package (see main README.md)

## Support

For issues or questions:
1. Check this guide first
2. Review `mobile-controls.tsx` source code
3. Test on real mobile device
4. Check browser console for errors

**Common patterns available in this package:**
- ✅ Virtual joystick
- ✅ Action buttons
- ✅ Safe area handling
- ✅ Keyboard detection
- ✅ Overlay management
- ✅ Performance mode
- ✅ Responsive design
