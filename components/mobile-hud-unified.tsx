// Unified Mobile HUD - Replaces fragmented HUD components
'use client';

import React, { useState, useEffect } from 'react';
import { useMobileHUD } from '@/lib/mobile-hud-context';
import { BottomSheet, InventorySheet, MapSheet, SocialSheet, SettingsSheet } from './mobile-bottom-sheet';
import { cn } from '@/lib/utils';

export function MobileHUDUnified() {
  const {
    activePanel,
    closePanel,
    topBarVisible,
    bottomTabsVisible,
    notifications,
    dismissNotification,
    quickActions,
    preferences,
  } = useMobileHUD();

  const [balance, setBalance] = useState(0);
  const [xp, setXp] = useState(0);
  const [level, setLevel] = useState(1);

  return (
    <>
      {/* Top Bar - Wallet, XP, Notifications */}
      {topBarVisible && <TopBar balance={balance} xp={xp} level={level} />}

      {/* Notifications Toast Stack */}
      <NotificationStack 
        notifications={notifications} 
        onDismiss={dismissNotification}
        hapticEnabled={preferences.hapticEnabled}
      />

      {/* Quick Action Buttons (context-aware) */}
      {quickActions.length > 0 && (
        <QuickActions actions={quickActions} />
      )}

      {/* Bottom Navigation Tabs */}
      {bottomTabsVisible && <BottomNav />}

      {/* Dynamic Panel Renderer */}
      <PanelRenderer 
        activePanel={activePanel} 
        onClose={closePanel}
      />
    </>
  );
}

// Top Bar Component
function TopBar({ balance, xp, level }: { balance: number; xp: number; level: number }) {
  const { openPanel, notifications } = useMobileHUD();
  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div 
      className="fixed top-0 left-0 right-0 z-30 bg-background/80 backdrop-blur-md border-b border-border"
      style={{
        paddingTop: 'env(safe-area-inset-top)',
      }}
    >
      <div className="flex items-center justify-between px-4 py-3">
        {/* Left - Wallet Balance */}
        <button
          onClick={() => openPanel('wallet', 0.6)}
          className="flex items-center gap-2 px-3 py-2 rounded-full bg-primary/10 hover:bg-primary/20 active:bg-primary/30 transition-colors"
        >
          <svg className="w-5 h-5 text-primary" fill="currentColor" viewBox="0 0 20 20">
            <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" />
          </svg>
          <span className="font-bold text-sm">{balance.toLocaleString()}</span>
          <span className="text-xs text-muted-foreground">VOID</span>
        </button>

        {/* Center - Level & XP */}
        <button
          onClick={() => openPanel('xp', 0.4)}
          className="flex items-center gap-2 px-3 py-2 rounded-full bg-secondary/10 hover:bg-secondary/20 active:bg-secondary/30 transition-colors"
        >
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center text-white font-bold text-sm">
            {level}
          </div>
          <div className="flex flex-col items-start">
            <span className="text-xs text-muted-foreground">Level {level}</span>
            <div className="w-20 h-1.5 bg-muted rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-yellow-400 to-orange-500 transition-all duration-300"
                style={{ width: `${(xp % 100)}%` }}
              />
            </div>
          </div>
        </button>

        {/* Right - Notifications */}
        <button
          onClick={() => openPanel('notifications', 0.5)}
          className="relative p-2 rounded-full hover:bg-muted active:bg-muted/80 transition-colors"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
          {unreadCount > 0 && (
            <span className="absolute top-0 right-0 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
              {unreadCount}
            </span>
          )}
        </button>
      </div>
    </div>
  );
}

// Notification Toast Stack
function NotificationStack({ 
  notifications, 
  onDismiss,
  hapticEnabled 
}: { 
  notifications: any[]; 
  onDismiss: (id: string) => void;
  hapticEnabled: boolean;
}) {
  return (
    <div 
      className="fixed top-20 right-4 z-40 flex flex-col gap-2 max-w-sm"
      style={{
        marginTop: 'env(safe-area-inset-top)',
      }}
    >
      {notifications.slice(0, 3).map((notification, index) => (
        <NotificationToast
          key={notification.id}
          notification={notification}
          onDismiss={() => onDismiss(notification.id)}
          index={index}
          hapticEnabled={hapticEnabled}
        />
      ))}
    </div>
  );
}

function NotificationToast({ 
  notification, 
  onDismiss, 
  index,
  hapticEnabled 
}: { 
  notification: any; 
  onDismiss: () => void; 
  index: number;
  hapticEnabled: boolean;
}) {
  const [isExiting, setIsExiting] = useState(false);

  const handleDismiss = () => {
    if (hapticEnabled && navigator.vibrate) {
      navigator.vibrate(5);
    }
    setIsExiting(true);
    setTimeout(onDismiss, 200);
  };

  const bgColors = {
    success: 'bg-green-500',
    error: 'bg-red-500',
    warning: 'bg-yellow-500',
    info: 'bg-blue-500',
    achievement: 'bg-purple-500',
  };

  const icons = {
    success: '✓',
    error: '✕',
    warning: '⚠',
    info: 'ℹ',
    achievement: notification.icon || '🏆',
  };

  return (
    <div
      className={cn(
        "flex items-start gap-3 p-4 rounded-lg shadow-xl backdrop-blur-md",
        "transform transition-all duration-200 min-w-[280px]",
        isExiting ? "opacity-0 translate-x-full" : "opacity-100 translate-x-0",
        bgColors[notification.type as keyof typeof bgColors] || bgColors.info
      )}
      style={{
        marginTop: `${index * 4}px`,
        transform: `scale(${1 - index * 0.05})`,
      }}
    >
      <div className="text-2xl">{icons[notification.type as keyof typeof icons]}</div>
      <div className="flex-1">
        <h4 className="font-bold text-white">{notification.title}</h4>
        {notification.message && (
          <p className="text-sm text-white/90 mt-0.5">{notification.message}</p>
        )}
      </div>
      <button
        onClick={handleDismiss}
        className="text-white/80 hover:text-white transition-colors"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}

// Quick Action Buttons
function QuickActions({ actions }: { actions: any[] }) {
  const { preferences } = useMobileHUD();

  return (
    <div 
      className="fixed bottom-24 right-4 z-30 flex flex-col gap-2"
      style={{
        marginBottom: 'env(safe-area-inset-bottom)',
      }}
    >
      {actions.map(action => (
        <button
          key={action.id}
          onClick={() => {
            if (preferences.hapticEnabled && navigator.vibrate) {
              navigator.vibrate(10);
            }
            action.onClick();
          }}
          disabled={!action.enabled}
          className={cn(
            "relative w-14 h-14 rounded-full shadow-lg",
            "flex items-center justify-center",
            "transition-all duration-200",
            action.enabled
              ? "bg-primary text-primary-foreground hover:scale-110 active:scale-95"
              : "bg-muted text-muted-foreground opacity-50 cursor-not-allowed"
          )}
        >
          <span className="text-2xl">{action.icon}</span>
          {action.badge && (
            <span className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
              {action.badge}
            </span>
          )}
          {action.label && (
            <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-xs whitespace-nowrap bg-background/80 px-2 py-1 rounded">
              {action.label}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}

// Bottom Navigation Tabs
function BottomNav() {
  const { openPanel, activePanel, preferences } = useMobileHUD();

  const tabs = [
    { id: 'inventory', icon: '🎒', label: 'Inventory' },
    { id: 'map', icon: '🗺️', label: 'Map' },
    { id: 'social', icon: '👥', label: 'Social' },
    { id: 'phone', icon: '📱', label: 'Phone' },
    { id: 'settings', icon: '⚙️', label: 'More' },
  ];

  return (
    <div 
      className="fixed bottom-0 left-0 right-0 z-30 bg-background/95 backdrop-blur-md border-t border-border"
      style={{
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}
    >
      <div className="flex items-center justify-around px-2 py-2">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => {
              if (preferences.hapticEnabled && navigator.vibrate) {
                navigator.vibrate(10);
              }
              openPanel(tab.id as any, 0.5);
            }}
            className={cn(
              "flex flex-col items-center gap-1 px-3 py-2 rounded-lg min-w-[60px]",
              "transition-all duration-200",
              activePanel === tab.id
                ? "bg-primary/10 text-primary scale-105"
                : "text-muted-foreground hover:bg-muted active:bg-muted/80"
            )}
          >
            <span className="text-2xl">{tab.icon}</span>
            <span className="text-xs font-medium">{tab.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

// Panel Renderer - Routes to appropriate panel content
function PanelRenderer({ activePanel, onClose }: { activePanel: string | null; onClose: () => void }) {
  if (!activePanel) return null;

  switch (activePanel) {
    case 'inventory':
      return (
        <InventorySheet isOpen={true} onClose={onClose}>
          <InventoryPanel />
        </InventorySheet>
      );
    
    case 'map':
      return (
        <MapSheet isOpen={true} onClose={onClose}>
          <MapPanel />
        </MapSheet>
      );
    
    case 'social':
      return (
        <SocialSheet isOpen={true} onClose={onClose}>
          <SocialPanel />
        </SocialSheet>
      );
    
    case 'phone':
      return (
        <BottomSheet isOpen={true} onClose={onClose} snapPoints={[0, 0.95]} initialSnap={0.95} title="Phone">
          <PhonePanel />
        </BottomSheet>
      );
    
    case 'settings':
      return (
        <SettingsSheet isOpen={true} onClose={onClose}>
          <SettingsPanel />
        </SettingsSheet>
      );
    
    case 'wallet':
      return (
        <BottomSheet isOpen={true} onClose={onClose} snapPoints={[0, 0.6]} initialSnap={0.6} title="Wallet">
          <WalletPanel />
        </BottomSheet>
      );
    
    case 'xp':
      return (
        <BottomSheet isOpen={true} onClose={onClose} snapPoints={[0, 0.4]} initialSnap={0.4} title="Level Progress">
          <XPPanel />
        </BottomSheet>
      );
    
    case 'quests':
      return (
        <BottomSheet isOpen={true} onClose={onClose} snapPoints={[0, 0.7, 0.95]} initialSnap={0.7} title="Quests">
          <QuestsPanel />
        </BottomSheet>
      );
    
    case 'achievements':
      return (
        <BottomSheet isOpen={true} onClose={onClose} snapPoints={[0, 0.7, 0.95]} initialSnap={0.7} title="Achievements">
          <AchievementsPanel />
        </BottomSheet>
      );
    
    default:
      return null;
  }
}

// Panel Content Components (placeholders - to be replaced with actual implementations)
function InventoryPanel() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-4 gap-3">
        {Array.from({ length: 20 }).map((_, i) => (
          <div key={i} className="aspect-square bg-muted rounded-lg border-2 border-border hover:border-primary transition-colors cursor-pointer" />
        ))}
      </div>
    </div>
  );
}

function MapPanel() {
  return (
    <div className="aspect-square bg-muted rounded-lg flex items-center justify-center">
      <p className="text-muted-foreground">Interactive Map</p>
    </div>
  );
}

function SocialPanel() {
  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <button className="flex-1 py-2 bg-primary text-primary-foreground rounded-lg font-medium">Friends</button>
        <button className="flex-1 py-2 bg-muted rounded-lg">Communities</button>
      </div>
      <div className="space-y-2">
        {[1, 2, 3].map(i => (
          <div key={i} className="flex items-center gap-3 p-3 bg-muted rounded-lg">
            <div className="w-10 h-10 bg-primary rounded-full" />
            <div className="flex-1">
              <p className="font-medium">Player {i}</p>
              <p className="text-sm text-muted-foreground">Online</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function PhonePanel() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-4">
        {['Messages', 'Calls', 'Camera', 'Gallery', 'Music', 'Settings'].map(app => (
          <button key={app} className="aspect-square bg-muted rounded-2xl flex flex-col items-center justify-center gap-2 hover:bg-muted/80 transition-colors">
            <span className="text-3xl">📱</span>
            <span className="text-xs">{app}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function SettingsPanel() {
  const { preferences, updatePreferences } = useMobileHUD();

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <label className="flex items-center justify-between p-3 bg-muted rounded-lg">
          <span>Haptic Feedback</span>
          <input 
            type="checkbox" 
            checked={preferences.hapticEnabled}
            onChange={(e) => updatePreferences({ hapticEnabled: e.target.checked })}
            className="w-10 h-6"
          />
        </label>
        
        <label className="flex items-center justify-between p-3 bg-muted rounded-lg">
          <span>Touch Indicators</span>
          <input 
            type="checkbox" 
            checked={preferences.touchIndicators}
            onChange={(e) => updatePreferences({ touchIndicators: e.target.checked })}
            className="w-10 h-6"
          />
        </label>
        
        <div className="p-3 bg-muted rounded-lg space-y-2">
          <span>Joystick Size</span>
          <select 
            value={preferences.joystickSize}
            onChange={(e) => updatePreferences({ joystickSize: e.target.value as any })}
            className="w-full p-2 rounded bg-background"
          >
            <option value="small">Small</option>
            <option value="medium">Medium</option>
            <option value="large">Large</option>
          </select>
        </div>
      </div>
    </div>
  );
}

function WalletPanel() {
  return (
    <div className="space-y-4">
      <div className="p-6 bg-gradient-to-br from-primary to-primary/50 rounded-2xl text-primary-foreground">
        <p className="text-sm opacity-80">Total Balance</p>
        <p className="text-4xl font-bold mt-2">12,450 VOID</p>
        <p className="text-sm opacity-80 mt-1">≈ $248.50 USD</p>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <button className="py-3 bg-primary text-primary-foreground rounded-lg font-medium">Send</button>
        <button className="py-3 bg-muted rounded-lg font-medium">Receive</button>
      </div>
    </div>
  );
}

function XPPanel() {
  return (
    <div className="space-y-4">
      <div className="text-center">
        <div className="w-24 h-24 mx-auto rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center text-white text-3xl font-bold">
          5
        </div>
        <h3 className="text-2xl font-bold mt-4">Level 5</h3>
        <p className="text-muted-foreground">750 / 1000 XP to Level 6</p>
      </div>
      <div className="w-full h-3 bg-muted rounded-full overflow-hidden">
        <div className="h-full bg-gradient-to-r from-yellow-400 to-orange-500 w-3/4" />
      </div>
    </div>
  );
}

function QuestsPanel() {
  return (
    <div className="space-y-3">
      {[1, 2, 3].map(i => (
        <div key={i} className="p-4 bg-muted rounded-lg">
          <h4 className="font-bold">Quest {i}</h4>
          <p className="text-sm text-muted-foreground mt-1">Complete daily tasks</p>
          <div className="flex items-center justify-between mt-3">
            <div className="flex-1 h-2 bg-background rounded-full overflow-hidden mr-3">
              <div className="h-full bg-primary w-1/2" />
            </div>
            <span className="text-sm font-medium">50%</span>
          </div>
        </div>
      ))}
    </div>
  );
}

function AchievementsPanel() {
  return (
    <div className="grid grid-cols-3 gap-3">
      {Array.from({ length: 12 }).map((_, i) => (
        <div key={i} className="aspect-square bg-muted rounded-lg flex items-center justify-center text-3xl">
          {i < 6 ? '🏆' : '🔒'}
        </div>
      ))}
    </div>
  );
}
