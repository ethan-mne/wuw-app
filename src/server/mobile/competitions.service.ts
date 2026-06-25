import {
  getCachedMobileCompetitionById,
  getCachedMobileCompetitions,
  getCachedMobileDrawsTimelineAfter,
  getCachedMobileDrawsTimelineBefore,
  getCachedMobileDrawsTimelineSeed,
} from '@/server/cache/mobile-read-cache';
import { MobileHttpError } from '@/server/mobile/http';

/** Past draws on the mobile timeline: small fixed window, no infinite scroll. */
export const MOBILE_DRAWS_MAX_PAST = 3;

export async function listMobileCompetitions() {
  return getCachedMobileCompetitions();
}

export async function getMobileDrawsTimelineSeed(
  takePast: number,
  takeFuture: number,
) {
  const pastTake = Math.min(
    Math.max(takePast, 1),
    MOBILE_DRAWS_MAX_PAST,
  );
  const futureTake = Math.min(Math.max(takeFuture, 1), 40);
  return getCachedMobileDrawsTimelineSeed(pastTake, futureTake);
}

export async function getMobileDrawsTimelineBefore(
  cursor: Date,
  take: number,
) {
  const pageTake = Math.min(Math.max(take, 1), 40);
  return getCachedMobileDrawsTimelineBefore(cursor, pageTake);
}

export async function getMobileDrawsTimelineAfter(cursor: Date, take: number) {
  const pageTake = Math.min(Math.max(take, 1), 40);
  return getCachedMobileDrawsTimelineAfter(cursor, pageTake);
}

export async function getMobileCompetitionById(id: string) {
  const competition = await getCachedMobileCompetitionById(id);
  if (!competition) {
    throw new MobileHttpError('Competition not found', 404);
  }

  return competition;
}
