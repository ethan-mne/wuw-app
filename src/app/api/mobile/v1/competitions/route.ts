import { NextResponse } from 'next/server';
import { listMobileCompetitions } from '@/server/mobile/competitions.service';

export const dynamic = 'force-dynamic';

const COMPETITIONS_CACHE_CONTROL = 'public, max-age=30, stale-while-revalidate=60';

export async function GET() {
  const competitions = await listMobileCompetitions();
  return NextResponse.json(
    { data: competitions },
    {
      headers: {
        'Cache-Control': COMPETITIONS_CACHE_CONTROL,
      },
    },
  );
}
