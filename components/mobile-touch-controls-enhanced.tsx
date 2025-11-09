// Enhanced Mobile Touch Controls - Replaces basic joystick
'use client';

import React, { useRef, useState, useEffect, useCallback } from 'react';
import { useMobileHUD } from '@/lib/mobile-hud-context';
import { cn } from '@/lib/utils';

interface TouchControlsProps {
  onMove?: (x: number, y: number) => void; // -1 to 1 for each axis
  onJump?: () => void;
  onSprint?: (sprinting: boolean) => void;
  className?: string;
}

export function MobileTouchControlsEnhanced({
  onMove,
  onJump,
  onSprint,
  className,
}: TouchControlsProps) {
  const { 
    joystickEnabled, 
    preferences, 
    updatePreferences 
  } = useMobileHUD();

  const joystickRef = useRef<HTMLDivElement>(null);
  const [joystickActive, setJoystickActive] = useState(false);
  const [joystickPosition, setJoystickPosition] = useState({ x: 0, y: 0 });
  const [isSprinting, setIsSprinting] = useState(false);
  const [touchIndicators, setTouchIndicators] = useState<Map<number, { x: number; y: number }>>(new Map());

  const joystickCenter = useRef({ x: 0, y: 0 });
  const activeTouchId = useRef<number | null>(null);

  // Joystick size mapping
  const sizeMap = {
    small: 80,
    medium: 100,
    large: 120,
  };

  const joystickSize = sizeMap[preferences.joystickSize];
  const maxDistance = joystickSize / 2;

  // Initialize joystick position
  useEffect(() => {
    if (joystickRef.current) {
      const rect = joystickRef.current.getBoundingClientRect();
      joystickCenter.current = {
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2,
      };
    }
  }, [preferences.joystickPosition]);

  const handleJoystickStart = useCallback((e: React.TouchEvent) => {
    if (!joystickEnabled || activeTouchId.current !== null) return;
    
    const touch = e.touches[0];
    activeTouchId.current = touch.identifier;
    
    if (joystickRef.current) {
      const rect = joystickRef.current.getBoundingClientRect();
      joystickCenter.current = {
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2,
      };
    }
    
    setJoystickActive(true);
    
    // Haptic feedback
    if (preferences.hapticEnabled && navigator.vibrate) {
      navigator.vibrate(10);
    }
  }, [joystickEnabled, preferences.hapticEnabled]);

  const handleJoystickMove = useCallback((e: React.TouchEvent) => {
    if (!joystickActive || activeTouchId.current === null) return;
    
    const touch = Array.from(e.touches).find(t => t.identifier === activeTouchId.current);
    if (!touch) return;
    
    const deltaX = touch.clientX - joystickCenter.current.x;
    const deltaY = touch.clientY - joystickCenter.current.y;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    
    // Limit to maxDistance
    const limitedDistance = Math.min(distance, maxDistance);
    const angle = Math.atan2(deltaY, deltaX);
    
    const x = Math.cos(angle) * limitedDistance;
    const y = Math.sin(angle) * limitedDistance;
    
    setJoystickPosition({ x, y });
    
    // Normalize to -1 to 1
    const normalizedX = x / maxDistance;
    const normalizedY = y / maxDistance;
    
    onMove?.(normalizedX, normalizedY);
    
    // Auto-sprint when joystick is pushed to edge
    const shouldSprint = limitedDistance > maxDistance * 0.8;
    if (shouldSprint !== isSprinting) {
      setIsSprinting(shouldSprint);
      onSprint?.(shouldSprint);
      
      if (shouldSprint && preferences.hapticEnabled && navigator.vibrate) {
        navigator.vibrate(15);
      }
    }
  }, [joystickActive, maxDistance, onMove, onSprint, isSprinting, preferences.hapticEnabled]);

  const handleJoystickEnd = useCallback(() => {
    if (activeTouchId.current === null) return;
    
    setJoystickActive(false);
    setJoystickPosition({ x: 0, y: 0 });
    setIsSprinting(false);
    activeTouchId.current = null;
    
    onMove?.(0, 0);
    onSprint?.(false);
    
    if (preferences.hapticEnabled && navigator.vibrate) {
      navigator.vibrate(5);
    }
  }, [onMove, onSprint, preferences.hapticEnabled]);

  const handleJumpButton = useCallback(() => {
    onJump?.();
    
    if (preferences.hapticEnabled && navigator.vibrate) {
      navigator.vibrate([20, 10, 20]);
    }
  }, [onJump, preferences.hapticEnabled]);

  // Touch indicator system
  const handleGlobalTouchStart = useCallback((e: TouchEvent) => {
    if (!preferences.touchIndicators) return;
    
    const newIndicators = new Map(touchIndicators);
    Array.from(e.touches).forEach(touch => {
      newIndicators.set(touch.identifier, {
        x: touch.clientX,
        y: touch.clientY,
      });
    });
    setTouchIndicators(newIndicators);
  }, [preferences.touchIndicators, touchIndicators]);

  const handleGlobalTouchEnd = useCallback((e: TouchEvent) => {
    if (!preferences.touchIndicators) return;
    
    const newIndicators = new Map(touchIndicators);
    Array.from(e.changedTouches).forEach(touch => {
      newIndicators.delete(touch.identifier);
    });
    setTouchIndicators(newIndicators);
  }, [preferences.touchIndicators, touchIndicators]);

  useEffect(() => {
    if (preferences.touchIndicators) {
      document.addEventListener('touchstart', handleGlobalTouchStart);
      document.addEventListener('touchend', handleGlobalTouchEnd);
      
      return () => {
        document.removeEventListener('touchstart', handleGlobalTouchStart);
        document.removeEventListener('touchend', handleGlobalTouchEnd);
      };
    }
  }, [preferences.touchIndicators, handleGlobalTouchStart, handleGlobalTouchEnd]);

  if (!joystickEnabled) return null;

  return (
    <>
      {/* Joystick Container */}
      <div
        className={cn(
          "fixed z-20 select-none",
          className
        )}
        style={{
          left: preferences.joystickPosition.x,
          bottom: preferences.joystickPosition.y,
          marginBottom: 'env(safe-area-inset-bottom)',
        }}
      >
        {/* Joystick Base */}
        <div
          ref={joystickRef}
          className={cn(
            "relative rounded-full bg-black/20 border-2 border-white/20 backdrop-blur-sm",
            "transition-all duration-200",
            joystickActive && "border-primary/50 scale-110"
          )}
          style={{
            width: joystickSize,
            height: joystickSize,
            opacity: preferences.joystickOpacity,
          }}
          onTouchStart={handleJoystickStart}
          onTouchMove={handleJoystickMove}
          onTouchEnd={handleJoystickEnd}
        >
          {/* Direction Indicators */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="absolute top-2 text-white/30 text-xs">▲</div>
            <div className="absolute bottom-2 text-white/30 text-xs">▼</div>
            <div className="absolute left-2 text-white/30 text-xs">◀</div>
            <div className="absolute right-2 text-white/30 text-xs">▶</div>
          </div>

          {/* Joystick Thumb */}
          <div
            className={cn(
              "absolute w-1/2 h-1/2 rounded-full",
              "transition-colors duration-200",
              isSprinting 
                ? "bg-gradient-to-br from-yellow-400 to-orange-500 shadow-lg shadow-orange-500/50" 
                : "bg-gradient-to-br from-white to-gray-200 shadow-lg"
            )}
            style={{
              left: `50%`,
              top: `50%`,
              transform: `translate(calc(-50% + ${joystickPosition.x}px), calc(-50% + ${joystickPosition.y}px))`,
            }}
          >
            {/* Center Dot */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className={cn(
                "w-2 h-2 rounded-full",
                isSprinting ? "bg-white" : "bg-gray-400"
              )} />
            </div>
          </div>

          {/* Sprint Ring */}
          {joystickActive && (
            <div 
              className="absolute inset-0 rounded-full border-2 border-yellow-400 animate-pulse"
              style={{
                opacity: Math.min((Math.sqrt(joystickPosition.x ** 2 + joystickPosition.y ** 2) / maxDistance), 1),
              }}
            />
          )}
        </div>

        {/* Sprint Label */}
        {isSprinting && (
          <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-yellow-500 text-white text-xs px-2 py-1 rounded font-bold whitespace-nowrap">
            SPRINTING
          </div>
        )}
      </div>

      {/* Jump Button */}
      <button
        onTouchStart={handleJumpButton}
        className={cn(
          "fixed z-20 w-16 h-16 rounded-full",
          "bg-gradient-to-br from-blue-500 to-blue-600",
          "text-white font-bold text-2xl",
          "shadow-lg active:scale-95 transition-transform",
          "border-2 border-white/20"
        )}
        style={{
          right: 20,
          bottom: 40,
          marginBottom: 'env(safe-area-inset-bottom)',
          opacity: preferences.joystickOpacity,
        }}
      >
        ↑
      </button>

      {/* Touch Indicators */}
      {preferences.touchIndicators && (
        <div className="fixed inset-0 pointer-events-none z-50">
          {Array.from(touchIndicators.entries()).map(([id, pos]) => (
            <div
              key={id}
              className="absolute w-12 h-12 rounded-full bg-primary/30 border-2 border-primary animate-ping"
              style={{
                left: pos.x - 24,
                top: pos.y - 24,
              }}
            />
          ))}
        </div>
      )}

      {/* Debug Info (Development Only) */}
      {process.env.NODE_ENV === 'development' && joystickActive && (
        <div className="fixed top-40 left-4 bg-black/80 text-white text-xs p-3 rounded font-mono z-50">
          <div>X: {(joystickPosition.x / maxDistance).toFixed(2)}</div>
          <div>Y: {(joystickPosition.y / maxDistance).toFixed(2)}</div>
          <div>Sprint: {isSprinting ? 'YES' : 'NO'}</div>
          <div>Distance: {Math.sqrt(joystickPosition.x ** 2 + joystickPosition.y ** 2).toFixed(0)}px</div>
        </div>
      )}
    </>
  );
}

// Gesture detector for additional controls
export function useGestureDetector() {
  const [gesture, setGesture] = useState<{
    type: 'swipe' | 'pinch' | 'long-press' | null;
    direction?: 'up' | 'down' | 'left' | 'right';
    scale?: number;
  }>({ type: null });

  const startTouch = useRef<{ x: number; y: number; time: number } | null>(null);
  const startDistance = useRef<number | null>(null);

  useEffect(() => {
    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        startTouch.current = {
          x: e.touches[0].clientX,
          y: e.touches[0].clientY,
          time: Date.now(),
        };

        // Long press detection
        const timeout = setTimeout(() => {
          setGesture({ type: 'long-press' });
          if (navigator.vibrate) {
            navigator.vibrate([50, 30, 50]);
          }
        }, 500);

        const clear = () => clearTimeout(timeout);
        window.addEventListener('touchend', clear, { once: true });
        window.addEventListener('touchmove', clear, { once: true });
      } else if (e.touches.length === 2) {
        // Pinch detection
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        startDistance.current = Math.sqrt(dx * dx + dy * dy);
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 2 && startDistance.current !== null) {
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const scale = distance / startDistance.current;
        
        setGesture({ type: 'pinch', scale });
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (startTouch.current && e.changedTouches.length === 1) {
        const endTouch = e.changedTouches[0];
        const deltaX = endTouch.clientX - startTouch.current.x;
        const deltaY = endTouch.clientY - startTouch.current.y;
        const deltaTime = Date.now() - startTouch.current.time;
        
        // Swipe detection (fast movement)
        if (Math.abs(deltaX) > 50 || Math.abs(deltaY) > 50) {
          if (deltaTime < 300) {
            let direction: 'up' | 'down' | 'left' | 'right';
            
            if (Math.abs(deltaX) > Math.abs(deltaY)) {
              direction = deltaX > 0 ? 'right' : 'left';
            } else {
              direction = deltaY > 0 ? 'down' : 'up';
            }
            
            setGesture({ type: 'swipe', direction });
            
            if (navigator.vibrate) {
              navigator.vibrate(10);
            }
          }
        }
      }
      
      startTouch.current = null;
      startDistance.current = null;
      
      // Reset gesture after short delay
      setTimeout(() => setGesture({ type: null }), 100);
    };

    document.addEventListener('touchstart', handleTouchStart);
    document.addEventListener('touchmove', handleTouchMove);
    document.addEventListener('touchend', handleTouchEnd);

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, []);

  return gesture;
}

// Joystick position customizer (for settings)
export function JoystickPositionEditor({ onSave }: { onSave: (x: number, y: number) => void }) {
  const { preferences } = useMobileHUD();
  const [position, setPosition] = useState(preferences.joystickPosition);
  const [isDragging, setIsDragging] = useState(false);

  const handleDrag = (e: React.TouchEvent) => {
    if (!isDragging) return;
    
    const touch = e.touches[0];
    setPosition({
      x: touch.clientX,
      y: window.innerHeight - touch.clientY,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
      <div className="bg-background p-6 rounded-lg max-w-sm">
        <h3 className="text-lg font-bold mb-4">Customize Joystick Position</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Drag the joystick preview to your preferred position
        </p>
        
        <div 
          className="relative w-full aspect-video bg-muted rounded-lg overflow-hidden"
          onTouchMove={handleDrag}
        >
          <div
            className="absolute w-16 h-16 rounded-full bg-primary/30 border-2 border-primary"
            style={{
              left: position.x,
              bottom: position.y,
            }}
            onTouchStart={() => setIsDragging(true)}
            onTouchEnd={() => setIsDragging(false)}
          />
        </div>
        
        <div className="flex gap-3 mt-4">
          <button
            onClick={() => onSave(position.x, position.y)}
            className="flex-1 py-2 bg-primary text-primary-foreground rounded-lg font-medium"
          >
            Save
          </button>
          <button
            onClick={() => setPosition({ x: 20, y: 120 })}
            className="flex-1 py-2 bg-muted rounded-lg font-medium"
          >
            Reset
          </button>
        </div>
      </div>
    </div>
  );
}
