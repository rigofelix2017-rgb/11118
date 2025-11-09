// Reject Trade API
import { NextRequest, NextResponse } from 'next/server';

// POST /api/trades/reject - Reject a trade offer
export async function POST(request: NextRequest) {
  try {
    const { tradeId } = await request.json();

    if (!tradeId) {
      return NextResponse.json({ error: 'Trade ID required' }, { status: 400 });
    }

    // TODO: Implement actual database logic
    // 1. Verify trade exists
    // 2. Update trade status to rejected
    // 3. Notify both parties

    const mockResponse = {
      success: true,
      message: 'Trade rejected',
    };

    return NextResponse.json(mockResponse);
  } catch (error) {
    console.error('Failed to reject trade:', error);
    return NextResponse.json({ error: 'Failed to reject trade' }, { status: 500 });
  }
}
