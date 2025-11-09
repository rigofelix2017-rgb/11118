// Quest System Component
// Handles daily, weekly, and seasonal quests with rewards

'use client';

import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { useMobileHUD } from '@/lib/mobile-hud-context';
import { 
  MobileOptimizedWrapper, 
  MobileButton, 
  MobileInput 
} from '@/components/mobile/MobileOptimizedComponents';
import { useHaptic, usePullToRefresh, useSwipeGesture } from '@/lib/mobile-optimization-hooks';
import { HapticPattern } from '@/lib/mobile-optimization';

interface Quest {
  id: string;
  title: string;
  description: string;
  category: 'daily' | 'weekly' | 'seasonal' | 'story';
  difficulty: 'easy' | 'medium' | 'hard' | 'legendary';
  progress: number;
  goal: number;
  rewards: {
    xp: number;
    void: number;
    items?: { name: string; quantity: number }[];
  };
  expiresAt?: Date;
  isCompleted: boolean;
  isClaimed: boolean;
}

export function QuestSystem() {
  const [quests, setQuests] = useState<Quest[]>([]);
  const [activeTab, setActiveTab] = useState<'daily' | 'weekly' | 'seasonal' | 'story'>('daily');
  const [isLoading, setIsLoading] = useState(true);
  const { pushNotification, preferences } = useMobileHUD();
  const haptic = useHaptic();
  const { ref: pullRef, isRefreshing } = usePullToRefresh(fetchQuests);

  useEffect(() => {
    fetchQuests();
  }, [activeTab]);

  const fetchQuests = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/quests?category=${activeTab}`);
      const data = await response.json();
      setQuests(data);
    } catch (error) {
      console.error('Failed to fetch quests:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const claimReward = async (questId: string) => {
    try {
      const response = await fetch('/api/quests/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questId }),
      });

      if (response.ok) {
        const { rewards } = await response.json();
        
        pushNotification({
          type: 'success',
          title: 'Quest Complete!',
          message: `You earned ${rewards.xp} XP and ${rewards.void} VOID`,
          duration: 4000,
        });

        if (preferences.hapticEnabled && navigator.vibrate) {
          navigator.vibrate([100, 50, 100, 50, 100]);
        }

        fetchQuests();
      }
    } catch (error) {
      console.error('Failed to claim reward:', error);
    }
  };

  const difficultyColors = {
    easy: 'text-green-500 bg-green-500/10',
    medium: 'text-yellow-500 bg-yellow-500/10',
    hard: 'text-orange-500 bg-orange-500/10',
    legendary: 'text-purple-500 bg-purple-500/10',
  };

  const categoryIcons = {
    daily: '📅',
    weekly: '📆',
    seasonal: '🌟',
    story: '📖',
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (`n    <MobileOptimizedWrapper title="Quests" showHeader={true}>`n      <div ref={pullRef as any} className="space-y-4">
      {/* Category Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {(['daily', 'weekly', 'seasonal', 'story'] as const).map((category) => (
          <button
            key={category}
            onClick={() => { haptic(HapticPattern.LIGHT); setActiveTab(category)); }
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-all min-w-[100px]",
              activeTab === category
                ? "bg-primary text-primary-foreground scale-105"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            )}
          >
            <span className="text-xl">{categoryIcons[category]}</span>
            <span className="capitalize">{category}</span>
          </button>
        ))}
      </div>

      {/* Quest List */}
      <div className="space-y-3">
        {quests.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <p className="text-4xl mb-2">🎯</p>
            <p>No {activeTab} quests available</p>
            <p className="text-sm mt-1">Check back later!</p>
          </div>
        ) : (
          quests.map((quest) => (
            <QuestCard
              key={quest.id}
              quest={quest}
              onClaim={claimReward}
              difficultyColor={difficultyColors[quest.difficulty]}
            />
          ))
        )}
      </div>

      {/* Quest Stats Summary */}
      <div className="grid grid-cols-3 gap-3 pt-4 border-t border-border">
        <div className="text-center p-3 bg-muted rounded-lg">
          <p className="text-2xl font-bold text-primary">
            {quests.filter(q => q.isCompleted).length}
          </p>
          <p className="text-xs text-muted-foreground mt-1">Completed</p>
        </div>
        <div className="text-center p-3 bg-muted rounded-lg">
          <p className="text-2xl font-bold text-yellow-500">
            {quests.filter(q => !q.isCompleted && q.progress > 0).length}
          </p>
          <p className="text-xs text-muted-foreground mt-1">In Progress</p>
        </div>
        <div className="text-center p-3 bg-muted rounded-lg">
          <p className="text-2xl font-bold text-muted-foreground">
            {quests.filter(q => q.progress === 0).length}
          </p>
          <p className="text-xs text-muted-foreground mt-1">Not Started</p>
        </div>
      </div>
    </div>
  );
}

function QuestCard({ 
  quest, 
  onClaim, 
  difficultyColor 
}: { 
  quest: Quest; 
  onClaim: (id: string) => void;
  difficultyColor: string;
}) {
  const [isClaiming, setIsClaiming] = useState(false);
  const progressPercentage = (quest.progress / quest.goal) * 100;
  const isCompleted = quest.isCompleted;
  const canClaim = isCompleted && !quest.isClaimed;

  const handleClaim = async () => {
    setIsClaiming(true);
    await onClaim(quest.id);
    setIsClaiming(false);
  };

  return (
    <div 
      className={cn(
        "p-4 rounded-lg border-2 transition-all",
        isCompleted 
          ? "bg-primary/5 border-primary/30" 
          : "bg-muted border-border hover:border-primary/50"
      )}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-bold text-sm">{quest.title}</h4>
            <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium", difficultyColor)}>
              {quest.difficulty}
            </span>
          </div>
          <p className="text-xs text-muted-foreground">{quest.description}</p>
        </div>

        {isCompleted && (
          <div className="ml-2 text-2xl">
            {quest.isClaimed ? '✅' : '🎁'}
          </div>
        )}
      </div>

      {/* Progress Bar */}
      <div className="mb-3">
        <div className="flex justify-between items-center mb-1">
          <span className="text-xs font-medium">
            {quest.progress} / {quest.goal}
          </span>
          <span className="text-xs text-muted-foreground">
            {Math.round(progressPercentage)}%
          </span>
        </div>
        <div className="h-2 bg-background rounded-full overflow-hidden">
          <div 
            className={cn(
              "h-full transition-all duration-500",
              isCompleted ? "bg-primary" : "bg-primary/50"
            )}
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
      </div>

      {/* Rewards */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 text-xs">
          <div className="flex items-center gap-1">
            <span>⚡</span>
            <span className="font-medium">{quest.rewards.xp} XP</span>
          </div>
          <div className="flex items-center gap-1">
            <span>💰</span>
            <span className="font-medium">{quest.rewards.void} VOID</span>
          </div>
          {quest.rewards.items && (
            <div className="flex items-center gap-1">
              <span>🎁</span>
              <span className="font-medium">{quest.rewards.items.length} items</span>
            </div>
          )}
        </div>

        {canClaim && (
          <button
            onClick={handleClaim}
            disabled={isClaiming}
            className="px-4 py-1.5 bg-primary text-primary-foreground rounded-lg font-medium text-sm hover:bg-primary/90 active:scale-95 transition-all disabled:opacity-50"
          >
            {isClaiming ? 'Claiming...' : 'Claim'}
          </button>
        )}
      </div>

      {/* Expiry Timer */}
      {quest.expiresAt && !quest.isClaimed && (
        <div className="mt-2 pt-2 border-t border-border">
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <span>⏱️</span>
            <span>Expires in {getTimeRemaining(quest.expiresAt)}</span>
          </div>
        </div>
      )}
    </div>
  );
}

function getTimeRemaining(expiresAt: Date): string {
  const now = new Date();
  const diff = expiresAt.getTime() - now.getTime();
  
  if (diff < 0) return 'Expired';
  
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  
  if (hours > 24) {
    const days = Math.floor(hours / 24);
    return `${days}d ${hours % 24}h`;
  }
  
  return `${hours}h ${minutes}m`;
}

// Quest tracker widget (for in-game HUD)
export function QuestTracker() {
  const [activeQuests, setActiveQuests] = useState<Quest[]>([]);

  useEffect(() => {
    const fetchActive = async () => {
      try {
        const response = await fetch('/api/quests/active');
        const data = await response.json();
        setActiveQuests(data.slice(0, 3)); // Show max 3
      } catch (error) {
        console.error('Failed to fetch active quests:', error);
      }
    };

    fetchActive();
    const interval = setInterval(fetchActive, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, []);

  if (activeQuests.length === 0) return null;

  return (
    <div className="fixed top-20 left-4 z-20 space-y-2 max-w-xs">
      {activeQuests.map((quest) => (
        <div 
          key={quest.id}
          className="bg-background/90 backdrop-blur-md border border-border rounded-lg p-3 shadow-lg"
        >
          <h5 className="font-bold text-xs mb-1">{quest.title}</h5>
          <div className="flex items-center gap-2">
            <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
              <div 
                className="h-full bg-primary transition-all"
                style={{ width: `${(quest.progress / quest.goal) * 100}%` }}
              />
            </div>
            <span className="text-xs text-muted-foreground">
              {quest.progress}/{quest.goal}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
