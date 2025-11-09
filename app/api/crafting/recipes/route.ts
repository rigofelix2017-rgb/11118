// Crafting Recipes API
import { NextRequest, NextResponse } from 'next/server';

// GET /api/crafting/recipes - Get all crafting recipes
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const craftableOnly = searchParams.get('craftableOnly') === 'true';

    // TODO: Replace with actual database query
    const mockRecipes = [
      {
        id: '1',
        name: 'Iron Sword',
        category: 'weapon',
        icon: '⚔️',
        rarity: 'common',
        level: 5,
        materials: [
          { itemId: 'iron_bar', name: 'Iron Bar', icon: '🔩', required: 3, owned: 5 },
          { itemId: 'wood', name: 'Wood', icon: '🪵', required: 1, owned: 10 },
        ],
        time: 300,
        successRate: 95,
        canCraft: true,
      },
      {
        id: '2',
        name: 'Legendary Staff',
        category: 'weapon',
        icon: '🔮',
        rarity: 'legendary',
        level: 50,
        materials: [
          { itemId: 'mithril', name: 'Mithril', icon: '💎', required: 5, owned: 2 },
          { itemId: 'dragon_scale', name: 'Dragon Scale', icon: '🐉', required: 3, owned: 0 },
        ],
        time: 3600,
        successRate: 45,
        canCraft: false,
      },
    ];

    const filtered = category && category !== 'all'
      ? mockRecipes.filter(r => r.category === category)
      : mockRecipes;

    const final = craftableOnly
      ? filtered.filter(r => r.canCraft)
      : filtered;

    return NextResponse.json(final);
  } catch (error) {
    console.error('Failed to fetch recipes:', error);
    return NextResponse.json({ error: 'Failed to fetch recipes' }, { status: 500 });
  }
}
