import { NextResponse } from 'next/server';

import { env } from '@/env';
import { runDrawReminderTest } from '@/server/draw-reminders/send-draw-reminders';

export const dynamic = 'force-dynamic';

function authorizeCron(request: Request): NextResponse | null {
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

function parseTestOptions(request: Request) {
  const url = new URL(request.url);
  const competitionId = url.searchParams.get('competitionId') ?? undefined;
  const userId = url.searchParams.get('userId') ?? undefined;
  const force = url.searchParams.get('force') !== 'false';
  const skipAlreadySent = url.searchParams.get('skipAlreadySent') !== 'false';
  const recordSent = url.searchParams.get('recordSent') === 'true';

  return {
    competitionId,
    userId,
    force,
    skipAlreadySent,
    recordSent,
  };
}

async function handleTest(request: Request) {
  const early = authorizeCron(request);
  if (early) {
    return early;
  }

  const options = parseTestOptions(request);
  const result = await runDrawReminderTest(options);

  return NextResponse.json({
    ok: true,
    mode: 'test',
    options,
    result,
  });
}

export async function GET(request: Request) {
  return handleTest(request);
}

export async function POST(request: Request) {
  return handleTest(request);
}
