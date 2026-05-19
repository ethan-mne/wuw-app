import { describe, expect, it } from 'vitest';

import {
  DRAW_REMINDER_LEAD_MINUTES,
  DRAW_REMINDER_SLACK_MINUTES,
  isDrawingDateInReminderCronWindow,
} from './window';

describe('isDrawingDateInReminderCronWindow', () => {
  const lead = DRAW_REMINDER_LEAD_MINUTES;
  const slack = DRAW_REMINDER_SLACK_MINUTES;

  it('returns true when reminder instant is within the slack window before now', () => {
    const now = new Date('2026-05-18T12:00:00.000Z');
    const drawingDate = new Date(now.getTime() + lead * 60_000);
    expect(isDrawingDateInReminderCronWindow({ drawingDate, now, leadMinutes: lead, slackMinutes: slack })).toBe(
      true,
    );
  });

  it('returns false when draw is in the past', () => {
    const now = new Date('2026-05-18T12:00:00.000Z');
    const drawingDate = new Date(now.getTime() - 60_000);
    expect(isDrawingDateInReminderCronWindow({ drawingDate, now, leadMinutes: lead, slackMinutes: slack })).toBe(
      false,
    );
  });

  it('returns false when reminder is still in the future beyond slack', () => {
    const now = new Date('2026-05-18T12:00:00.000Z');
    const drawingDate = new Date(now.getTime() + (lead + slack + 1) * 60_000);
    expect(isDrawingDateInReminderCronWindow({ drawingDate, now, leadMinutes: lead, slackMinutes: slack })).toBe(
      false,
    );
  });

  it('returns true for late cron: reminder instant is just before now but within slack', () => {
    const now = new Date('2026-05-18T12:02:00.000Z');
    const drawingDate = new Date('2026-05-18T12:10:00.000Z');
    expect(isDrawingDateInReminderCronWindow({ drawingDate, now, leadMinutes: lead, slackMinutes: slack })).toBe(
      true,
    );
  });
});
