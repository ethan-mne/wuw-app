import { NextResponse } from 'next/server';

import { listCompetitionsForAdminSchedule } from '@/server/admin/competition-schedule.service';
import { requireAdminSession } from '@/server/admin/auth.service';
import { MobileHttpError } from '@/server/mobile/http';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await requireAdminSession();
    const rows = await listCompetitionsForAdminSchedule();
    return NextResponse.json({ data: rows });
  } catch (error) {
    if (error instanceof MobileHttpError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    throw error;
  }
}
