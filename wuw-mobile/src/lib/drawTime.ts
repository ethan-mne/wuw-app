import type { Locale } from '../types';

export const DRAW_TIMEZONE = 'Europe/London';

export type CountdownParts = {
  day: string;
  hour: string;
  min: string;
  sec: string;
};

export type DrawDateTimeDual = {
  london: string;
  local: string | null;
};

const TIME_LABELS = {
  en: { londonTime: 'London time', yourTime: 'your time' },
  es: { londonTime: 'hora de Londres', yourTime: 'tu hora' },
  fr: { londonTime: 'heure de Londres', yourTime: 'chez vous' },
} as const;

const COUNTDOWN_UNIT_LABELS = {
  en: { day: 'DAY', hour: 'HOUR', min: 'MIN', sec: 'SEC' },
  es: { day: 'DÍA', hour: 'HORA', min: 'MIN', sec: 'SEG' },
  fr: { day: 'JOUR', hour: 'HEURE', min: 'MIN', sec: 'SEC' },
} as const;

export function bcp47(locale: Locale): string {
  return locale === 'en' ? 'en-GB' : locale;
}

function toTwoDigits(value: number): string {
  return String(value).padStart(2, '0');
}

export function getCountdownParts(iso: string, nowMs: number): CountdownParts {
  const endMs = new Date(iso).getTime();
  const remainingMs = Math.max(endMs - nowMs, 0);
  const totalSeconds = Math.floor(remainingMs / 1000);
  const days = Math.floor(totalSeconds / 86_400);
  const hours = Math.floor((totalSeconds % 86_400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return {
    day: toTwoDigits(days),
    hour: toTwoDigits(hours),
    min: toTwoDigits(minutes),
    sec: toTwoDigits(seconds),
  };
}

export function getCountdownUnitLabels(locale: Locale) {
  return COUNTDOWN_UNIT_LABELS[locale];
}

export function getTimeLabels(locale: Locale) {
  return TIME_LABELS[locale];
}

/** Calendar date YYYY-MM-DD in the given IANA timezone. */
export function getCalendarDateKey(date: Date, timeZone: string): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

function parseCalendarDateKey(key: string): Date {
  const [year, month, day] = key.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

/** Signed day offset from `now` to `draw` in the given timezone (draw − now). */
export function calendarDayDiffInTimeZone(draw: Date, now: Date, timeZone: string): number {
  const drawStart = parseCalendarDateKey(getCalendarDateKey(draw, timeZone));
  const nowStart = parseCalendarDateKey(getCalendarDateKey(now, timeZone));
  return Math.round((drawStart.getTime() - nowStart.getTime()) / 86_400_000);
}

function getDayOfWeekInTimeZone(date: Date, timeZone: string): number {
  const weekday = new Intl.DateTimeFormat('en-US', { timeZone, weekday: 'short' }).format(date);
  const map: Record<string, number> = {
    Sun: 0,
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
  };
  return map[weekday] ?? 0;
}

export function startOfMondayWeekInTimeZone(date: Date, timeZone: string): Date {
  const weekStart = parseCalendarDateKey(getCalendarDateKey(date, timeZone));
  const dow = getDayOfWeekInTimeZone(date, timeZone);
  const mondayOffset = dow === 0 ? -6 : 1 - dow;
  weekStart.setUTCDate(weekStart.getUTCDate() + mondayOffset);
  return weekStart;
}

export function sameWeekInTimeZone(a: Date, b: Date, timeZone: string): boolean {
  return (
    startOfMondayWeekInTimeZone(a, timeZone).getTime()
    === startOfMondayWeekInTimeZone(b, timeZone).getTime()
  );
}

export function formatTimeInZone(date: Date, locale: Locale, timeZone?: string): string {
  return new Intl.DateTimeFormat(bcp47(locale), {
    hour: 'numeric',
    minute: '2-digit',
    ...(timeZone ? { timeZone } : {}),
  }).format(date);
}

export function formatFullDateTimeInZone(date: Date, locale: Locale, timeZone?: string): string {
  return new Intl.DateTimeFormat(bcp47(locale), {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    ...(timeZone ? { timeZone } : {}),
  }).format(date);
}

export function weekdayLongInZone(date: Date, locale: Locale, timeZone: string): string {
  return new Intl.DateTimeFormat(bcp47(locale), {
    weekday: 'long',
    timeZone,
  }).format(date);
}

function localTimeDiffersFromLondon(date: Date, locale: Locale): boolean {
  return (
    formatTimeInZone(date, locale, DRAW_TIMEZONE)
    !== formatTimeInZone(date, locale)
  );
}

export function appendLondonAndLocalTimeSuffix(
  coreLabel: string,
  draw: Date,
  locale: Locale,
): string {
  const labels = TIME_LABELS[locale];
  const withLondon = `${coreLabel} (${labels.londonTime})`;

  if (!localTimeDiffersFromLondon(draw, locale)) {
    return withLondon;
  }

  const localTime = formatTimeInZone(draw, locale);
  return `${withLondon} · ${localTime} ${labels.yourTime}`;
}

export function formatDrawDateTimeDual(iso: string, locale: Locale): DrawDateTimeDual {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return { london: iso, local: null };
  }

  const labels = TIME_LABELS[locale];
  const londonDateTime = formatFullDateTimeInZone(date, locale, DRAW_TIMEZONE);
  const london = `${londonDateTime} (${labels.londonTime})`;

  if (!localTimeDiffersFromLondon(date, locale)) {
    return { london, local: null };
  }

  const localTime = formatTimeInZone(date, locale);
  return {
    london,
    local: `${localTime} ${labels.yourTime}`,
  };
}
