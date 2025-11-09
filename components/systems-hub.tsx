// Systems Hub - Central access to all 11 core metaverse systems
// Mobile-optimized interface for accessing all game systems

'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { AchievementSystem } from '@/components/systems/achievement-system';
import { QuestSystem } from '@/components/systems/quest-system';
import { LeaderboardsSystem } from '@/components/systems/leaderboards-system';
import { TradingSystem } from '@/components/systems/trading-system';
import { CraftingSystem } from '@/components/systems/crafting-system';
import { AuctionHouse } from '@/components/systems/auction-house';
import { BankSystem } from '@/components/systems/bank-system';
import { EmoteSystem } from '@/components/systems/emote-system';
import { PhotoMode } from '@/components/systems/photo-mode';
import { PartySystem } from '@/components/systems/party-system';
import { EventCalendar } from '@/components/systems/event-calendar';

interface SystemsHubProps {
  isOpen: boolean;
  onClose: () => void;
}

interface SystemDefinition {
  id: string;
  name: string;
  icon: string;
  description: string;
  component: React.ComponentType<any>;
  category: 'social' | 'economy' | 'progression' | 'creative';
  hotkey?: string;
}

const SYSTEMS: SystemDefinition[] = [
  {
    id: 'achievements',
    name: 'Achievements',
    icon: '🏆',
    description: 'Track your accomplishments and earn rewards',
    component: AchievementSystem,
    category: 'progression',
    hotkey: 'A',
  },
  {
    id: 'quests',
    name: 'Quests',
    icon: '⚔️',
    description: 'Daily, weekly, and seasonal quests',
    component: QuestSystem,
    category: 'progression',
    hotkey: 'Q',
  },
  {
    id: 'leaderboards',
    name: 'Leaderboards',
    icon: '🏅',
    description: 'Compete with players worldwide',
    component: LeaderboardsSystem,
    category: 'social',
    hotkey: 'L',
  },
  {
    id: 'party',
    name: 'Party',
    icon: '👥',
    description: 'Form parties and play together',
    component: PartySystem,
    category: 'social',
    hotkey: 'H',
  },
  {
    id: 'trading',
    name: 'Trading',
    icon: '🔄',
    description: 'Trade items with other players',
    component: TradingSystem,
    category: 'economy',
    hotkey: 'T',
  },
  {
    id: 'auction',
    name: 'Auction House',
    icon: '🔨',
    description: 'Buy and sell items at auction',
    component: AuctionHouse,
    category: 'economy',
    hotkey: 'U',
  },
  {
    id: 'bank',
    name: 'Bank',
    icon: '🏦',
    description: 'Store items and stake VOID',
    component: BankSystem,
    category: 'economy',
    hotkey: 'K',
  },
  {
    id: 'crafting',
    name: 'Crafting',
    icon: '⚒️',
    description: 'Craft items and equipment',
    component: CraftingSystem,
    category: 'progression',
    hotkey: 'C',
  },
  {
    id: 'emotes',
    name: 'Emotes',
    icon: '💃',
    description: 'Express yourself with emotes',
    component: EmoteSystem,
    category: 'creative',
    hotkey: 'Z',
  },
  {
    id: 'photo',
    name: 'Photo Mode',
    icon: '📷',
    description: 'Capture amazing screenshots',
    component: PhotoMode,
    category: 'creative',
    hotkey: 'Y',
  },
  {
    id: 'events',
    name: 'Events',
    icon: '📅',
    description: 'View and join world events',
    component: EventCalendar,
    category: 'social',
    hotkey: 'W',
  },
];

const CATEGORY_LABELS = {
  social: 'Social',
  economy: 'Economy',
  progression: 'Progression',
  creative: 'Creative',
};

const CATEGORY_COLORS = {
  social: 'from-blue-500/20 to-cyan-500/20 border-blue-400',
  economy: 'from-green-500/20 to-emerald-500/20 border-green-400',
  progression: 'from-purple-500/20 to-pink-500/20 border-purple-400',
  creative: 'from-orange-500/20 to-yellow-500/20 border-orange-400',
};

export function SystemsHub({ isOpen, onClose }: SystemsHubProps) {
  const [activeSystem, setActiveSystem] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const activeSystemDef = SYSTEMS.find(s => s.id === activeSystem);
  const ActiveComponent = activeSystemDef?.component;

  const filteredSystems = selectedCategory === 'all' 
    ? SYSTEMS 
    : SYSTEMS.filter(s => s.category === selectedCategory);

  const categories = ['all', ...Array.from(new Set(SYSTEMS.map(s => s.category)))];

  // Keyboard shortcuts
  React.useEffect(() => {
    if (!isOpen || activeSystem) return;

    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;

      const system = SYSTEMS.find(s => s.hotkey?.toLowerCase() === e.key.toLowerCase());
      if (system) {
        e.preventDefault();
        setActiveSystem(system.id);
      }

      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [isOpen, activeSystem, onClose]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        key="systems-hub"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
        onClick={(e) => {
          if (e.target === e.currentTarget && !activeSystem) {
            onClose();
          }
        }}
      >
        {/* Active System View */}
        {activeSystem && ActiveComponent ? (
          <motion.div
            key="active-system"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="relative w-full max-w-6xl max-h-[90vh] overflow-hidden rounded-2xl shadow-2xl"
            style={{
              background: 'linear-gradient(135deg, rgba(10, 10, 30, 0.95), rgba(30, 10, 50, 0.95))',
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-white/10 bg-black/30">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setActiveSystem(null)}
                  className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/20 transition-all"
                >
                  â† Back
                </button>
                <span className="text-3xl">{activeSystemDef.icon}</span>
                <div>
                  <h2 className="text-xl font-bold text-white">{activeSystemDef.name}</h2>
                  <p className="text-sm text-gray-400">{activeSystemDef.description}</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-lg bg-white/5 hover:bg-red-500/20 border border-white/20 hover:border-red-400 transition-all"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* System Content */}
            <div className="overflow-y-auto" style={{ maxHeight: 'calc(90vh - 80px)' }}>
              <ActiveComponent />
            </div>
          </motion.div>
        ) : (
          /* Systems Menu */
          <motion.div
            key="systems-menu"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="relative w-full max-w-6xl max-h-[90vh] overflow-hidden rounded-2xl shadow-2xl"
            style={{
              background: 'linear-gradient(135deg, rgba(10, 10, 30, 0.95), rgba(30, 10, 50, 0.95))',
              border: '2px solid rgba(139, 92, 246, 0.3)',
            }}
          >
            {/* Header */}
            <div className="relative p-6 border-b border-white/10 bg-black/30">
              <button
                onClick={onClose}
                className="absolute top-4 right-4 p-2 rounded-lg bg-white/5 hover:bg-red-500/20 border border-white/20 hover:border-red-400 transition-all"
              >
                <X className="w-6 h-6" />
              </button>
              
              <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400 mb-2">
                Systems Hub
              </h1>
              <p className="text-gray-400">Access all 11 core metaverse systems</p>

              {/* Category Filter */}
              <div className="flex gap-2 mt-4 overflow-x-auto pb-2">
                {categories.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-all ${
                      selectedCategory === cat
                        ? 'bg-purple-500 text-white scale-105'
                        : 'bg-white/5 text-gray-400 hover:bg-white/10'
                    }`}
                  >
                    {cat === 'all' ? 'All Systems' : CATEGORY_LABELS[cat as keyof typeof CATEGORY_LABELS]}
                  </button>
                ))}
              </div>
            </div>

            {/* Systems Grid */}
            <div className="p-6 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 200px)' }}>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredSystems.map((system, index) => (
                  <motion.button
                    key={system.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    onClick={() => setActiveSystem(system.id)}
                    className={`group relative p-6 rounded-xl border-2 transition-all hover:scale-105 bg-gradient-to-br ${CATEGORY_COLORS[system.category]}`}
                  >
                    {/* Hotkey Badge */}
                    {system.hotkey && (
                      <div className="absolute top-2 right-2 w-8 h-8 rounded-lg bg-black/50 border border-white/20 flex items-center justify-center text-xs font-mono text-white">
                        {system.hotkey}
                      </div>
                    )}

                    {/* Icon */}
                    <div className="text-6xl mb-3 transform group-hover:scale-110 transition-transform">
                      {system.icon}
                    </div>

                    {/* Info */}
                    <h3 className="text-xl font-bold text-white mb-2">{system.name}</h3>
                    <p className="text-sm text-gray-300 leading-relaxed">{system.description}</p>

                    {/* Category Badge */}
                    <div className="mt-3 inline-block px-3 py-1 rounded-full bg-black/30 border border-white/20 text-xs font-medium text-white">
                      {CATEGORY_LABELS[system.category]}
                    </div>
                  </motion.button>
                ))}
              </div>

              {/* Help Text */}
              <div className="mt-8 p-4 rounded-lg bg-white/5 border border-white/10">
                <p className="text-sm text-gray-400 text-center">
                  💡 Tip: Press the letter shown in the top-right of each system to open it quickly!
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
