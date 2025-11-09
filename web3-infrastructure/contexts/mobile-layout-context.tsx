import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useIsMobile } from '../hooks/use-mobile';

interface SafeAreaInsets {
  top: number;
  bottom: number;
  left: number;
  right: number;
}

interface ViewportState {
  height: number;
  visualHeight: number; // accounting for keyboard
  isKeyboardOpen: boolean;
}

interface MobileLayoutContextType {
  // Safe area values
  safeAreaInsets: SafeAreaInsets;
  
  // Viewport state
  viewport: ViewportState;
  
  // Layout state
  activeOverlay: 'chat' | 'social' | 'settings' | null;
  setActiveOverlay: (overlay: 'chat' | 'social' | 'settings' | null) => void;
  
  // Performance mode
  isMobilePerformanceMode: boolean;
  setMobilePerformanceMode: (enabled: boolean) => void;
  
  // Mobile state
  isMobile: boolean;
}

const MobileLayoutContext = createContext<MobileLayoutContextType | null>(null);

export function useMobileLayout() {
  const context = useContext(MobileLayoutContext);
  if (!context) {
    throw new Error('useMobileLayout must be used within a MobileLayoutProvider');
  }
  return context;
}

interface MobileLayoutProviderProps {
  children: ReactNode;
}

export function MobileLayoutProvider({ children }: MobileLayoutProviderProps) {
  const isMobile = useIsMobile();
  const [activeOverlay, setActiveOverlay] = useState<'chat' | 'social' | 'settings' | null>(null);
  const [isMobilePerformanceMode, setMobilePerformanceMode] = useState(isMobile);
  
  // Safe area insets state
  const [safeAreaInsets, setSafeAreaInsets] = useState<SafeAreaInsets>({
    top: 0,
    bottom: 0,
    left: 0,
    right: 0
  });
  
  // Viewport state
  const [viewport, setViewport] = useState<ViewportState>({
    height: window.innerHeight,
    visualHeight: window.innerHeight,
    isKeyboardOpen: false
  });

  // Update safe area insets from CSS env() values
  useEffect(() => {
    const updateSafeAreaInsets = () => {
      const computedStyle = getComputedStyle(document.documentElement);
      
      // Try to get safe area insets from CSS env() if available
      const testElement = document.createElement('div');
      testElement.style.cssText = `
        position: fixed;
        top: env(safe-area-inset-top);
        bottom: env(safe-area-inset-bottom);
        left: env(safe-area-inset-left);
        right: env(safe-area-inset-right);
        pointer-events: none;
        visibility: hidden;
      `;
      document.body.appendChild(testElement);
      
      const rect = testElement.getBoundingClientRect();
      const windowHeight = window.innerHeight;
      const windowWidth = window.innerWidth;
      
      setSafeAreaInsets({
        top: Math.max(0, rect.top),
        bottom: Math.max(0, windowHeight - rect.bottom),
        left: Math.max(0, rect.left),
        right: Math.max(0, windowWidth - rect.right)
      });
      
      document.body.removeChild(testElement);
    };

    updateSafeAreaInsets();
    window.addEventListener('resize', updateSafeAreaInsets);
    window.addEventListener('orientationchange', updateSafeAreaInsets);
    
    return () => {
      window.removeEventListener('resize', updateSafeAreaInsets);
      window.removeEventListener('orientationchange', updateSafeAreaInsets);
    };
  }, []);

  // Dynamic viewport height management
  useEffect(() => {
    const updateViewportHeight = () => {
      const vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty('--vh', `${vh}px`);
      
      setViewport(prev => ({
        ...prev,
        height: window.innerHeight
      }));
    };

    updateViewportHeight();
    window.addEventListener('resize', updateViewportHeight);
    window.addEventListener('orientationchange', updateViewportHeight);
    
    return () => {
      window.removeEventListener('resize', updateViewportHeight);
      window.removeEventListener('orientationchange', updateViewportHeight);
    };
  }, []);

  // Keyboard detection for mobile
  useEffect(() => {
    if (!isMobile) return;

    const initialHeight = window.innerHeight;
    let resizeTimer: number;

    const handleResize = () => {
      clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(() => {
        const currentHeight = window.innerHeight;
        const heightDiff = initialHeight - currentHeight;
        const isKeyboardOpen = heightDiff > 150; // 150px threshold
        
        setViewport(prev => ({
          ...prev,
          visualHeight: currentHeight,
          isKeyboardOpen
        }));
      }, 100); // Debounce to avoid rapid updates
    };

    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(resizeTimer);
    };
  }, [isMobile]);

  // Auto-enable performance mode on mobile
  useEffect(() => {
    if (isMobile && !isMobilePerformanceMode) {
      setMobilePerformanceMode(true);
    }
  }, [isMobile, isMobilePerformanceMode]);

  // Update CSS custom properties when safe area changes
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--safe-area-top', `${safeAreaInsets.top}px`);
    root.style.setProperty('--safe-area-bottom', `${safeAreaInsets.bottom}px`);
    root.style.setProperty('--safe-area-left', `${safeAreaInsets.left}px`);
    root.style.setProperty('--safe-area-right', `${safeAreaInsets.right}px`);
  }, [safeAreaInsets]);

  const value: MobileLayoutContextType = {
    safeAreaInsets,
    viewport,
    activeOverlay,
    setActiveOverlay,
    isMobilePerformanceMode,
    setMobilePerformanceMode,
    isMobile
  };

  return (
    <MobileLayoutContext.Provider value={value}>
      {children}
    </MobileLayoutContext.Provider>
  );
}
