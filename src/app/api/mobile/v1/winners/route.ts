import { NextResponse } from 'next/server';
import { listMobileWinners, parseWinnersPagination } from '@/server/mobile/winners.service';

export const dynamic = 'force-dynamic';

const WINNERS_HOME_CACHE_CONTROL = 'public, max-age=30, stale-while-revalidate=60';

export async function GET(request: Request) {
  const { skip, take } = parseWinnersPagination(request.url);
  const response = await listMobileWinners(skip, take);
  const headers =
    skip === 0 && take <= 8
      ? { 'Cache-Control': WINNERS_HOME_CACHE_CONTROL }
      : undefined;
  return NextResponse.json(response, headers ? { headers } : undefined);
}
