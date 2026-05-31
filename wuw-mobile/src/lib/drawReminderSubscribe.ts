import {
  cancelDrawReminder,
  drawReminderFailureMessage,
  scheduleDrawReminder,
  type DrawReminderScheduleInput,
} from './drawLocalNotifications';
import { mobileDataService } from '../services/mobileDataService';

export type EnableDrawReminderResult = { ok: true } | { ok: false; message: string };

/** Schedule a on-device reminder and persist subscription on the server (no push token). */
export async function enableDrawReminder(
  input: DrawReminderScheduleInput,
): Promise<EnableDrawReminderResult> {
  const scheduled = await scheduleDrawReminder(input);
  if (!scheduled.ok) {
    return { ok: false, message: drawReminderFailureMessage(scheduled) };
  }

  try {
    await mobileDataService.subscribeDrawAlert(input.competitionId);
  } catch (err) {
    await cancelDrawReminder(input.competitionId);
    const message = err instanceof Error ? err.message : 'Could not save your reminder. Try again.';
    return { ok: false, message: message || 'Could not save your reminder. Try again.' };
  }

  return { ok: true };
}

export async function disableDrawReminder(competitionId: string): Promise<void> {
  await cancelDrawReminder(competitionId);
  await mobileDataService.unsubscribeDrawAlert(competitionId);
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
