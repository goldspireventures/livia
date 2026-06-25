# Livia Migration Ingest Template

**Status:** canonical v1.0  
**Code:** `lib/policy/src/migration-ingest-template.ts`  
**Related:** [`IMPORT-MIGRATION-SPEC.md`](./IMPORT-MIGRATION-SPEC.md) · [`INCUMBENT-MIGRATION-ATLAS.md`](./INCUMBENT-MIGRATION-ATLAS.md)

---

## Purpose

One standard entity bundle any scheduling platform can produce for Livia ingest — OAuth pull, partner handoff, or file upload all land in the same apply pipeline (`migration-import-helpers` → core tenant tables).

Partners do not need to learn Livia's internal schema. They map to this template once.

---

## Bundle shape

```json
{
  "version": "1.0",
  "exportedAt": "2026-06-21T12:00:00Z",
  "externalBusinessId": "salon-abc-123",
  "clients": [{ "firstName": "Jane", "email": "jane@example.com" }],
  "services": [{ "name": "Cut & blowdry", "durationMinutes": 60, "priceMinor": 6500 }],
  "staff": [{ "displayName": "Alex" }],
  "appointments": [{ "startAt": "2026-06-25T10:00:00Z", "serviceName": "Cut & blowdry" }]
}
```

Apply order: **services → staff → clients → appointments** (see `LIVIA_MIGRATION_BUNDLE_ENTITY_ORDER`).

---

## What Livia automates today

| Connect type | Platforms | Entities |
|--------------|-----------|----------|
| OAuth (workspace env required) | Acuity, Square, Fresha, Google Calendar | See atlas per platform |
| Partner API | Phorest, Zenoti | Not live — store salon ID, file fallback |
| File upload | All incumbents with exports | clients, services, staff, appointments |
| Booking URL mirror | Booksy-style public pages | **Not live** — URL stored, honest UI |

UI uses `resolveMigrationAutomationTruth()` — never shows Connect when tier is not `oauth_live`.

---

## Track alignment

- **Track B (platform kernel):** ingest services, connection storage, OAuth orchestration  
- **Track C (experience):** onboarding import UI, honest limits, file upload  
- **Track E (lifecycle):** fast-track switching nav, post-import hours → open  

---

## Partner handoff checklist

1. Provide `externalBusinessId` stable per location  
2. Export or API-read the four core entity kinds  
3. Use ISO-8601 for appointment times  
4. Include email **or** phone on clients when possible  
5. POST bundle or enable OAuth scopes listed in atlas for your category  

Livia applies bundle, marks `migrationImported`, advances switching onboarding to hours.
