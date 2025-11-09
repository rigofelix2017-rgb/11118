// Mobile-Optimized Wrapper Component
// Wraps any system component with mobile optimizations

import React, { ReactNode } from 'react';
import {
  useSafeAreaInsets,
  useViewport,
  useNetworkStatus,
  useVirtualKeyboard,
  usePreventPullToRefresh,
} from './mobile-optimization-hooks';
import { MOBILE_CLASSES } from './mobile-optimization';

interface MobileOptimizedWrapperProps {
  children: ReactNode;
  title?: string;
  showHeader?: boolean;
  showOfflineIndicator?: boolean;
  adjustForKeyboard?: boolean;
  preventPullToRefresh?: boolean;
  safeAreas?: {
    top?: boolean;
    bottom?: boolean;
    left?: boolean;
    right?: boolean;
  };
  className?: string;
}

export function MobileOptimizedWrapper({
  children,
  title,
  showHeader = true,
  showOfflineIndicator = true,
  adjustForKeyboard = true,
  preventPullToRefresh = false,
  safeAreas = { top: true, bottom: true, left: true, right: true },
  className = '',
}: MobileOptimizedWrapperProps) {
  const insets = useSafeAreaInsets();
  const viewport = useViewport();
  const isOnline = useNetworkStatus();
  const { isKeyboardVisible, keyboardHeight } = useVirtualKeyboard();

  // Prevent pull-to-refresh if enabled
  if (preventPullToRefresh) {
    usePreventPullToRefresh();
  }

  // Calculate padding based on safe areas
  const safeAreaStyles: React.CSSProperties = {
    paddingTop: safeAreas.top ? `${insets.top}px` : undefined,
    paddingBottom: safeAreas.bottom 
      ? `${insets.bottom + (adjustForKeyboard && isKeyboardVisible ? 0 : 0)}px`
      : undefined,
    paddingLeft: safeAreas.left ? `${insets.left}px` : undefined,
    paddingRight: safeAreas.right ? `${insets.right}px` : undefined,
  };

  // Adjust height when keyboard is visible
  const containerStyle: React.CSSProperties = {
    ...safeAreaStyles,
    height: adjustForKeyboard && isKeyboardVisible 
      ? `calc(100vh - ${keyboardHeight}px)`
      : '100vh',
    transition: 'height 0.2s ease-out',
  };

  return (
    <div 
      className={`mobile-optimized-container ${MOBILE_CLASSES.smoothScroll} ${className}`}
      style={containerStyle}
    >
      {/* Offline Indicator */}
      {showOfflineIndicator && !isOnline && (
        <div className="fixed top-0 left-0 right-0 bg-yellow-500 text-white text-center py-2 text-sm font-medium z-50">
          ⚠️ You are offline
        </div>
      )}

      {/* Header */}
      {showHeader && title && (
        <div 
          className={`sticky top-0 bg-gray-900/95 backdrop-blur-sm border-b border-gray-800 z-40 ${MOBILE_CLASSES.touchListItem}`}
          style={{ paddingTop: safeAreas.top ? `${insets.top}px` : '0' }}
        >
          <div className="px-4 py-3">
            <h1 className="text-xl font-bold text-white">{title}</h1>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        {children}
      </div>

      {/* Device Info (Debug - remove in production) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed bottom-0 left-0 right-0 bg-black/80 text-white text-xs p-2 font-mono">
          <div>📱 {viewport.width}x{viewport.height} | DPR: {viewport.devicePixelRatio}</div>
          <div>
            Safe: {insets.top}t {insets.right}r {insets.bottom}b {insets.left}l
          </div>
          <div>
            {viewport.isMobile ? '📱 Mobile' : viewport.isTablet ? '📱 Tablet' : '💻 Desktop'} | 
            {viewport.isPortrait ? ' Portrait' : ' Landscape'}
            {isKeyboardVisible && ` | ⌨️ ${keyboardHeight}px`}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Mobile-Optimized Button Component
 */
interface MobileButtonProps {
  children: ReactNode;
  onClick: () => void;
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  fullWidth?: boolean;
  hapticFeedback?: boolean;
  className?: string;
}

export function MobileButton({
  children,
  onClick,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  fullWidth = false,
  hapticFeedback = true,
  className = '',
}: MobileButtonProps) {
  const { useOptimizedTouch, HapticPattern } = require('./mobile-optimization-hooks');
  
  const handleClick = useOptimizedTouch(onClick, {
    haptic: hapticFeedback ? HapticPattern.LIGHT : undefined,
    debounce: 100,
  });

  const sizeClasses = {
    small: 'h-10 px-4 text-sm',
    medium: 'h-12 px-6 text-base',
    large: 'h-14 px-8 text-lg',
  };

  const variantClasses = {
    primary: 'bg-blue-600 hover:bg-blue-700 text-white',
    secondary: 'bg-gray-700 hover:bg-gray-600 text-white',
    danger: 'bg-red-600 hover:bg-red-700 text-white',
  };

  return (
    <button
      onClick={handleClick}
      disabled={disabled}
      className={`
        ${sizeClasses[size]}
        ${variantClasses[variant]}
        ${fullWidth ? 'w-full' : ''}
        ${MOBILE_CLASSES.touchTarget}
        ${MOBILE_CLASSES.activeScale}
        ${MOBILE_CLASSES.noTapHighlight}
        rounded-lg font-semibold
        disabled:opacity-50 disabled:cursor-not-allowed
        transition-all duration-150
        ${className}
      `}
    >
      {children}
    </button>
  );
}

/**
 * Mobile-Optimized List Item Component
 */
interface MobileListItemProps {
  children: ReactNode;
  onClick?: () => void;
  onLongPress?: () => void;
  showChevron?: boolean;
  disabled?: boolean;
  className?: string;
}

export function MobileListItem({
  children,
  onClick,
  onLongPress,
  showChevron = false,
  disabled = false,
  className = '',
}: MobileListItemProps) {
  const { useLongPress } = require('./mobile-optimization-hooks');
  const longPressRef = onLongPress ? useLongPress(onLongPress) : null;

  return (
    <div
      ref={longPressRef}
      onClick={onClick}
      className={`
        ${MOBILE_CLASSES.touchListItem}
        ${onClick ? MOBILE_CLASSES.activeOpacity : ''}
        ${onClick ? 'cursor-pointer' : ''}
        ${MOBILE_CLASSES.noTapHighlight}
        flex items-center px-4 py-3 border-b border-gray-800
        ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        ${className}
      `}
    >
      <div className="flex-1">{children}</div>
      {showChevron && onClick && (
        <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      )}
    </div>
  );
}

/**
 * Mobile-Optimized Modal Component
 */
interface MobileModalProps {
  children: ReactNode;
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  size?: 'small' | 'medium' | 'large' | 'full';
  showCloseButton?: boolean;
  className?: string;
}

export function MobileModal({
  children,
  isOpen,
  onClose,
  title,
  size = 'medium',
  showCloseButton = true,
  className = '',
}: MobileModalProps) {
  const { useSwipeGesture } = require('./mobile-optimization-hooks');
  const swipeRef = useSwipeGesture((event) => {
    if (event.direction === 'down' && event.distance > 100) {
      onClose();
    }
  });

  const insets = useSafeAreaInsets();

  if (!isOpen) return null;

  const sizeClasses = {
    small: 'max-h-[40vh]',
    medium: 'max-h-[60vh]',
    large: 'max-h-[80vh]',
    full: 'h-full',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div
        ref={swipeRef as any}
        className={`
          relative w-full bg-gray-900 rounded-t-3xl sm:rounded-3xl
          ${sizeClasses[size]}
          overflow-hidden flex flex-col
          ${className}
        `}
        style={{
          maxWidth: '600px',
          paddingBottom: `${insets.bottom}px`,
        }}
      >
        {/* Swipe Indicator */}
        <div className="flex justify-center py-2">
          <div className="w-12 h-1 bg-gray-700 rounded-full" />
        </div>

        {/* Header */}
        {(title || showCloseButton) && (
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
            {title && <h2 className="text-lg font-bold text-white">{title}</h2>}
            {showCloseButton && (
              <button
                onClick={onClose}
                className={`
                  ${MOBILE_CLASSES.touchTarget}
                  ${MOBILE_CLASSES.activeScale}
                  p-2 rounded-lg hover:bg-gray-800
                `}
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-auto px-6 py-4">
          {children}
        </div>
      </div>
    </div>
  );
}

/**
 * Mobile-Optimized Input Component
 */
interface MobileInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: 'text' | 'number' | 'email' | 'password' | 'search';
  disabled?: boolean;
  autoFocus?: boolean;
  className?: string;
}

export function MobileInput({
  value,
  onChange,
  placeholder = '',
  type = 'text',
  disabled = false,
  autoFocus = false,
  className = '',
}: MobileInputProps) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      disabled={disabled}
      autoFocus={autoFocus}
      className={`
        ${MOBILE_CLASSES.touchTarget}
        w-full px-4 py-3 bg-gray-800 border border-gray-700
        rounded-lg text-white placeholder-gray-500
        focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent
        disabled:opacity-50 disabled:cursor-not-allowed
        text-base
        ${className}
      `}
      // Prevent zoom on iOS when focused
      style={{ fontSize: '16px' }}
    />
  );
}

/**
 * Mobile-Optimized Card Component
 */
interface MobileCardProps {
  children: ReactNode;
  onClick?: () => void;
  className?: string;
}

export function MobileCard({ children, onClick, className = '' }: MobileCardProps) {
  return (
    <div
      onClick={onClick}
      className={`
        bg-gray-800 rounded-xl p-4
        ${onClick ? MOBILE_CLASSES.activeScale : ''}
        ${onClick ? 'cursor-pointer' : ''}
        ${MOBILE_CLASSES.noTapHighlight}
        transition-all duration-150
        ${className}
      `}
    >
      {children}
    </div>
  );
}

// Export all components
export default {
  MobileOptimizedWrapper,
  MobileButton,
  MobileListItem,
  MobileModal,
  MobileInput,
  MobileCard,
};
