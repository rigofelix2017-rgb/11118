// Leaderboards System Component
// Global/friend rankings, multiple categories, seasonal resets

'use client';

import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface LeaderboardEntry {
  rank: number;
  userId: string;
  username: string;
  avatar: string;
  level: number;
  value: number;
  change?: number; // Rank change since last update
  isFriend?: boolean;
  isCurrentUser?: boolean;
}

type LeaderboardCategory = 
  | 'level'
  | 'wealth'
  | 'casino-wins'
  | 'achievements'
  | 'quests'
  | 'social'
  | 'pvp'
  | 'pve';

type LeaderboardScope = 'global' | 'friends' | 'guild';
type LeaderboardPeriod = 'all-time' | 'seasonal' | 'monthly' | 'weekly' | 'daily';

export function LeaderboardsSystem() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [category, setCategory] = useState<LeaderboardCategory>('level');
  const [scope, setScope] = useState<LeaderboardScope>('global');
  const [period, setPeriod] = useState<LeaderboardPeriod>('all-time');
  const [isLoading, setIsLoading] = useState(true);
  const [currentUserRank, setCurrentUserRank] = useState<LeaderboardEntry | null>(null);

  useEffect(() => {
    fetchLeaderboard();
  }, [category, scope, period]);

  const fetchLeaderboard = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(
        `/api/leaderboards?category=${category}&scope=${scope}&period=${period}`
      );
      const data = await response.json();
      
      setEntries(data.entries);
      setCurrentUserRank(data.currentUserRank);
    } catch (error) {
      console.error('Failed to fetch leaderboard:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const categories: { key: LeaderboardCategory; label: string; icon: string }[] = [
    { key: 'level', label: 'Level', icon: '📈' },
    { key: 'wealth', label: 'Wealth', icon: '💰' },
    { key: 'casino-wins', label: 'Casino', icon: '🎰' },
    { key: 'achievements', label: 'Achievements', icon: '🏆' },
    { key: 'quests', label: 'Quests', icon: '📜' },
    { key: 'social', label: 'Social', icon: '👥' },
    { key: 'pvp', label: 'PvP', icon: '⚔️' },
    { key: 'pve', label: 'PvE', icon: '🐉' },
  ];

  const periods: { key: LeaderboardPeriod; label: string }[] = [
    { key: 'all-time', label: 'All Time' },
    { key: 'seasonal', label: 'Season' },
    { key: 'monthly', label: 'Month' },
    { key: 'weekly', label: 'Week' },
    { key: 'daily', label: 'Today' },
  ];

  return (`n    <MobileOptimizedWrapper title="Leaderboards" showHeader={true}>`n      <div ref={pullRef as any} className="space-y-4">
      {/* Category Tabs */}
      <div className="overflow-x-auto -mx-4 px-4">
        <div className="flex gap-2 min-w-max">
          {categories.map((cat) => (
            <button
              key={cat.key}
              onClick={() => setCategory(cat.key)}
              className={cn(
                "px-3 py-2 rounded-lg font-medium transition-all whitespace-nowrap",
                category === cat.key
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground"
              )}
            >
              <span className="mr-1">{cat.icon}</span>
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        <select
          value={scope}
          onChange={(e) => setScope(e.target.value as LeaderboardScope)}
          className="flex-1 px-3 py-2 rounded-lg bg-muted border border-border outline-none focus:border-primary text-sm"
        >
          <option value="global">🌍 Global</option>
          <option value="friends">👥 Friends</option>
          <option value="guild">🏰 Guild</option>
        </select>

        <select
          value={period}
          onChange={(e) => setPeriod(e.target.value as LeaderboardPeriod)}
          className="flex-1 px-3 py-2 rounded-lg bg-muted border border-border outline-none focus:border-primary text-sm"
        >
          {periods.map((p) => (
            <option key={p.key} value={p.key}>
              {p.label}
            </option>
          ))}
        </select>
      </div>

      {/* Current User Rank (Sticky) */}
      {currentUserRank && !isLoading && (
        <div className="sticky top-0 z-10 p-3 bg-primary/10 border-2 border-primary rounded-lg">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold text-sm">
              #{currentUserRank.rank}
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold">Your Rank</p>
              <p className="text-xs text-muted-foreground">
                {formatValue(category, currentUserRank.value)}
              </p>
            </div>
            {currentUserRank.change !== undefined && (
              <div className={cn(
                "px-2 py-1 rounded text-xs font-medium",
                currentUserRank.change > 0 ? "bg-green-500/20 text-green-500" : "bg-red-500/20 text-red-500"
              )}>
                {currentUserRank.change > 0 ? '↑' : '↓'} {Math.abs(currentUserRank.change)}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Leaderboard Entries */}
      <div className="space-y-2">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : entries.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <p className="text-4xl mb-2">📊</p>
            <p>No data available</p>
            <p className="text-sm mt-1">Be the first to climb the leaderboard!</p>
          </div>
        ) : (
          entries.map((entry, index) => (
            <LeaderboardEntryCard
              key={entry.userId}
              entry={entry}
              category={category}
              showTopBadge={index < 3}
            />
          ))
        )}
      </div>

      {/* Seasonal Info */}
      {period === 'seasonal' && (
        <div className="p-4 bg-muted rounded-lg border border-border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-bold">Season 1: Genesis</p>
              <p className="text-xs text-muted-foreground">Ends in 23 days</p>
            </div>
            <button className="px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-xs font-medium hover:bg-primary/90">
              View Rewards
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function LeaderboardEntryCard({
  entry,
  category,
  showTopBadge,
}: {
  entry: LeaderboardEntry;
  category: LeaderboardCategory;
  showTopBadge: boolean;
}) {
  const topBadges = ['🥇', '🥈', '🥉'];
  const badge = showTopBadge ? topBadges[entry.rank - 1] : null;

  return (
    <div className={cn(
      "p-3 rounded-lg border transition-all",
      entry.isCurrentUser
        ? "bg-primary/5 border-primary"
        : "bg-muted border-border",
      showTopBadge && "shadow-lg"
    )}>
      <div className="flex items-center gap-3">
        {/* Rank */}
        <div className="relative">
          <div className={cn(
            "w-10 h-10 rounded-full flex items-center justify-center font-bold",
            showTopBadge
              ? "bg-gradient-to-br from-yellow-400 to-yellow-600 text-white text-lg"
              : "bg-background text-foreground"
          )}>
            {badge || `#${entry.rank}`}
          </div>
          {entry.isFriend && (
            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center text-[10px]">
              ⭐
            </div>
          )}
        </div>

        {/* Avatar & Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xl">{entry.avatar}</span>
            <div className="flex-1 min-w-0">
              <p className={cn(
                "text-sm font-bold truncate",
                entry.isCurrentUser && "text-primary"
              )}>
                {entry.username}
                {entry.isCurrentUser && " (You)"}
              </p>
              <p className="text-xs text-muted-foreground">
                Level {entry.level}
              </p>
            </div>
          </div>
        </div>

        {/* Value */}
        <div className="text-right">
          <p className="text-lg font-bold">
            {formatValue(category, entry.value)}
          </p>
          {entry.change !== undefined && entry.change !== 0 && (
            <p className={cn(
              "text-xs font-medium",
              entry.change > 0 ? "text-green-500" : "text-red-500"
            )}>
              {entry.change > 0 ? '↑' : '↓'} {Math.abs(entry.change)}
            </p>
          )}
        </div>

        {/* Action Button */}
        <button className="px-3 py-1.5 bg-primary/10 text-primary rounded-lg text-xs font-medium hover:bg-primary/20">
          View
        </button>
      </div>
    </div>
  );
}

function formatValue(category: LeaderboardCategory, value: number): string {
  switch (category) {
    case 'level':
      return `Lv.${value}`;
    case 'wealth':
      return `${value.toLocaleString()} 💰`;
    case 'casino-wins':
      return `${value.toLocaleString()} 🎰`;
    case 'achievements':
      return `${value} 🏆`;
    case 'quests':
      return `${value} 📜`;
    case 'social':
      return `${value} ❤️`;
    case 'pvp':
      return `${value} ⚔️`;
    case 'pve':
      return `${value} 🐉`;
    default:
      return value.toString();
  }
}

// Mini HUD Widget for showing current rank
export function LeaderboardHUDWidget({
  category = 'level',
}: {
  category?: LeaderboardCategory;
}) {
  const [rank, setRank] = useState<number | null>(null);

  useEffect(() => {
    fetchCurrentRank();
  }, [category]);

  const fetchCurrentRank = async () => {
    try {
      const response = await fetch(`/api/leaderboards/current-rank?category=${category}`);
      const data = await response.json();
      setRank(data.rank);
    } catch (error) {
      console.error('Failed to fetch current rank:', error);
    }
  };

  if (!rank) return null;

  return (
    <div className="px-3 py-1.5 bg-background/90 backdrop-blur-sm rounded-lg border border-border">
      <p className="text-xs text-muted-foreground">Rank</p>
      <p className="text-sm font-bold">#{rank}</p>
    </div>
  );
}
