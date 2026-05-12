import {
  getCompetitionForMobileById,
  listCompetitionsForMobile,
  getDrawTimelinePageAfter,
  getDrawTimelinePageBefore,
  getDrawTimelineSeed,
} from '@/server/lightweight/competition/service';
import { MobileHttpError } from '@/server/mobile/http';

/** Past draws on the mobile timeline: small fixed window, no infinite scroll. */
export const MOBILE_DRAWS_MAX_PAST = 3;

export async function listMobileCompetitions() {
  return listCompetitionsForMobile();
}

export async function getMobileDrawsTimelineSeed(
  takePast: number,
  takeFuture: number,
) {
  const pastTake = Math.min(
    Math.max(takePast, 1),
    MOBILE_DRAWS_MAX_PAST,
  );
  return getDrawTimelineSeed(pastTake, takeFuture, {
    probePastHasMore: false,
  });
}

export async function getMobileDrawsTimelineBefore(
  cursor: Date,
  take: number,
) {
  return getDrawTimelinePageBefore(cursor, take);
}

export async function getMobileDrawsTimelineAfter(cursor: Date, take: number) {
  return getDrawTimelinePageAfter(cursor, take);
}

export async function getMobileCompetitionById(id: string) {
  const competition = await getCompetitionForMobileById(id);
  if (!competition) {
    throw new MobileHttpError('Competition not found', 404);
  }

  return competition;
}
