import type { Locale } from '../types';

export const PUBLIC_SITE_ORIGIN = 'https://winuwatch.com';

export function publicCompetitionUrl(locale: Locale, competitionId: string): string {
  return `${PUBLIC_SITE_ORIGIN}/${locale}/competitions/${encodeURIComponent(competitionId)}`;
}
