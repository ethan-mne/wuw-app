import {
  isApnsConfiguredForPush,
  isDrawReminderCronSecretConfigured,
  isFirebaseConfiguredForPush,
  isOneSignalConfigured,
  isPushConfiguredForDrawReminders,
} from '@/server/draw-reminders/cron-secrets';
import { db } from '@/server/db';
import { getOneSignalRestApiKeyFormat } from '@/server/notifications/onesignal';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const start = performance.now();
  let dbStatus = 'ok';
  let dbLatencyMs = -1;

  try {
    await db.$queryRawUnsafe('SELECT 1');
    dbLatencyMs = Math.round(performance.now() - start);
  } catch (error) {
    dbStatus = 'error';
    dbLatencyMs = Math.round(performance.now() - start);
    console.error('[Health] DB ping failed:', error);
  }

  const response = {
    status: dbStatus === 'ok' ? 'healthy' : 'degraded',
    timestamp: new Date().toISOString(),
    db: {
      status: dbStatus,
      latencyMs: dbLatencyMs,
    },
    push: {
      cronSecretConfigured: isDrawReminderCronSecretConfigured(),
      firebaseConfigured: isFirebaseConfiguredForPush(),
      apnsConfigured: isApnsConfiguredForPush(),
      oneSignalConfigured: isOneSignalConfigured(),
      oneSignalRestApiKeyFormat: getOneSignalRestApiKeyFormat(),
      pushConfigured: isPushConfiguredForDrawReminders(),
    },
  };

  return NextResponse.json(response, {
    status: dbStatus === 'ok' ? 200 : 503,
  });
}
