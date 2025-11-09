# Mobile UX Overhaul Implementation Guide

## Overview

Reorganize mobile UI with bottom toolbar, optimized panels, touch targets, safe area support, and keyboard handling.

---

## Bottom Toolbar Design

### Layout

```
┌─────────────────────────────────────┐
│         Game Viewport               │
│                                     │
│                                     │
└─────────────────────────────────────┘
┌─────────────────────────────────────┐
│  [☰]  [♫]  [💬]  [🎒]  [⋯]         │  ← 60px height
└─────────────────────────────────────┘
```

### 5 Primary Actions

1. **☰ Menu** - Slide-out from left (settings, profile, logout)
2. **♫ Jukebox** - Bottom sheet (queue, add song, current playing)
3. **💬 Chat** - Slide-out from right (proximity + global)
4. **🎒 Inventory** - Full-screen modal (5 tabs)
5. **⋯ More** - Bottom sheet (housing, land, agency, wallet)

---

## Panel Types

### Slide-Outs (Side Panels)

```typescript
// menu-slide-out.tsx
export function MenuSlideOut({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  return (
    <div 
      className={`
        fixed top-0 left-0 h-full w-80 bg-black/95 border-r border-cyan-500/30
        transform transition-transform duration-300 z-50
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}
      style={{
        paddingTop: 'env(safe-area-inset-top)',
        paddingBottom: 'env(safe-area-inset-bottom)',
        paddingLeft: 'env(safe-area-inset-left)'
      }}
    >
      {/* Menu content */}
    </div>
  );
}
```

### Bottom Sheets

```typescript
// jukebox-bottom-sheet.tsx
export function JukeboxBottomSheet({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [height, setHeight] = useState(400);

  return (
    <div 
      className={`
        fixed bottom-0 left-0 right-0 bg-black/95 border-t border-cyan-500/30
        transform transition-transform duration-300 z-50 rounded-t-3xl
        ${isOpen ? 'translate-y-0' : 'translate-y-full'}
      `}
      style={{
        height: `${height}px`,
        paddingBottom: 'env(safe-area-inset-bottom)',
        paddingLeft: 'env(safe-area-inset-left)',
        paddingRight: 'env(safe-area-inset-right)'
      }}
    >
      {/* Drag handle */}
      <div className="w-12 h-1 bg-cyan-500/30 rounded-full mx-auto my-2" />
      
      {/* Jukebox content */}
    </div>
  );
}
```

### Full-Screen Modals

```typescript
// inventory-modal.tsx (already created in INVENTORY-SYSTEM-IMPLEMENTATION.md)
export function InventoryModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/90 z-50 overflow-auto">
      {/* Full inventory panel */}
    </div>
  );
}
```

---

## Safe Area Insets

### Implementation

```css
/* globals.css */
:root {
  --safe-area-inset-top: env(safe-area-inset-top);
  --safe-area-inset-right: env(safe-area-inset-right);
  --safe-area-inset-bottom: env(safe-area-inset-bottom);
  --safe-area-inset-left: env(safe-area-inset-left);
}

/* For iPhone notch/Dynamic Island */
@supports (padding: env(safe-area-inset-top)) {
  .bottom-toolbar {
    padding-bottom: calc(env(safe-area-inset-bottom) + 8px);
  }
  
  .top-bar {
    padding-top: calc(env(safe-area-inset-top) + 8px);
  }
}
```

### Viewport Meta Tag

```html
<!-- index.html -->
<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
```

---

## Touch Target Optimization

### Minimum Sizes

```typescript
// Button component with proper touch targets
export function MobileButton({ children, ...props }: ButtonProps) {
  return (
    <button 
      className="min-h-[44px] min-w-[44px] px-4 py-2"  // Apple HIG: 44px
      {...props}
    >
      {children}
    </button>
  );
}

// For Android (Material Design: 48px)
export function MobileButtonAndroid({ children, ...props }: ButtonProps) {
  return (
    <button 
      className="min-h-[48px] min-w-[48px] px-4 py-2"
      {...props}
    >
      {children}
    </button>
  );
}
```

### Spacing

```css
/* Minimum 8px gap between interactive elements */
.toolbar-buttons {
  display: flex;
  gap: 8px;
  padding: 8px;
}
```

---

## Keyboard Handling

### Detect Keyboard Visibility

```typescript
// use-keyboard-visible.ts
import { useState, useEffect } from 'react';

export function useKeyboardVisible() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (!window.visualViewport) return;

    const handleResize = () => {
      const viewport = window.visualViewport!;
      const keyboardVisible = viewport.height < window.innerHeight * 0.75;
      setIsVisible(keyboardVisible);
    };

    window.visualViewport.addEventListener('resize', handleResize);
    return () => window.visualViewport?.removeEventListener('resize', handleResize);
  }, []);

  return isVisible;
}
```

### Hide UI When Keyboard Visible

```typescript
// game-interface.tsx
const isKeyboardVisible = useKeyboardVisible();

return (
  <>
    {/* Game viewport */}
    
    {/* Hide toolbar when keyboard visible */}
    {!isKeyboardVisible && (
      <BottomToolbar />
    )}
  </>
);
```

### Prevent Zoom on Input Focus

```css
/* Prevent iOS zoom on input focus */
input, textarea, select {
  font-size: 16px; /* Minimum to prevent zoom */
}
```

---

## Swipe Gestures

### Implementation

```typescript
// use-swipe-gesture.ts
import { useState, TouchEvent } from 'react';

export function useSwipeGesture(onSwipeLeft?: () => void, onSwipeRight?: () => void) {
  const [touchStart, setTouchStart] = useState(0);

  const handleTouchStart = (e: TouchEvent) => {
    setTouchStart(e.touches[0].clientX);
  };

  const handleTouchEnd = (e: TouchEvent) => {
    const touchEnd = e.changedTouches[0].clientX;
    const diff = touchStart - touchEnd;

    // Minimum 50px swipe
    if (Math.abs(diff) < 50) return;

    if (diff > 0) {
      // Swipe left
      onSwipeLeft?.();
    } else {
      // Swipe right
      onSwipeRight?.();
    }
  };

  return { handleTouchStart, handleTouchEnd };
}
```

### Usage

```typescript
// game-interface.tsx
const [showMenu, setShowMenu] = useState(false);
const [showChat, setShowChat] = useState(false);

const swipe = useSwipeGesture(
  () => setShowChat(true),  // Swipe left → open chat
  () => setShowMenu(true)   // Swipe right → open menu
);

<div 
  onTouchStart={swipe.handleTouchStart}
  onTouchEnd={swipe.handleTouchEnd}
>
  {/* Game viewport */}
</div>
```

---

## Bottom Sheet Drag Handle

### Implementation

```typescript
// use-drag-handle.ts
import { useState, TouchEvent } from 'react';

export function useDragHandle(initialHeight: number, onClose: () => void) {
  const [height, setHeight] = useState(initialHeight);
  const [startY, setStartY] = useState(0);

  const handleTouchStart = (e: TouchEvent) => {
    setStartY(e.touches[0].clientY);
  };

  const handleTouchMove = (e: TouchEvent) => {
    const currentY = e.touches[0].clientY;
    const diff = startY - currentY;
    setHeight(Math.max(100, Math.min(window.innerHeight - 100, initialHeight + diff)));
  };

  const handleTouchEnd = (e: TouchEvent) => {
    const currentY = e.changedTouches[0].clientY;
    const diff = currentY - startY;

    // If dragged down > 100px, close
    if (diff > 100) {
      onClose();
    } else {
      // Snap back to initial height
      setHeight(initialHeight);
    }
  };

  return { height, handleTouchStart, handleTouchMove, handleTouchEnd };
}
```

---

## 4-Week Implementation Timeline

### Week 1: Bottom Toolbar + Slide-Outs
- [ ] Create bottom toolbar component
- [ ] Implement menu slide-out (left)
- [ ] Implement chat slide-out (right)
- [ ] Add safe area insets
- [ ] Test on iOS/Android

### Week 2: Bottom Sheets
- [ ] Implement jukebox bottom sheet
- [ ] Implement "More" bottom sheet
- [ ] Add drag handle
- [ ] Add swipe-to-dismiss
- [ ] Test drag behavior

### Week 3: Touch Optimization + Keyboard
- [ ] Update all buttons to 44px/48px
- [ ] Add 8px spacing
- [ ] Implement keyboard detection
- [ ] Hide UI when keyboard visible
- [ ] Prevent zoom on input focus

### Week 4: Swipe Gestures + Polish
- [ ] Add swipe left/right gestures
- [ ] Add haptic feedback
- [ ] Performance optimization
- [ ] Final testing on devices
- [ ] Documentation

---

## Before/After Comparison

### Before
- ❌ Floating panels everywhere
- ❌ Inconsistent behavior
- ❌ Small touch targets (32px)
- ❌ No safe area support
- ❌ Toolbar blocks game when keyboard visible

### After
- ✅ Organized bottom toolbar
- ✅ Consistent panel types
- ✅ Large touch targets (44px/48px)
- ✅ Safe area insets for notch
- ✅ Hide toolbar when keyboard visible
- ✅ Swipe gestures for quick access

---

## Testing Checklist

### iOS Testing
- [ ] iPhone 14 Pro (Dynamic Island)
- [ ] iPhone SE (Home button)
- [ ] iPad
- [ ] Safe area insets work
- [ ] No zoom on input focus
- [ ] Swipe gestures work
- [ ] Bottom sheet drag works

### Android Testing
- [ ] Pixel 7 (gesture nav)
- [ ] Samsung Galaxy (button nav)
- [ ] Tablet
- [ ] Touch targets 48px
- [ ] Keyboard detection works
- [ ] Swipe gestures work

---

**Status:** Ready for implementation  
**Estimated Time:** 4 weeks  
**Dependencies:** shadcn/ui, Tailwind CSS
