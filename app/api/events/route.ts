// Events Calendar API
import { NextRequest, NextResponse } from 'next/server';

// GET /api/events - Get events by date and view
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');
    const view = searchParams.get('view') || 'month';

    // TODO: Replace with actual database query
    const mockEvents = [
      {
        id: '1',
        title: 'Dragon Raid',
        description: 'Epic raid on the Ancient Dragon',
        category: 'raid',
        startTime: new Date(Date.now() + 3600000),
        endTime: new Date(Date.now() + 7200000),
        location: 'Dragon\'s Lair',
        organizerId: 'user1',
        organizerName: 'DragonSlayer',
        maxAttendees: 20,
        attendees: [
          { userId: 'user1', status: 'going' },
          { userId: 'user2', status: 'maybe' },
        ],
        attendeeCount: { going: 1, maybe: 1, notGoing: 0 },
        isRecurring: false,
        isLive: false,
      },
      {
        id: '2',
        title: 'Weekly Market',
        description: 'Trading and auction event',
        category: 'market',
        startTime: new Date(Date.now() + 86400000),
        endTime: new Date(Date.now() + 90000000),
        location: 'Central Plaza',
        organizerId: 'system',
        organizerName: 'System',
        maxAttendees: null,
        attendees: [],
        attendeeCount: { going: 15, maybe: 5, notGoing: 2 },
        isRecurring: true,
        recurringType: 'weekly',
        isLive: false,
      },
    ];

    return NextResponse.json(mockEvents);
  } catch (error) {
    console.error('Failed to fetch events:', error);
    return NextResponse.json({ error: 'Failed to fetch events' }, { status: 500 });
  }
}
