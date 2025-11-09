// Crafting System Component
// Recipe browser, material requirements, skill progression, crafting queue

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

interface Material {
  itemId: string;
  name: string;
  icon: string;
  requiredAmount: number;
  ownedAmount: number;
}

interface Recipe {
  id: string;
  name: string;
  icon: string;
  category: 'weapon' | 'armor' | 'consumable' | 'material' | 'furniture' | 'misc';
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  skillRequired: number;
  currentSkill: number;
  materials: Material[];
  craftTime: number; // in seconds
  successRate: number; // 0-100
  xpGain: number;
  resultItem: {
    name: string;
    icon: string;
    quantity: number;
  };
  isUnlocked: boolean;
  description?: string;
}

interface CraftingJob {
  id: string;
  recipeId: string;
  recipeName: string;
  recipeIcon: string;
  startTime: Date;
  endTime: Date;
  progress: number; // 0-100
  status: 'crafting' | 'completed' | 'failed' | 'collected';
}

export function CraftingSystem() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [craftingQueue, setCraftingQueue] = useState<CraftingJob[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<'all' | Recipe['category']>('all');
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showOnlyCraftable, setShowOnlyCraftable] = useState(false);
  const [craftingSkill, setCraftingSkill] = useState({ level: 1, xp: 0, nextLevelXP: 100 });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchRecipes();
    fetchCraftingQueue();
    fetchSkillLevel();
  }, []);

  const fetchRecipes = async () => {
    try {
      const response = await fetch('/api/crafting/recipes');
      const data = await response.json();
      setRecipes(data);
    } catch (error) {
      console.error('Failed to fetch recipes:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCraftingQueue = async () => {
    try {
      const response = await fetch('/api/crafting/queue');
      const data = await response.json();
      setCraftingQueue(data);
    } catch (error) {
      console.error('Failed to fetch crafting queue:', error);
    }
  };

  const fetchSkillLevel = async () => {
    try {
      const response = await fetch('/api/crafting/skill');
      const data = await response.json();
      setCraftingSkill(data);
    } catch (error) {
      console.error('Failed to fetch skill level:', error);
    }
  };

  const categories: { key: 'all' | Recipe['category']; label: string; icon: string }[] = [
    { key: 'all', label: 'All', icon: '📋' },
    { key: 'weapon', label: 'Weapons', icon: '⚔️' },
    { key: 'armor', label: 'Armor', icon: '🛡️' },
    { key: 'consumable', label: 'Consumables', icon: '🧪' },
    { key: 'material', label: 'Materials', icon: '⚙️' },
    { key: 'furniture', label: 'Furniture', icon: '🪑' },
    { key: 'misc', label: 'Misc', icon: '📦' },
  ];

  const filteredRecipes = recipes.filter((recipe) => {
    const matchesCategory = selectedCategory === 'all' || recipe.category === selectedCategory;
    const matchesSearch = recipe.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCraftable = !showOnlyCraftable || canCraft(recipe);
    return matchesCategory && matchesSearch && matchesCraftable;
  });

  const canCraft = (recipe: Recipe): boolean => {
    const hasSkill = craftingSkill.level >= recipe.skillRequired;
    const hasMaterials = recipe.materials.every(m => m.ownedAmount >= m.requiredAmount);
    return hasSkill && hasMaterials && recipe.isUnlocked;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <MobileOptimizedWrapper title="Crafting System" showHeader={true}>
      <div className="space-y-4">
      {/* Skill Progress */}
      <div className="p-4 bg-muted rounded-lg border border-border">
        <div className="flex items-center justify-between mb-2">
          <div>
            <p className="text-sm font-bold">Crafting Skill</p>
            <p className="text-xs text-muted-foreground">
              Level {craftingSkill.level}
            </p>
          </div>
          <p className="text-xs text-muted-foreground">
            {craftingSkill.xp} / {craftingSkill.nextLevelXP} XP
          </p>
        </div>
        <div className="h-2 bg-background rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all"
            style={{ width: `${(craftingSkill.xp / craftingSkill.nextLevelXP) * 100}%` }}
          />
        </div>
      </div>

      {/* Crafting Queue */}
      {craftingQueue.length > 0 && (
        <div className="space-y-2">
          <h4 className="font-bold text-sm">Crafting Queue</h4>
          {craftingQueue.map((job) => (
            <CraftingJobCard key={job.id} job={job} onUpdate={fetchCraftingQueue} />
          ))}
        </div>
      )}

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

      {/* Search & Filters */}
      <div className="space-y-2">
        <input
          type="text"
          placeholder="Search recipes..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full px-3 py-2 rounded-lg bg-muted border border-border outline-none focus:border-primary"
        />
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={showOnlyCraftable}
            onChange={(e) => setShowOnlyCraftable(e.target.checked)}
            className="w-4 h-4"
          />
          <span className="text-sm">Show only craftable</span>
        </label>
      </div>

      {/* Recipe Grid */}
      <div className="grid grid-cols-2 gap-3">
        {filteredRecipes.length === 0 ? (
          <div className="col-span-2 text-center py-12 text-muted-foreground">
            <p className="text-4xl mb-2">🔨</p>
            <p>No recipes found</p>
          </div>
        ) : (
          filteredRecipes.map((recipe) => (
            <RecipeCard
              key={recipe.id}
              recipe={recipe}
              canCraft={canCraft(recipe)}
              onClick={() => setSelectedRecipe(recipe)}
            />
          ))
        )}
      </div>

      {/* Recipe Details Modal */}
      {selectedRecipe && (
        <RecipeDetailsModal
          recipe={selectedRecipe}
          canCraft={canCraft(selectedRecipe)}
          onClose={() => setSelectedRecipe(null)}
          onCraft={() => {
            setSelectedRecipe(null);
            fetchCraftingQueue();
            fetchRecipes();
          }}
        />
      )}
    </div>
  );
}

function RecipeCard({
  recipe,
  canCraft,
  onClick,
}: {
  recipe: Recipe;
  canCraft: boolean;
  onClick: () => void;
}) {
  const rarityColors = {
    common: 'border-gray-500/30',
    uncommon: 'border-green-500/30',
    rare: 'border-blue-500/30',
    epic: 'border-purple-500/30',
    legendary: 'border-orange-500/30',
  };

  return (
    <button
      onClick={onClick}
      disabled={!recipe.isUnlocked}
      className={cn(
        "p-3 rounded-lg border-2 text-left transition-all",
        rarityColors[recipe.rarity],
        canCraft ? "bg-muted hover:bg-muted/80" : "bg-muted/50 opacity-60",
        !recipe.isUnlocked && "opacity-40"
      )}
    >
      <div className="flex items-start gap-2 mb-2">
        <span className="text-3xl">{recipe.icon}</span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold truncate">{recipe.name}</p>
          <p className="text-xs text-muted-foreground">
            Lv.{recipe.skillRequired}
          </p>
        </div>
      </div>

      {!canCraft && recipe.isUnlocked && (
        <div className="text-xs text-red-500 font-medium">
          {recipe.skillRequired > recipe.currentSkill ? 'Skill too low' : 'Missing materials'}
        </div>
      )}

      {!recipe.isUnlocked && (
        <div className="text-xs text-yellow-500 font-medium">🔒 Locked</div>
      )}
    </button>
  );
}

function CraftingJobCard({ job, onUpdate }: { job: CraftingJob; onUpdate: () => void }) {
  const [currentProgress, setCurrentProgress] = useState(job.progress);
  const { pushNotification, preferences } = useMobileHUD();
  const haptic = useHaptic();

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date().getTime();
      const start = new Date(job.startTime).getTime();
      const end = new Date(job.endTime).getTime();
      const elapsed = now - start;
      const total = end - start;
      const progress = Math.min((elapsed / total) * 100, 100);

      setCurrentProgress(progress);

      if (progress >= 100 && job.status === 'crafting') {
        if (preferences.hapticEnabled && navigator.vibrate) {
          navigator.vibrate([50, 30, 50, 30, 100]);
        }
        pushNotification({
          type: 'success',
          title: 'Crafting Complete!',
          message: `${job.recipeName} is ready`,
          duration: 5000,
        });
        onUpdate();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [job]);

  const handleCollect = async () => {
    try {
      await fetch('/api/crafting/collect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId: job.id }),
      });
      onUpdate();
    } catch (error) {
      console.error('Failed to collect item:', error);
    }
  };

  const timeRemaining = getTimeRemaining(new Date(job.endTime));

  return (
    <div className="p-3 bg-muted rounded-lg border border-border">
      <div className="flex items-center gap-3">
        <span className="text-2xl">{job.recipeIcon}</span>
        <div className="flex-1">
          <p className="text-sm font-bold">{job.recipeName}</p>
          <p className="text-xs text-muted-foreground">
            {job.status === 'crafting' && timeRemaining}
            {job.status === 'completed' && '✅ Ready to collect'}
            {job.status === 'failed' && '❌ Failed'}
          </p>
          {job.status === 'crafting' && (
            <div className="h-1.5 bg-background rounded-full overflow-hidden mt-2">
              <div
                className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all"
                style={{ width: `${currentProgress}%` }}
              />
            </div>
          )}
        </div>
        {job.status === 'completed' && (
          <button
            onClick={handleCollect}
            className="px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-xs font-medium hover:bg-primary/90"
          >
            Collect
          </button>
        )}
      </div>
    </div>
  );
}

function RecipeDetailsModal({
  recipe,
  canCraft,
  onClose,
  onCraft,
}: {
  recipe: Recipe;
  canCraft: boolean;
  onClose: () => void;
  onCraft: () => void;
}) {
  const { pushNotification } = useMobileHUD();
  const haptic = useHaptic();

  const handleCraft = async () => {
    try {
      const response = await fetch('/api/crafting/craft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipeId: recipe.id }),
      });

      if (response.ok) {
        pushNotification({
          type: 'success',
          title: 'Crafting Started',
          message: `Started crafting ${recipe.name}`,
          duration: 3000,
        });
        onCraft();
      }
    } catch (error) {
      console.error('Failed to start crafting:', error);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-background rounded-lg max-w-md w-full max-h-[80vh] overflow-auto">
        <div className="p-6 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-4xl">{recipe.icon}</span>
            <div>
              <h3 className="text-lg font-bold">{recipe.name}</h3>
              <p className="text-xs text-muted-foreground capitalize">
                {recipe.rarity} {recipe.category}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-muted rounded-lg">
            ✕
          </button>
        </div>

        <div className="p-6 space-y-4">
          {recipe.description && (
            <p className="text-sm text-muted-foreground">{recipe.description}</p>
          )}

          {/* Stats */}
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-xs text-muted-foreground">Skill Required</p>
              <p className="font-bold">Level {recipe.skillRequired}</p>
            </div>
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-xs text-muted-foreground">Craft Time</p>
              <p className="font-bold">{formatTime(recipe.craftTime)}</p>
            </div>
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-xs text-muted-foreground">Success Rate</p>
              <p className="font-bold">{recipe.successRate}%</p>
            </div>
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-xs text-muted-foreground">XP Gain</p>
              <p className="font-bold">+{recipe.xpGain} XP</p>
            </div>
          </div>

          {/* Materials */}
          <div>
            <h4 className="font-bold text-sm mb-2">Required Materials</h4>
            <div className="space-y-2">
              {recipe.materials.map((material) => (
                <div
                  key={material.itemId}
                  className="flex items-center justify-between p-2 bg-muted rounded-lg"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{material.icon}</span>
                    <span className="text-sm">{material.name}</span>
                  </div>
                  <span className={cn(
                    "text-sm font-medium",
                    material.ownedAmount >= material.requiredAmount
                      ? "text-green-500"
                      : "text-red-500"
                  )}>
                    {material.ownedAmount} / {material.requiredAmount}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Result */}
          <div>
            <h4 className="font-bold text-sm mb-2">Result</h4>
            <div className="p-3 bg-muted rounded-lg flex items-center gap-2">
              <span className="text-2xl">{recipe.resultItem.icon}</span>
              <div>
                <p className="text-sm font-medium">{recipe.resultItem.name}</p>
                <p className="text-xs text-muted-foreground">
                  x{recipe.resultItem.quantity}
                </p>
              </div>
            </div>
          </div>

          {/* Craft Button */}
          <button
            onClick={handleCraft}
            disabled={!canCraft}
            className="w-full py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {canCraft ? 'Start Crafting' : 'Cannot Craft'}
          </button>
        </div>
      </div>
    </div>
  );
}

function formatTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hours > 0) return `${hours}h ${minutes}m`;
  if (minutes > 0) return `${minutes}m ${secs}s`;
  return `${secs}s`;
}

function getTimeRemaining(endTime: Date): string {
  const now = new Date();
  const diff = endTime.getTime() - now.getTime();

  if (diff < 0) return 'Ready';

  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);

  if (hours > 0) return `${hours}h ${minutes}m`;
  if (minutes > 0) return `${minutes}m ${seconds}s`;
  return `${seconds}s`;
}
