import { NextResponse } from 'next/server';

import { requireAdminSession } from '@/server/admin/auth.service';
import { sendCompetitionScheduleAnnouncement } from '@/server/admin/competition-notification.service';
import { MobileHttpError } from '@/server/mobile/http';

export const dynamic = 'force-dynamic';

type RouteContext = {
  params: {
    id: string;
  };
};

export async function POST(_request: Request, { params }: RouteContext) {
  try {
    const admin = await requireAdminSession();

    const competitionId = params.id?.trim() ?? '';
    if (!competitionId) {
      return NextResponse.json({ error: 'Competition not found' }, { status: 404 });
    }

    const result = await sendCompetitionScheduleAnnouncement({
      competitionId,
      sentByUserId: admin.userId,
    });

    switch (result.kind) {
      case 'sent':
        return NextResponse.json({ data: result });
      case 'already_sent':
        return NextResponse.json({ data: result }, { status: 409 });
      case 'no_recipients':
        return NextResponse.json({ data: result }, { status: 200 });
      case 'delivery_failed':
        return NextResponse.json({ data: result }, { status: 502 });
      default:
        return NextResponse.json({ error: 'Unexpected notification result' }, { status: 500 });
    }
  } catch (error) {
    if (error instanceof MobileHttpError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    throw error;
  }
}
