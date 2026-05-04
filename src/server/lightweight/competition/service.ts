import { db } from '@/server/db';
import {
  mapCompetitionToMobileDto,
  type MobileCompetitionDto,
} from './mapper';

export async function listCompetitionsForMobile(): Promise<MobileCompetitionDto[]> {
  const competitions = await db.competition.findMany({
    where: {
      is_gold: false,
    },
    include: {
      Watches: {
        include: {
          images_url: true,
        },
      },
      _count: {
        select: {
          Ticket: {
            where: {
              Order: {
                status: 'CONFIRMED',
              },
            },
          },
        },
      },
    },
    orderBy: {
      end_date: 'asc',
    },
  });

  return competitions.map(mapCompetitionToMobileDto);
}

export async function getCompetitionForMobileById(id: string) {
  const competition = await db.competition.findUnique({
    where: { id },
    include: {
      Watches: {
        include: {
          images_url: true,
        },
      },
      _count: {
        select: {
          Ticket: {
            where: {
              Order: {
                status: 'CONFIRMED',
              },
            },
          },
        },
      },
    },
  });

  if (competition?.is_gold) {
    return null;
  }

  return competition ? mapCompetitionToMobileDto(competition) : null;
}
