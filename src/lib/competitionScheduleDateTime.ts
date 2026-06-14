/** Timezone used when admins enter end/draw dates in the schedule dashboard. */
export const ADMIN_SCHEDULE_TIMEZONE = 'Asia/Jerusalem';

const DATE_TIME_LOCAL = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/;

function wallClockParts(ms: number, timeZone: string): {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
} {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(new Date(ms));

  const read = (type: Intl.DateTimeFormatPartTypes): number => {
    const value = parts.find((part) => part.type === type)?.value ?? '0';
    return Number.parseInt(value, 10);
  };

  return {
    year: read('year'),
    month: read('month'),
    day: read('day'),
    hour: read('hour'),
    minute: read('minute'),
  };
}

function wallClockToUtcMs(
  parts: {
    year: number;
    month: number;
    day: number;
    hour: number;
    minute: number;
  },
  timeZone: string,
): number {
  let ms = Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute);

  for (let attempt = 0; attempt < 4; attempt += 1) {
    const actualParts = wallClockParts(ms, timeZone);
    const desired = Date.UTC(
      parts.year,
      parts.month - 1,
      parts.day,
      parts.hour,
      parts.minute,
    );
    const actual = Date.UTC(
      actualParts.year,
      actualParts.month - 1,
      actualParts.day,
      actualParts.hour,
      actualParts.minute,
    );
    const delta = desired - actual;
    if (delta === 0) {
      break;
    }
    ms += delta;
  }

  return ms;
}

export function toScheduleDateTimeLocalValue(
  iso: string,
  timeZone: string = ADMIN_SCHEDULE_TIMEZONE,
): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return iso;
  }

  const { year, month, day, hour, minute } = wallClockParts(date.getTime(), timeZone);
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${year}-${pad(month)}-${pad(day)}T${pad(hour)}:${pad(minute)}`;
}

export function fromScheduleDateTimeLocalToIso(
  localDateTime: string,
  timeZone: string = ADMIN_SCHEDULE_TIMEZONE,
): string {
  const match = DATE_TIME_LOCAL.exec(localDateTime.trim());
  if (!match) {
    return new Date(localDateTime).toISOString();
  }

  const [, year, month, day, hour, minute] = match.map((part, index) =>
    index === 0 ? part : Number.parseInt(part, 10),
  ) as [string, number, number, number, number, number];

  return new Date(
    wallClockToUtcMs(
      {
        year,
        month,
        day,
        hour,
        minute,
      },
      timeZone,
    ),
  ).toISOString();
}

/** Admin schedule forms — Israel wall clock. */
export const toAdminScheduleDateTimeLocalValue = toScheduleDateTimeLocalValue;
export const fromAdminScheduleDateTimeLocalToIso = fromScheduleDateTimeLocalToIso;
