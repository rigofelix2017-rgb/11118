// Emote Favorites API
import { NextRequest, NextResponse } from 'next/server';

// GET /api/emotes/favorites - Get favorite emote slots
export async function GET(request: NextRequest) {
  try {
    // TODO: Replace with actual database query
    const mockFavorites = {
      slot1: { id: '1', name: 'Wave', icon: '👋', animation: 'wave' },
      slot2: { id: '2', name: 'Dance', icon: '💃', animation: 'dance-epic' },
      slot3: null,
      slot4: null,
      slot5: null,
      slot6: null,
      slot7: null,
      slot8: null,
    };

    return NextResponse.json(mockFavorites);
  } catch (error) {
    console.error('Failed to fetch favorites:', error);
    return NextResponse.json({ error: 'Failed to fetch favorites' }, { status: 500 });
  }
}

// POST /api/emotes/favorites - Set favorite emote slot
export async function POST(request: NextRequest) {
  try {
    const { slot, emoteId } = await request.json();

    if (!slot || slot < 1 || slot > 8) {
      return NextResponse.json({ error: 'Valid slot (1-8) required' }, { status: 400 });
    }

    // TODO: Implement actual database logic
    // 1. Verify emote exists and is unlocked
    // 2. Update favorite slot

    const mockResponse = {
      success: true,
      message: `Slot ${slot} updated`,
    };

    return NextResponse.json(mockResponse);
  } catch (error) {
    console.error('Failed to set favorite:', error);
    return NextResponse.json({ error: 'Failed to set favorite' }, { status: 500 });
  }
}
