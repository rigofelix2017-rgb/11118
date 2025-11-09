// Recent Achievement Progress API
import { NextRequest, NextResponse } from 'next/server';

// GET /api/achievements/recent-progress - Get achievements with recent progress
export async function GET(request: NextRequest) {
  try {
    // TODO: Replace with actual database query
    // Return achievements that have had progress in the last 24 hours
    const mockRecentProgress = [
      {
        id: '2',
        key: 'social_butterfly',
        name: 'Social Butterfly',
        icon: '🦋',
        progress: 3,
        goal: 10,
        percentage: 30,
      },
      {
        id: '4',
        key: 'treasure_hunter',
        name: 'Treasure Hunter',
        icon: '💰',
        progress: 15,
        goal: 50,
        percentage: 30,
      },
    ];

    return NextResponse.json(mockRecentProgress);
  } catch (error) {
    console.error('Failed to fetch recent progress:', error);
    return NextResponse.json({ error: 'Failed to fetch recent progress' }, { status: 500 });
  }
}
