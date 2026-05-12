import { db } from '@/server/db';
import {
  mapCompetitionToMobileDto,
  type MobileCompetitionDto,
} from './mapper';

/** Loaded rows for list + detail; remaining tickets use confirmed ticket count. */
const mobileCompetitionCoreSelect = {
  id: true,
  name: true,
  start_date: true,
  total_tickets: true,
  ticket_price: true,
  price: true,
  cash_alternative: true,
  max_winners: true,
  end_date: true,
  drawing_date: true,
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
} as const;

const mobileCompetitionSelect = {
  ...mobileCompetitionCoreSelect,
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

async function countConfirmedTicketsForCompetition(competitionId: string): Promise<number> {
  return db.ticket.count({
    where: {
      competitionId,
      Order: {
        status: 'CONFIRMED',
      },
    },
  });
}

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

/** Cutoff for paging older draws — same window as timeline seed for consistency. */
const DRAW_TIMELINE_LOOKBACK_MONTHS = 24;

async function timelineLookbackCutoff(): Promise<Date> {
  const cutoff = new Date();
  cutoff.setMonth(cutoff.getMonth() - DRAW_TIMELINE_LOOKBACK_MONTHS);
  return cutoff;
}

/** Gold filter fragment for mobile draw timeline queries. */
function drawTimelineGoldWhere(useIsGoldFilter: boolean) {
  return useIsGoldFilter ? ({ is_gold: false } as const) : ({} as const);
}

/** Initial snapshot: bounded past + bounded future chunks (each `take + 1` to derive hasMore). */
export async function getDrawTimelineSeed(
  takePast: number,
  takeFuture: number,
): Promise<{
  past: MobileCompetitionDto[];
  upcoming: MobileCompetitionDto[];
  hasMorePast: boolean;
  hasMoreFuture: boolean;
}> {
  const useIsGoldFilter = await canUseIsGoldFilter();
  const cutoff = await timelineLookbackCutoff();
  const gold = drawTimelineGoldWhere(useIsGoldFilter);
  const now = new Date();

  const pastRaw = await db.competition.findMany({
    where: {
      ...gold,
      drawing_date: {
        lte: now,
        gte: cutoff,
      },
    },
    select: mobileCompetitionSelect,
    orderBy: { drawing_date: 'desc' },
    take: takePast + 1,
  });

  const futureRaw = await db.competition.findMany({
    where: {
      ...gold,
      drawing_date: { gt: now },
    },
    select: mobileCompetitionSelect,
    orderBy: { drawing_date: 'asc' },
    take: takeFuture + 1,
  });

  const hasMorePast = pastRaw.length > takePast;
  const hasMoreFuture = futureRaw.length > takeFuture;
  const pastSlice = pastRaw.slice(0, takePast);
  const futureSlice = futureRaw.slice(0, takeFuture);

  return {
    past: [...pastSlice].reverse().map(mapCompetitionToMobileDto),
    upcoming: futureSlice.map(mapCompetitionToMobileDto),
    hasMorePast,
    hasMoreFuture,
  };
}

/** Older draws strictly before cursor (exclusive), ascending chronological order for prepending order. */
export async function getDrawTimelinePageBefore(
  cursorExclusive: Date,
  take: number,
): Promise<{ items: MobileCompetitionDto[]; hasMore: boolean }> {
  const useIsGoldFilter = await canUseIsGoldFilter();
  const cutoff = await timelineLookbackCutoff();
  const gold = drawTimelineGoldWhere(useIsGoldFilter);

  const rows = await db.competition.findMany({
    where: {
      ...gold,
      drawing_date: {
        lt: cursorExclusive,
        gte: cutoff,
      },
    },
    select: mobileCompetitionSelect,
    orderBy: { drawing_date: 'desc' },
    take: take + 1,
  });

  const hasMore = rows.length > take;
  const slice = rows.slice(0, take);
  return {
    items: [...slice].reverse().map(mapCompetitionToMobileDto),
    hasMore,
  };
}

/** Later draws strictly after cursor (exclusive), ascending order. */
export async function getDrawTimelinePageAfter(
  cursorExclusive: Date,
  take: number,
): Promise<{ items: MobileCompetitionDto[]; hasMore: boolean }> {
  const useIsGoldFilter = await canUseIsGoldFilter();
  const gold = drawTimelineGoldWhere(useIsGoldFilter);

  const rows = await db.competition.findMany({
    where: {
      ...gold,
      drawing_date: { gt: cursorExclusive },
    },
    select: mobileCompetitionSelect,
    orderBy: { drawing_date: 'asc' },
    take: take + 1,
  });

  const hasMore = rows.length > take;
  const slice = rows.slice(0, take);
  return {
    items: slice.map(mapCompetitionToMobileDto),
    hasMore,
  };
}

export async function getCompetitionForMobileById(id: string) {
  const trimmedId = id.trim();
  if (!trimmedId) {
    return null;
  }

  /** Separate count avoids Prisma findUnique + filtered relation _count issues on PlanetScale (relationMode prisma). */
  const competition = await db.competition.findUnique({
    where: { id: trimmedId },
    select: mobileCompetitionCoreSelect,
  });

  if (!competition) {
    return null;
  }

  const confirmedTickets = await countConfirmedTicketsForCompetition(trimmedId);

  return mapCompetitionToMobileDto({
    ...competition,
    _count: { Ticket: confirmedTickets },
  });
}
