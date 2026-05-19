/** Lead time before draw when the reminder should fire; slack catches cron jitter / late runs. */
export const DRAW_REMINDER_LEAD_MINUTES = 10;
export const DRAW_REMINDER_SLACK_MINUTES = 5;

/**
 * A competition's `drawingDate` is due for a reminder in this cron tick when the ideal
 * send instant (`drawingDate - lead`) fell in `(now - slack, now]`, and the draw is still upcoming.
 */
export function isDrawingDateInReminderCronWindow(params: {
  drawingDate: Date;
  now: Date;
  leadMinutes?: number;
  slackMinutes?: number;
}): boolean {
  const leadMs = (params.leadMinutes ?? DRAW_REMINDER_LEAD_MINUTES) * 60_000;
  const slackMs = (params.slackMinutes ?? DRAW_REMINDER_SLACK_MINUTES) * 60_000;
  const drawMs = params.drawingDate.getTime();
  const nowMs = params.now.getTime();
  if (drawMs <= nowMs) {
    return false;
  }
  const reminderAt = drawMs - leadMs;
  return reminderAt <= nowMs && reminderAt >= nowMs - slackMs;
}
