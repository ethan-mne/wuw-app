import type { Competition } from '../types';

/** Use scheduled draw instant; sold-out comps are still `CLOSED` in the mobile DTO but may be upcoming. */
export function drawAlertInstantMs(competition: Competition): number {
  return new Date(competition.drawingDate ?? competition.endDate).getTime();
}

export function isDrawAlertEligible(competition: Competition, nowMs: number): boolean {
  const t = drawAlertInstantMs(competition);
  return Number.isFinite(t) && t > nowMs;
}
