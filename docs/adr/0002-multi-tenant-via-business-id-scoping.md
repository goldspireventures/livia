# ADR 0002: Multi-tenant isolation via `businessId` scoping

- **Status:** Accepted (2026-03, pre-rename — re-affirmed 2026-05-06).
- **Deciders:** founder.

## Context

Livia is sold per shop. Each shop is a tenant with its own staff, customers, services, bookings, conversations, and AI configuration. Two tenants must never see each other's data, and the data isolation has to survive every future feature without per-feature audits.

We considered three isolation models: schema-per-tenant, database-per-tenant, and row-level scoping by tenant id. The product is high-write, low-data-volume per tenant, and we expect to operate hundreds-to-low-thousands of tenants on shared Postgres in the medium term.

## Decision

Every tenant-scoped table carries a `businessId` foreign key, and **every query is scoped by `businessId`** — at the route handler layer, before the query executes. The `businesses` table is the tenant root. Auth (Clerk) → user → business membership → `businessId` is resolved once per request and passed into the data layer.

## Consequences

- Single Postgres instance; one Drizzle schema; one set of migrations. Operationally cheap.
- Conflict-safe booking creation uses `pg_advisory_xact_lock(businessId, staffId)` inside a transaction — see `lib/db` and the cockpit booking flow. Locks are tenant-scoped by construction.
- Every new schema table that holds tenant data **must** include `businessId` and an index on it. Code review checks this.
- We accept the noisy-neighbour risk inherent in shared Postgres; mitigated by per-tenant rate limits on the public endpoints (Engineering E10) and observability per tenant id in logs (E3).
- Cross-tenant analytics (e.g. founder-side "how many bookings across all shops") run as deliberate unscoped queries clearly labelled as such.

## Alternatives considered

- **Schema-per-tenant.** Rejected — migration overhead grows with tenant count, and Drizzle's project-reference workflow does not support it cleanly.
- **Database-per-tenant.** Rejected — operationally expensive at our stage, and would force connection-pool gymnastics on the Replit deployment surface.
- **Postgres Row-Level Security (RLS).** Considered. Rejected for v1 because the tenancy boundary is already enforced one layer up (route → service → query) and adding RLS would double-enforce without measurably improving the security posture. May revisit pre-SOC 2.
