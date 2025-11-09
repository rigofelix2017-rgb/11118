import { ReactNode, useEffect } from 'react';
import { useMobileLayout } from '@/contexts/mobile-layout-context';
import { cn } from '@/lib/utils';

interface MobileLayoutShellProps {
  children: ReactNode;
  className?: string;
}

export function MobileLayoutShell({ children, className }: MobileLayoutShellProps) {
  const { isMobile, viewport, isMobilePerformanceMode } = useMobileLayout();

  // Apply performance mode styles when enabled
  useEffect(() => {
    if (isMobile && isMobilePerformanceMode) {
      // Limit device pixel ratio for better performance
      const canvas = document.querySelector('canvas');
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          // Cap DPR at 2 for mobile performance
          const maxDPR = Math.min(window.devicePixelRatio, 2);
          canvas.style.transform = `scale(${1 / maxDPR})`;
          canvas.style.transformOrigin = 'top left';
        }
      }
    }
  }, [isMobile, isMobilePerformanceMode]);

  // Update viewport height custom property
  useEffect(() => {
    const updateVH = () => {
      const vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty('--vh', `${vh}px`);
    };

    updateVH();
    window.addEventListener('resize', updateVH);
    window.addEventListener('orientationchange', updateVH);
    
    return () => {
      window.removeEventListener('resize', updateVH);
      window.removeEventListener('orientationchange', updateVH);
    };
  }, []);

  // Prevent body scroll on mobile when overlays are open
  useEffect(() => {
    if (isMobile) {
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.width = '100%';
      document.body.style.height = '100%';
      
      return () => {
        document.body.style.overflow = '';
        document.body.style.position = '';
        document.body.style.width = '';
        document.body.style.height = '';
      };
    }
  }, [isMobile]);

  if (!isMobile) {
    // For desktop, just render children without mobile shell
    return <>{children}</>;
  }

  return (
    <div 
      className={cn('mobile-layout-shell', className)}
      data-testid="mobile-layout-shell"
    >
      {children}
    </div>
  );
}