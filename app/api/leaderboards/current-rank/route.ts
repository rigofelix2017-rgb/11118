// Current Rank API
import { NextRequest, NextResponse } from 'next/server';

// GET /api/leaderboards/current-rank - Get user's current rank
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category') || 'level';

    // TODO: Replace with actual database query
    const mockRank = {
      rank: 127,
      value: 8450,
      change: 3,
      category,
    };

    return NextResponse.json(mockRank);
  } catch (error) {
    console.error('Failed to fetch current rank:', error);
    return NextResponse.json({ error: 'Failed to fetch rank' }, { status: 500 });
  }
}
