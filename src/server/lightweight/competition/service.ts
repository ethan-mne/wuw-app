import { db } from '@/server/db';
import {
  mapCompetitionToMobileDto,
  type MobileCompetitionDto,
} from './mapper';

export async function listCompetitionsForMobile(): Promise<MobileCompetitionDto[]> {
  const competitions = await db.competition.findMany({
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

  return competition ? mapCompetitionToMobileDto(competition) : null;
}
