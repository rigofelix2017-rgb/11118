// Shared Vault API
import { NextRequest, NextResponse } from 'next/server';

// GET /api/bank/shared - Get shared vault items
export async function GET(request: NextRequest) {
  try {
    // TODO: Replace with actual database query
    const mockShared = [
      {
        id: '1',
        itemId: 'material1',
        name: 'Iron Ore',
        icon: '🔩',
        rarity: 'common',
        quantity: 200,
        value: 2000,
        depositedBy: 'Alice',
      },
    ];

    return NextResponse.json(mockShared);
  } catch (error) {
    console.error('Failed to fetch shared vault:', error);
    return NextResponse.json({ error: 'Failed to fetch shared vault' }, { status: 500 });
  }
}
