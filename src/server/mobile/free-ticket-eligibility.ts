import { db } from '@/server/db';
import type { Prisma } from '@prisma/client';

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

/** Same window as mobile competition list. */
function freeTicketRedeemableWhere(now: Date, useIsGoldFilter: boolean) {
  return {
    ...(useIsGoldFilter ? { is_gold: false } : {}),
    status: 'ACTIVE' as const,
    start_date: { lte: now },
    end_date: { gte: now },
  };
}

export function ticketPricesEqual(a: number, b: number): boolean {
  return Math.abs(a - b) < 0.001;
}

export function computeRemainingTickets(
  totalTickets: number,
  confirmedTicketCount: number,
): number {
  return Math.max(totalTickets - confirmedTicketCount, 0);
}

const confirmedTicketCountSelect = {
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

type CompetitionStockRow = {
  id: string;
  ticket_price: number;
  total_tickets: number;
  _count: {
    Ticket: number;
  };
};

export function pickLowestInStockPriceTier(
  rows: CompetitionStockRow[],
): { ids: string[]; minTicketPrice: number | null } {
  const inStock = rows
    .map((row) => ({
      id: row.id,
      ticket_price: row.ticket_price,
      remainingTickets: computeRemainingTickets(row.total_tickets, row._count.Ticket),
    }))
    .filter((row) => row.remainingTickets > 0);

  if (inStock.length === 0) {
    return { ids: [], minTicketPrice: null };
  }

  const minTicketPrice = Math.min(...inStock.map((row) => row.ticket_price));
  const ids = inStock
    .filter((row) => ticketPricesEqual(row.ticket_price, minTicketPrice))
    .map((row) => row.id);

  return { ids, minTicketPrice };
}

/** Lowest entry-price tier that still has tickets (skips sold-out cheaper tiers). */
export async function resolveCheapestRedeemableCompetitionIds(now = new Date()): Promise<{
  ids: string[];
  minTicketPrice: number | null;
}> {
  const useIsGoldFilter = await canUseIsGoldFilter();
  const rows = await db.competition.findMany({
    where: freeTicketRedeemableWhere(now, useIsGoldFilter),
    select: {
      id: true,
      ticket_price: true,
      total_tickets: true,
      ...confirmedTicketCountSelect,
    },
  });

  return pickLowestInStockPriceTier(rows);
}

export function isCompetitionCheapestForFreeTicket(
  competitionId: string,
  ticketPrice: number,
  eligible: { ids: string[]; minTicketPrice: number | null },
): boolean {
  if (eligible.minTicketPrice == null) {
    return false;
  }
  return (
    ticketPricesEqual(ticketPrice, eligible.minTicketPrice)
    && eligible.ids.includes(competitionId)
  );
}

export async function countConfirmedTicketsForCompetition(
  tx: Prisma.TransactionClient,
  competitionId: string,
): Promise<number> {
  return tx.ticket.count({
    where: {
      competitionId,
      Order: {
        status: 'CONFIRMED',
      },
    },
  });
}

export async function hasCompetitionTicketStock(
  tx: Prisma.TransactionClient,
  competition: {
    id: string;
    total_tickets: number;
  },
): Promise<boolean> {
  const confirmedTicketCount = await countConfirmedTicketsForCompetition(tx, competition.id);
  return computeRemainingTickets(competition.total_tickets, confirmedTicketCount) > 0;
}
