// Leaderboards API
import { NextRequest, NextResponse } from 'next/server';

// GET /api/leaderboards - Get leaderboard data
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category') || 'level';
    const scope = searchParams.get('scope') || 'global';
    const period = searchParams.get('period') || 'all-time';

    // TODO: Replace with actual database query
    const mockLeaderboard = [
      {
        rank: 1,
        userId: 'user1',
        name: 'DragonSlayer',
        value: 9850,
        change: 0,
        avatar: '🐉',
      },
      {
        rank: 2,
        userId: 'user2',
        name: 'MysticMage',
        value: 9720,
        change: 1,
        avatar: '🧙',
      },
      {
        rank: 3,
        userId: 'user3',
        name: 'ShadowNinja',
        value: 9580,
        change: -1,
        avatar: '🥷',
      },
    ];

    return NextResponse.json({
      category,
      scope,
      period,
      entries: mockLeaderboard,
      season: period === 'seasonal' ? {
        name: 'Season 5: Eternal Winter',
        endsAt: new Date(Date.now() + 7 * 86400000),
        rewards: ['Legendary Weapon', '10,000 VOID', 'Unique Title']
      } : null
    });
  } catch (error) {
    console.error('Failed to fetch leaderboard:', error);
    return NextResponse.json({ error: 'Failed to fetch leaderboard' }, { status: 500 });
  }
}
