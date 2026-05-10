import { db } from '@/server/db';
import {
  mapCompetitionToMobileDto,
  type MobileCompetitionDto,
} from './mapper';

const mobileCompetitionSelect = {
  id: true,
  name: true,
  start_date: true,
  total_tickets: true,
  ticket_price: true,
  price: true,
  cash_alternative: true,
  max_winners: true,
  end_date: true,
  status: true,
  comp_image_url: true,
  Watches: {
    select: {
      id: true,
      brand: true,
      model: true,
      reference_number: true,
      movement: true,
      Bracelet_material: true,
      glass: true,
      bezel_material: true,
      year_of_manifacture: true,
      condition: true,
      has_box: true,
      has_certificate: true,
      images_url: {
        select: {
          url: true,
        },
      },
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
} as const;

let supportsIsGoldFilter: boolean | null = null;

async function canUseIsGoldFilter(): Promise<boolean> {
  if (supportsIsGoldFilter != null) {
    return supportsIsGoldFilter;
  }

  const rows = await db.$queryRaw<Array<{ count: number | bigint }>>`
    SELECT COUNT(*) AS count
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'competition'
      AND COLUMN_NAME = 'is_gold'
  `;
  const rawCount = rows[0]?.count ?? 0;
  const count = typeof rawCount === 'bigint' ? Number(rawCount) : rawCount;
  supportsIsGoldFilter = count > 0;
  return supportsIsGoldFilter;
}

export async function listCompetitionsForMobile(): Promise<MobileCompetitionDto[]> {
  const useIsGoldFilter = await canUseIsGoldFilter();
  const now = new Date();

  const competitions = await db.competition.findMany({
    where: useIsGoldFilter
      ? {
          is_gold: false,
          end_date: {
            gte: now,
          },
        }
      : {
          end_date: {
            gte: now,
          },
        },
    select: mobileCompetitionSelect,
    orderBy: {
      end_date: 'asc',
    },
  });

  return competitions.map(mapCompetitionToMobileDto);
}

export async function getCompetitionForMobileById(id: string) {
  const competition = await db.competition.findUnique({
    where: { id },
    select: mobileCompetitionSelect,
  });

  return competition ? mapCompetitionToMobileDto(competition) : null;
}
