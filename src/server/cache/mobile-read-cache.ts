import { revalidateTag, unstable_cache } from 'next/cache';

import {
  getCompetitionForMobileById,
  getDrawTimelinePageAfter,
  getDrawTimelinePageBefore,
  getDrawTimelineSeed,
  listCompetitionsForMobile,
} from '@/server/lightweight/competition/service';
import type { MobileCompetitionDto } from '@/server/lightweight/competition/mapper';
import { db } from '@/server/db';
import type { MobileWinnersResponse } from '@/server/mobile/types';
import {
  redisDelete,
  redisDeleteByPrefix,
  redisGetJson,
  redisSetJson,
} from '@/server/cache/redis';

export const MOBILE_COMPETITIONS_TAG = 'mobile-competitions';
export const MOBILE_WINNERS_HOME_TAG = 'mobile-winners-home';
export const MOBILE_DRAWS_TAG = 'mobile-draws';

export const MOBILE_COMPETITIONS_REVALIDATE_SECONDS = 60;
export const MOBILE_WINNERS_HOME_REVALIDATE_SECONDS = 60;
export const MOBILE_COMPETITION_DETAIL_REVALIDATE_SECONDS = 30;
export const MOBILE_DRAWS_REVALIDATE_SECONDS = 60;

export const MOBILE_COMPETITIONS_CACHE_KEY = 'mobile:competitions';
export const MOBILE_WINNERS_HOME_CACHE_KEY = 'mobile:winners:0:8';
export const MOBILE_DRAWS_REDIS_PREFIX = 'mobile:draws:';

export function mobileCompetitionTag(competitionId: string): string {
  return `mobile-competition:${competitionId.trim()}`;
}

export function mobileCompetitionRedisKey(competitionId: string): string {
  return `mobile:competition:${competitionId.trim()}`;
}

export function mobileDrawsSeedRedisKey(takePast: number, takeFuture: number): string {
  return `${MOBILE_DRAWS_REDIS_PREFIX}seed:${takePast}:${takeFuture}`;
}

export function mobileDrawsBeforeRedisKey(cursorIso: string, take: number): string {
  return `${MOBILE_DRAWS_REDIS_PREFIX}before:${cursorIso}:${take}`;
}

export function mobileDrawsAfterRedisKey(cursorIso: string, take: number): string {
  return `${MOBILE_DRAWS_REDIS_PREFIX}after:${cursorIso}:${take}`;
}

type DrawsTimelineSeedPayload = Awaited<ReturnType<typeof getDrawTimelineSeed>>;
type DrawsTimelinePagePayload = Awaited<ReturnType<typeof getDrawTimelinePageBefore>>;

async function fetchWithRedisL2<T>(
  key: string,
  ttlSeconds: number,
  fetcher: () => Promise<T>,
): Promise<T> {
  const cached = await redisGetJson<T>(key);
  if (cached != null) {
    return cached;
  }

  const fresh = await fetcher();
  if (fresh != null) {
    void redisSetJson(key, fresh, ttlSeconds);
  }
  return fresh;
}

const winnersHomeSelect = {
  id: true,
  name: true,
  watch_name: true,
  value: true,
  img: true,
  src: true,
  date: true,
} as const;

async function fetchMobileWinnersHome(): Promise<MobileWinnersResponse> {
  const skip = 0;
  const take = 8;

  const [rows, total] = await Promise.all([
    db.winner.findMany({
      orderBy: {
        date: 'desc',
      },
      skip,
      take,
      select: winnersHomeSelect,
    }),
    db.winner.count(),
  ]);

  const data = rows.map((winner) => ({
    id: String(winner.id),
    name: winner.name ?? 'Winner',
    prize: winner.watch_name ?? 'Competition prize',
    location: '',
    imageUrl: winner.src ?? winner.img ?? '',
    drawDate: winner.date ? winner.date.toISOString().slice(0, 10) : '',
  }));

  return {
    data,
    hasMore: skip + rows.length < total,
  };
}

export const getCachedMobileCompetitions = unstable_cache(
  async (): Promise<MobileCompetitionDto[]> =>
    fetchWithRedisL2(
      MOBILE_COMPETITIONS_CACHE_KEY,
      MOBILE_COMPETITIONS_REVALIDATE_SECONDS,
      listCompetitionsForMobile,
    ),
  ['mobile-competitions'],
  {
    revalidate: MOBILE_COMPETITIONS_REVALIDATE_SECONDS,
    tags: [MOBILE_COMPETITIONS_TAG],
  },
);

export const getCachedMobileWinnersHome = unstable_cache(
  async (): Promise<MobileWinnersResponse> =>
    fetchWithRedisL2(
      MOBILE_WINNERS_HOME_CACHE_KEY,
      MOBILE_WINNERS_HOME_REVALIDATE_SECONDS,
      fetchMobileWinnersHome,
    ),
  ['mobile-winners-home'],
  {
    revalidate: MOBILE_WINNERS_HOME_REVALIDATE_SECONDS,
    tags: [MOBILE_WINNERS_HOME_TAG],
  },
);

export async function getCachedMobileCompetitionById(
  competitionId: string,
): Promise<MobileCompetitionDto | null> {
  const trimmedId = competitionId.trim();
  if (!trimmedId) {
    return null;
  }

  const cachedFn = unstable_cache(
    async (): Promise<MobileCompetitionDto | null> =>
      fetchWithRedisL2(
        mobileCompetitionRedisKey(trimmedId),
        MOBILE_COMPETITION_DETAIL_REVALIDATE_SECONDS,
        () => getCompetitionForMobileById(trimmedId),
      ),
    ['mobile-competition', trimmedId],
    {
      revalidate: MOBILE_COMPETITION_DETAIL_REVALIDATE_SECONDS,
      tags: [mobileCompetitionTag(trimmedId), MOBILE_COMPETITIONS_TAG],
    },
  );

  return cachedFn();
}

export async function getCachedMobileDrawsTimelineSeed(
  takePast: number,
  takeFuture: number,
): Promise<DrawsTimelineSeedPayload> {
  const cachedFn = unstable_cache(
    async (): Promise<DrawsTimelineSeedPayload> =>
      fetchWithRedisL2(
        mobileDrawsSeedRedisKey(takePast, takeFuture),
        MOBILE_DRAWS_REVALIDATE_SECONDS,
        () =>
          getDrawTimelineSeed(takePast, takeFuture, {
            probePastHasMore: false,
          }),
      ),
    ['mobile-draws-seed', String(takePast), String(takeFuture)],
    {
      revalidate: MOBILE_DRAWS_REVALIDATE_SECONDS,
      tags: [MOBILE_DRAWS_TAG, MOBILE_COMPETITIONS_TAG],
    },
  );

  return cachedFn();
}

export async function getCachedMobileDrawsTimelineBefore(
  cursor: Date,
  take: number,
): Promise<DrawsTimelinePagePayload> {
  const cursorIso = cursor.toISOString();
  const cachedFn = unstable_cache(
    async (): Promise<DrawsTimelinePagePayload> =>
      fetchWithRedisL2(
        mobileDrawsBeforeRedisKey(cursorIso, take),
        MOBILE_DRAWS_REVALIDATE_SECONDS,
        () => getDrawTimelinePageBefore(cursor, take),
      ),
    ['mobile-draws-before', cursorIso, String(take)],
    {
      revalidate: MOBILE_DRAWS_REVALIDATE_SECONDS,
      tags: [MOBILE_DRAWS_TAG, MOBILE_COMPETITIONS_TAG],
    },
  );

  return cachedFn();
}

export async function getCachedMobileDrawsTimelineAfter(
  cursor: Date,
  take: number,
): Promise<DrawsTimelinePagePayload> {
  const cursorIso = cursor.toISOString();
  const cachedFn = unstable_cache(
    async (): Promise<DrawsTimelinePagePayload> =>
      fetchWithRedisL2(
        mobileDrawsAfterRedisKey(cursorIso, take),
        MOBILE_DRAWS_REVALIDATE_SECONDS,
        () => getDrawTimelinePageAfter(cursor, take),
      ),
    ['mobile-draws-after', cursorIso, String(take)],
    {
      revalidate: MOBILE_DRAWS_REVALIDATE_SECONDS,
      tags: [MOBILE_DRAWS_TAG, MOBILE_COMPETITIONS_TAG],
    },
  );

  return cachedFn();
}

export function invalidateMobileDrawsReadCache(): void {
  revalidateTag(MOBILE_DRAWS_TAG);
  void redisDeleteByPrefix(MOBILE_DRAWS_REDIS_PREFIX);
}

export function invalidateMobileCompetitionReadCache(competitionId?: string): void {
  revalidateTag(MOBILE_COMPETITIONS_TAG);
  void redisDelete(MOBILE_COMPETITIONS_CACHE_KEY);
  invalidateMobileDrawsReadCache();

  const trimmedId = competitionId?.trim() ?? '';
  if (trimmedId) {
    revalidateTag(mobileCompetitionTag(trimmedId));
    void redisDelete(mobileCompetitionRedisKey(trimmedId));
  }
}

/** Invalidate list/detail caches and populate them before a go-live push. */
export async function prewarmMobileCompetitionReadCache(
  competitionId?: string,
): Promise<void> {
  invalidateMobileCompetitionReadCache(competitionId);
  await getCachedMobileCompetitions();

  const trimmedId = competitionId?.trim() ?? '';
  if (trimmedId) {
    await getCachedMobileCompetitionById(trimmedId);
  }
}

/** Warm the default mobile draws seed (matches DrawsPage initial load). */
export async function prewarmMobileDrawsReadCache(
  takePast = 3,
  takeFuture = 15,
): Promise<void> {
  invalidateMobileDrawsReadCache();
  await getCachedMobileDrawsTimelineSeed(takePast, takeFuture);
}
