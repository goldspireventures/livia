# Multi-tenant isolation

**Status:** F8 (2026-05-07). Companion to ADR 0014. Reads with ADR 0002 + ADR 0010.

## The question

Beyond row-level scoping by `business_id`. Schema-per-tenant for big chains? Hybrid? And the cross-tenant intelligence ADR (the "salons like yours" feature) — privacy line, opt-in vs opt-out, what data ever leaves the tenant.

## The decision

**Hybrid:** row-level by `business_id` for v1; schema-per-tenant for chains ≥10 shops at v1.5; cross-tenant intelligence default-OPT-IN with k≥10 differential privacy. Captured in ADR 0014.

### Row-level for v1

- Every table has `business_id NOT NULL`.
- Every query goes through a tenant-scoped query helper that enforces the filter; raw SQL is forbidden in app code.
- Postgres Row-Level Security (RLS) policies are the second line of defence: even if app code forgets the filter, RLS denies the read.
- Database role per artifact (api_server, workflow_runner, audit_writer); each role scoped to the minimum tables it needs.

### Schema-per-tenant graduation

A tenant graduates to its own schema when:
- ≥10 shops in the chain (operational scale)
- OR enterprise contract requirement (SOC2 evidence)
- OR explicit Owner request + ability to pay the v1.5 schema-isolation tier

Graduation is a one-way migration; reverse-graduation is supported but discouraged.

### Cross-tenant intelligence — the privacy line

The "salons like yours" feature is the most ethically loaded thing we ship. The ADR boundaries:

**Default: OPT-IN.** Tenants explicitly opt in during onboarding (with a clear explanation). Opt-out is one click and immediate.

**Differential privacy with k≥10.** Insights are only published when ≥10 peer tenants contribute to the aggregate. Below k=10, the panel says "your peer-set is forming — insights begin once 10 salons like yours have opted in." This is the only honest stance.

**What never leaves the tenant.**
- Customer PII (names, contacts, history) — never.
- Staff PII (names, comp, performance) — never.
- Tenant-identifiable booking details — never.
- Free-text from any source — never (only categorical aggregates).
- Anything that could re-identify a small business — never.

**What may leave (only if opted in, only after k≥10 aggregation).**
- Service-mix percentages (cuts vs colour vs treatments).
- Capacity-utilisation curves (anonymised by hour-of-week, not date).
- No-show rate buckets.
- Average ticket size buckets.
- Drift-recovery rate buckets.

**Cross-tenant ADR auditability.** Every cross-tenant aggregate has a published computation spec. Owners (and auditors) can verify what's in the aggregate and what isn't. The audit log records every aggregate consumption.

### What this earns us

Cross-tenant intelligence becomes a category-defining feature *and* a privacy stance, not a privacy compromise. Owners trust the panel because they can verify what isn't in it.

### What we deferred

- **Tenant-managed encryption keys (BYOK).** v2 work; expect enterprise demand at chain ≥10 shops.
- **Cross-region tenant pinning.** v2 (Berlin tenants pinned to Frankfurt; Dublin tenants pinned to Dublin; etc.).

## Open questions

- Should the audit log live in the tenant schema or a central schema? (Leaning: central with hash-chained per-tenant partitions; ADR 0015 will resolve.)
