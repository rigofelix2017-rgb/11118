// Photos Gallery API
import { NextRequest, NextResponse } from 'next/server';

// GET /api/photos - Get photo gallery
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sort = searchParams.get('sort') || 'newest';

    // TODO: Replace with actual database query
    const mockPhotos = [
      {
        id: '1',
        url: '/screenshots/photo1.jpg',
        thumbnail: '/screenshots/photo1_thumb.jpg',
        capturedAt: new Date(Date.now() - 86400000),
        isPublic: true,
        likes: 42,
        settings: {
          filter: 'cyberpunk',
          frame: 'neon',
          fov: 75,
        },
        isNFT: false,
      },
      {
        id: '2',
        url: '/screenshots/photo2.jpg',
        thumbnail: '/screenshots/photo2_thumb.jpg',
        capturedAt: new Date(Date.now() - 3600000),
        isPublic: false,
        likes: 0,
        settings: {
          filter: 'vintage',
          frame: 'classic',
          fov: 60,
        },
        isNFT: true,
        nftTokenId: '12345',
      },
    ];

    // Sort logic would go here
    return NextResponse.json(mockPhotos);
  } catch (error) {
    console.error('Failed to fetch photos:', error);
    return NextResponse.json({ error: 'Failed to fetch photos' }, { status: 500 });
  }
}
