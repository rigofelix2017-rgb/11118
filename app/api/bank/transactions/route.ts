// Bank Transactions API
import { NextRequest, NextResponse } from 'next/server';

// GET /api/bank/transactions - Get transaction history
export async function GET(request: NextRequest) {
  try {
    // TODO: Replace with actual database query
    const mockTransactions = [
      {
        id: '1',
        type: 'deposit',
        description: 'Deposited Legendary Sword',
        amount: 10000,
        timestamp: new Date(Date.now() - 5 * 86400000),
      },
      {
        id: '2',
        type: 'interest',
        description: 'Daily interest earned',
        amount: 6.85,
        timestamp: new Date(Date.now() - 86400000),
      },
      {
        id: '3',
        type: 'withdraw',
        description: 'Withdrew 2,500 VOID',
        amount: -2500,
        timestamp: new Date(Date.now() - 3600000),
      },
    ];

    return NextResponse.json(mockTransactions);
  } catch (error) {
    console.error('Failed to fetch transactions:', error);
    return NextResponse.json({ error: 'Failed to fetch transactions' }, { status: 500 });
  }
}
