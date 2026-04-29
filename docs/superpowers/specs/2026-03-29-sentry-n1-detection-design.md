# Sentry N+1 Query Detection Design

**Date:** 2026-03-29
**Status:** Approved

## Goal

Detect N+1 database queries in production using Sentry — both for visibility (performance waterfall) and active alerting (Sentry issues fired when a threshold is crossed).

## Threshold

Fire an alert when a single request/transaction executes **more than 10 DB queries**.

## Changes

### 1. `sentry.server.config.ts` — Add Prisma integration

Add `prismaIntegration()` to the Sentry `integrations` array. This instruments every Prisma query as a `db.query` span in Sentry's performance waterfall with zero changes to the Prisma client setup.

```ts
import * as Sentry from '@sentry/nextjs'
import { prismaIntegration } from '@sentry/nextjs'

Sentry.init({
  dsn: '...',
  enabled: process.env.NODE_ENV === 'production',
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 0,
  integrations: [prismaIntegration()],
})
```

### 2. `src/server/db.ts` — Add N+1 detection middleware

Add a `$use` middleware to the Prisma client inside `createPrismaClient()`. It attaches a query counter to the active Sentry span and fires `Sentry.captureMessage` exactly once per transaction when the count hits 10.

```ts
client.$use(async (params, next) => {
  const activeSpan = Sentry.getActiveSpan()
  if (!activeSpan) return next(params)

  const spanData = activeSpan as unknown as { _queryCount?: number }
  spanData._queryCount = (spanData._queryCount ?? 0) + 1

  if (spanData._queryCount === 10) {
    Sentry.captureMessage(`N+1 detected: >10 DB queries in one transaction`, {
      level: 'warning',
      extra: {
        queryCount: spanData._queryCount,
        model: params.model,
        action: params.action,
        spanName: Sentry.spanToJSON(activeSpan).description,
      },
    })
  }

  return next(params)
})
```

The middleware fires exactly once at the 10th query to avoid flooding Sentry. The `extra` payload captures: query count, Prisma model, action (findMany, etc.), and the Sentry span description (route name).

## Architecture

- **Visibility:** `prismaIntegration()` → every Prisma query is a span → waterfall in Sentry Performance tab shows clusters of repeated queries
- **Alerting:** `$use` middleware → counts queries against active Sentry span → `captureMessage` at threshold → appears as a Sentry warning issue with route context

## Scope

- Only affects server-side (`sentry.server.config.ts` + `src/server/db.ts`)
- No changes to client Sentry config, tRPC routers, or query logic
- No new dependencies (all APIs are already in `@sentry/nextjs`)

## Error Handling

- Middleware short-circuits with `return next(params)` when there is no active Sentry span (e.g. background jobs, scripts), so it is safe outside HTTP request context
- Alert fires once per span lifetime — no risk of duplicate Sentry events per transaction

## Testing

- Manually trigger a known N+1 route in development and verify the Sentry message appears in the Sentry dashboard
- Confirm `db.query` spans appear in the performance waterfall for instrumented routes
