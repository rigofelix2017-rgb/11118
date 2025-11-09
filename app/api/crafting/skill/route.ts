// Crafting Skill API
import { NextRequest, NextResponse } from 'next/server';

// GET /api/crafting/skill - Get user's crafting skill
export async function GET(request: NextRequest) {
  try {
    // TODO: Replace with actual database query
    const mockSkill = {
      level: 25,
      xp: 8450,
      xpToNext: 10000,
      progress: 84.5,
    };

    return NextResponse.json(mockSkill);
  } catch (error) {
    console.error('Failed to fetch skill:', error);
    return NextResponse.json({ error: 'Failed to fetch skill' }, { status: 500 });
  }
}
