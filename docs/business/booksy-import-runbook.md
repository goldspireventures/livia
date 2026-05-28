# Booksy / Phorest import runbook

**Service:** `artifacts/api-server/src/services/booksy-import.service.ts`  
**Owner:** CS + founder (first 3 partners)

## When to use

Partner exports client list + appointment history from incumbent (Booksy CSV or Phorest export). Goal: **time-to-first Liv booking** &lt;7 days after import.

## Steps

1. Obtain export file from partner (GDPR: their customer data).
2. OWNER → Settings → Integrations (or internal import route if enabled).
3. Map columns per service README in `booksy-import.service.ts`.
4. Dry-run in **demo** tenant first; review duplicate customers.
5. Production import → verify customer count + next booking on calendar.
6. Log duration in partner tracker (S-02 migration dry-run).

## Failure macros (Support)

- **Duplicate clients:** identity merge suggestions (`/liv` merge flow).
- **Missing services:** create services before re-import appointments.
- **Wrong timezone:** fix shop timezone in Settings → Shop before import.
