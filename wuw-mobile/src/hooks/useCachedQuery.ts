import { useCallback, useEffect, useRef, useState } from 'react';

import {
  fetchWithCache,
  getCachedData,
  invalidateCachedData,
  isCachedDataFresh,
  setCachedData,
} from '../lib/dataCache';

type UseCachedQueryOptions<T> = {
  enabled?: boolean;
  /** Skip background refetch while cached data is younger than this (ms). */
  maxAgeMs?: number;
  /** Shown while loading when no cached entry exists yet. */
  placeholderData?: T;
};

export function useCachedQuery<T>(
  key: string,
  fetcher: () => Promise<T>,
  options: UseCachedQueryOptions<T> = {},
): {
  data: T | undefined;
  isLoading: boolean;
  isRefreshing: boolean;
  error: unknown;
  mutate: (value: T) => void;
  invalidate: () => void;
  refetch: () => void;
} {
  const { enabled = true, maxAgeMs, placeholderData } = options;
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  const [data, setData] = useState<T | undefined>(() => {
    const cached = getCachedData<T>(key);
    return cached ?? placeholderData;
  });
  const [isLoading, setIsLoading] = useState(() => {
    if (!enabled) {
      return false;
    }
    return getCachedData<T>(key) === undefined && placeholderData === undefined;
  });
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<unknown>();
  const [fetchVersion, setFetchVersion] = useState(0);

  const mutate = useCallback(
    (value: T) => {
      setCachedData(key, value);
      setData(value);
      setError(undefined);
    },
    [key],
  );

  const invalidate = useCallback(() => {
    invalidateCachedData(key);
    setData(undefined);
  }, [key]);

  const refetch = useCallback(() => {
    setFetchVersion((v) => v + 1);
  }, []);

  useEffect(() => {
    if (!enabled) {
      setIsLoading(false);
      setIsRefreshing(false);
      return;
    }

    let cancelled = false;
    const cached = getCachedData<T>(key);
    const hasCachedData = cached !== undefined;

    if (hasCachedData) {
      setData(cached);
    } else if (placeholderData !== undefined) {
      setData(placeholderData);
    }

    if (maxAgeMs != null && hasCachedData && isCachedDataFresh(key, maxAgeMs)) {
      setIsLoading(false);
      setIsRefreshing(false);
      setError(undefined);
      return () => {
        cancelled = true;
      };
    }

    if (!hasCachedData && placeholderData === undefined) {
      setIsLoading(true);
    } else {
      setIsRefreshing(true);
    }

    void fetchWithCache(key, () => fetcherRef.current())
      .then((result) => {
        if (cancelled) {
          return;
        }
        setData(result);
        setError(undefined);
      })
      .catch((err: unknown) => {
        if (cancelled) {
          return;
        }
        if (getCachedData<T>(key) === undefined && placeholderData !== undefined) {
          setData(placeholderData);
        }
        setError(err);
      })
      .finally(() => {
        if (cancelled) {
          return;
        }
        setIsLoading(false);
        setIsRefreshing(false);
      });

    return () => {
      cancelled = true;
    };
  }, [key, enabled, fetchVersion, maxAgeMs, placeholderData]);

  const resolvedData = data ?? (getCachedData<T>(key) === undefined ? placeholderData : undefined);

  return {
    data: resolvedData,
    isLoading,
    isRefreshing,
    error,
    mutate,
    invalidate,
    refetch,
  };
}
