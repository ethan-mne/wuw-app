import type { Locale } from '../types';

function bcp47(locale: Locale): string {
  return locale === 'en' ? 'en-GB' : locale;
}

function startOfLocalDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function startOfMondayWeekLocal(d: Date): Date {
  const day = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const dow = day.getDay();
  const mondayOffset = dow === 0 ? -6 : 1 - dow;
  day.setDate(day.getDate() + mondayOffset);
  day.setHours(0, 0, 0, 0);
  return day;
}

function sameLocalWeek(a: Date, b: Date): boolean {
  return startOfMondayWeekLocal(a).getTime() === startOfMondayWeekLocal(b).getTime();
}

function calendarDayDiffFromTodayToDraw(drawStart: Date, todayStart: Date): number {
  return Math.round((drawStart.getTime() - todayStart.getTime()) / 86_400_000);
}

const PHRASE = {
  en: {
    today: 'Today',
    tomorrow: 'Tomorrow',
    yesterday: 'Yesterday',
    /** “This Wednesday”, etc. (`weekday` from Intl already title-cased in en-GB). */
    thisWeekPhrase: (weekday: string, time: string) => `This ${weekday} at ${time}`,
    at: 'at',
  },
  es: {
    today: 'Hoy',
    tomorrow: 'Mañana',
    yesterday: 'Ayer',
    at: 'a las',
  },
  fr: {
    today: "Aujourd'hui",
    tomorrow: 'Demain',
    yesterday: 'Hier',
    at: 'à',
  },
} as const;

function formatTime(locale: Locale, draw: Date): string {
  return new Intl.DateTimeFormat(bcp47(locale), {
    hour: 'numeric',
    minute: '2-digit',
  }).format(draw);
}

function formatFullDateTime(locale: Locale, draw: Date): string {
  return new Intl.DateTimeFormat(bcp47(locale), {
    weekday: undefined,
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(draw);
}

function weekdayLong(locale: Locale, draw: Date): string {
  return new Intl.DateTimeFormat(bcp47(locale), { weekday: 'long' }).format(draw);
}

/** Upcoming draws: Today / Tomorrow / This {weekday} at … / full date. */
export function formatUpcomingDrawLabel(
  drawingDateIso: string,
  locale: Locale,
  now: Date = new Date(),
): string {
  const draw = new Date(drawingDateIso);
  if (Number.isNaN(draw.getTime())) {
    return drawingDateIso;
  }

  const todayStart = startOfLocalDay(now);
  const drawStart = startOfLocalDay(draw);
  const dayOffset = calendarDayDiffFromTodayToDraw(drawStart, todayStart);

  const time = formatTime(locale, draw);
  const p = PHRASE[locale];
  const wd = weekdayLong(locale, draw);

  if (dayOffset === 0) {
    return `${p.today} ${p.at} ${time}`;
  }
  if (dayOffset === 1) {
    return `${p.tomorrow} ${p.at} ${time}`;
  }
  if (sameLocalWeek(draw, now)) {
    if (locale === 'en') {
      return PHRASE.en.thisWeekPhrase(wd, time);
    }
    if (locale === 'es') {
      return `Este ${wd} ${p.at} ${time}`;
    }
    if (locale === 'fr') {
      return `Ce ${wd} ${p.at} ${time}`;
    }
  }

  return formatFullDateTime(locale, draw);
}

/** Past draws: Today / Yesterday / full date. */
export function formatPastDrawLabel(
  drawingDateIso: string,
  locale: Locale,
  now: Date = new Date(),
): string {
  const draw = new Date(drawingDateIso);
  if (Number.isNaN(draw.getTime())) {
    return drawingDateIso;
  }

  const todayStart = startOfLocalDay(now);
  const drawStart = startOfLocalDay(draw);
  const diffTowardPast = Math.round((todayStart.getTime() - drawStart.getTime()) / 86_400_000);

  const time = formatTime(locale, draw);
  const p = PHRASE[locale];

  if (diffTowardPast === 0) {
    return `${p.today} ${p.at} ${time}`;
  }
  if (diffTowardPast === 1) {
    return `${p.yesterday} ${p.at} ${time}`;
  }

  return formatFullDateTime(locale, draw);
}
