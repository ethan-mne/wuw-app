import { Redis } from '@upstash/redis';

import { env } from '@/env';

let redisClient: Redis | null | undefined;

function getRedisClient(): Redis | null {
  if (redisClient !== undefined) {
    return redisClient;
  }

  const url = env.UPSTASH_REDIS_REST_URL;
  const token = env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) {
    redisClient = null;
    return null;
  }

  redisClient = new Redis({ url, token });
  return redisClient;
}

export function isRedisConfigured(): boolean {
  return getRedisClient() != null;
}

/** Lightweight connectivity check for deploy verification. */
export async function pingRedis(): Promise<'disabled' | 'ok' | 'error'> {
  const client = getRedisClient();
  if (!client) {
    return 'disabled';
  }

  try {
    const result = await client.ping();
    return result === 'PONG' ? 'ok' : 'error';
  } catch (error) {
    console.warn('[redis] ping failed', error);
    return 'error';
  }
}

export async function redisGetJson<T>(key: string): Promise<T | null> {
  const client = getRedisClient();
  if (!client) {
    return null;
  }

  try {
    const value = await client.get<T>(key);
    return value ?? null;
  } catch (error) {
    console.warn('[redis] get failed', key, error);
    return null;
  }
}

export async function redisSetJson(
  key: string,
  value: unknown,
  ttlSeconds: number,
): Promise<void> {
  const client = getRedisClient();
  if (!client) {
    return;
  }

  try {
    await client.set(key, value, { ex: ttlSeconds });
  } catch (error) {
    console.warn('[redis] set failed', key, error);
  }
}

export async function redisDelete(key: string): Promise<void> {
  const client = getRedisClient();
  if (!client) {
    return;
  }

  try {
    await client.del(key);
  } catch (error) {
    console.warn('[redis] del failed', key, error);
  }
}

/** Delete all keys matching a prefix (e.g. `mobile:draws:`). */
export async function redisDeleteByPrefix(prefix: string): Promise<void> {
  const client = getRedisClient();
  if (!client || !prefix) {
    return;
  }

  try {
    let cursor = 0;
    do {
      const result = await client.scan(cursor, {
        match: `${prefix}*`,
        count: 100,
      });
      const nextCursor = Number(result[0]);
      const keys = result[1];
      cursor = nextCursor;
      if (keys.length > 0) {
        await client.del(...keys);
      }
    } while (cursor !== 0);
  } catch (error) {
    console.warn('[redis] delete by prefix failed', prefix, error);
  }
}
