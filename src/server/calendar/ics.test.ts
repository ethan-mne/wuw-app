import { describe, expect, it } from 'vitest';

import { buildCalendarIcs } from '@/server/calendar/ics';

describe('buildCalendarIcs', () => {
  it('renders a VCALENDAR with expected VEVENT fields', () => {
    const ics = buildCalendarIcs({
      calendarName: 'Winuwatch Draws',
      events: [
        {
          uid: 'draw-comp_1@winuwatch',
          sequence: 12,
          dtstamp: new Date('2026-06-07T12:30:00.000Z'),
          dtstart: new Date('2026-06-21T19:00:00.000Z'),
          summary: 'Rolex Draw',
          description: 'Live draw for Rolex',
          url: 'https://winuwatch.com/en/competitions/comp_1',
        },
      ],
    });

    expect(ics).toContain('BEGIN:VCALENDAR');
    expect(ics).toContain('VERSION:2.0');
    expect(ics).toContain('BEGIN:VEVENT');
    expect(ics).toContain('UID:draw-comp_1@winuwatch');
    expect(ics).toContain('SEQUENCE:12');
    expect(ics).toContain('DTSTAMP:20260607T123000Z');
    expect(ics).toContain('DTSTART:20260621T190000Z');
    expect(ics).toContain('SUMMARY:Rolex Draw');
    expect(ics).toContain('URL:https://winuwatch.com/en/competitions/comp_1');
    expect(ics).toContain('END:VCALENDAR');
  });

  it('escapes special characters in text fields', () => {
    const ics = buildCalendarIcs({
      calendarName: 'Draws, Updates',
      events: [
        {
          uid: 'uid-1',
          sequence: 1,
          dtstamp: new Date('2026-06-07T12:30:00.000Z'),
          dtstart: new Date('2026-06-21T19:00:00.000Z'),
          summary: 'Rolex, draw; live',
          description: 'Line 1\nLine 2',
        },
      ],
    });

    expect(ics).toContain('X-WR-CALNAME:Draws\\, Updates');
    expect(ics).toContain('SUMMARY:Rolex\\, draw\\; live');
    expect(ics).toContain('DESCRIPTION:Line 1\\nLine 2');
  });

  it('emits URL as URI value without TEXT escaping', () => {
    const ics = buildCalendarIcs({
      calendarName: 'Winuwatch Draws',
      events: [
        {
          uid: 'uri-value-1',
          sequence: 2,
          dtstamp: new Date('2026-06-07T12:30:00.000Z'),
          dtstart: new Date('2026-06-21T19:00:00.000Z'),
          summary: 'URI event',
          url: 'https://example.com/path?a=1,2;3',
        },
      ],
    });

    expect(ics).toContain('URL:https://example.com/path?a=1,2;3');
    expect(ics).not.toContain('URL:https://example.com/path?a=1\\,2\\;3');
  });
});
