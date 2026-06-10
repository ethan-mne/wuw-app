import { NextResponse } from 'next/server';

import { MobileHttpError } from '@/server/mobile/http';
import {
  getCalendarFeedSubscriptionForCurrentUser,
  regenerateCalendarFeedTokenForCurrentUser,
  revokeCalendarFeedTokenForCurrentUser,
} from '@/server/mobile/calendar-feed.service';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const data = await getCalendarFeedSubscriptionForCurrentUser();
    return NextResponse.json({ data });
  } catch (error) {
    if (error instanceof MobileHttpError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    throw error;
  }
}

export async function POST() {
  try {
    const data = await regenerateCalendarFeedTokenForCurrentUser();
    return NextResponse.json({ data });
  } catch (error) {
    if (error instanceof MobileHttpError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    throw error;
  }
}

export async function DELETE() {
  try {
    await revokeCalendarFeedTokenForCurrentUser();
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof MobileHttpError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    throw error;
  }
}
