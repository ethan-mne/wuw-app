import { NextResponse } from 'next/server';

import { env } from '@/env';
import { runDrawReminderJob } from '@/server/draw-reminders/send-draw-reminders';

export const dynamic = 'force-dynamic';

function handleCron(request: Request): NextResponse | null {
  if (!env.CRON_SECRET && !env.DRAW_REMINDER_CRON_SECRET) {
    return NextResponse.json({ error: 'Cron secret not configured' }, { status: 503 });
  }
  const secret = env.CRON_SECRET ?? env.DRAW_REMINDER_CRON_SECRET;
  const auth = request.headers.get('authorization');
  if (auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  return null;
}

export async function GET(request: Request) {
  const early = handleCron(request);
  if (early) {
    return early;
  }
  const result = await runDrawReminderJob(new Date());
  return NextResponse.json(result);
}

export async function POST(request: Request) {
  const early = handleCron(request);
  if (early) {
    return early;
  }
  const result = await runDrawReminderJob(new Date());
  return NextResponse.json(result);
}
