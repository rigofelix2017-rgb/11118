// Active Trades API
import { NextRequest, NextResponse } from 'next/server';

// GET /api/trades/active - Get all active trades
export async function GET(request: NextRequest) {
  try {
    // TODO: Replace with actual database query
    const mockActiveTrades = [
      {
        id: '1',
        initiatorId: 'user1',
        partnerId: 'user2',
        initiatorName: 'Alice',
        partnerName: 'Bob',
        initiatorItems: [
          {
            id: '1',
            itemId: 'sword1',
            name: 'Iron Sword',
            icon: '⚔️',
            rarity: 'common',
            quantity: 1,
            value: 100,
          },
        ],
        partnerItems: [
          {
            id: '2',
            itemId: 'potion1',
            name: 'Health Potion',
            icon: '🧪',
            rarity: 'common',
            quantity: 5,
            value: 50,
          },
        ],
        initiatorReady: false,
        partnerReady: false,
        status: 'pending',
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 3600000), // 1 hour
      },
    ];

    return NextResponse.json(mockActiveTrades);
  } catch (error) {
    console.error('Failed to fetch active trades:', error);
    return NextResponse.json({ error: 'Failed to fetch trades' }, { status: 500 });
  }
}
