import { useState, useEffect, useRef, useCallback } from 'react';
import { useIsMobile } from '../hooks/use-mobile';
import { useMobileLayout } from '../contexts/mobile-layout-context';

interface MobileControlsProps {
  onMove: (direction: { x: number; y: number }) => void;
  onInteract?: () => void;
  onAction?: () => void;
  className?: string;
}

interface JoystickState {
  isActive: boolean;
  position: { x: number; y: number };
  center: { x: number; y: number };
}

function cn(...classes: (string | undefined | false)[]) {
  return classes.filter(Boolean).join(' ');
}

export function MobileControls({
  onMove,
  onInteract,
  onAction,
  className
}: MobileControlsProps) {
  const isMobile = useIsMobile();
  const { activeOverlay } = useMobileLayout();
  const [joystick, setJoystick] = useState<JoystickState>({
    isActive: false,
    position: { x: 0, y: 0 },
    center: { x: 0, y: 0 }
  });
  
  const joystickRef = useRef<HTMLDivElement>(null);
  const moveIntervalRef = useRef<number | null>(null);
  const currentDirectionRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Convert joystick position to movement direction (isometric)
  const getMovementDirection = useCallback((deltaX: number, deltaY: number, maxDistance: number) => {
    const normalizedX = deltaX / maxDistance;
    const normalizedY = deltaY / maxDistance;
    
    // Clamp values to prevent over-movement
    const clampedX = Math.max(-1, Math.min(1, normalizedX));
    const clampedY = Math.max(-1, Math.min(1, normalizedY));
    
    // Convert to isometric movement directions
    // Based on standard keyboard controls:
    // W (up-left): x-=s, y-=s -> normalizedX: -1, normalizedY: -1
    // S (down-right): x+=s, y+=s -> normalizedX: 1, normalizedY: 1  
    // A (down-left): x-=s, y+=s -> normalizedX: -1, normalizedY: 1
    // D (up-right): x+=s, y-=s -> normalizedX: 1, normalizedY: -1
    
    return {
      x: clampedX,
      y: clampedY
    };
  }, []);

  // Handle continuous movement while joystick is active
  useEffect(() => {
    if (joystick.isActive) {
      const moveSpeed = 4.3; // 40% faster movement speed
      
      moveIntervalRef.current = window.setInterval(() => {
        const direction = currentDirectionRef.current;
        if (Math.abs(direction.x) > 0.064 || Math.abs(direction.y) > 0.064) {
          // Simulate the position change that would happen with keyboard input
          onMove({
            x: direction.x * moveSpeed,
            y: direction.y * moveSpeed
          });
        }
      }, 10); // ~100fps for 40% faster response
      
      return () => {
        if (moveIntervalRef.current) {
          clearInterval(moveIntervalRef.current);
          moveIntervalRef.current = null;
        }
      };
    } else {
      if (moveIntervalRef.current) {
        clearInterval(moveIntervalRef.current);
        moveIntervalRef.current = null;
      }
    }
  }, [joystick.isActive, onMove]);

  // Joystick touch handlers
  const handleJoystickStart = useCallback((clientX: number, clientY: number) => {
    if (!joystickRef.current) return;
    
    const rect = joystickRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    setJoystick({
      isActive: true,
      position: { x: clientX, y: clientY },
      center: { x: centerX, y: centerY }
    });
  }, []);

  const handleJoystickMove = useCallback((clientX: number, clientY: number) => {
    if (!joystick.isActive) return;
    
    const deltaX = clientX - joystick.center.x;
    const deltaY = clientY - joystick.center.y;
    const maxDistance = 50; // Maximum joystick radius
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    
    // Limit joystick movement to the maximum radius
    const limitedX = distance > maxDistance ? (deltaX / distance) * maxDistance : deltaX;
    const limitedY = distance > maxDistance ? (deltaY / distance) * maxDistance : deltaY;
    
    setJoystick(prev => ({
      ...prev,
      position: {
        x: prev.center.x + limitedX,
        y: prev.center.y + limitedY
      }
    }));
    
    // Update current direction for continuous movement
    const direction = getMovementDirection(limitedX, limitedY, maxDistance);
    currentDirectionRef.current = direction;
  }, [joystick.isActive, joystick.center, getMovementDirection]);

  const handleJoystickEnd = useCallback(() => {
    setJoystick(prev => ({
      ...prev,
      isActive: false,
      position: prev.center
    }));
    currentDirectionRef.current = { x: 0, y: 0 };
  }, []);

  // Touch event handlers
  const handleTouchStart = useCallback((e: React.TouchEvent, action?: () => void) => {
    e.preventDefault();
    if (action) {
      action();
    } else if (e.currentTarget === joystickRef.current) {
      const touch = e.touches[0];
      handleJoystickStart(touch.clientX, touch.clientY);
    }
  }, [handleJoystickStart]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    if (joystick.isActive && e.touches.length > 0) {
      const touch = e.touches[0];
      handleJoystickMove(touch.clientX, touch.clientY);
    }
  }, [joystick.isActive, handleJoystickMove]);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    if (joystick.isActive) {
      handleJoystickEnd();
    }
  }, [joystick.isActive, handleJoystickEnd]);

  // Don't render on desktop or when overlays are active
  if (!isMobile || activeOverlay !== null) return null;

  return (
    <div className={cn("fixed inset-0 pointer-events-none z-20", className)}>
      {/* Virtual Joystick - Left Side */}
      <div className="absolute bottom-20 left-6 pointer-events-auto">
        {/* Joystick Housing */}
        <div className="p-2 rounded-full" style={{
          background: 'radial-gradient(circle, rgba(20,40,60,0.95) 0%, rgba(10,20,30,0.95) 100%)',
          boxShadow: `
            inset 0 -4px 8px rgba(0,0,0,0.8),
            inset 0 2px 4px rgba(255,255,255,0.1),
            0 8px 20px rgba(0,0,0,0.6),
            0 0 40px rgba(0,255,255,0.1)
          `
        }}>
          <div
            ref={joystickRef}
            className="relative w-24 h-24 rounded-full"
            style={{
              background: 'radial-gradient(circle, rgba(0,20,30,0.9) 0%, rgba(0,0,0,0.95) 100%)',
              border: '3px solid rgba(0,255,255,0.3)',
              boxShadow: 'inset 0 4px 10px rgba(0,0,0,0.8), 0 0 20px rgba(0,255,255,0.05)'
            }}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            data-testid="joystick-container"
          >
            {/* Grid Lines */}
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute top-1/2 left-2 right-2 h-[1px] bg-cyan-900/20" />
              <div className="absolute top-2 bottom-2 left-1/2 w-[1px] bg-cyan-900/20" />
            </div>
            
            {/* Joystick Knob */}
            <div
              className={cn(
                "absolute w-10 h-10 rounded-full transition-all duration-75",
                "transform -translate-x-1/2 -translate-y-1/2"
              )}
              style={{
                left: joystick.isActive 
                  ? joystick.position.x - joystick.center.x + 48 
                  : 48,
                top: joystick.isActive 
                  ? joystick.position.y - joystick.center.y + 48 
                  : 48,
                background: 'linear-gradient(135deg, #00ff41 0%, #00aa20 100%)',
                border: '2px solid #00ff41',
                boxShadow: joystick.isActive ? 
                  `inset 0 -2px 4px rgba(0,0,0,0.4),
                   inset 0 2px 2px rgba(255,255,255,0.4),
                   0 4px 10px rgba(0,255,65,0.5),
                   0 0 20px rgba(0,255,65,0.8)` :
                  `inset 0 -3px 6px rgba(0,0,0,0.4),
                   inset 0 3px 3px rgba(255,255,255,0.4),
                   0 6px 15px rgba(0,0,0,0.5),
                   0 0 30px rgba(0,255,65,0.3)`
              }}
              data-testid="joystick-knob"
            />
            
            {/* Center indicator */}
            <div className="absolute top-1/2 left-1/2 w-2 h-2 rounded-full transform -translate-x-1/2 -translate-y-1/2"
              style={{
                background: '#00ffff',
                boxShadow: '0 0 10px rgba(0,255,255,0.8)'
              }}
            />
          </div>
        </div>
        
        <div className="text-center mt-3 text-xs font-mono font-bold tracking-wider"
          style={{
            color: '#00ffff',
            textShadow: '0 0 10px rgba(0,255,255,0.8)'
          }}
        >
          MOVE
        </div>
      </div>

      {/* Action Buttons - Right Side */}
      <div className="absolute bottom-20 right-6 pointer-events-auto">
        <div className="flex flex-col gap-4">
          {/* Interact Button */}
          {onInteract && (
            <button
              className="w-16 h-16 rounded-full flex items-center justify-center font-mono text-lg font-bold
                       transition-all duration-100 active:scale-95"
              style={{
                background: 'linear-gradient(135deg, rgba(30,50,70,0.95) 0%, rgba(20,30,40,0.95) 100%)',
                border: '3px solid rgba(0,255,255,0.4)',
                boxShadow: `
                  inset 0 -3px 6px rgba(0,0,0,0.6),
                  inset 0 3px 3px rgba(255,255,255,0.2),
                  0 6px 15px rgba(0,0,0,0.5),
                  0 0 25px rgba(0,255,255,0.2)
                `
              }}
              onTouchStart={(e) => handleTouchStart(e, onInteract)}
              data-testid="button-interact"
            >
              <span className="text-2xl" style={{ filter: 'drop-shadow(0 0 8px rgba(0,255,255,0.8))' }}>🔍</span>
            </button>
          )}
          
          {/* Action Button */}
          {onAction && (
            <button
              className="w-16 h-16 rounded-full flex items-center justify-center font-mono text-lg font-bold
                       transition-all duration-100 active:scale-95"
              style={{
                background: 'linear-gradient(135deg, rgba(50,30,70,0.95) 0%, rgba(30,20,40,0.95) 100%)',
                border: '3px solid rgba(255,0,255,0.4)',
                boxShadow: `
                  inset 0 -3px 6px rgba(0,0,0,0.6),
                  inset 0 3px 3px rgba(255,255,255,0.2),
                  0 6px 15px rgba(0,0,0,0.5),
                  0 0 25px rgba(255,0,255,0.2)
                `
              }}
              onTouchStart={(e) => handleTouchStart(e, onAction)}
              data-testid="button-action"
            >
              <span className="text-2xl" style={{ filter: 'drop-shadow(0 0 8px rgba(255,0,255,0.8))' }}>💥</span>
            </button>
          )}
        </div>
        
        <div className="text-center mt-3 text-xs font-mono font-bold tracking-wider"
          style={{
            color: '#00ffff',
            textShadow: '0 0 10px rgba(0,255,255,0.8)'
          }}
        >
          ACTIONS
        </div>
      </div>
    </div>
  );
}
