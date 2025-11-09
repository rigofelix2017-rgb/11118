// Emotes API
import { NextRequest, NextResponse } from 'next/server';

// GET /api/emotes - Get all emotes
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const unlockedOnly = searchParams.get('unlockedOnly') === 'true';

    // TODO: Replace with actual database query
    const mockEmotes = [
      {
        id: '1',
        name: 'Wave',
        category: 'greet',
        icon: '👋',
        animation: 'wave',
        rarity: 'common',
        isUnlocked: true,
        unlockMethod: 'Default',
      },
      {
        id: '2',
        name: 'Epic Dance',
        category: 'dance',
        icon: '💃',
        animation: 'dance-epic',
        rarity: 'epic',
        isUnlocked: true,
        unlockMethod: 'Quest Reward',
      },
      {
        id: '3',
        name: 'Legendary Pose',
        category: 'gesture',
        icon: '🦸',
        animation: 'pose-legendary',
        rarity: 'legendary',
        isUnlocked: false,
        unlockMethod: 'Achievement: 100 Wins',
      },
    ];

    const filtered = category && category !== 'all'
      ? mockEmotes.filter(e => e.category === category)
      : mockEmotes;

    const final = unlockedOnly
      ? filtered.filter(e => e.isUnlocked)
      : filtered;

    return NextResponse.json(final);
  } catch (error) {
    console.error('Failed to fetch emotes:', error);
    return NextResponse.json({ error: 'Failed to fetch emotes' }, { status: 500 });
  }
}
