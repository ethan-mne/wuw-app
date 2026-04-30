# Lightweight Backend Module

This module contains the shared lightweight backend surface used by the mobile app.

## Scope

- Competition feed and detail mapping for mobile.
- Kept intentionally isolated from legacy/admin routers.

## Paths

- Service logic: `src/server/lightweight/competition/service.ts`
- DTO mapping: `src/server/lightweight/competition/mapper.ts`
- Router binding: `src/server/api/routers/lightweight.ts`
- REST endpoints: `src/app/api/mobile/*`
