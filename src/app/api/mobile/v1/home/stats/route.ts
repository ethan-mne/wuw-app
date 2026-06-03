import { NextResponse } from 'next/server';
import { getPublicHomeStats } from '@/server/public-home-data';

export const dynamic = 'force-dynamic';

export async function GET() {
  const stats = await getPublicHomeStats();
  return NextResponse.json({
    data: {
      instagramFollowers: stats.instagramCount,
      amountWon: stats.amountWon,
    },
  });
}
