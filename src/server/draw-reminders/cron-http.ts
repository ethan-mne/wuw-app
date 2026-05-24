import { NextResponse } from 'next/server';

import {
  getDrawReminderCronSecret,
  isDrawReminderCronSecretConfigured,
} from '@/server/draw-reminders/cron-secrets';
import {
  runDrawReminderJob,
  runDrawReminderTest,
  type DrawReminderTestOptions,
} from '@/server/draw-reminders/send-draw-reminders';

export function authorizeDrawReminderCron(request: Request): NextResponse | null {
  if (!isDrawReminderCronSecretConfigured()) {
    return NextResponse.json(
      {
        error: 'Cron secret not configured',
        hint: 'Set CRON_SECRET or DRAW_REMINDER_CRON_SECRET on the server (Render → wuw-backend → Environment), then redeploy.',
      },
      { status: 503 },
    );
  }
  const secret = getDrawReminderCronSecret();
  const auth = request.headers.get('authorization');
  if (auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  return null;
}

export function parseDrawReminderTestOptions(request: Request): DrawReminderTestOptions {
  const url = new URL(request.url);
  return {
    competitionId: url.searchParams.get('competitionId') ?? undefined,
    userId: url.searchParams.get('userId') ?? undefined,
    force: url.searchParams.get('force') !== 'false',
    skipAlreadySent: url.searchParams.get('skipAlreadySent') !== 'false',
    recordSent: url.searchParams.get('recordSent') === 'true',
    debug: url.searchParams.get('debug') === 'true',
  };
}

export function isDrawReminderTestRequest(request: Request): boolean {
  return new URL(request.url).searchParams.get('test') === 'true';
}

export async function handleDrawReminderCron(request: Request): Promise<NextResponse> {
  const early = authorizeDrawReminderCron(request);
  if (early) {
    return early;
  }

  if (isDrawReminderTestRequest(request)) {
    const options = parseDrawReminderTestOptions(request);
    const result = await runDrawReminderTest(options);
    return NextResponse.json({
      ok: true,
      mode: 'test',
      options,
      result,
    });
  }

  const result = await runDrawReminderJob(new Date());
  return NextResponse.json(result);
}
