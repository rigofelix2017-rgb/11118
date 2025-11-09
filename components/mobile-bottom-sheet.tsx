// Universal Bottom Sheet Component - Replaces all custom drawers/modals
'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useMobileHUD } from '@/lib/mobile-hud-context';
import { cn } from '@/lib/utils';

interface BottomSheetProps {
  children: React.ReactNode;
  isOpen: boolean;
  onClose: () => void;
  snapPoints?: number[]; // [0, 0.4, 0.9] - percentage of viewport height
  initialSnap?: number;
  enableBackdrop?: boolean;
  enableSwipeGestures?: boolean;
  blockJoystick?: boolean;
  title?: string;
  subtitle?: string;
  headerActions?: React.ReactNode;
  className?: string;
}

export function BottomSheet({
  children,
  isOpen,
  onClose,
  snapPoints = [0, 0.4, 0.9],
  initialSnap = 0.4,
  enableBackdrop = true,
  enableSwipeGestures = true,
  blockJoystick = true,
  title,
  subtitle,
  headerActions,
  className,
}: BottomSheetProps) {
  const { setJoystickEnabled, preferences } = useMobileHUD();
  const [currentSnap, setCurrentSnap] = useState(initialSnap);
  const [isDragging, setIsDragging] = useState(false);
  const [startY, setStartY] = useState(0);
  const [currentY, setCurrentY] = useState(0);
  const [velocity, setVelocity] = useState(0);
  const sheetRef = useRef<HTMLDivElement>(null);
  const lastMoveTime = useRef(Date.now());
  const lastMoveY = useRef(0);

  // Block joystick when sheet is open
  useEffect(() => {
    if (isOpen && blockJoystick) {
      setJoystickEnabled(false);
    } else {
      setJoystickEnabled(true);
    }
    
    return () => setJoystickEnabled(true);
  }, [isOpen, blockJoystick, setJoystickEnabled]);

  // Handle snap point changes
  useEffect(() => {
    if (isOpen) {
      setCurrentSnap(initialSnap);
    } else {
      setCurrentSnap(0);
    }
  }, [isOpen, initialSnap]);

  const getTranslateY = useCallback(() => {
    const viewportHeight = window.innerHeight;
    const snapHeight = viewportHeight * currentSnap;
    const dragOffset = isDragging ? currentY - startY : 0;
    return viewportHeight - snapHeight + dragOffset;
  }, [currentSnap, isDragging, startY, currentY]);

  const findNearestSnapPoint = useCallback((translateY: number) => {
    const viewportHeight = window.innerHeight;
    const currentHeight = viewportHeight - translateY;
    const currentPercentage = currentHeight / viewportHeight;
    
    // Find closest snap point
    let nearest = snapPoints[0];
    let minDiff = Math.abs(currentPercentage - nearest);
    
    for (const snap of snapPoints) {
      const diff = Math.abs(currentPercentage - snap);
      if (diff < minDiff) {
        minDiff = diff;
        nearest = snap;
      }
    }
    
    // Consider velocity for flick gestures
    if (Math.abs(velocity) > 0.5) {
      const direction = velocity > 0 ? 1 : -1; // Down = close, Up = open
      const currentIndex = snapPoints.indexOf(nearest);
      const nextIndex = currentIndex + direction;
      
      if (nextIndex >= 0 && nextIndex < snapPoints.length) {
        return snapPoints[nextIndex];
      }
    }
    
    return nearest;
  }, [snapPoints, velocity]);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (!enableSwipeGestures) return;
    
    setIsDragging(true);
    setStartY(e.touches[0].clientY);
    setCurrentY(e.touches[0].clientY);
    lastMoveTime.current = Date.now();
    lastMoveY.current = e.touches[0].clientY;
    
    // Haptic feedback
    if (preferences.hapticEnabled && navigator.vibrate) {
      navigator.vibrate(5);
    }
  }, [enableSwipeGestures, preferences.hapticEnabled]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isDragging || !enableSwipeGestures) return;
    
    const now = Date.now();
    const deltaTime = now - lastMoveTime.current;
    const deltaY = e.touches[0].clientY - lastMoveY.current;
    
    // Calculate velocity (pixels per millisecond)
    if (deltaTime > 0) {
      setVelocity(deltaY / deltaTime);
    }
    
    setCurrentY(e.touches[0].clientY);
    lastMoveTime.current = now;
    lastMoveY.current = e.touches[0].clientY;
  }, [isDragging, enableSwipeGestures]);

  const handleTouchEnd = useCallback(() => {
    if (!isDragging) return;
    
    setIsDragging(false);
    
    const translateY = getTranslateY();
    const newSnap = findNearestSnapPoint(translateY);
    
    // If snapping to 0, close the sheet
    if (newSnap === 0) {
      onClose();
    } else {
      setCurrentSnap(newSnap);
    }
    
    // Reset velocity
    setVelocity(0);
    
    // Haptic feedback
    if (preferences.hapticEnabled && navigator.vibrate) {
      navigator.vibrate(10);
    }
  }, [isDragging, getTranslateY, findNearestSnapPoint, onClose, preferences.hapticEnabled]);

  const handleBackdropClick = useCallback(() => {
    if (enableBackdrop) {
      onClose();
    }
  }, [enableBackdrop, onClose]);

  const expandToFull = useCallback(() => {
    const fullSnap = Math.max(...snapPoints);
    setCurrentSnap(fullSnap);
    
    if (preferences.hapticEnabled && navigator.vibrate) {
      navigator.vibrate(10);
    }
  }, [snapPoints, preferences.hapticEnabled]);

  const collapseToHalf = useCallback(() => {
    const halfSnap = snapPoints.find(s => s > 0 && s < 1) || 0.4;
    setCurrentSnap(halfSnap);
    
    if (preferences.hapticEnabled && navigator.vibrate) {
      navigator.vibrate(10);
    }
  }, [snapPoints, preferences.hapticEnabled]);

  if (!isOpen) return null;

  const translateY = getTranslateY();
  const opacity = Math.min(currentSnap / 0.9, 1);

  return (
    <>
      {/* Backdrop */}
      {enableBackdrop && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-opacity duration-300"
          style={{ opacity }}
          onClick={handleBackdropClick}
        />
      )}

      {/* Bottom Sheet */}
      <div
        ref={sheetRef}
        className={cn(
          "fixed left-0 right-0 bottom-0 z-50",
          "bg-background border-t border-border rounded-t-3xl",
          "shadow-2xl overflow-hidden",
          "transition-transform duration-300 ease-out",
          isDragging && "transition-none",
          className
        )}
        style={{
          transform: `translateY(${translateY}px)`,
          height: '95vh',
          paddingTop: 'env(safe-area-inset-top)',
          paddingBottom: 'env(safe-area-inset-bottom)',
        }}
      >
        {/* Drag Handle */}
        <div
          className="flex flex-col items-center pt-3 pb-2 cursor-grab active:cursor-grabbing"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <div className="w-12 h-1.5 bg-muted-foreground/30 rounded-full" />
        </div>

        {/* Header */}
        {(title || headerActions) && (
          <div className="flex items-center justify-between px-6 py-3 border-b border-border">
            <div className="flex-1">
              {title && (
                <h2 className="text-lg font-bold text-foreground">{title}</h2>
              )}
              {subtitle && (
                <p className="text-sm text-muted-foreground mt-0.5">{subtitle}</p>
              )}
            </div>
            
            {headerActions && (
              <div className="flex items-center gap-2 ml-4">
                {headerActions}
              </div>
            )}
            
            <button
              onClick={onClose}
              className="ml-4 p-2 rounded-full hover:bg-muted active:bg-muted/80 transition-colors"
              aria-label="Close"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}

        {/* Content */}
        <div 
          className="flex-1 overflow-y-auto overscroll-contain px-6 py-4"
          style={{
            height: `calc(95vh - ${title ? '120px' : '60px'})`,
          }}
        >
          {children}
        </div>

        {/* Snap Point Indicators (for debugging) */}
        {process.env.NODE_ENV === 'development' && (
          <div className="fixed bottom-4 right-4 flex flex-col gap-1 opacity-50">
            {snapPoints.map(snap => (
              <button
                key={snap}
                onClick={() => setCurrentSnap(snap)}
                className={cn(
                  "px-2 py-1 text-xs rounded",
                  currentSnap === snap ? "bg-primary text-primary-foreground" : "bg-muted"
                )}
              >
                {Math.round(snap * 100)}%
              </button>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

// Preset variants for common use cases
export function InventorySheet({ children, isOpen, onClose }: Pick<BottomSheetProps, 'children' | 'isOpen' | 'onClose'>) {
  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      snapPoints={[0, 0.5, 0.95]}
      initialSnap={0.5}
      title="Inventory"
      subtitle="Manage your items and equipment"
    >
      {children}
    </BottomSheet>
  );
}

export function MapSheet({ children, isOpen, onClose }: Pick<BottomSheetProps, 'children' | 'isOpen' | 'onClose'>) {
  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      snapPoints={[0, 0.4, 0.95]}
      initialSnap={0.95}
      title="Map"
      blockJoystick={false} // Allow navigation while viewing map
    >
      {children}
    </BottomSheet>
  );
}

export function SocialSheet({ children, isOpen, onClose }: Pick<BottomSheetProps, 'children' | 'isOpen' | 'onClose'>) {
  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      snapPoints={[0, 0.6, 0.95]}
      initialSnap={0.6}
      title="Social"
      subtitle="Friends and communities"
    >
      {children}
    </BottomSheet>
  );
}

export function SettingsSheet({ children, isOpen, onClose }: Pick<BottomSheetProps, 'children' | 'isOpen' | 'onClose'>) {
  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      snapPoints={[0, 0.95]}
      initialSnap={0.95}
      title="Settings"
    >
      {children}
    </BottomSheet>
  );
}
