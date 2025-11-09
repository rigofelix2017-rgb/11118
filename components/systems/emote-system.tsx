// Emote System Component
// Emote wheel UI (8 slots), animation previews, custom emotes, unlocking

'use client';

import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { useMobileHUD } from '@/lib/mobile-hud-context';

interface Emote {
  id: string;
  name: string;
  icon: string;
  animation: string;
  category: 'greet' | 'dance' | 'gesture' | 'emote' | 'reaction' | 'custom';
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  isUnlocked: boolean;
  isFavorite: boolean;
  unlockMethod?: string;
  preview?: string;
}

export function EmoteSystem() {
  const [emotes, setEmotes] = useState<Emote[]>([]);
  const [favoriteSlots, setFavoriteSlots] = useState<(Emote | null)[]>(Array(8).fill(null));
  const [selectedCategory, setSelectedCategory] = useState<'all' | Emote['category']>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showOnlyUnlocked, setShowOnlyUnlocked] = useState(false);
  const [showEmoteWheel, setShowEmoteWheel] = useState(false);
  const [previewEmote, setPreviewEmote] = useState<Emote | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchEmotes();
    fetchFavorites();
  }, []);

  const fetchEmotes = async () => {
    try {
      const response = await fetch('/api/emotes');
      const data = await response.json();
      setEmotes(data);
    } catch (error) {
      console.error('Failed to fetch emotes:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchFavorites = async () => {
    try {
      const response = await fetch('/api/emotes/favorites');
      const data = await response.json();
      setFavoriteSlots(data);
    } catch (error) {
      console.error('Failed to fetch favorites:', error);
    }
  };

  const categories: { key: 'all' | Emote['category']; label: string; icon: string }[] = [
    { key: 'all', label: 'All', icon: '🎭' },
    { key: 'greet', label: 'Greetings', icon: '👋' },
    { key: 'dance', label: 'Dance', icon: '💃' },
    { key: 'gesture', label: 'Gestures', icon: '✌️' },
    { key: 'emote', label: 'Emotions', icon: '😊' },
    { key: 'reaction', label: 'Reactions', icon: '😱' },
    { key: 'custom', label: 'Custom', icon: '⭐' },
  ];

  const filteredEmotes = emotes.filter((emote) => {
    const matchesCategory = selectedCategory === 'all' || emote.category === selectedCategory;
    const matchesSearch = emote.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesUnlocked = !showOnlyUnlocked || emote.isUnlocked;
    return matchesCategory && matchesSearch && matchesUnlocked;
  });

  return (
    <div className="space-y-4">
      {/* Emote Wheel Button */}
      <button
        onClick={() => setShowEmoteWheel(true)}
        className="w-full p-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg font-bold hover:opacity-90 transition-opacity"
      >
        🎭 Open Emote Wheel
      </button>

      {/* Favorite Slots */}
      <div>
        <h4 className="font-bold text-sm mb-2">Quick Access (8 Slots)</h4>
        <div className="grid grid-cols-4 gap-2">
          {favoriteSlots.map((emote, index) => (
            <FavoriteSlot
              key={index}
              slotNumber={index + 1}
              emote={emote}
              onClear={() => {
                const newSlots = [...favoriteSlots];
                newSlots[index] = null;
                setFavoriteSlots(newSlots);
              }}
            />
          ))}
        </div>
      </div>

      {/* Category Tabs */}
      <div className="overflow-x-auto -mx-4 px-4">
        <div className="flex gap-2 min-w-max">
          {categories.map((cat) => (
            <button
              key={cat.key}
              onClick={() => setSelectedCategory(cat.key)}
              className={cn(
                "px-3 py-2 rounded-lg font-medium transition-all whitespace-nowrap",
                selectedCategory === cat.key
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

      {/* Search & Filter */}
      <div className="space-y-2">
        <input
          type="text"
          placeholder="Search emotes..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full px-3 py-2 rounded-lg bg-muted border border-border outline-none focus:border-primary"
        />
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={showOnlyUnlocked}
            onChange={(e) => setShowOnlyUnlocked(e.target.checked)}
            className="w-4 h-4"
          />
          <span className="text-sm">Show only unlocked</span>
        </label>
      </div>

      {/* Emote Grid */}
      <div className="grid grid-cols-3 gap-2">
        {isLoading ? (
          <div className="col-span-3 flex items-center justify-center py-12">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filteredEmotes.length === 0 ? (
          <div className="col-span-3 text-center py-12 text-muted-foreground">
            <p className="text-4xl mb-2">🎭</p>
            <p>No emotes found</p>
          </div>
        ) : (
          filteredEmotes.map((emote) => (
            <EmoteCard
              key={emote.id}
              emote={emote}
              onPreview={() => setPreviewEmote(emote)}
              onAddToSlot={(slotIndex) => {
                const newSlots = [...favoriteSlots];
                newSlots[slotIndex] = emote;
                setFavoriteSlots(newSlots);
              }}
            />
          ))
        )}
      </div>

      {/* Emote Wheel Modal */}
      {showEmoteWheel && (
        <EmoteWheelModal
          favoriteSlots={favoriteSlots}
          onClose={() => setShowEmoteWheel(false)}
          onUseEmote={(emote) => {
            setShowEmoteWheel(false);
            // Trigger emote animation in game
          }}
        />
      )}

      {/* Preview Modal */}
      {previewEmote && (
        <EmotePreviewModal
          emote={previewEmote}
          onClose={() => setPreviewEmote(null)}
        />
      )}
    </div>
  );
}

function FavoriteSlot({
  slotNumber,
  emote,
  onClear,
}: {
  slotNumber: number;
  emote: Emote | null;
  onClear: () => void;
}) {
  return (
    <div className="relative aspect-square p-3 bg-muted rounded-lg border-2 border-border flex flex-col items-center justify-center">
      <div className="absolute top-1 left-1 text-xs font-bold text-muted-foreground">
        {slotNumber}
      </div>
      {emote ? (
        <>
          <span className="text-3xl">{emote.icon}</span>
          <p className="text-xs text-center mt-1 truncate w-full">{emote.name}</p>
          <button
            onClick={onClear}
            className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-red-600"
          >
            ✕
          </button>
        </>
      ) : (
        <span className="text-2xl text-muted-foreground">+</span>
      )}
    </div>
  );
}

function EmoteCard({
  emote,
  onPreview,
  onAddToSlot,
}: {
  emote: Emote;
  onPreview: () => void;
  onAddToSlot: (slotIndex: number) => void;
}) {
  const [showSlotPicker, setShowSlotPicker] = useState(false);
  const { pushNotification, preferences } = useMobileHUD();

  const handleUseEmote = async () => {
    try {
      await fetch('/api/emotes/use', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emoteId: emote.id }),
      });

      if (preferences.hapticEnabled && navigator.vibrate) {
        navigator.vibrate(50);
      }
    } catch (error) {
      console.error('Failed to use emote:', error);
    }
  };

  const rarityColors = {
    common: 'border-gray-500/30',
    uncommon: 'border-green-500/30',
    rare: 'border-blue-500/30',
    epic: 'border-purple-500/30',
    legendary: 'border-orange-500/30',
  };

  return (
    <div className={cn(
      "aspect-square p-2 rounded-lg border-2 flex flex-col items-center justify-center relative",
      rarityColors[emote.rarity],
      emote.isUnlocked ? "bg-muted" : "bg-muted/50 opacity-60"
    )}>
      {emote.isFavorite && (
        <div className="absolute top-1 right-1 text-xs">⭐</div>
      )}
      
      <span className="text-3xl mb-1">{emote.icon}</span>
      <p className="text-xs text-center truncate w-full">{emote.name}</p>

      {emote.isUnlocked ? (
        <div className="absolute inset-0 bg-black/60 opacity-0 hover:opacity-100 transition-opacity rounded-lg flex flex-col items-center justify-center gap-1">
          <button
            onClick={handleUseEmote}
            className="px-2 py-1 bg-primary text-primary-foreground rounded text-xs font-medium"
          >
            Use
          </button>
          <button
            onClick={onPreview}
            className="px-2 py-1 bg-muted text-foreground rounded text-xs"
          >
            Preview
          </button>
          <button
            onClick={() => setShowSlotPicker(true)}
            className="px-2 py-1 bg-muted text-foreground rounded text-xs"
          >
            Add to Wheel
          </button>
        </div>
      ) : (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-2xl">🔒</span>
        </div>
      )}

      {showSlotPicker && (
        <SlotPickerModal
          onSelect={(slot) => {
            onAddToSlot(slot);
            setShowSlotPicker(false);
            pushNotification({
              type: 'success',
              title: 'Added to Wheel',
              message: `${emote.name} added to slot ${slot + 1}`,
              duration: 2000,
            });
          }}
          onClose={() => setShowSlotPicker(false)}
        />
      )}
    </div>
  );
}

function EmoteWheelModal({
  favoriteSlots,
  onClose,
  onUseEmote,
}: {
  favoriteSlots: (Emote | null)[];
  onClose: () => void;
  onUseEmote: (emote: Emote) => void;
}) {
  const radius = 120;
  const centerX = 150;
  const centerY = 150;

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="relative w-[300px] h-[300px]" onClick={(e) => e.stopPropagation()}>
        {/* Center */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 bg-muted rounded-full border-4 border-primary flex items-center justify-center">
          <span className="text-2xl">🎭</span>
        </div>

        {/* Emote Slots */}
        {favoriteSlots.map((emote, index) => {
          const angle = (index * 360) / 8 - 90; // Start from top
          const radian = (angle * Math.PI) / 180;
          const x = centerX + radius * Math.cos(radian);
          const y = centerY + radius * Math.sin(radian);

          return (
            <button
              key={index}
              onClick={() => emote && onUseEmote(emote)}
              disabled={!emote}
              className={cn(
                "absolute w-16 h-16 rounded-full border-2 flex flex-col items-center justify-center transition-all",
                emote
                  ? "bg-primary border-primary-foreground hover:scale-110"
                  : "bg-muted border-border opacity-40"
              )}
              style={{
                left: `${x}px`,
                top: `${y}px`,
                transform: 'translate(-50%, -50%)',
              }}
            >
              {emote ? (
                <>
                  <span className="text-2xl">{emote.icon}</span>
                  <span className="text-xs mt-1">{index + 1}</span>
                </>
              ) : (
                <span className="text-lg text-muted-foreground">{index + 1}</span>
              )}
            </button>
          );
        })}
      </div>

      <button
        onClick={onClose}
        className="absolute top-4 right-4 p-2 bg-background rounded-full hover:bg-muted"
      >
        ✕
      </button>
    </div>
  );
}

function EmotePreviewModal({ emote, onClose }: { emote: Emote; onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-background rounded-lg max-w-sm w-full">
        <div className="p-6 border-b border-border flex items-center justify-between">
          <h3 className="text-lg font-bold">{emote.name}</h3>
          <button onClick={onClose} className="p-2 hover:bg-muted rounded-lg">✕</button>
        </div>

        <div className="p-6 space-y-4">
          <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
            <span className="text-6xl">{emote.icon}</span>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Category:</span>
              <span className="text-sm font-medium capitalize">{emote.category}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Rarity:</span>
              <span className="text-sm font-medium capitalize">{emote.rarity}</span>
            </div>
            {emote.unlockMethod && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Unlock:</span>
                <span className="text-sm font-medium">{emote.unlockMethod}</span>
              </div>
            )}
          </div>

          <button
            onClick={onClose}
            className="w-full py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

function SlotPickerModal({
  onSelect,
  onClose,
}: {
  onSelect: (slotIndex: number) => void;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-background rounded-lg p-6" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-lg font-bold mb-4">Select Wheel Slot</h3>
        <div className="grid grid-cols-4 gap-2">
          {Array.from({ length: 8 }, (_, i) => (
            <button
              key={i}
              onClick={() => onSelect(i)}
              className="aspect-square p-4 bg-muted rounded-lg border-2 border-border hover:border-primary font-bold text-lg"
            >
              {i + 1}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
