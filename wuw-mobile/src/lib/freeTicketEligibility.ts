import type { Competition } from '../types';

/** Matches server: active, in stock, lowest entry price among redeemable comps. */
export function filterCheapestRedeemableCompetitions(competitions: Competition[]): Competition[] {
  const redeemable = competitions.filter(
    (c) => c.status === 'ACTIVE' && c.remainingTickets > 0,
  );
  if (redeemable.length === 0) {
    return [];
  }

  const minTicketPrice = Math.min(...redeemable.map((c) => c.ticketPrice));
  return redeemable.filter((c) => c.ticketPrice === minTicketPrice);
}
