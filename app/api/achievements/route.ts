// Achievements API Routes
import { NextRequest, NextResponse } from 'next/server';

// GET /api/achievements - Fetch achievements with optional category filter
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');

    // TODO: Replace with actual database query
    const mockAchievements = [
      {
        id: '1',
        key: 'first_steps',
        name: 'First Steps',
        description: 'Complete your first quest',
        icon: '👣',
        category: 'progression',
        rarity: 'common',
        points: 10,
        progress: 1,
        goal: 1,
        isUnlocked: true,
        isHidden: false,
        unlockedAt: new Date(),
        rewards: { xp: 100, void: 50 }
      },
      {
        id: '2',
        key: 'social_butterfly',
        name: 'Social Butterfly',
        description: 'Make 10 friends',
        icon: '🦋',
        category: 'social',
        rarity: 'uncommon',
        points: 25,
        progress: 3,
        goal: 10,
        isUnlocked: false,
        isHidden: false,
        rewards: { xp: 250, void: 100 }
      },
      {
        id: '3',
        key: 'legendary_warrior',
        name: 'Legendary Warrior',
        description: 'Win 100 PvP battles',
        icon: '⚔️',
        category: 'combat',
        rarity: 'legendary',
        points: 500,
        progress: 45,
        goal: 100,
        isUnlocked: false,
        isHidden: false,
        rewards: { xp: 5000, void: 1000, title: 'Legendary' }
      },
    ];

    const filtered = category && category !== 'all'
      ? mockAchievements.filter(a => a.category === category)
      : mockAchievements;

    return NextResponse.json(filtered);
  } catch (error) {
    console.error('Failed to fetch achievements:', error);
    return NextResponse.json({ error: 'Failed to fetch achievements' }, { status: 500 });
  }
}
