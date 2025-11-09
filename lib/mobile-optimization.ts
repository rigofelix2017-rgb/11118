// Mobile Optimization Utilities
// Comprehensive mobile UX improvements for all systems

/**
 * MOBILE OPTIMIZATION STANDARDS
 * - Touch targets: Minimum 44x44px (Apple HIG) / 48x48dp (Material Design)
 * - Safe areas: Account for notches, rounded corners, home indicators
 * - Haptic feedback: Provide tactile response for all interactions
 * - Gesture support: Swipe, pinch, long-press where appropriate
 * - Performance: Optimize for 60fps on mobile devices
 */

// Touch Target Sizes
export const TOUCH_TARGETS = {
  // Minimum sizes (iOS Human Interface Guidelines)
  MIN_SIZE: 44, // pixels
  // Recommended sizes
  BUTTON: 48, // Standard button
  ICON: 44, // Icon button
  LIST_ITEM: 56, // List row
  TAB: 48, // Tab bar item
  CARD: 64, // Card minimum height
  // Spacing
  MIN_SPACING: 8, // Minimum space between targets
  COMFORTABLE_SPACING: 16, // Comfortable space
} as const;

// Safe Area Insets (for notches, rounded corners, home indicator)
export interface SafeAreaInsets {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

/**
 * Get safe area insets from CSS env() variables
 * Supports iOS notch, Android gesture navigation, etc.
 */
export function getSafeAreaInsets(): SafeAreaInsets {
  if (typeof window === 'undefined') {
    return { top: 0, right: 0, bottom: 0, left: 0 };
  }

  const style = getComputedStyle(document.documentElement);
  
  return {
    top: parseInt(style.getPropertyValue('--safe-area-inset-top') || '0', 10),
    right: parseInt(style.getPropertyValue('--safe-area-inset-right') || '0', 10),
    bottom: parseInt(style.getPropertyValue('--safe-area-inset-bottom') || '0', 10),
    left: parseInt(style.getPropertyValue('--safe-area-inset-left') || '0', 10),
  };
}

/**
 * Apply safe area padding to element
 */
export function applySafeAreaPadding(
  element: HTMLElement,
  sides: ('top' | 'right' | 'bottom' | 'left')[] = ['top', 'right', 'bottom', 'left']
) {
  const insets = getSafeAreaInsets();
  
  if (sides.includes('top')) element.style.paddingTop = `${insets.top}px`;
  if (sides.includes('right')) element.style.paddingRight = `${insets.right}px`;
  if (sides.includes('bottom')) element.style.paddingBottom = `${insets.bottom}px`;
  if (sides.includes('left')) element.style.paddingLeft = `${insets.left}px`;
}

// Haptic Feedback Patterns
export enum HapticPattern {
  LIGHT = 'light',
  MEDIUM = 'medium',
  HEAVY = 'heavy',
  SUCCESS = 'success',
  WARNING = 'warning',
  ERROR = 'error',
  SELECTION = 'selection',
}

/**
 * Trigger haptic feedback
 * Works on iOS (with Taptic Engine) and Android (with Vibration API)
 */
export function triggerHaptic(pattern: HapticPattern = HapticPattern.LIGHT) {
  if (typeof window === 'undefined' || !navigator) return;

  // iOS Haptic Engine (requires iOS 13+)
  if ('vibrate' in navigator) {
    const patterns: Record<HapticPattern, number | number[]> = {
      [HapticPattern.LIGHT]: 10,
      [HapticPattern.MEDIUM]: 20,
      [HapticPattern.HEAVY]: 30,
      [HapticPattern.SUCCESS]: [10, 50, 10],
      [HapticPattern.WARNING]: [20, 100, 20],
      [HapticPattern.ERROR]: [30, 100, 30, 100, 30],
      [HapticPattern.SELECTION]: 5,
    };

    navigator.vibrate(patterns[pattern]);
  }
}

// Gesture Recognition
export interface SwipeEvent {
  direction: 'up' | 'down' | 'left' | 'right';
  distance: number;
  duration: number;
  velocity: number;
}

/**
 * Add swipe gesture detection to element
 */
export function addSwipeGesture(
  element: HTMLElement,
  onSwipe: (event: SwipeEvent) => void,
  options: {
    threshold?: number; // Minimum distance for swipe (default: 50px)
    maxTime?: number; // Maximum time for swipe (default: 500ms)
  } = {}
) {
  const threshold = options.threshold || 50;
  const maxTime = options.maxTime || 500;

  let startX = 0;
  let startY = 0;
  let startTime = 0;

  const handleTouchStart = (e: TouchEvent) => {
    const touch = e.touches[0];
    startX = touch.clientX;
    startY = touch.clientY;
    startTime = Date.now();
  };

  const handleTouchEnd = (e: TouchEvent) => {
    const touch = e.changedTouches[0];
    const endX = touch.clientX;
    const endY = touch.clientY;
    const endTime = Date.now();

    const deltaX = endX - startX;
    const deltaY = endY - startY;
    const duration = endTime - startTime;

    // Check if gesture is fast enough
    if (duration > maxTime) return;

    const absX = Math.abs(deltaX);
    const absY = Math.abs(deltaY);

    // Check if movement is significant enough
    if (absX < threshold && absY < threshold) return;

    // Determine direction
    let direction: SwipeEvent['direction'];
    let distance: number;

    if (absX > absY) {
      // Horizontal swipe
      direction = deltaX > 0 ? 'right' : 'left';
      distance = absX;
    } else {
      // Vertical swipe
      direction = deltaY > 0 ? 'down' : 'up';
      distance = absY;
    }

    const velocity = distance / duration;

    onSwipe({ direction, distance, duration, velocity });
    triggerHaptic(HapticPattern.LIGHT);
  };

  element.addEventListener('touchstart', handleTouchStart, { passive: true });
  element.addEventListener('touchend', handleTouchEnd, { passive: true });

  // Return cleanup function
  return () => {
    element.removeEventListener('touchstart', handleTouchStart);
    element.removeEventListener('touchend', handleTouchEnd);
  };
}

/**
 * Add long-press gesture detection
 */
export function addLongPressGesture(
  element: HTMLElement,
  onLongPress: () => void,
  duration = 500
) {
  let timer: NodeJS.Timeout | null = null;
  let cancelled = false;

  const handleStart = () => {
    cancelled = false;
    timer = setTimeout(() => {
      if (!cancelled) {
        onLongPress();
        triggerHaptic(HapticPattern.MEDIUM);
      }
    }, duration);
  };

  const handleEnd = () => {
    cancelled = true;
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }
  };

  element.addEventListener('touchstart', handleStart, { passive: true });
  element.addEventListener('touchend', handleEnd, { passive: true });
  element.addEventListener('touchmove', handleEnd, { passive: true });
  element.addEventListener('touchcancel', handleEnd, { passive: true });

  return () => {
    if (timer) clearTimeout(timer);
    element.removeEventListener('touchstart', handleStart);
    element.removeEventListener('touchend', handleEnd);
    element.removeEventListener('touchmove', handleEnd);
    element.removeEventListener('touchcancel', handleEnd);
  };
}

// Performance Optimization
/**
 * Throttle function calls (useful for scroll/resize handlers)
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  return function (this: any, ...args: Parameters<T>) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

/**
 * Debounce function calls (useful for search inputs)
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout;
  return function (this: any, ...args: Parameters<T>) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func.apply(this, args), delay);
  };
}

/**
 * Request animation frame wrapper for smooth animations
 */
export function smoothAnimation(callback: (progress: number) => void, duration: number) {
  const startTime = performance.now();

  function animate(currentTime: number) {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);

    callback(progress);

    if (progress < 1) {
      requestAnimationFrame(animate);
    }
  }

  requestAnimationFrame(animate);
}

// Viewport and Device Detection
export interface ViewportInfo {
  width: number;
  height: number;
  isMobile: boolean;
  isTablet: boolean;
  isLandscape: boolean;
  isPortrait: boolean;
  devicePixelRatio: number;
}

/**
 * Get viewport information
 */
export function getViewportInfo(): ViewportInfo {
  if (typeof window === 'undefined') {
    return {
      width: 0,
      height: 0,
      isMobile: false,
      isTablet: false,
      isLandscape: false,
      isPortrait: false,
      devicePixelRatio: 1,
    };
  }

  const width = window.innerWidth;
  const height = window.innerHeight;
  const isLandscape = width > height;
  const isPortrait = !isLandscape;

  // Breakpoints
  const isMobile = width < 768;
  const isTablet = width >= 768 && width < 1024;

  return {
    width,
    height,
    isMobile,
    isTablet,
    isLandscape,
    isPortrait,
    devicePixelRatio: window.devicePixelRatio || 1,
  };
}

/**
 * Prevent zoom on double-tap (iOS)
 */
export function preventDoubleTapZoom() {
  if (typeof document === 'undefined') return;

  let lastTouchEnd = 0;

  document.addEventListener(
    'touchend',
    (event) => {
      const now = Date.now();
      if (now - lastTouchEnd <= 300) {
        event.preventDefault();
      }
      lastTouchEnd = now;
    },
    { passive: false }
  );
}

/**
 * Lock scroll (useful for modals)
 */
export function lockScroll() {
  if (typeof document === 'undefined') return;

  const scrollY = window.scrollY;
  document.body.style.position = 'fixed';
  document.body.style.top = `-${scrollY}px`;
  document.body.style.width = '100%';

  return () => unlockScroll(scrollY);
}

/**
 * Unlock scroll
 */
export function unlockScroll(previousScrollY?: number) {
  if (typeof document === 'undefined') return;

  document.body.style.position = '';
  document.body.style.top = '';
  document.body.style.width = '';

  if (previousScrollY !== undefined) {
    window.scrollTo(0, previousScrollY);
  }
}

// CSS Class Helpers for Mobile Optimization
export const MOBILE_CLASSES = {
  // Touch targets
  touchTarget: 'min-h-[44px] min-w-[44px]',
  touchButton: 'min-h-[48px] min-w-[48px]',
  touchListItem: 'min-h-[56px]',
  
  // Safe areas
  safeTop: 'pt-[env(safe-area-inset-top)]',
  safeBottom: 'pb-[env(safe-area-inset-bottom)]',
  safeLeft: 'pl-[env(safe-area-inset-left)]',
  safeRight: 'pr-[env(safe-area-inset-right)]',
  safeAll: 'p-[env(safe-area-inset-top)_env(safe-area-inset-right)_env(safe-area-inset-bottom)_env(safe-area-inset-left)]',
  
  // Tap highlighting
  noTapHighlight: '-webkit-tap-highlight-color-transparent',
  
  // Smooth scrolling
  smoothScroll: 'scroll-smooth -webkit-overflow-scrolling-touch',
  
  // Prevent text selection
  noSelect: 'select-none',
  
  // Active states
  activeScale: 'active:scale-95 transition-transform',
  activeOpacity: 'active:opacity-70 transition-opacity',
} as const;

/**
 * Generate Tailwind classes for mobile-optimized component
 */
export function getMobileOptimizedClasses(
  baseClasses: string,
  options: {
    touchTarget?: boolean;
    safeAreas?: boolean;
    activeState?: 'scale' | 'opacity';
  } = {}
): string {
  const classes = [baseClasses];

  if (options.touchTarget) {
    classes.push(MOBILE_CLASSES.touchTarget);
  }

  if (options.safeAreas) {
    classes.push(MOBILE_CLASSES.safeAll);
  }

  if (options.activeState === 'scale') {
    classes.push(MOBILE_CLASSES.activeScale);
  } else if (options.activeState === 'opacity') {
    classes.push(MOBILE_CLASSES.activeOpacity);
  }

  classes.push(MOBILE_CLASSES.noTapHighlight);

  return classes.join(' ');
}

// Export all utilities
export default {
  TOUCH_TARGETS,
  getSafeAreaInsets,
  applySafeAreaPadding,
  triggerHaptic,
  HapticPattern,
  addSwipeGesture,
  addLongPressGesture,
  throttle,
  debounce,
  smoothAnimation,
  getViewportInfo,
  preventDoubleTapZoom,
  lockScroll,
  unlockScroll,
  MOBILE_CLASSES,
  getMobileOptimizedClasses,
};
