import type { Locale } from '../types';

import {
  appendLondonAndLocalTimeSuffix,
  calendarDayDiffInTimeZone,
  DRAW_TIMEZONE,
  formatFullDateTimeInZone,
  formatTimeInZone,
  sameWeekInTimeZone,
  weekdayLongInZone,
} from './drawTime';

const PHRASE = {
  en: {
    today: 'Today',
    tomorrow: 'Tomorrow',
    yesterday: 'Yesterday',
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

function buildUpcomingDrawCoreLabel(
  drawingDateIso: string,
  locale: Locale,
  now: Date,
): string | null {
  const draw = new Date(drawingDateIso);
  if (Number.isNaN(draw.getTime())) {
    return null;
  }

  const dayOffset = calendarDayDiffInTimeZone(draw, now, DRAW_TIMEZONE);
  const time = formatTimeInZone(draw, locale, DRAW_TIMEZONE);
  const p = PHRASE[locale];
  const wd = weekdayLongInZone(draw, locale, DRAW_TIMEZONE);

  if (dayOffset === 0) {
    return `${p.today} ${p.at} ${time}`;
  }
  if (dayOffset === 1) {
    return `${p.tomorrow} ${p.at} ${time}`;
  }
  if (sameWeekInTimeZone(draw, now, DRAW_TIMEZONE)) {
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

  return formatFullDateTimeInZone(draw, locale, DRAW_TIMEZONE);
}

function buildPastDrawCoreLabel(
  drawingDateIso: string,
  locale: Locale,
  now: Date,
): string | null {
  const draw = new Date(drawingDateIso);
  if (Number.isNaN(draw.getTime())) {
    return null;
  }

  const diffTowardPast = -calendarDayDiffInTimeZone(draw, now, DRAW_TIMEZONE);
  const time = formatTimeInZone(draw, locale, DRAW_TIMEZONE);
  const p = PHRASE[locale];

  if (diffTowardPast === 0) {
    return `${p.today} ${p.at} ${time}`;
  }
  if (diffTowardPast === 1) {
    return `${p.yesterday} ${p.at} ${time}`;
  }

  return formatFullDateTimeInZone(draw, locale, DRAW_TIMEZONE);
}

/** Upcoming draws: Today / Tomorrow / This {weekday} at … / full date (London time). */
export function formatUpcomingDrawLabel(
  drawingDateIso: string,
  locale: Locale,
  now: Date = new Date(),
): string {
  const draw = new Date(drawingDateIso);
  if (Number.isNaN(draw.getTime())) {
    return drawingDateIso;
  }

  const core = buildUpcomingDrawCoreLabel(drawingDateIso, locale, now);
  if (!core) {
    return drawingDateIso;
  }

  return appendLondonAndLocalTimeSuffix(core, draw, locale);
}

/** Past draws: Today / Yesterday / full date (London time). */
export function formatPastDrawLabel(
  drawingDateIso: string,
  locale: Locale,
  now: Date = new Date(),
): string {
  const draw = new Date(drawingDateIso);
  if (Number.isNaN(draw.getTime())) {
    return drawingDateIso;
  }

  const core = buildPastDrawCoreLabel(drawingDateIso, locale, now);
  if (!core) {
    return drawingDateIso;
  }

  return appendLondonAndLocalTimeSuffix(core, draw, locale);
}
