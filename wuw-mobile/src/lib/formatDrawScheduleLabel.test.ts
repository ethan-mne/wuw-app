import { describe, expect, it } from 'vitest';

import { formatPastDrawLabel, formatUpcomingDrawLabel } from './formatDrawScheduleLabel';

describe('formatDrawScheduleLabel', () => {
  it('labels tomorrow using London calendar day', () => {
    const now = new Date('2030-06-01T22:00:00.000Z');
    const drawIso = '2030-06-02T00:30:00.000Z';
    const label = formatUpcomingDrawLabel(drawIso, 'en', now);
    expect(label).toMatch(/^Tomorrow at /);
    expect(label).toContain('London time');
  });

  it('includes local time suffix when device timezone differs from London', () => {
    const now = new Date('2030-06-14T10:00:00.000Z');
    const drawIso = '2030-06-15T19:00:00.000Z';
    const label = formatUpcomingDrawLabel(drawIso, 'en', now);
    expect(label).toContain('London time');

    const londonOnly = formatTimeLondon(drawIso);
    const localOnly = formatTimeLocal(drawIso);
    if (londonOnly !== localOnly) {
      expect(label).toContain('your time');
    }
  });

  it('formats past draws with London time label', () => {
    const now = new Date('2030-06-03T12:00:00.000Z');
    const drawIso = '2030-06-02T19:00:00.000Z';
    const label = formatPastDrawLabel(drawIso, 'en', now);
    expect(label).toContain('London time');
  });

  it('localizes upcoming labels in French', () => {
    const now = new Date('2030-06-01T22:00:00.000Z');
    const drawIso = '2030-06-02T00:30:00.000Z';
    const label = formatUpcomingDrawLabel(drawIso, 'fr', now);
    expect(label).toMatch(/^Demain à /);
    expect(label).toContain('heure de Londres');
  });
});

function formatTimeLondon(iso: string): string {
  return new Intl.DateTimeFormat('en-GB', {
    hour: 'numeric',
    minute: '2-digit',
    timeZone: 'Europe/London',
  }).format(new Date(iso));
}

function formatTimeLocal(iso: string): string {
  return new Intl.DateTimeFormat('en-GB', {
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(iso));
}
