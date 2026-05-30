/**
 * Read cron secrets at request time from process.env.
 * Render/Docker inject these at runtime; do not rely only on build-time env bundling.
 */
export function getDrawReminderCronSecret(): string | undefined {
  const draw = process.env.DRAW_REMINDER_CRON_SECRET?.trim();
  if (draw) {
    return draw;
  }
  const cron = process.env.CRON_SECRET?.trim();
  if (cron) {
    return cron;
  }
  return undefined;
}

export function isDrawReminderCronSecretConfigured(): boolean {
  return Boolean(getDrawReminderCronSecret());
}

export function isFirebaseConfiguredForPush(): boolean {
  return Boolean(process.env.FIREBASE_SERVICE_ACCOUNT_JSON?.trim());
}

import { isApnsConfiguredForPush } from '@/server/draw-reminders/apns';

export { isApnsConfiguredForPush };

/** True when at least one push transport is configured (FCM for Android, APNs for iOS). */
export function isPushConfiguredForDrawReminders(): boolean {
  return isFirebaseConfiguredForPush() || isApnsConfiguredForPush();
}
