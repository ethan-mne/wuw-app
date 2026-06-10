export type CalendarIcsEvent = {
  uid: string;
  sequence: number;
  dtstart: Date;
  dtstamp: Date;
  summary: string;
  description?: string;
  url?: string;
  status?: 'CONFIRMED' | 'CANCELLED';
  lastModified?: Date;
};

export type BuildCalendarIcsInput = {
  calendarName: string;
  calendarDescription?: string;
  events: CalendarIcsEvent[];
  publishedAt?: Date;
  prodId?: string;
};

function formatIcsUtc(input: Date): string {
  const iso = input.toISOString();
  return `${iso.slice(0, 4)}${iso.slice(5, 7)}${iso.slice(8, 10)}T${iso.slice(11, 13)}${iso.slice(14, 16)}${iso.slice(17, 19)}Z`;
}

function escapeIcsText(input: string): string {
  return input
    .replace(/\\/g, '\\\\')
    .replace(/\r?\n/g, '\\n')
    .replace(/,/g, '\\,')
    .replace(/;/g, '\\;');
}

function foldIcsLine(line: string): string[] {
  const MAX = 75;
  if (line.length <= MAX) {
    return [line];
  }

  const parts: string[] = [];
  let rest = line;
  while (rest.length > MAX) {
    parts.push(rest.slice(0, MAX));
    rest = ` ${rest.slice(MAX)}`;
  }
  parts.push(rest);
  return parts;
}

export function buildCalendarIcs(input: BuildCalendarIcsInput): string {
  const createdAt = input.publishedAt ?? new Date();
  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    `PRODID:${escapeIcsText(input.prodId ?? '-//Winuwatch//Draw Calendar//EN')}`,
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:${escapeIcsText(input.calendarName)}`,
  ];

  if (input.calendarDescription?.trim()) {
    lines.push(`X-WR-CALDESC:${escapeIcsText(input.calendarDescription.trim())}`);
  }

  for (const event of input.events) {
    lines.push('BEGIN:VEVENT');
    lines.push(`UID:${escapeIcsText(event.uid)}`);
    lines.push(`SEQUENCE:${Math.max(0, Math.floor(event.sequence))}`);
    lines.push(`DTSTAMP:${formatIcsUtc(event.dtstamp)}`);
    lines.push(`DTSTART:${formatIcsUtc(event.dtstart)}`);
    lines.push(`CREATED:${formatIcsUtc(createdAt)}`);
    lines.push(`LAST-MODIFIED:${formatIcsUtc(event.lastModified ?? event.dtstamp)}`);
    lines.push(`SUMMARY:${escapeIcsText(event.summary)}`);
    if (event.description?.trim()) {
      lines.push(`DESCRIPTION:${escapeIcsText(event.description.trim())}`);
    }
    if (event.url?.trim()) {
      lines.push(`URL:${event.url.trim()}`);
    }
    lines.push(`STATUS:${event.status ?? 'CONFIRMED'}`);
    lines.push('END:VEVENT');
  }

  lines.push('END:VCALENDAR');

  return lines.flatMap(foldIcsLine).join('\r\n').concat('\r\n');
}
