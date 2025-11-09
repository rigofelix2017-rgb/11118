// Vault API
import { NextRequest, NextResponse } from 'next/server';

// GET /api/bank/vault - Get personal vault items
export async function GET(request: NextRequest) {
  try {
    // TODO: Replace with actual database query
    const mockVault = [
      {
        id: '1',
        itemId: 'sword1',
        name: 'Legendary Sword',
        icon: '⚔️',
        rarity: 'legendary',
        quantity: 1,
        value: 10000,
        depositedAt: new Date(Date.now() - 5 * 86400000),
        daysSinceDeposit: 5,
      },
      {
        id: '2',
        itemId: 'potion1',
        name: 'Health Potion',
        icon: '🧪',
        rarity: 'common',
        quantity: 50,
        value: 500,
        depositedAt: new Date(Date.now() - 2 * 86400000),
        daysSinceDeposit: 2,
      },
    ];

    return NextResponse.json(mockVault);
  } catch (error) {
    console.error('Failed to fetch vault:', error);
    return NextResponse.json({ error: 'Failed to fetch vault' }, { status: 500 });
  }
}
