# RFC 0011 — Staff scheduling (rota)

**Status:** Accepted (schema stub; UI Phase 10 minimal)  
**Date:** 2026-05-20

## Problem

Studios and chains need **shift/rota** planning distinct from **time-off** (blocking availability) and **bookings** (customer demand).

## Decision

1. **`staff_shifts` table** — recurring or one-off shifts: `business_id`, `staff_id`, `starts_at`, `ends_at`, `label`, `created_at`. Does not auto-block bookings until wired to availability engine (Phase 11+).
2. **API (future):** `GET/POST /businesses/{id}/staff-shifts` with OWNER/ADMIN auth.
3. **UI:** Dashboard staff page tab "Rota" — placeholder in Phase 10; full drag-drop calendar deferred.

## Migration

`lib/db/migrations/sql/003-staff-shifts.sql` — see file in repo.

## Open questions

- Overlap rules with `time_off` blocks.
- Chain-wide template shifts copied to new shops.
