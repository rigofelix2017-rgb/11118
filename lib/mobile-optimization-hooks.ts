// React Hooks for Mobile Optimization
import { useEffect, useState, useCallback, useRef } from 'react';
import {
  HapticPattern,
  triggerHaptic,
  getSafeAreaInsets,
  getViewportInfo,
  addSwipeGesture,
  addLongPressGesture,
  SafeAreaInsets,
  ViewportInfo,
  SwipeEvent,
} from './mobile-optimization';

/**
 * Hook for safe area insets
 * Automatically updates when device orientation changes
 */
export function useSafeAreaInsets(): SafeAreaInsets {
  const [insets, setInsets] = useState<SafeAreaInsets>(getSafeAreaInsets());

  useEffect(() => {
    const updateInsets = () => setInsets(getSafeAreaInsets());

    // Update on resize (orientation change)
    window.addEventListener('resize', updateInsets);
    window.addEventListener('orientationchange', updateInsets);

    return () => {
      window.removeEventListener('resize', updateInsets);
      window.removeEventListener('orientationchange', updateInsets);
    };
  }, []);

  return insets;
}

/**
 * Hook for viewport information
 * Automatically updates on resize/orientation change
 */
export function useViewport(): ViewportInfo {
  const [viewport, setViewport] = useState<ViewportInfo>(getViewportInfo());

  useEffect(() => {
    const updateViewport = () => setViewport(getViewportInfo());

    window.addEventListener('resize', updateViewport);
    window.addEventListener('orientationchange', updateViewport);

    return () => {
      window.removeEventListener('resize', updateViewport);
      window.removeEventListener('orientationchange', updateViewport);
    };
  }, []);

  return viewport;
}

/**
 * Hook for haptic feedback
 * Returns a function to trigger haptic patterns
 */
export function useHaptic() {
  return useCallback((pattern: HapticPattern = HapticPattern.LIGHT) => {
    triggerHaptic(pattern);
  }, []);
}

/**
 * Hook for swipe gestures
 */
export function useSwipeGesture(
  onSwipe: (event: SwipeEvent) => void,
  options?: {
    threshold?: number;
    maxTime?: number;
  }
) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const cleanup = addSwipeGesture(element, onSwipe, options);
    return cleanup;
  }, [onSwipe, options]);

  return ref;
}

/**
 * Hook for long-press gestures
 */
export function useLongPress(onLongPress: () => void, duration = 500) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const cleanup = addLongPressGesture(element, onLongPress, duration);
    return cleanup;
  }, [onLongPress, duration]);

  return ref;
}

/**
 * Hook for pull-to-refresh
 */
export function usePullToRefresh(onRefresh: () => Promise<void>) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    let startY = 0;
    let currentY = 0;
    let scrollTop = 0;

    const handleTouchStart = (e: TouchEvent) => {
      scrollTop = element.scrollTop;
      startY = e.touches[0].clientY;
    };

    const handleTouchMove = (e: TouchEvent) => {
      // Only allow pull-to-refresh when at the top
      if (scrollTop > 0) return;

      currentY = e.touches[0].clientY;
      const delta = currentY - startY;

      if (delta > 0) {
        // Pulling down
        setPullDistance(Math.min(delta, 100));
        
        if (delta > 80) {
          // Haptic feedback when threshold reached
          triggerHaptic(HapticPattern.LIGHT);
        }
      }
    };

    const handleTouchEnd = async () => {
      if (pullDistance > 80 && !isRefreshing) {
        setIsRefreshing(true);
        triggerHaptic(HapticPattern.SUCCESS);
        
        try {
          await onRefresh();
        } finally {
          setIsRefreshing(false);
        }
      }
      
      setPullDistance(0);
    };

    element.addEventListener('touchstart', handleTouchStart, { passive: true });
    element.addEventListener('touchmove', handleTouchMove, { passive: true });
    element.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchmove', handleTouchMove);
      element.removeEventListener('touchend', handleTouchEnd);
    };
  }, [onRefresh, isRefreshing, pullDistance]);

  return { ref, isRefreshing, pullDistance };
}

/**
 * Hook for touch ripple effect
 */
export function useTouchRipple() {
  const [ripples, setRipples] = useState<Array<{ x: number; y: number; id: number }>>([]);
  const ref = useRef<HTMLElement>(null);
  const nextId = useRef(0);

  const addRipple = useCallback((e: React.TouchEvent) => {
    const element = ref.current;
    if (!element) return;

    const rect = element.getBoundingClientRect();
    const x = e.touches[0].clientX - rect.left;
    const y = e.touches[0].clientY - rect.top;
    const id = nextId.current++;

    setRipples((prev) => [...prev, { x, y, id }]);

    // Remove ripple after animation
    setTimeout(() => {
      setRipples((prev) => prev.filter((r) => r.id !== id));
    }, 600);
  }, []);

  return { ref, ripples, addRipple };
}

/**
 * Hook for virtual keyboard detection
 * Useful for adjusting layout when keyboard appears
 */
export function useVirtualKeyboard() {
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  useEffect(() => {
    const initialHeight = window.visualViewport?.height || window.innerHeight;

    const handleResize = () => {
      const currentHeight = window.visualViewport?.height || window.innerHeight;
      const heightDiff = initialHeight - currentHeight;

      // Keyboard is considered visible if viewport height reduced by >100px
      setIsKeyboardVisible(heightDiff > 100);
      setKeyboardHeight(heightDiff);
    };

    window.visualViewport?.addEventListener('resize', handleResize);
    window.addEventListener('resize', handleResize);

    return () => {
      window.visualViewport?.removeEventListener('resize', handleResize);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return { isKeyboardVisible, keyboardHeight };
}

/**
 * Hook for scroll direction detection
 */
export function useScrollDirection() {
  const [scrollDirection, setScrollDirection] = useState<'up' | 'down' | null>(null);
  const [lastScrollY, setLastScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      if (currentScrollY > lastScrollY) {
        setScrollDirection('down');
      } else if (currentScrollY < lastScrollY) {
        setScrollDirection('up');
      }

      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  return scrollDirection;
}

/**
 * Hook for network status
 * Useful for showing offline indicators
 */
export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      triggerHaptic(HapticPattern.SUCCESS);
    };

    const handleOffline = () => {
      setIsOnline(false);
      triggerHaptic(HapticPattern.WARNING);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
}

/**
 * Hook for battery status
 * Shows battery level and charging status
 */
export function useBatteryStatus() {
  const [battery, setBattery] = useState<{
    level: number;
    charging: boolean;
  } | null>(null);

  useEffect(() => {
    if (!('getBattery' in navigator)) return;

    (navigator as any).getBattery().then((battery: any) => {
      const updateBattery = () => {
        setBattery({
          level: battery.level,
          charging: battery.charging,
        });
      };

      updateBattery();

      battery.addEventListener('levelchange', updateBattery);
      battery.addEventListener('chargingchange', updateBattery);

      return () => {
        battery.removeEventListener('levelchange', updateBattery);
        battery.removeEventListener('chargingchange', updateBattery);
      };
    });
  }, []);

  return battery;
}

/**
 * Hook for iOS standalone mode detection (PWA)
 */
export function useIsStandalone(): boolean {
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // iOS Safari
    const isIosStandalone = (window.navigator as any).standalone === true;
    
    // Android Chrome
    const isAndroidStandalone = window.matchMedia('(display-mode: standalone)').matches;

    setIsStandalone(isIosStandalone || isAndroidStandalone);
  }, []);

  return isStandalone;
}

/**
 * Hook for preventing pull-to-refresh on iOS Safari
 */
export function usePreventPullToRefresh() {
  useEffect(() => {
    const preventPull = (e: TouchEvent) => {
      // Prevent pull-to-refresh on iOS Safari
      if (window.scrollY === 0) {
        e.preventDefault();
      }
    };

    document.body.addEventListener('touchmove', preventPull, { passive: false });
    return () => document.body.removeEventListener('touchmove', preventPull);
  }, []);
}

/**
 * Hook for optimized touch events
 * Combines multiple optimizations for better mobile UX
 */
export function useOptimizedTouch(
  onClick: () => void,
  options: {
    haptic?: HapticPattern;
    debounce?: number;
  } = {}
) {
  const haptic = useHaptic();
  const timeoutRef = useRef<NodeJS.Timeout>();

  const handleTouch = useCallback(() => {
    // Clear any pending clicks
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Trigger haptic feedback
    if (options.haptic) {
      haptic(options.haptic);
    }

    // Debounce if specified
    if (options.debounce) {
      timeoutRef.current = setTimeout(onClick, options.debounce);
    } else {
      onClick();
    }
  }, [onClick, haptic, options.haptic, options.debounce]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return handleTouch;
}

// Export all hooks
export default {
  useSafeAreaInsets,
  useViewport,
  useHaptic,
  useSwipeGesture,
  useLongPress,
  usePullToRefresh,
  useTouchRipple,
  useVirtualKeyboard,
  useScrollDirection,
  useNetworkStatus,
  useBatteryStatus,
  useIsStandalone,
  usePreventPullToRefresh,
  useOptimizedTouch,
};
