import { describe, expect, it } from 'vitest';

import {
  DRAW_REMINDER_LEAD_MINUTES,
  drawReminderFireAtMs,
  notificationIdForCompetition,
} from './drawLocalNotifications';

describe('drawLocalNotifications', () => {
  it('uses a stable positive notification id per competition', () => {
    const a = notificationIdForCompetition('cmp_test_1');
    const b = notificationIdForCompetition('cmp_test_1');
    const c = notificationIdForCompetition('cmp_test_2');
    expect(a).toBe(b);
    expect(a).toBeGreaterThan(0);
    expect(c).not.toBe(a);
  });

  it('schedules 10 minutes before the draw', () => {
    const drawMs = Date.parse('2030-06-01T20:00:00.000Z');
    const nowMs = drawMs - DRAW_REMINDER_LEAD_MINUTES * 60_000 - 60_000;
    expect(drawReminderFireAtMs(new Date(drawMs).toISOString(), nowMs)).toBe(
      drawMs - DRAW_REMINDER_LEAD_MINUTES * 60_000,
    );
  });

  it('fires soon when inside the lead window', () => {
    const drawMs = Date.parse('2030-06-01T20:00:00.000Z');
    const nowMs = drawMs - 5 * 60_000;
    const fireAt = drawReminderFireAtMs(new Date(drawMs).toISOString(), nowMs);
    expect(fireAt).toBe(nowMs + 30_000);
  });

  it('returns null after the draw', () => {
    const drawMs = Date.parse('2030-06-01T20:00:00.000Z');
    expect(drawReminderFireAtMs(new Date(drawMs).toISOString(), drawMs + 1)).toBeNull();
  });
});
