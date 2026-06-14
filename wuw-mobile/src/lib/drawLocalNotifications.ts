import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';

/** Matches server draw-reminder cron lead time. */
export const DRAW_REMINDER_LEAD_MINUTES = 10;

export type DrawReminderScheduleInput = {
  competitionId: string;
  competitionName: string;
  drawingDateIso: string;
};

export type ScheduleDrawReminderResult =
  | { ok: true; fireAtMs: number }
  | {
      ok: false;
      reason: 'not_native' | 'permission_denied' | 'draw_passed' | 'invalid_date' | 'schedule_failed';
      message: string;
    };

/** Stable numeric id for Capacitor local notifications (per competition). */
export function notificationIdForCompetition(competitionId: string): number {
  let hash = 0;
  for (let i = 0; i < competitionId.length; i++) {
    hash = (Math.imul(31, hash) + competitionId.charCodeAt(i)) | 0;
  }
  const id = Math.abs(hash) % 2147483646;
  return id === 0 ? 1 : id;
}

/** When the local reminder should fire (ms since epoch), or null if the draw already ended. */
export function drawReminderFireAtMs(
  drawingDateIso: string,
  nowMs: number = Date.now(),
  leadMinutes: number = DRAW_REMINDER_LEAD_MINUTES,
): number | null {
  const drawMs = new Date(drawingDateIso).getTime();
  if (!Number.isFinite(drawMs)) {
    return null;
  }
  if (drawMs <= nowMs) {
    return null;
  }
  const ideal = drawMs - leadMinutes * 60_000;
  if (ideal <= nowMs) {
    return nowMs + 30_000;
  }
  return ideal;
}

export function drawReminderFailureMessage(result: Extract<ScheduleDrawReminderResult, { ok: false }>): string {
  return result.message;
}

export async function ensureLocalNotificationPermission(): Promise<boolean> {
  if (!Capacitor.isNativePlatform()) {
    return false;
  }
  const current = await LocalNotifications.checkPermissions();
  if (current.display === 'granted') {
    return true;
  }
  const requested = await LocalNotifications.requestPermissions();
  return requested.display === 'granted';
}

export async function scheduleDrawReminder(
  input: DrawReminderScheduleInput,
): Promise<ScheduleDrawReminderResult> {
  if (!Capacitor.isNativePlatform()) {
    return {
      ok: false,
      reason: 'not_native',
      message: 'Draw reminders require the Winuwatch app on your phone.',
    };
  }

  const fireAtMs = drawReminderFireAtMs(input.drawingDateIso);
  if (fireAtMs == null) {
    return {
      ok: false,
      reason: 'draw_passed',
      message: 'This draw has already started or ended.',
    };
  }

  const granted = await ensureLocalNotificationPermission();
  if (!granted) {
    return {
      ok: false,
      reason: 'permission_denied',
      message: 'Allow notifications in Settings to get draw reminders.',
    };
  }

  const notificationId = notificationIdForCompetition(input.competitionId);
  const title = 'Draw starting soon';
  const body = `${input.competitionName} — the draw is in 10 minutes.`;

  try {
    await cancelDrawReminder(input.competitionId);
    await LocalNotifications.schedule({
      notifications: [
        {
          id: notificationId,
          title,
          body,
          schedule: { at: new Date(fireAtMs) },
          extra: { competitionId: input.competitionId, type: 'draw_reminder' },
        },
      ],
    });
    return { ok: true, fireAtMs };
  } catch {
    return {
      ok: false,
      reason: 'schedule_failed',
      message: 'Could not schedule a reminder on this device. Try again.',
    };
  }
}

export async function cancelDrawReminder(competitionId: string): Promise<void> {
  if (!Capacitor.isNativePlatform()) {
    return;
  }
  try {
    await LocalNotifications.cancel({
      notifications: [{ id: notificationIdForCompetition(competitionId) }],
    });
  } catch {
    // Best-effort — subscription state is cleared on the server anyway.
  }
}

/** Dev / QA: fire a sample draw reminder after a short delay (default 15s). */
export async function scheduleDrawReminderTest(
  delaySeconds = 15,
): Promise<ScheduleDrawReminderResult> {
  if (!Capacitor.isNativePlatform()) {
    return {
      ok: false,
      reason: 'not_native',
      message: 'Draw reminders require the Winuwatch app on your phone.',
    };
  }

  const granted = await ensureLocalNotificationPermission();
  if (!granted) {
    return {
      ok: false,
      reason: 'permission_denied',
      message: 'Allow notifications in Settings to get draw reminders.',
    };
  }

  const fireAtMs = Date.now() + delaySeconds * 1000;
  try {
    await LocalNotifications.schedule({
      notifications: [
        {
          id: 9_999_001,
          title: 'Draw starting soon',
          body: 'Test reminder — the draw is in 10 minutes.',
          schedule: { at: new Date(fireAtMs) },
          extra: { type: 'draw_reminder_test' },
        },
      ],
    });
    return { ok: true, fireAtMs };
  } catch {
    return {
      ok: false,
      reason: 'schedule_failed',
      message: 'Could not schedule a test reminder on this device.',
    };
  }
}

export async function listPendingDrawReminders(): Promise<
  Array<{ id: number; title?: string; body?: string; at?: string }>
> {
  if (!Capacitor.isNativePlatform()) {
    return [];
  }
  try {
    const pending = await LocalNotifications.getPending();
    return (pending.notifications ?? []).map((n) => ({
      id: n.id,
      title: n.title,
      body: n.body,
      at:
        n.schedule && 'at' in n.schedule && n.schedule.at
          ? new Date(n.schedule.at as string | Date).toISOString()
          : undefined,
    }));
  } catch {
    return [];
  }
}
