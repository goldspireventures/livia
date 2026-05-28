# Events vs analytics — two tables, two jobs

**Status:** living (Phase 1 platform spine).

Livia has two event-shaped surfaces. They are **not** interchangeable.

## `events` (product analytics feed)

- **Table:** `events` (`eventsTable` in `@workspace/db`)
- **Writer:** `logEvent()` in `artifacts/api-server/src/services/events.service.ts`
- **Purpose:** Owner-facing activity feed, dashboard “what happened”, lightweight product telemetry
- **Shape:** `type`, `businessId`, `userId`, `entityType`, `entityId`, `context` JSON
- **Consumers today:** Dashboard activity feed, demo summaries
- **Not:** tamper-evident, not legal-grade, not billing input

## `audit_log` (trust amplification)

- **Table:** `audit_log` (`auditLogTable` in `@workspace/audit-log`)
- **Writer:** `appendAudit()` / `appendHumanAudit()` in `artifacts/api-server/src/lib/audit.ts`
- **Purpose:** Hash-chained, append-only record of privileged human/Liv/system actions (ADR 0015)
- **Shape:** actor kind/id, action class, resource, payload, `prev_hash` / `row_hash`
- **Consumers:** Owner audit search (Phase 6), impersonation policy, SOC2 evidence
- **Triggers:** Postgres recomputes chain on insert (second line of defence)

## Domain bus (Phase 3+)

- **Package:** `@workspace/event-bus` — typed registry (`booking.*`, `conversation.*`, `time-off.*`, …)
- **Publisher:** `publishDomainEvent()` in api-server → Inngest `livia/<event>`
- **Dedup:** `domain_event_dedup` table (unique `dedupe_key`)
- **Transport:** Inngest (ADR 0013) — see `docs/engineering/workflows-dev.md`
- **Rule:** Producers emit bus events **and** keep writing `audit_log` for human-visible actions; analytics `events` remain optional for feed UX

## Request path (Phase 1)

```
HTTP → requireAuth → requireRole → resolveTenantContext (ALS)
     → route handler → service mutation
     → audit_log (if privileged write)
     → events (if feed-worthy)
```

When adding a new mutation, ask:

1. Should an owner be able to prove it happened? → **audit_log**
2. Should it appear in the activity feed? → **events**
3. Should downstream automation react? → **event-bus** (Phase 3+)
