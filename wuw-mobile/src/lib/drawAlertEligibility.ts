import type { Competition } from '../types';

/** Keep the draws-page hero on the just-ended draw while the live stream is expected. */
export const HERO_LIVE_GRACE_MS = 10 * 60 * 1000;

/** Use scheduled draw instant; sold-out comps are still `CLOSED` in the mobile DTO but may be upcoming. */
export function drawAlertInstantMs(competition: Competition): number {
  return new Date(competition.drawingDate ?? competition.endDate).getTime();
}

export function isDrawAlertEligible(competition: Competition, nowMs: number): boolean {
  const t = drawAlertInstantMs(competition);
  return Number.isFinite(t) && t > nowMs;
}

export function isInHeroLiveBuffer(competition: Competition, nowMs: number): boolean {
  const t = drawAlertInstantMs(competition);
  return Number.isFinite(t) && t <= nowMs && nowMs - t < HERO_LIVE_GRACE_MS;
}

/** Most recently ended draw still within the hero grace window, if any. */
export function findHeroLiveBufferDraw(
  competitions: Competition[],
  nowMs: number,
): Competition | null {
  let best: Competition | null = null;
  let bestT = -Infinity;
  for (const c of competitions) {
    const t = drawAlertInstantMs(c);
    if (!Number.isFinite(t) || t > nowMs) continue;
    if (t > bestT) {
      bestT = t;
      best = c;
    }
  }
  if (best == null || !isInHeroLiveBuffer(best, nowMs)) {
    return null;
  }
  return best;
}
