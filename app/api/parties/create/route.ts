// Create Party API
import { NextRequest, NextResponse } from 'next/server';

// POST /api/parties/create - Create a new party
export async function POST(request: NextRequest) {
  try {
    const { name, isPublic } = await request.json();

    if (!name) {
      return NextResponse.json({ error: 'Party name required' }, { status: 400 });
    }

    // TODO: Implement actual database logic
    // 1. Create party with user as leader
    // 2. Set default settings
    // 3. Return party info

    const mockResponse = {
      success: true,
      partyId: 'party_' + Date.now(),
      name,
      isPublic: isPublic || false,
    };

    return NextResponse.json(mockResponse);
  } catch (error) {
    console.error('Failed to create party:', error);
    return NextResponse.json({ error: 'Failed to create party' }, { status: 500 });
  }
}
