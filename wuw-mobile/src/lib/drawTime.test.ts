import { describe, expect, it } from 'vitest';

import {
  calendarDayDiffInTimeZone,
  DRAW_TIMEZONE,
  formatDrawDateTimeDual,
  formatTimeInZone,
  getCalendarDateKey,
  getCountdownParts,
  getCountdownUnitLabels,
} from './drawTime';

describe('drawTime', () => {
  it('computes countdown parts from ISO instant', () => {
    const nowMs = Date.parse('2030-06-01T18:00:00.000Z');
    const endIso = '2030-06-01T20:00:00.000Z';
    expect(getCountdownParts(endIso, nowMs)).toEqual({
      day: '00',
      hour: '02',
      min: '00',
      sec: '00',
    });
  });

  it('returns localized countdown unit labels', () => {
    expect(getCountdownUnitLabels('en')).toEqual({
      day: 'DAY',
      hour: 'HOUR',
      min: 'MIN',
      sec: 'SEC',
    });
    expect(getCountdownUnitLabels('fr').day).toBe('JOUR');
    expect(getCountdownUnitLabels('es').sec).toBe('SEG');
  });

  it('resolves calendar day in London timezone', () => {
    const draw = new Date('2030-06-02T00:30:00.000Z');
    expect(getCalendarDateKey(draw, DRAW_TIMEZONE)).toBe('2030-06-02');
  });

  it('compares calendar days in London timezone', () => {
    const now = new Date('2030-06-01T22:00:00.000Z');
    const draw = new Date('2030-06-02T00:30:00.000Z');
    expect(calendarDayDiffInTimeZone(draw, now, DRAW_TIMEZONE)).toBe(1);
  });

  it('shows London and local time when they differ', () => {
    const iso = '2030-06-15T19:00:00.000Z';
    const dual = formatDrawDateTimeDual(iso, 'en');
    expect(dual.london).toContain('London time');
    expect(dual.local).toMatch(/\d/);
    expect(dual.local).toContain('your time');
  });

  it('omits local time only when device timezone matches London', () => {
    const iso = '2030-01-15T12:00:00.000Z';
    const date = new Date(iso);
    const dual = formatDrawDateTimeDual(iso, 'en');
    const londonTime = formatTimeInZone(date, 'en', DRAW_TIMEZONE);
    const localTime = formatTimeInZone(date, 'en');

    expect(dual.london).toContain('London time');
    if (londonTime === localTime) {
      expect(dual.local).toBeNull();
    } else {
      expect(dual.local).toBe(`${localTime} your time`);
    }
  });
});
