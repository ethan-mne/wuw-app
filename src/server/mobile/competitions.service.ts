import {
  getCompetitionForMobileById,
  listCompetitionsForMobile,
} from '@/server/lightweight/competition/service';
import { MobileHttpError } from '@/server/mobile/http';

export async function listMobileCompetitions() {
  return listCompetitionsForMobile();
}

export async function getMobileCompetitionById(id: string) {
  const competition = await getCompetitionForMobileById(id);
  if (!competition) {
    throw new MobileHttpError('Competition not found', 404);
  }

  return competition;
}
