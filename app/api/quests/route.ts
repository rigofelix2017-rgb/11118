// Quests API Routes
import { NextRequest, NextResponse } from 'next/server';

// GET /api/quests - Fetch quests by type
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'active';

    // TODO: Replace with actual database query
    const mockQuests = {
      active: [
        {
          id: '1',
          title: 'Welcome to the Metaverse',
          description: 'Complete the tutorial and explore your first location',
          type: 'story',
          difficulty: 'easy',
          objectives: [
            { id: '1', description: 'Talk to the Guide', progress: 1, goal: 1, completed: true },
            { id: '2', description: 'Visit the Plaza', progress: 0, goal: 1, completed: false },
          ],
          rewards: { xp: 500, void: 200, items: [{ name: 'Starter Pack', icon: '📦' }] },
          timeLimit: null,
          expiresAt: null,
          progress: 50,
        },
      ],
      completed: [],
      available: [
        {
          id: '2',
          title: 'Daily Challenge',
          description: 'Complete 5 social interactions',
          type: 'daily',
          difficulty: 'medium',
          objectives: [
            { id: '1', description: 'Chat with 5 players', progress: 0, goal: 5, completed: false },
          ],
          rewards: { xp: 200, void: 100 },
          timeLimit: 86400,
          expiresAt: new Date(Date.now() + 86400000),
          progress: 0,
        },
      ],
    };

    return NextResponse.json(mockQuests[type as keyof typeof mockQuests] || []);
  } catch (error) {
    console.error('Failed to fetch quests:', error);
    return NextResponse.json({ error: 'Failed to fetch quests' }, { status: 500 });
  }
}
