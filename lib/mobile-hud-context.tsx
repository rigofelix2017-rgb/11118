// Unified Mobile HUD Context - Single source of truth for all mobile UI state
'use client';

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

export type PanelType = 'inventory' | 'map' | 'social' | 'phone' | 'settings' | 'xp' | 'wallet' | 'quests' | 'achievements';
export type SnapPoint = 0 | 0.4 | 0.9;

interface Notification {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning' | 'achievement';
  title: string;
  message: string;
  icon?: string;
  timestamp: Date;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface QuickAction {
  id: string;
  icon: string;
  label: string;
  onClick: () => void;
  enabled: boolean;
  badge?: number;
}

interface MobileHUDPreferences {
  hapticEnabled: boolean;
  joystickSize: 'small' | 'medium' | 'large';
  joystickOpacity: number;
  joystickPosition: { x: number; y: number };
  showTouchIndicators: boolean;
  autoHideControls: boolean;
}

interface MobileHUDState {
  // Panel state
  activePanel: PanelType | null;
  panelSnapPoint: SnapPoint;
  panelHistory: PanelType[];
  
  // UI visibility
  joystickEnabled: boolean;
  topBarVisible: boolean;
  bottomTabsVisible: boolean;
  
  // Notifications
  notifications: Notification[];
  unreadCount: number;
  
  // Quick actions (context-aware buttons)
  quickActions: QuickAction[];
  
  // User preferences
  preferences: MobileHUDPreferences;
  
  // Loading states
  isLoading: boolean;
  
  // Methods
  openPanel: (panel: PanelType, snapPoint?: SnapPoint) => void;
  closePanel: () => void;
  togglePanel: (panel: PanelType) => void;
  setSnapPoint: (point: SnapPoint) => void;
  goBackPanel: () => void;
  
  setJoystickEnabled: (enabled: boolean) => void;
  setTopBarVisible: (visible: boolean) => void;
  setBottomTabsVisible: (visible: boolean) => void;
  
  pushNotification: (notification: Omit<Notification, 'id' | 'timestamp'>) => void;
  dismissNotification: (id: string) => void;
  clearNotifications: () => void;
  markAllRead: () => void;
  
  setQuickActions: (actions: QuickAction[]) => void;
  updateQuickAction: (id: string, updates: Partial<QuickAction>) => void;
  
  updatePreferences: (updates: Partial<MobileHUDPreferences>) => void;
  resetPreferences: () => void;
  
  setLoading: (loading: boolean) => void;
}

const DEFAULT_PREFERENCES: MobileHUDPreferences = {
  hapticEnabled: true,
  joystickSize: 'medium',
  joystickOpacity: 0.8,
  joystickPosition: { x: 24, y: 80 }, // bottom-left offset
  showTouchIndicators: true,
  autoHideControls: true,
};

const MobileHUDContext = createContext<MobileHUDState | null>(null);

export function MobileHUDProvider({ children }: { children: React.ReactNode }) {
  const [activePanel, setActivePanel] = useState<PanelType | null>(null);
  const [panelSnapPoint, setPanelSnapPoint] = useState<SnapPoint>(0);
  const [panelHistory, setPanelHistory] = useState<PanelType[]>([]);
  
  const [joystickEnabled, setJoystickEnabledState] = useState(true);
  const [topBarVisible, setTopBarVisible] = useState(true);
  const [bottomTabsVisible, setBottomTabsVisible] = useState(true);
  
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  
  const [quickActions, setQuickActions] = useState<QuickAction[]>([]);
  const [preferences, setPreferences] = useState<MobileHUDPreferences>(DEFAULT_PREFERENCES);
  const [isLoading, setLoading] = useState(false);

  // Load preferences from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('mobileHUDPreferences');
      if (saved) {
        try {
          setPreferences({ ...DEFAULT_PREFERENCES, ...JSON.parse(saved) });
        } catch (e) {
          console.error('Failed to load HUD preferences:', e);
        }
      }
    }
  }, []);

  // Save preferences to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('mobileHUDPreferences', JSON.stringify(preferences));
    }
  }, [preferences]);

  // Auto-hide joystick when panel is open
  useEffect(() => {
    if (activePanel !== null && preferences.autoHideControls) {
      setJoystickEnabledState(false);
    } else {
      setJoystickEnabledState(true);
    }
  }, [activePanel, preferences.autoHideControls]);

  const openPanel = useCallback((panel: PanelType, snapPoint: SnapPoint = 0.4) => {
    if (activePanel !== panel) {
      setPanelHistory(prev => [...prev, panel]);
    }
    setActivePanel(panel);
    setPanelSnapPoint(snapPoint);
    
    // Haptic feedback
    if (preferences.hapticEnabled && typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(10);
    }
  }, [activePanel, preferences.hapticEnabled]);

  const closePanel = useCallback(() => {
    setActivePanel(null);
    setPanelSnapPoint(0);
    setPanelHistory([]);
    
    if (preferences.hapticEnabled && typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(5);
    }
  }, [preferences.hapticEnabled]);

  const togglePanel = useCallback((panel: PanelType) => {
    if (activePanel === panel) {
      closePanel();
    } else {
      openPanel(panel);
    }
  }, [activePanel, openPanel, closePanel]);

  const setSnapPoint = useCallback((point: SnapPoint) => {
    setPanelSnapPoint(point);
  }, []);

  const goBackPanel = useCallback(() => {
    if (panelHistory.length > 1) {
      const newHistory = [...panelHistory];
      newHistory.pop(); // Remove current
      const previous = newHistory[newHistory.length - 1];
      setPanelHistory(newHistory);
      setActivePanel(previous);
    } else {
      closePanel();
    }
  }, [panelHistory, closePanel]);

  const pushNotification = useCallback((notification: Omit<Notification, 'id' | 'timestamp'>) => {
    const newNotification: Notification = {
      ...notification,
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date(),
    };
    
    setNotifications(prev => [newNotification, ...prev]);
    setUnreadCount(prev => prev + 1);
    
    // Haptic feedback for important notifications
    if (preferences.hapticEnabled && typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      if (notification.type === 'achievement') {
        navigator.vibrate([50, 30, 50]); // Pattern for achievements
      } else if (notification.type === 'success') {
        navigator.vibrate(20);
      } else if (notification.type === 'error') {
        navigator.vibrate([100, 50, 100]);
      }
    }
    
    // Auto-dismiss after duration
    if (notification.duration) {
      setTimeout(() => {
        dismissNotification(newNotification.id);
      }, notification.duration);
    }
  }, [preferences.hapticEnabled]);

  const dismissNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const clearNotifications = useCallback(() => {
    setNotifications([]);
    setUnreadCount(0);
  }, []);

  const markAllRead = useCallback(() => {
    setUnreadCount(0);
  }, []);

  const updateQuickAction = useCallback((id: string, updates: Partial<QuickAction>) => {
    setQuickActions(prev => prev.map(action => 
      action.id === id ? { ...action, ...updates } : action
    ));
  }, []);

  const updatePreferences = useCallback((updates: Partial<MobileHUDPreferences>) => {
    setPreferences(prev => ({ ...prev, ...updates }));
  }, []);

  const resetPreferences = useCallback(() => {
    setPreferences(DEFAULT_PREFERENCES);
  }, []);

  const value: MobileHUDState = {
    activePanel,
    panelSnapPoint,
    panelHistory,
    
    joystickEnabled,
    topBarVisible,
    bottomTabsVisible,
    
    notifications,
    unreadCount,
    
    quickActions,
    preferences,
    isLoading,
    
    openPanel,
    closePanel,
    togglePanel,
    setSnapPoint,
    goBackPanel,
    
    setJoystickEnabled: setJoystickEnabledState,
    setTopBarVisible,
    setBottomTabsVisible,
    
    pushNotification,
    dismissNotification,
    clearNotifications,
    markAllRead,
    
    setQuickActions,
    updateQuickAction,
    
    updatePreferences,
    resetPreferences,
    
    setLoading,
  };

  return (
    <MobileHUDContext.Provider value={value}>
      {children}
    </MobileHUDContext.Provider>
  );
}

export function useMobileHUD() {
  const context = useContext(MobileHUDContext);
  if (!context) {
    throw new Error('useMobileHUD must be used within MobileHUDProvider');
  }
  return context;
}

// Utility hook for managing context-aware quick actions
export function useQuickActions(actions: QuickAction[]) {
  const { setQuickActions } = useMobileHUD();
  
  useEffect(() => {
    setQuickActions(actions);
    
    // Cleanup on unmount
    return () => setQuickActions([]);
  }, [actions, setQuickActions]);
}

// Utility hook for showing notifications
export function useNotification() {
  const { pushNotification } = useMobileHUD();
  
  return {
    success: (title: string, message: string, duration = 3000) => 
      pushNotification({ type: 'success', title, message, duration }),
    
    error: (title: string, message: string, duration = 5000) => 
      pushNotification({ type: 'error', title, message, duration }),
    
    info: (title: string, message: string, duration = 3000) => 
      pushNotification({ type: 'info', title, message, duration }),
    
    warning: (title: string, message: string, duration = 4000) => 
      pushNotification({ type: 'warning', title, message, duration }),
    
    achievement: (title: string, message: string, icon?: string) => 
      pushNotification({ type: 'achievement', title, message, icon, duration: 5000 }),
  };
}
