import type { Competition, WatchImage } from '../types';

function normalizeImageRef(url: string): string {
  return url
    .trim()
    .replace(/\?.*$/, '')
    .replace(/\/$/, '')
    .toLowerCase();
}

/**
 * Watch gallery photos for the skill challenge, excluding the competition hero when it
 * appears as a duplicate in the gallery. Preserves gallery order.
 */
export function listChallengeWatchImages(competition: Competition): WatchImage[] {
  const images = competition.watch.images;
  if (images.length === 0) {
    return [];
  }
  const hero = competition.competitionImageUrl?.trim();
  if (!hero) {
    return [...images];
  }
  const heroKey = normalizeImageRef(hero);
  const withoutHero = images.filter((img) => normalizeImageRef(img.url) !== heroKey);
  if (withoutHero.length > 0) {
    return withoutHero;
  }
  return [...images];
}

/**
 * Default single image for legacy call sites (same rules as before list rotation).
 */
export function pickChallengeWatchImage(competition: Competition): WatchImage | undefined {
  const images = competition.watch.images;
  if (images.length === 0) {
    return undefined;
  }
  const hero = competition.competitionImageUrl?.trim();
  if (hero) {
    const heroKey = normalizeImageRef(hero);
    const notHero = images.find((img) => normalizeImageRef(img.url) !== heroKey);
    if (notHero) {
      return notHero;
    }
  }
  if (images.length > 1) {
    return images[1];
  }
  return images[0];
}
