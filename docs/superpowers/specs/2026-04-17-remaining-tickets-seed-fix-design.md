# New competitions rendering as SOLD OUT — design

Date: 2026-04-17
Branch: `claude/show-sold-out-competitions-zLHZT` → merged to `prod` via follow-up PR #719 (spec) and a subsequent code PR.
Related PR (root feature): #718 (`d35d1e89`).

## Problem

Brand-new competitions appear on the home page with the SOLD OUT overlay and a red "tickets sold out" bottom-bar button, even though no tickets have been bought. Reported after closing the Bruce Wayne and Pepsi competitions, when a newly created competition became the active item.

## Root cause

`remaining_tickets` is persisted as `0` at creation time.

1. Admin form (`src/app/dashboard/components/DashboardCompetitions.tsx:1391-1409`) initialises `remaining_tickets: 0` in Formik and does not update it before submit.
2. tRPC `Competition.add` (`src/server/api/routers/index.ts:666-674`) spreads the raw `input` into `prisma.competition.create`, so `remaining_tickets = 0` is persisted verbatim.
3. Home page uses `isSoldOut = remaining_tickets === 0 || status === 'COMPLETED'` (`src/app/[locale]/(home)/competition-item.tsx:53-55` and `src/app/[locale]/(home)/competition-bottom-bar.tsx:166-168`). `status === 'COMPLETED'` cannot be the trigger because the home page pre-filters to `status === 'ACTIVE'` (`src/app/[locale]/(home)/page.tsx:123-125`). Therefore `remaining_tickets === 0` is the firing condition.

The data bug has existed as long as the admin form has. It became user-visible only after PR #718 started rendering sold-out competitions with a prominent overlay instead of hiding them.

## Fix

Derive `remaining_tickets` at read time for the home page from confirmed ticket counts, so the stored column is no longer authoritative for this render path. Clean up the admin creation path so future rows are persisted with the correct value. No database migration and no row-level data repair.

### Code changes

| # | File | Change |
|---|------|--------|
| 1 | `src/app/[locale]/(home)/page.tsx` (`getHomeCompetitions`) | Drop the `remaining_tickets` column from the `select`. Add `_count: { select: { Ticket: { where: { Order: { status: 'confirmed' } } } } }`. Map rows to expose `remaining_tickets = total_tickets - _count.Ticket` so `CompetitionInterface` shape stays intact for downstream components. Keeps `unstable_cache` wrapping and 60 s revalidation. |
| 2 | `src/server/api/routers/index.ts` (`Competition.add`) | On create, override `remaining_tickets: input.total_tickets` regardless of what the client sent. Future rows stay consistent even for other callers of this mutation. |
| 3 | `src/server/api/routers/index.ts` (`Competition.add` input) | Change input from `CompetitionSchema.omit({ id: true }).required()` to `CompetitionSchema.omit({ id: true, remaining_tickets: true }).required()`, mirroring the `updateOne` pattern. Keeps the base `CompetitionSchema` untouched for its many other call sites. |
| 4 | `src/app/dashboard/components/DashboardCompetitions.tsx` | Remove `remaining_tickets` from Formik `initialValues` (L1405) and from the object passed to `addComp` in the submit handler (L1374-1387). |

### Why the home page query change is safe

- The existing raw-SQL pattern at `src/server/api/routers/index.ts:471-481` already computes `remaining_tickets` the same way (`total_tickets - COUNT(tickets where order.status = 'confirmed')`). We are copying that semantics, not inventing one.
- `byID` at `src/server/api/routers/index.ts:594-628` uses the same Prisma `_count` pattern we are adopting (though without the `where` filter — we add it to match the confirmed-only semantics).
- Home page data flows through `unstable_cache` with `revalidate: 60`, so the extra subquery runs at most once per minute per instance.

## Non-goals

- Not touching other read paths that still consume the stored `remaining_tickets` column (`src/app/[locale]/competitions/[id]/layout.tsx`, `src/app/dashboard/**`, account pages, etc.). Out of scope for a hotfix.
- Not touching `Competition.updateOne`. Admins may still edit `total_tickets` there; mismatched stored `remaining_tickets` on other pages is pre-existing and unrelated to this bug.
- Not touching the webhook ticket-decrement path at `src/app/api/webhooks/lib.ts:114`.
- Not repairing the currently stuck prod row — the home page query ignores its stored value.
- Not migrating `remaining_tickets` to a fully-derived column across the codebase (rejected Option C — too invasive for a hotfix).

## Testing

- Unit: add a test that `Competition.add` input validates without `remaining_tickets` and that the create mutation persists `remaining_tickets = total_tickets`.
- Manual smoke on preview:
  1. Create a new competition with `total_tickets = 100` via the admin dashboard.
  2. Verify the DB row has `remaining_tickets = 100`.
  3. Home page renders it with "Get your ticket" (no SOLD OUT overlay).
  4. Manually update the row to `remaining_tickets = 0` in the DB without confirming tickets; reload the home page; it should still render live (confirming the derived-at-read path is working).
  5. Buy out all tickets via the normal checkout flow; home page then shows the SOLD OUT overlay for that competition.

## Rollout

1. Branch off `prod` (reusing `claude/show-sold-out-competitions-zLHZT` for continuity).
2. Implement the four code changes above.
3. Open PR into `prod` (the current PR #719 has the spec only; the code goes in a follow-up PR).
4. Merge → deploy. No data migration. No manual DB work.
5. Verify the previously stuck competition renders live.

## Risks

- Prisma `_count` with a nested relation `where` requires a recent-enough Prisma version. Verify locally before opening the PR; if unsupported, fall back to the raw-SQL pattern already used in `getAllTickets` at `src/server/api/routers/index.ts:468-515`.
- The home page `_count` adds one subquery per competition per cache miss. With fewer than a handful of active competitions and 60 s caching, this is negligible.
- Other pages that still read the stored `remaining_tickets` column will show the outdated value for the currently stuck competition. Acceptable: the bug was reported against the home page, and those other pages are admin-facing or per-competition detail pages where the value is less prominent. A future PR can migrate them if needed.
