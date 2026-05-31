import {
  cancelDrawReminder,
  drawReminderFailureMessage,
  scheduleDrawReminder,
  type DrawReminderScheduleInput,
} from './drawLocalNotifications';
import {
  isDrawReminderSubscribedLocally,
  removeDrawReminderLocally,
  saveDrawReminderLocally,
} from './drawReminderLocalStorage';
import { mobileDataService } from '../services/mobileDataService';

export type EnableDrawReminderResult = { ok: true } | { ok: false; message: string };

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
