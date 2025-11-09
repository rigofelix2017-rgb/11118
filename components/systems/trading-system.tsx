// Trading System Component
// P2P item trading with offer/counter-offer system

'use client';

import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { useMobileHUD } from '@/lib/mobile-hud-context';
import { 
  MobileOptimizedWrapper, 
  MobileButton, 
  MobileInput 
} from '@/components/mobile/MobileOptimizedComponents';
import { useHaptic, usePullToRefresh } from '@/lib/mobile-optimization-hooks';
import { HapticPattern } from '@/lib/mobile-optimization';

interface TradeItem {
  id: string;
  itemId: string;
  name: string;
  icon: string;
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  quantity: number;
  value: number;
}

interface Trade {
  id: string;
  initiatorId: string;
  partnerId: string;
  initiatorName: string;
  partnerName: string;
  initiatorItems: TradeItem[];
  partnerItems: TradeItem[];
  initiatorReady: boolean;
  partnerReady: boolean;
  status: 'pending' | 'accepted' | 'completed' | 'cancelled' | 'rejected';
  createdAt: Date;
  expiresAt: Date;
}

export function TradingSystem() {
  const [activeTrades, setActiveTrades] = useState<Trade[]>([]);
  const [tradeHistory, setTradeHistory] = useState<Trade[]>([]);
  const [selectedTab, setSelectedTab] = useState<'active' | 'history'>('active');
  const [showCreateTrade, setShowCreateTrade] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchTrades();
  }, [selectedTab]);

  const fetchTrades = async () => {
    try {
      setIsLoading(true);
      const endpoint = selectedTab === 'active' ? '/api/trades/active' : '/api/trades/history';
      const response = await fetch(endpoint);
      const data = await response.json();
      
      if (selectedTab === 'active') {
        setActiveTrades(data);
      } else {
        setTradeHistory(data);
      }
    } catch (error) {
      console.error('Failed to fetch trades:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <MobileOptimizedWrapper title="Trading System" showHeader={true}>
      <div className="space-y-4">
      {/* Header with Create Button */}
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          <button
            onClick={() => setSelectedTab('active')}
            className={cn(
              "px-4 py-2 rounded-lg font-medium transition-all",
              selectedTab === 'active'
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground"
            )}
          >
            Active ({activeTrades.length})
          </button>
          <button
            onClick={() => setSelectedTab('history')}
            className={cn(
              "px-4 py-2 rounded-lg font-medium transition-all",
              selectedTab === 'history'
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground"
            )}
          >
            History
          </button>
        </div>

        <button
          onClick={() => setShowCreateTrade(true)}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90"
        >
          + New Trade
        </button>
      </div>

      {/* Trade List */}
      <div className="space-y-3">
        {selectedTab === 'active' && activeTrades.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <p className="text-4xl mb-2">🤝</p>
            <p>No active trades</p>
            <p className="text-sm mt-1">Start a new trade to get started!</p>
          </div>
        )}

        {selectedTab === 'active' && activeTrades.map((trade) => (
          <TradeCard key={trade.id} trade={trade} onUpdate={fetchTrades} />
        ))}

        {selectedTab === 'history' && tradeHistory.map((trade) => (
          <TradeHistoryCard key={trade.id} trade={trade} />
        ))}
      </div>

      {/* Create Trade Modal */}
      {showCreateTrade && (
        <CreateTradeModal
          onClose={() => setShowCreateTrade(false)}
          onCreated={() => {
            setShowCreateTrade(false);
            fetchTrades();
          }}
        />
      )}
    </div>
  );
}

function TradeCard({ trade, onUpdate }: { trade: Trade; onUpdate: () => void }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const { pushNotification, preferences } = useMobileHUD();
  const haptic = useHaptic();

  const handleAccept = async () => {
    try {
      const response = await fetch('/api/trades/accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tradeId: trade.id }),
      });

      if (response.ok) {
        pushNotification({
          type: 'success',
          title: 'Trade Completed!',
          message: `Successfully traded with ${trade.partnerName}`,
          duration: 3000,
        });

        if (preferences.hapticEnabled && navigator.vibrate) {
          navigator.vibrate([50, 30, 50]);
        }

        onUpdate();
      }
    } catch (error) {
      console.error('Failed to accept trade:', error);
    }
  };

  const handleReject = async () => {
    try {
      await fetch('/api/trades/reject', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tradeId: trade.id }),
      });
      onUpdate();
    } catch (error) {
      console.error('Failed to reject trade:', error);
    }
  };

  const handleToggleReady = async () => {
    try {
      await fetch('/api/trades/toggle-ready', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tradeId: trade.id }),
      });
      onUpdate();
    } catch (error) {
      console.error('Failed to toggle ready:', error);
    }
  };

  const timeRemaining = trade.expiresAt ? getTimeRemaining(new Date(trade.expiresAt)) : null;

  return (
    <div className="p-4 bg-muted rounded-lg border border-border">
      <div
        className="flex items-center justify-between cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            <span className="text-xl">🤝</span>
          </div>
          <div>
            <h4 className="font-bold text-sm">
              Trade with {trade.partnerName}
            </h4>
            <p className="text-xs text-muted-foreground">
              {trade.initiatorItems.length + trade.partnerItems.length} items
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {timeRemaining && (
            <span className="text-xs text-muted-foreground">⏱️ {timeRemaining}</span>
          )}
          <span className={cn("text-lg transition-transform", isExpanded && "rotate-180")}>
            ▼
          </span>
        </div>
      </div>

      {isExpanded && (
        <div className="mt-4 space-y-4">
          {/* Trade Window */}
          <div className="grid grid-cols-2 gap-3">
            {/* Your Offer */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">Your Offer</p>
                {trade.initiatorReady && (
                  <span className="text-xs text-green-500">✓ Ready</span>
                )}
              </div>
              <div className="p-3 bg-background rounded-lg border border-border min-h-[120px]">
                {trade.initiatorItems.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-8">
                    No items offered
                  </p>
                ) : (
                  <div className="space-y-2">
                    {trade.initiatorItems.map((item) => (
                      <TradeItemDisplay key={item.id} item={item} />
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Their Offer */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">Their Offer</p>
                {trade.partnerReady && (
                  <span className="text-xs text-green-500">✓ Ready</span>
                )}
              </div>
              <div className="p-3 bg-background rounded-lg border border-border min-h-[120px]">
                {trade.partnerItems.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-8">
                    No items offered
                  </p>
                ) : (
                  <div className="space-y-2">
                    {trade.partnerItems.map((item) => (
                      <TradeItemDisplay key={item.id} item={item} />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <button
              onClick={handleToggleReady}
              className={cn(
                "flex-1 py-2 rounded-lg font-medium transition-all",
                trade.initiatorReady
                  ? "bg-green-500 text-white"
                  : "bg-primary text-primary-foreground"
              )}
            >
              {trade.initiatorReady ? 'Ready ✓' : 'Mark Ready'}
            </button>
            
            {trade.initiatorReady && trade.partnerReady && (
              <button
                onClick={handleAccept}
                className="flex-1 py-2 bg-green-500 text-white rounded-lg font-medium hover:bg-green-600"
              >
                Complete Trade
              </button>
            )}
            
            <button
              onClick={handleReject}
              className="px-4 py-2 bg-red-500/10 text-red-500 rounded-lg font-medium hover:bg-red-500/20"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function TradeItemDisplay({ item }: { item: TradeItem }) {
  const rarityColors = {
    common: 'border-gray-500/30',
    uncommon: 'border-green-500/30',
    rare: 'border-blue-500/30',
    epic: 'border-purple-500/30',
    legendary: 'border-orange-500/30',
  };

  return (
    <div className={cn(
      "flex items-center gap-2 p-2 rounded border-2 bg-background/50",
      rarityColors[item.rarity]
    )}>
      <span className="text-2xl">{item.icon}</span>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium truncate">{item.name}</p>
        <p className="text-xs text-muted-foreground">x{item.quantity}</p>
      </div>
      <p className="text-xs font-medium">{item.value} 💰</p>
    </div>
  );
}

function TradeHistoryCard({ trade }: { trade: Trade }) {
  const statusIcons = {
    completed: { icon: '✅', color: 'text-green-500' },
    rejected: { icon: '❌', color: 'text-red-500' },
    cancelled: { icon: '🚫', color: 'text-yellow-500' },
  };

  const status = statusIcons[trade.status as keyof typeof statusIcons] || statusIcons.cancelled;

  return (
    <div className="p-3 bg-muted rounded-lg border border-border">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className={cn("text-xl", status.color)}>{status.icon}</span>
          <div>
            <p className="text-sm font-medium">
              Trade with {trade.partnerName}
            </p>
            <p className="text-xs text-muted-foreground">
              {new Date(trade.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>
        <p className="text-xs capitalize">{trade.status}</p>
      </div>
    </div>
  );
}

function CreateTradeModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: () => void;
}) {
  const [selectedPlayer, setSelectedPlayer] = useState('');
  const [selectedItems, setSelectedItems] = useState<TradeItem[]>([]);

  const handleCreate = async () => {
    try {
      const response = await fetch('/api/trades/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          partnerId: selectedPlayer,
          items: selectedItems.map(i => ({ itemId: i.itemId, quantity: i.quantity })),
        }),
      });

      if (response.ok) {
        onCreated();
      }
    } catch (error) {
      console.error('Failed to create trade:', error);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-background rounded-lg max-w-md w-full max-h-[80vh] overflow-auto">
        <div className="p-6 border-b border-border flex items-center justify-between">
          <h3 className="text-lg font-bold">Create Trade</h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-muted rounded-lg"
          >
            ✕
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Select Player</label>
            <input
              type="text"
              placeholder="Enter player name..."
              value={selectedPlayer}
              onChange={(e) => setSelectedPlayer(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-muted border border-border outline-none focus:border-primary"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Your Items</label>
            <div className="p-3 bg-muted rounded-lg border border-border min-h-[120px]">
              <p className="text-xs text-muted-foreground text-center py-4">
                Select items from your inventory
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleCreate}
              disabled={!selectedPlayer || selectedItems.length === 0}
              className="flex-1 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 disabled:opacity-50"
            >
              Send Trade Offer
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-muted rounded-lg font-medium"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function getTimeRemaining(expiresAt: Date): string {
  const now = new Date();
  const diff = expiresAt.getTime() - now.getTime();
  
  if (diff < 0) return 'Expired';
  
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}
