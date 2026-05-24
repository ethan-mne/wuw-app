import { useCallback, useEffect, useRef, useState } from 'react';

import {
  fetchWithCache,
  getCachedData,
  invalidateCachedData,
  setCachedData,
} from '../lib/dataCache';

type UseCachedQueryOptions = {
  enabled?: boolean;
};

export function useCachedQuery<T>(
  key: string,
  fetcher: () => Promise<T>,
  options: UseCachedQueryOptions = {},
): {
  data: T | undefined;
  isLoading: boolean;
  isRefreshing: boolean;
  error: unknown;
  mutate: (value: T) => void;
  invalidate: () => void;
  refetch: () => void;
} {
  const { enabled = true } = options;
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  const [data, setData] = useState<T | undefined>(() => getCachedData<T>(key));
  const [isLoading, setIsLoading] = useState(() => enabled && getCachedData<T>(key) === undefined);
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
    const hasCachedData = getCachedData<T>(key) !== undefined;

    if (!hasCachedData) {
      setIsLoading(true);
    } else {
      setIsRefreshing(true);
      setData(getCachedData<T>(key));
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
  }, [key, enabled, fetchVersion]);

  return {
    data,
    isLoading,
    isRefreshing,
    error,
    mutate,
    invalidate,
    refetch,
  };
}
