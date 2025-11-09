// Auction Browse API
import { NextRequest, NextResponse } from 'next/server';

// GET /api/auction/browse - Browse auction listings
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sort = searchParams.get('sort') || 'ending-soon';

    // TODO: Replace with actual database query
    const mockAuctions = [
      {
        id: '1',
        itemId: 'sword1',
        itemName: 'Legendary Sword',
        icon: '⚔️',
        rarity: 'legendary',
        sellerId: 'user1',
        sellerName: 'DragonSlayer',
        currentBid: 5000,
        buyNowPrice: 10000,
        bidCount: 12,
        highestBidder: 'user2',
        isWinning: false,
        endsAt: new Date(Date.now() + 3600000),
        duration: 24,
      },
      {
        id: '2',
        itemId: 'armor1',
        itemName: 'Epic Armor',
        icon: '🛡️',
        rarity: 'epic',
        sellerId: 'user3',
        sellerName: 'IronKnight',
        currentBid: 2500,
        buyNowPrice: null,
        bidCount: 5,
        highestBidder: null,
        isWinning: false,
        endsAt: new Date(Date.now() + 7200000),
        duration: 48,
      },
    ];

    return NextResponse.json(mockAuctions);
  } catch (error) {
    console.error('Failed to fetch auctions:', error);
    return NextResponse.json({ error: 'Failed to fetch auctions' }, { status: 500 });
  }
}
