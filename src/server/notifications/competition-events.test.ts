import { describe, expect, it } from 'vitest';

import { hasDrawScheduleChanged } from '@/server/notifications/competition-events';

describe('hasDrawScheduleChanged', () => {
  it('returns false when draw and end dates are unchanged', () => {
    const drawingDate = new Date('2026-06-10T10:00:00.000Z');
    const endDate = new Date('2026-06-10T09:50:00.000Z');

    expect(
      hasDrawScheduleChanged(
        { drawing_date: drawingDate, end_date: endDate },
        { drawing_date: new Date(drawingDate), end_date: new Date(endDate) },
      ),
    ).toBe(false);
  });

  it('returns true when drawing_date changes', () => {
    expect(
      hasDrawScheduleChanged(
        {
          drawing_date: new Date('2026-06-10T10:00:00.000Z'),
          end_date: new Date('2026-06-10T09:50:00.000Z'),
        },
        {
          drawing_date: new Date('2026-06-10T10:05:00.000Z'),
          end_date: new Date('2026-06-10T09:50:00.000Z'),
        },
      ),
    ).toBe(true);
  });

  it('returns true when end_date changes', () => {
    expect(
      hasDrawScheduleChanged(
        {
          drawing_date: new Date('2026-06-10T10:00:00.000Z'),
          end_date: new Date('2026-06-10T09:50:00.000Z'),
        },
        {
          drawing_date: new Date('2026-06-10T10:00:00.000Z'),
          end_date: new Date('2026-06-10T09:55:00.000Z'),
        },
      ),
    ).toBe(true);
  });
});
