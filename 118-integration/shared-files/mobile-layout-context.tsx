// mobile-layout-context.tsx
// Copy this file to: src/contexts/mobile-layout-context.tsx

'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

interface MobileLayoutContextValue {
  isMobile: boolean;
  isKeyboardVisible: boolean;
  safeAreaInsets: {
    top: number;
    bottom: number;
    left: number;
    right: number;
  };
  setKeyboardVisible: (visible: boolean) => void;
}

const MobileLayoutContext = createContext<MobileLayoutContextValue | undefined>(undefined);

export function MobileLayoutProvider({ children }: { children: React.ReactNode }) {
  const [isMobile, setIsMobile] = useState(false);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const [safeAreaInsets, setSafeAreaInsets] = useState({
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
  });

  useEffect(() => {
    // Detect mobile device
    const checkMobile = () => {
      const mobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent
      );
      setIsMobile(mobile);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);

    // Detect safe area insets (iOS notch, etc.)
    const updateSafeArea = () => {
      const root = document.documentElement;
      const computedStyle = getComputedStyle(root);
      
      setSafeAreaInsets({
        top: parseInt(computedStyle.getPropertyValue('env(safe-area-inset-top)') || '0'),
        bottom: parseInt(computedStyle.getPropertyValue('env(safe-area-inset-bottom)') || '0'),
        left: parseInt(computedStyle.getPropertyValue('env(safe-area-inset-left)') || '0'),
        right: parseInt(computedStyle.getPropertyValue('env(safe-area-inset-right)') || '0'),
      });
    };

    updateSafeArea();
    window.addEventListener('resize', updateSafeArea);

    // Detect keyboard visibility (mobile)
    if (isMobile) {
      let initialHeight = window.visualViewport?.height || window.innerHeight;

      const handleResize = () => {
        const currentHeight = window.visualViewport?.height || window.innerHeight;
        const heightDiff = initialHeight - currentHeight;
        
        // Keyboard is visible if viewport shrinks by more than 150px
        setIsKeyboardVisible(heightDiff > 150);
      };

      window.visualViewport?.addEventListener('resize', handleResize);
      window.addEventListener('resize', handleResize);

      return () => {
        window.visualViewport?.removeEventListener('resize', handleResize);
        window.removeEventListener('resize', handleResize);
      };
    }

    return () => {
      window.removeEventListener('resize', checkMobile);
      window.removeEventListener('resize', updateSafeArea);
    };
  }, [isMobile]);

  return (
    <MobileLayoutContext.Provider
      value={{
        isMobile,
        isKeyboardVisible,
        safeAreaInsets,
        setKeyboardVisible: setIsKeyboardVisible,
      }}
    >
      {children}
    </MobileLayoutContext.Provider>
  );
}

export function useMobileLayout() {
  const context = useContext(MobileLayoutContext);
  if (!context) {
    throw new Error('useMobileLayout must be used within MobileLayoutProvider');
  }
  return context;
}
