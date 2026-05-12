import { type NextRequest, NextResponse } from 'next/server';

import {
  getMobileDrawsTimelineAfter,
  getMobileDrawsTimelineBefore,
  getMobileDrawsTimelineSeed,
  MOBILE_DRAWS_MAX_PAST,
} from '@/server/mobile/competitions.service';

export const dynamic = 'force-dynamic';

const MIN_TAKE = 1;
const MAX_TAKE = 40;
const DEFAULT_PAGE_TAKE = 15;
const DEFAULT_TAKE_PAST = MOBILE_DRAWS_MAX_PAST;

function clampTake(value: string | null, fallback: number): number {
  const parsed = parseInt(value ?? '', 10);
  if (Number.isNaN(parsed)) {
    return fallback;
  }
  return Math.min(MAX_TAKE, Math.max(MIN_TAKE, parsed));
}

function clampTakePast(value: string | null, fallback: number): number {
  const parsed = parseInt(value ?? '', 10);
  const base = Number.isNaN(parsed) ? fallback : parsed;
  return Math.min(MOBILE_DRAWS_MAX_PAST, Math.max(MIN_TAKE, base));
}

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const before = sp.get('before');
  const after = sp.get('after');
  const pageTake = clampTake(sp.get('take'), DEFAULT_PAGE_TAKE);
  const takePast = clampTakePast(sp.get('takePast'), DEFAULT_TAKE_PAST);
  const takeFuture = clampTake(sp.get('takeFuture'), DEFAULT_PAGE_TAKE);

  if (before != null && after != null) {
    return NextResponse.json(
      { error: 'Use only one of before or after' },
      { status: 400 },
    );
  }

  if (before != null) {
    const cursor = new Date(before);
    if (Number.isNaN(cursor.getTime())) {
      return NextResponse.json({ error: 'Invalid before' }, { status: 400 });
    }
    const { items, hasMore } = await getMobileDrawsTimelineBefore(
      cursor,
      pageTake,
    );
    return NextResponse.json({ data: { items, hasMore } });
  }

  if (after != null) {
    const cursor = new Date(after);
    if (Number.isNaN(cursor.getTime())) {
      return NextResponse.json({ error: 'Invalid after' }, { status: 400 });
    }
    const { items, hasMore } = await getMobileDrawsTimelineAfter(
      cursor,
      pageTake,
    );
    return NextResponse.json({ data: { items, hasMore } });
  }

  const seed = await getMobileDrawsTimelineSeed(takePast, takeFuture);
  return NextResponse.json({
    data: {
      past: seed.past,
      upcoming: seed.upcoming,
      hasMorePast: seed.hasMorePast,
      hasMoreFuture: seed.hasMoreFuture,
    },
  });
}
