import type { Competition } from '../types';

function ticketPricesEqual(a: number, b: number): boolean {
  return Math.abs(a - b) < 0.001;
}

function isWithinRedeemWindow(competition: Competition, now: number): boolean {
  if (competition.status !== 'ACTIVE' || competition.remainingTickets <= 0) {
    return false;
  }
  const startMs = Date.parse(competition.startDate);
  const endMs = Date.parse(competition.endDate);
  if (!Number.isNaN(startMs) && startMs > now) {
    return false;
  }
  if (!Number.isNaN(endMs) && endMs < now) {
    return false;
  }
  return true;
}

/**
 * Lowest entry-price tier that still has tickets.
 * Skips sold-out cheaper tiers (e.g. shows £15 comps when £10 tier is sold out).
 */
export function filterCheapestRedeemableCompetitions(competitions: Competition[]): Competition[] {
  const now = Date.now();
  const inStock = competitions.filter((c) => isWithinRedeemWindow(c, now));
  if (inStock.length === 0) {
    return [];
  }

  const minTicketPrice = Math.min(...inStock.map((c) => c.ticketPrice));
  return inStock.filter((c) => ticketPricesEqual(c.ticketPrice, minTicketPrice));
}
