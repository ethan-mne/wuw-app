import { describe, expect, it } from 'vitest';

import {
  ADMIN_SCHEDULE_TIMEZONE,
  fromAdminScheduleDateTimeLocalToIso,
  toAdminScheduleDateTimeLocalValue,
} from './competitionScheduleDateTime';

describe('competitionScheduleDateTime', () => {
  it('round-trips Israel wall-clock time in summer', () => {
    const iso = '2030-06-14T15:30:00.000Z';
    const local = toAdminScheduleDateTimeLocalValue(iso);
    expect(local).toBe('2030-06-14T18:30');
    expect(fromAdminScheduleDateTimeLocalToIso(local)).toBe(iso);
  });

  it('stores admin input as Israel time, not browser local', () => {
    expect(fromAdminScheduleDateTimeLocalToIso('2030-06-14T18:30')).toBe(
      '2030-06-14T15:30:00.000Z',
    );
  });

  it('uses Asia/Jerusalem as the admin timezone constant', () => {
    expect(ADMIN_SCHEDULE_TIMEZONE).toBe('Asia/Jerusalem');
  });
});
