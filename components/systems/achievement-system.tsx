// Achievement System Component
// Handles achievement tracking, progress, unlocks, and rewards

'use client';

import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { useMobileHUD } from '@/lib/mobile-hud-context';

interface Achievement {
  id: string;
  key: string;
  name: string;
  description: string;
  icon: string;
  category: 'combat' | 'social' | 'exploration' | 'economy' | 'progression' | 'special';
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary' | 'mythic';
  points: number;
  progress: number;
  goal: number;
  isUnlocked: boolean;
  isHidden: boolean;
  unlockedAt?: Date;
  rewards?: {
    xp?: number;
    void?: number;
    items?: { name: string; icon: string }[];
    title?: string;
  };
}

export function AchievementSystem() {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showOnlyLocked, setShowOnlyLocked] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { pushNotification, preferences } = useMobileHUD();

  useEffect(() => {
    fetchAchievements();
  }, [activeCategory]);

  const fetchAchievements = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/achievements?category=${activeCategory}`);
      const data = await response.json();
      setAchievements(data);
    } catch (error) {
      console.error('Failed to fetch achievements:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const claimReward = async (achievementId: string) => {
    try {
      const response = await fetch('/api/achievements/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ achievementId }),
      });

      if (response.ok) {
        const { achievement, rewards } = await response.json();
        
        pushNotification({
          type: 'achievement',
          title: `${achievement.name} Unlocked!`,
          message: `You earned ${rewards.xp || 0} XP and ${achievement.points} achievement points`,
          icon: achievement.icon,
          duration: 5000,
        });

        if (preferences.hapticEnabled && navigator.vibrate) {
          navigator.vibrate([50, 30, 50, 30, 100]);
        }

        fetchAchievements();
      }
    } catch (error) {
      console.error('Failed to claim reward:', error);
    }
  };

  const filteredAchievements = achievements.filter(achievement => {
    const matchesSearch = achievement.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         achievement.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = !showOnlyLocked || !achievement.isUnlocked;
    const notHidden = !achievement.isHidden || achievement.isUnlocked;
    return matchesSearch && matchesFilter && notHidden;
  });

  const categories = [
    { id: 'all', name: 'All', icon: '🏆' },
    { id: 'combat', name: 'Combat', icon: '⚔️' },
    { id: 'social', name: 'Social', icon: '👥' },
    { id: 'exploration', name: 'Exploration', icon: '🗺️' },
    { id: 'economy', name: 'Economy', icon: '💰' },
    { id: 'progression', name: 'Progression', icon: '📈' },
    { id: 'special', name: 'Special', icon: '⭐' },
  ];

  const rarityColors = {
    common: 'text-gray-500 bg-gray-500/10 border-gray-500/30',
    uncommon: 'text-green-500 bg-green-500/10 border-green-500/30',
    rare: 'text-blue-500 bg-blue-500/10 border-blue-500/30',
    epic: 'text-purple-500 bg-purple-500/10 border-purple-500/30',
    legendary: 'text-orange-500 bg-orange-500/10 border-orange-500/30',
    mythic: 'text-pink-500 bg-pink-500/10 border-pink-500/30',
  };

  const stats = {
    total: achievements.length,
    unlocked: achievements.filter(a => a.isUnlocked).length,
    points: achievements.filter(a => a.isUnlocked).reduce((sum, a) => sum + a.points, 0),
    completion: achievements.length > 0 
      ? Math.round((achievements.filter(a => a.isUnlocked).length / achievements.length) * 100)
      : 0,
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Stats Overview */}
      <div className="grid grid-cols-4 gap-2">
        <div className="text-center p-3 bg-muted rounded-lg">
          <p className="text-xl font-bold text-primary">{stats.unlocked}</p>
          <p className="text-xs text-muted-foreground">Unlocked</p>
        </div>
        <div className="text-center p-3 bg-muted rounded-lg">
          <p className="text-xl font-bold">{stats.total}</p>
          <p className="text-xs text-muted-foreground">Total</p>
        </div>
        <div className="text-center p-3 bg-muted rounded-lg">
          <p className="text-xl font-bold text-yellow-500">{stats.points}</p>
          <p className="text-xs text-muted-foreground">Points</p>
        </div>
        <div className="text-center p-3 bg-muted rounded-lg">
          <p className="text-xl font-bold text-green-500">{stats.completion}%</p>
          <p className="text-xs text-muted-foreground">Complete</p>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="space-y-2">
        <input
          type="text"
          placeholder="Search achievements..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full px-4 py-2 rounded-lg bg-muted border border-border focus:border-primary outline-none"
        />
        
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={showOnlyLocked}
            onChange={(e) => setShowOnlyLocked(e.target.checked)}
            className="w-4 h-4"
          />
          Show only locked achievements
        </label>
      </div>

      {/* Category Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {categories.map((category) => (
          <button
            key={category.id}
            onClick={() => setActiveCategory(category.id)}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-all",
              activeCategory === category.id
                ? "bg-primary text-primary-foreground scale-105"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            )}
          >
            <span className="text-lg">{category.icon}</span>
            <span>{category.name}</span>
          </button>
        ))}
      </div>

      {/* Achievement Grid */}
      <div className="grid grid-cols-1 gap-3">
        {filteredAchievements.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <p className="text-4xl mb-2">🔍</p>
            <p>No achievements found</p>
          </div>
        ) : (
          filteredAchievements.map((achievement) => (
            <AchievementCard
              key={achievement.id}
              achievement={achievement}
              onClaim={claimReward}
              rarityColor={rarityColors[achievement.rarity]}
            />
          ))
        )}
      </div>
    </div>
  );
}

function AchievementCard({
  achievement,
  onClaim,
  rarityColor,
}: {
  achievement: Achievement;
  onClaim: (id: string) => void;
  rarityColor: string;
}) {
  const [isClaiming, setIsClaiming] = useState(false);
  const progressPercentage = (achievement.progress / achievement.goal) * 100;
  const isUnlocked = achievement.isUnlocked;
  const canClaim = isUnlocked; // In production, check if reward was claimed

  const handleClaim = async () => {
    setIsClaiming(true);
    await onClaim(achievement.id);
    setIsClaiming(false);
  };

  return (
    <div
      className={cn(
        "p-4 rounded-lg border-2 transition-all",
        isUnlocked
          ? `${rarityColor} border-2`
          : "bg-muted border-border opacity-75"
      )}
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div
          className={cn(
            "w-16 h-16 rounded-lg flex items-center justify-center text-3xl flex-shrink-0",
            isUnlocked ? rarityColor : "bg-background/50 grayscale"
          )}
        >
          {isUnlocked || !achievement.isHidden ? achievement.icon : '🔒'}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between mb-1">
            <div className="flex-1">
              <h4 className="font-bold text-sm">
                {isUnlocked || !achievement.isHidden ? achievement.name : '???'}
              </h4>
              <p className="text-xs text-muted-foreground mt-0.5">
                {isUnlocked || !achievement.isHidden ? achievement.description : 'Hidden achievement'}
              </p>
            </div>
            
            {isUnlocked && (
              <div className="ml-2 text-2xl">✓</div>
            )}
          </div>

          {/* Progress Bar */}
          {!isUnlocked && (
            <div className="mb-2">
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs font-medium">
                  {achievement.progress} / {achievement.goal}
                </span>
                <span className="text-xs text-muted-foreground">
                  {Math.round(progressPercentage)}%
                </span>
              </div>
              <div className="h-2 bg-background rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary transition-all duration-500"
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>
            </div>
          )}

          {/* Rewards & Info */}
          <div className="flex items-center justify-between mt-2">
            <div className="flex items-center gap-3 text-xs">
              <div className="flex items-center gap-1">
                <span>🏆</span>
                <span className="font-medium">{achievement.points} pts</span>
              </div>
              {achievement.rewards?.xp && (
                <div className="flex items-center gap-1">
                  <span>⚡</span>
                  <span className="font-medium">{achievement.rewards.xp} XP</span>
                </div>
              )}
              {achievement.rewards?.void && (
                <div className="flex items-center gap-1">
                  <span>💰</span>
                  <span className="font-medium">{achievement.rewards.void} VOID</span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium capitalize", rarityColor)}>
                {achievement.rarity}
              </span>
              
              {isUnlocked && achievement.unlockedAt && (
                <span className="text-xs text-muted-foreground">
                  {new Date(achievement.unlockedAt).toLocaleDateString()}
                </span>
              )}
            </div>
          </div>

          {/* Unlock Rewards */}
          {achievement.rewards?.items && achievement.rewards.items.length > 0 && (
            <div className="mt-2 pt-2 border-t border-border">
              <p className="text-xs text-muted-foreground mb-1">Rewards:</p>
              <div className="flex gap-1 flex-wrap">
                {achievement.rewards.items.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-1 px-2 py-1 bg-background rounded text-xs"
                  >
                    <span>{item.icon}</span>
                    <span>{item.name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Special Title Reward */}
          {achievement.rewards?.title && (
            <div className="mt-2 pt-2 border-t border-border">
              <div className="flex items-center gap-2 text-xs">
                <span className="text-yellow-500">👑</span>
                <span className="font-medium text-yellow-500">
                  Unlocks Title: "{achievement.rewards.title}"
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Achievement notification (for real-time unlocks)
export function AchievementUnlockNotification({
  achievement,
  onClose,
}: {
  achievement: Achievement;
  onClose: () => void;
}) {
  useEffect(() => {
    const timer = setTimeout(onClose, 5000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const rarityColors = {
    common: 'from-gray-500 to-gray-600',
    uncommon: 'from-green-500 to-green-600',
    rare: 'from-blue-500 to-blue-600',
    epic: 'from-purple-500 to-purple-600',
    legendary: 'from-orange-500 to-orange-600',
    mythic: 'from-pink-500 to-pink-600',
  };

  return (
    <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 animate-in zoom-in duration-500">
      <div className={cn(
        "bg-gradient-to-br p-1 rounded-2xl shadow-2xl",
        rarityColors[achievement.rarity]
      )}>
        <div className="bg-background rounded-xl p-6 text-center max-w-sm">
          <p className="text-sm text-muted-foreground mb-2">Achievement Unlocked!</p>
          <div className="text-6xl mb-3">{achievement.icon}</div>
          <h3 className="text-2xl font-bold mb-2">{achievement.name}</h3>
          <p className="text-sm text-muted-foreground mb-4">{achievement.description}</p>
          
          <div className="flex items-center justify-center gap-4 text-sm">
            <div className="flex items-center gap-1">
              <span>🏆</span>
              <span className="font-medium">{achievement.points} pts</span>
            </div>
            {achievement.rewards?.xp && (
              <div className="flex items-center gap-1">
                <span>⚡</span>
                <span className="font-medium">+{achievement.rewards.xp} XP</span>
              </div>
            )}
          </div>
          
          <button
            onClick={onClose}
            className="mt-4 px-6 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90"
          >
            Awesome!
          </button>
        </div>
      </div>
    </div>
  );
}

// Achievement progress tracker (mini widget for HUD)
export function AchievementTracker() {
  const [recentProgress, setRecentProgress] = useState<Achievement[]>([]);

  useEffect(() => {
    const fetchRecent = async () => {
      try {
        const response = await fetch('/api/achievements/recent-progress');
        const data = await response.json();
        setRecentProgress(data.slice(0, 2)); // Show max 2
      } catch (error) {
        console.error('Failed to fetch recent progress:', error);
      }
    };

    fetchRecent();
    const interval = setInterval(fetchRecent, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, []);

  if (recentProgress.length === 0) return null;

  return (
    <div className="fixed top-20 right-4 z-20 space-y-2 max-w-xs">
      {recentProgress.map((achievement) => (
        <div
          key={achievement.id}
          className="bg-background/90 backdrop-blur-md border border-border rounded-lg p-3 shadow-lg"
        >
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xl">{achievement.icon}</span>
            <h5 className="font-bold text-xs flex-1">{achievement.name}</h5>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary transition-all"
                style={{ width: `${(achievement.progress / achievement.goal) * 100}%` }}
              />
            </div>
            <span className="text-xs text-muted-foreground">
              {achievement.progress}/{achievement.goal}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
