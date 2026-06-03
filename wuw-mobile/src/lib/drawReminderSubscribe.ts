import {
  drawReminderFireAtMs,
  ensureLocalNotificationPermission,
  cancelDrawReminder,
  drawReminderFailureMessage,
  scheduleDrawReminder,
  type DrawReminderScheduleInput,
} from './drawLocalNotifications';
import {
  isDrawReminderSubscribedLocally,
  listDrawRemindersLocally,
  removeDrawReminderLocally,
  saveDrawReminderLocally,
} from './drawReminderLocalStorage';
import { getMobileSessionToken } from './mobileSessionToken';
import { mobileDataService } from '../services/mobileDataService';

export type EnableDrawReminderResult = { ok: true } | { ok: false; message: string };
export type ReconcileDrawRemindersResult = {
  considered: number;
  created: number;
  updated: number;
  unchanged: number;
  cancelled: number;
  failed: number;
  permissionDenied: boolean;
};

/** Schedule on-device reminder; persist locally; sync server subscription when available. */
export async function enableDrawReminder(
  input: DrawReminderScheduleInput,
): Promise<EnableDrawReminderResult> {
  const scheduled = await scheduleDrawReminder(input);
  if (!scheduled.ok) {
    return { ok: false, message: drawReminderFailureMessage(scheduled) };
  }

  saveDrawReminderLocally(input.competitionId, {
    competitionName: input.competitionName,
    fireAtMs: scheduled.fireAtMs,
  });

  try {
    await mobileDataService.subscribeDrawAlert(input.competitionId);
  } catch (err) {
    console.warn('[draw-reminder] local schedule ok; server sync failed', err);
  }

  return { ok: true };
}

export async function disableDrawReminder(competitionId: string): Promise<void> {
  await cancelDrawReminder(competitionId);
  removeDrawReminderLocally(competitionId);
  try {
    await mobileDataService.unsubscribeDrawAlert(competitionId);
  } catch (err) {
    console.warn('[draw-reminder] local cancel ok; server sync failed', err);
  }
}

export async function isDrawReminderEnabled(competitionId: string): Promise<boolean> {
  if (isDrawReminderSubscribedLocally(competitionId)) {
    return true;
  }
  return mobileDataService.getDrawAlertSubscribed(competitionId).catch(() => false);
}

export async function enableDrawReminderForCompetitionId(
  competitionId: string,
): Promise<EnableDrawReminderResult> {
  const competition = await mobileDataService.getCompetition(competitionId);
  if (!competition) {
    return { ok: false, message: 'Competition not found.' };
  }
  return enableDrawReminder({
    competitionId: competition.id,
    competitionName: competition.name,
    drawingDateIso: competition.drawingDate ?? competition.endDate,
  });
}

export async function reconcileDrawReminders(): Promise<ReconcileDrawRemindersResult> {
  const empty: ReconcileDrawRemindersResult = {
    considered: 0,
    created: 0,
    updated: 0,
    unchanged: 0,
    cancelled: 0,
    failed: 0,
    permissionDenied: false,
  };
  if (!getMobileSessionToken()) {
    return empty;
  }

  const competitions = await mobileDataService.listReminderTargetCompetitions();
  if (competitions.length === 0) {
    return empty;
  }

  const localByCompetitionId = new Map(
    listDrawRemindersLocally().map((entry) => [entry.competitionId, entry]),
  );
  const permissionGranted = await ensureLocalNotificationPermission();
  if (!permissionGranted) {
    return {
      ...empty,
      considered: competitions.length,
      failed: competitions.length,
      permissionDenied: true,
    };
  }

  const result: ReconcileDrawRemindersResult = {
    ...empty,
    considered: competitions.length,
  };

  for (const competition of competitions) {
    const competitionId = competition.id.trim();
    if (!competitionId) {
      result.failed += 1;
      continue;
    }

    const drawingDateIso = competition.drawingDate ?? competition.endDate;
    const expectedFireAtMs = drawReminderFireAtMs(drawingDateIso);
    if (expectedFireAtMs == null) {
      await cancelDrawReminder(competitionId);
      removeDrawReminderLocally(competitionId);
      result.cancelled += 1;
      continue;
    }

    const existing = localByCompetitionId.get(competitionId);
    if (existing?.fireAtMs === expectedFireAtMs) {
      result.unchanged += 1;
      continue;
    }

    const scheduled = await scheduleDrawReminder({
      competitionId,
      competitionName: competition.name,
      drawingDateIso,
    });
    if (!scheduled.ok) {
      result.failed += 1;
      continue;
    }

    saveDrawReminderLocally(competitionId, {
      competitionName: competition.name,
      fireAtMs: scheduled.fireAtMs,
    });

    try {
      await mobileDataService.subscribeDrawAlert(competitionId);
    } catch (err) {
      console.warn('[draw-reminder] local reconcile schedule ok; server sync failed', err);
    }

    if (existing) {
      result.updated += 1;
    } else {
      result.created += 1;
    }
  }

  return result;
}
