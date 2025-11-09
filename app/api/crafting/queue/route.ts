// Crafting Queue API
import { NextRequest, NextResponse } from 'next/server';

// GET /api/crafting/queue - Get current crafting queue
export async function GET(request: NextRequest) {
  try {
    // TODO: Replace with actual database query
    const mockQueue = [
      {
        id: 'queue1',
        recipeId: '1',
        itemName: 'Iron Sword',
        icon: '⚔️',
        quantity: 2,
        progress: 75,
        startedAt: new Date(Date.now() - 225000),
        completesAt: new Date(Date.now() + 75000),
        timeRemaining: 75,
      },
    ];

    return NextResponse.json(mockQueue);
  } catch (error) {
    console.error('Failed to fetch queue:', error);
    return NextResponse.json({ error: 'Failed to fetch queue' }, { status: 500 });
  }
}
