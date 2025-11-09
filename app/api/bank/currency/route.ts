// Currency API
import { NextRequest, NextResponse } from 'next/server';

// GET /api/bank/currency - Get VOID balance and staking info
export async function GET(request: NextRequest) {
  try {
    // TODO: Replace with actual database query
    const mockCurrency = {
      balance: 25000,
      staked: 50000,
      dailyInterest: 6.85,
      totalInterestEarned: 450,
      apr: 5.0,
      dailyLimit: 10000,
      withdrawnToday: 2500,
    };

    return NextResponse.json(mockCurrency);
  } catch (error) {
    console.error('Failed to fetch currency:', error);
    return NextResponse.json({ error: 'Failed to fetch currency' }, { status: 500 });
  }
}
