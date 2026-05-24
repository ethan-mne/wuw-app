import { db } from '@/server/db';

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

function freeTicketRedeemableWhere(now: Date, useIsGoldFilter: boolean) {
  return {
    ...(useIsGoldFilter ? { is_gold: false } : {}),
    status: 'ACTIVE' as const,
    start_date: { lte: now },
    end_date: { gte: now },
    remaining_tickets: { gt: 0 },
  };
}

/** Active competitions eligible for Wincoin free-ticket redemption (lowest ticket_price only). */
export async function resolveCheapestRedeemableCompetitionIds(now = new Date()): Promise<{
  ids: string[];
  minTicketPrice: number | null;
}> {
  const useIsGoldFilter = await canUseIsGoldFilter();
  const rows = await db.competition.findMany({
    where: freeTicketRedeemableWhere(now, useIsGoldFilter),
    select: { id: true, ticket_price: true },
  });

  if (rows.length === 0) {
    return { ids: [], minTicketPrice: null };
  }

  const minTicketPrice = Math.min(...rows.map((row) => row.ticket_price));
  const ids = rows
    .filter((row) => row.ticket_price === minTicketPrice)
    .map((row) => row.id);

  return { ids, minTicketPrice };
}

export function isCompetitionCheapestForFreeTicket(
  competitionId: string,
  ticketPrice: number,
  eligible: { ids: string[]; minTicketPrice: number | null },
): boolean {
  if (eligible.minTicketPrice == null) {
    return false;
  }
  return ticketPrice === eligible.minTicketPrice && eligible.ids.includes(competitionId);
}
