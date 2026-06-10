import { Client } from '@planetscale/database';
import { PrismaPlanetScale } from '@prisma/adapter-planetscale';
import { PrismaClient } from '@prisma/client';
import * as Sentry from '@sentry/nextjs';

import { env } from '@/env';
import {
  runCompetitionCreateSideEffects,
  runCompetitionUpdateSideEffects,
} from '@/server/notifications/competition-events';

const DB_LATENCY_THRESHOLD_MS = 500;

const psClient = new Client({ url: env.DATABASE_URL });

const spanQueryCounts = new WeakMap<object, number>();
const spanWarned = new WeakSet<object>();

const createPrismaClient = () => {
  const base = new PrismaClient({
    log:
      env.NODE_ENV === 'development'
        ? [{ emit: 'event', level: 'query' }, 'warn', 'error']
        : ['error'],
    adapter: new PrismaPlanetScale(psClient),
  });

  if (env.NODE_ENV === 'development') {
    base.$on('query', (event) => {
      if (event.duration > DB_LATENCY_THRESHOLD_MS) {
        console.warn(`[DB SLOW] ${event.duration}ms ${event.query}`);
      }
    });
  }

  return base.$extends({
    query: {
      competition: {
        async create({ args, query }) {
          const result = await query(args);
          const idFromResult =
            typeof result === 'object'
            && result != null
            && 'id' in result
            && typeof result.id === 'string'
              ? result.id
              : undefined;
          const idFromArgs =
            typeof args === 'object'
            && args != null
            && 'data' in args
            && typeof args.data === 'object'
            && args.data != null
            && 'id' in args.data
            && typeof args.data.id === 'string'
              ? args.data.id
              : undefined;
          const competitionId = idFromResult ?? idFromArgs;
          if (competitionId) {
            try {
              await runCompetitionCreateSideEffects(base, competitionId);
            } catch (error) {
              console.error('[competition-events] create side-effects failed', error);
            }
          }
          return result;
        },
        async update({ args, query }) {
          const previous = await base.competition.findUnique({
            where: args.where,
            select: {
              id: true,
              drawing_date: true,
              end_date: true,
            },
          });

          const result = await query(args);

          if (previous) {
            try {
              await runCompetitionUpdateSideEffects(base, previous);
            } catch (error) {
              console.error('[competition-events] update side-effects failed', error);
            }
          }

          return result;
        },
      },
      $allModels: {
        async $allOperations({ model, operation, args, query }) {
          const activeSpan = Sentry.getActiveSpan();
          if (!activeSpan) return query(args);

          const count = (spanQueryCounts.get(activeSpan) ?? 0) + 1;
          spanQueryCounts.set(activeSpan, count);

          if (count === 10 && !spanWarned.has(activeSpan)) {
            spanWarned.add(activeSpan);
            Sentry.captureMessage(
              'N+1 detected: 10+ DB queries in one transaction',
              {
                level: 'warning',
                extra: {
                  queryCount: count,
                  model,
                  action: operation,
                  spanName: Sentry.spanToJSON(activeSpan).description ?? 'unknown',
                },
              },
            );
          }

          return query(args);
        },
      },
    },
  }) as unknown as PrismaClient;
};

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const db = globalForPrisma.prisma ?? createPrismaClient();

if (env.NODE_ENV !== 'production') globalForPrisma.prisma = db;
