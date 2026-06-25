type CacheEntry<T> = {
  data: T;
  fetchedAt: number;
};

const cache = new Map<string, CacheEntry<unknown>>();
const inflight = new Map<string, Promise<unknown>>();

export const cacheKeys = {
  competitions: 'competitions',
  winnersHome: 'winners:0:8',
  winnersAll: 'winners:all',
  homeStats: 'home-stats',
  drawsSeed: (takePast: number, takeFuture: number) => `draws-seed:${takePast}:${takeFuture}`,
  competition: (id: string) => `competition:${id}`,
  accountSummary: 'auth:account-summary',
  activeEntries: 'auth:active-entries',
  mobileProfile: 'auth:mobile-profile',
  calendarFeedSubscription: 'auth:calendar-feed-subscription',
  orderHistory: 'auth:order-history',
  referralUsages: 'auth:referral-usages',
} as const;

export function getCachedData<T>(key: string): T | undefined {
  return cache.get(key)?.data as T | undefined;
}

export function getCachedFetchedAt(key: string): number | undefined {
  return cache.get(key)?.fetchedAt;
}

export function isCachedDataFresh(key: string, maxAgeMs: number): boolean {
  const fetchedAt = getCachedFetchedAt(key);
  if (fetchedAt == null) {
    return false;
  }
  return Date.now() - fetchedAt < maxAgeMs;
}

export function setCachedData<T>(key: string, data: T): void {
  cache.set(key, { data, fetchedAt: Date.now() });
}

export function invalidateCachedData(key: string): void {
  cache.delete(key);
  inflight.delete(key);
}

export function invalidateCachedDataByPrefix(prefix: string): void {
  for (const key of cache.keys()) {
    if (key.startsWith(prefix)) {
      cache.delete(key);
    }
  }
  for (const key of inflight.keys()) {
    if (key.startsWith(prefix)) {
      inflight.delete(key);
    }
  }
}

export function invalidateUserCachedData(): void {
  invalidateCachedDataByPrefix('auth:');
}

export async function fetchWithCache<T>(
  key: string,
  fetcher: () => Promise<T>,
): Promise<T> {
  const pending = inflight.get(key);
  if (pending) {
    return pending as Promise<T>;
  }

  const request = fetcher()
    .then((data) => {
      setCachedData(key, data);
      return data;
    })
    .finally(() => {
      inflight.delete(key);
    });

  inflight.set(key, request);
  return request;
}
