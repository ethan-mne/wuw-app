import {
  getCompetitionForMobileById,
  listCompetitionsForMobile,
  getDrawTimelinePageAfter,
  getDrawTimelinePageBefore,
  getDrawTimelineSeed,
} from '@/server/lightweight/competition/service';
import { MobileHttpError } from '@/server/mobile/http';

export async function listMobileCompetitions() {
  return listCompetitionsForMobile();
}

export async function getMobileDrawsTimelineSeed(
  takePast: number,
  takeFuture: number,
) {
  return getDrawTimelineSeed(takePast, takeFuture);
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
