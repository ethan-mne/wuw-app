# Sentry N+1 Detection Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Instrument Prisma queries as Sentry spans for waterfall visibility and fire a Sentry warning when any single request executes more than 10 DB queries.

**Architecture:** `prismaIntegration()` is added to `sentry.server.config.ts` so every Prisma query appears as a `db.query` span in Sentry's performance view. A Prisma `$extends` query extension in `db.ts` counts queries against the active Sentry span and calls `Sentry.captureMessage` exactly once when the count reaches 10.

**Tech Stack:** `@sentry/nextjs@10.46.0`, `@prisma/client@5.12.1`, Next.js 14, PlanetScale (MySQL)

---

### Task 1: Add `prismaIntegration()` to Sentry server config

**Files:**
- Modify: `sentry.server.config.ts`

- [ ] **Step 1: Open the file and confirm current state**

Read `sentry.server.config.ts`. It should look like:
```ts
import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: 'https://05087b65318343fd7e286d0bc8337670@o4504842386341888.ingest.sentry.io/4506190809923584',
  enabled: process.env.NODE_ENV === 'production',
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 0,
  debug: false,
})
```

- [ ] **Step 2: Add `prismaIntegration` to the init call**

Replace the full file with:
```ts
import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: 'https://05087b65318343fd7e286d0bc8337670@o4504842386341888.ingest.sentry.io/4506190809923584',
  enabled: process.env.NODE_ENV === 'production',
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 0,
  debug: false,
  integrations: [Sentry.prismaIntegration()],
})
```

`Sentry.prismaIntegration()` is exported from `@sentry/nextjs` in v8+ — no additional import needed.

- [ ] **Step 3: Verify TypeScript compiles**

```bash
pnpm tsc --noEmit
```

Expected: no errors. If you see `prismaIntegration is not a function`, check the Sentry version with `pnpm list @sentry/nextjs` — it must be ≥8.0.0.

- [ ] **Step 4: Commit**

```bash
git add sentry.server.config.ts
git commit -m "feat: add prismaIntegration to Sentry for DB query span visibility"
```

---

### Task 2: Add N+1 detection extension to Prisma client

**Files:**
- Modify: `src/server/db.ts`

- [ ] **Step 1: Open the file and confirm current state**

Read `src/server/db.ts`. The `createPrismaClient` function currently looks like:
```ts
const createPrismaClient = () => {
  const client = new PrismaClient({
    log:
      env.NODE_ENV === 'development'
        ? [{ emit: 'event', level: 'query' }, 'warn', 'error']
        : ['error'],
    adapter: new PrismaPlanetScale(psClient),
  });

  if (env.NODE_ENV === 'development') {
    client.$on('query', (event) => {
      if (event.duration > DB_LATENCY_THRESHOLD_MS) {
        console.warn(`[DB SLOW] ${event.duration}ms ${event.query}`);
      }
    });
  }

  return client;
};
```

- [ ] **Step 2: Add Sentry import**

Add the Sentry import at the top of the file after the existing imports:
```ts
import * as Sentry from '@sentry/nextjs'
```

The full import block at the top of `src/server/db.ts` should then be:
```ts
import { Client } from '@planetscale/database';
import { PrismaPlanetScale } from '@prisma/adapter-planetscale';
import { PrismaClient } from '@prisma/client';
import * as Sentry from '@sentry/nextjs';

import { env } from '@/env';
```

- [ ] **Step 3: Replace `createPrismaClient` to use `$extends`**

Replace the entire `createPrismaClient` function with:
```ts
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
      $allModels: {
        async $allOperations({ model, operation, args, query }) {
          const activeSpan = Sentry.getActiveSpan();
          if (!activeSpan) return query(args);

          const spanData = activeSpan as unknown as { _queryCount?: number };
          spanData._queryCount = (spanData._queryCount ?? 0) + 1;

          if (spanData._queryCount === 10) {
            Sentry.captureMessage(
              'N+1 detected: >10 DB queries in one transaction',
              {
                level: 'warning',
                extra: {
                  queryCount: spanData._queryCount,
                  model,
                  action: operation,
                  spanName: Sentry.spanToJSON(activeSpan).description,
                },
              },
            );
          }

          return query(args);
        },
      },
    },
  });
};
```

Key points:
- `$on` must be called on the base `PrismaClient` before `$extends` — that's why we keep `base` as a separate variable
- `$extends` returns a new extended client. `ReturnType<typeof createPrismaClient>` picks this up automatically — no manual type changes needed
- The alert fires at exactly the 10th query (not on every subsequent one) to avoid flooding Sentry
- `if (!activeSpan) return query(args)` is the safety valve — outside HTTP context (scripts, background jobs) there is no span, so the middleware is a no-op

- [ ] **Step 4: Verify TypeScript compiles**

```bash
pnpm tsc --noEmit
```

Expected: no errors. Common issues:
- If you see `Property '_queryCount' does not exist` — the `as unknown as { _queryCount?: number }` cast handles this; double-check it's present
- If you see `$extends is not a function` — ensure `@prisma/client` is v4.16+ (it's v5.12.1 here, so this should not occur)

- [ ] **Step 5: Commit**

```bash
git add src/server/db.ts
git commit -m "feat: add N+1 detection middleware — alert when >10 DB queries in one transaction"
```

---

### Task 3: Manual verification

- [ ] **Step 1: Start the dev server**

```bash
pnpm dev
```

- [ ] **Step 2: Trigger a known list endpoint**

Open your browser and navigate to the competitions list page (e.g. `/en/competitions`). This page loads multiple competitions, each potentially loading related `Watches` and `ImagesUrl` — a classic N+1 shape.

- [ ] **Step 3: Check Sentry performance waterfall**

In your Sentry dashboard → Performance → find the transaction for the page you just loaded. Expand the span tree. You should see `db.query` spans for each Prisma query, grouped under the request transaction.

If you don't see `db.query` spans in production: check that `tracesSampleRate` is non-zero when Sentry is enabled and that the `prismaIntegration()` line was saved correctly.

- [ ] **Step 4: Verify N+1 alert fires (if applicable)**

If the page triggered >10 queries, you will see a warning issue in Sentry → Issues with the title `N+1 detected: >10 DB queries in one transaction`. The issue detail will show:
```json
{
  "queryCount": 10,
  "model": "Competition",
  "action": "findMany",
  "spanName": "GET /en/competitions"
}
```

If no issue appeared, the page fired ≤10 queries — which means no N+1 on that route. Try a route that loads nested relations (e.g. a competition detail page that loads tickets).
