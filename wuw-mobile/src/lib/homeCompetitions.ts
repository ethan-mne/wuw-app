import { withLocale } from '../routes/locales';
import type { Competition, Locale } from '../types';

/** Same ordering as `MobileCompetitionList`: available first, then by end date. */
export function orderHomeCompetitions(competitions: Competition[]): Competition[] {
  return [...competitions].sort((a, b) => {
    const aSoldOut = a.remainingTickets === 0;
    const bSoldOut = b.remainingTickets === 0;
    if (aSoldOut === bSoldOut) {
      return new Date(a.endDate).getTime() - new Date(b.endDate).getTime();
    }
    return aSoldOut ? 1 : -1;
  });
}

export function isHomeCompetitionSoldOut(competition: Competition): boolean {
  return competition.remainingTickets === 0;
}

/** First non–sold-out competition from the home feed (same list as the cards above). */
export function pickNextHomeCompetition(
  competitions: Competition[],
): Competition | undefined {
  return orderHomeCompetitions(competitions).find((c) => !isHomeCompetitionSoldOut(c));
}

export function joinNextHomeCompetitionPath(
  locale: Locale,
  competitions: Competition[],
): string | null {
  const next = pickNextHomeCompetition(competitions);
  if (!next) {
    return null;
  }
  return withLocale(locale, `competitions/${next.id}`);
}
