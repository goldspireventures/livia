# ADR 0017 — Observability: OpenTelemetry + Grafana Cloud (EU-managed) + PagerDuty

**Status:** Accepted (2026-05-07).
**Context:** F8 engineering blueprint.

## Context

Tracing, metrics, structured logs, status page, on-call rotation. Vendor-neutral instrumentation; EU-resident; right-sized for year 1; clean migration path if we outgrow it.

## Decision

- **Instrumentation:** OpenTelemetry across all services and packages.
- **Observability vendor:** Grafana Cloud (managed, EU-hosted) for metrics + traces + logs.
- **Paging:** PagerDuty primary; Slack secondary; phone tertiary.
- **Status page:** `status.livia.io` (Atlassian Statuspage). Per-surface granularity; honest historical incidents.
- **On-call:** every engineer ~1 week in 6 (year 1); EU business hours hot; off-hours only for SEV1/SEV2.
- **SLOs per surface** (booking page 99.95%, voice 99.9%, WhatsApp 99.9%, cockpit 99.5%, mobile 99.9%, audit log recent 99.5%, audit log archive 99%, cross-tenant rollup 99%). Breaches trigger automatic post-mortem RFC.
- **Severity classes** (SEV1 customer-facing down → 30min target; SEV2 owner-facing degraded → 4hr target; SEV3 internal → sprint).
- **Post-mortems:** every SEV1/SEV2 within 5 business days; blameless; lands as RFC in `docs/postmortems/`.

Cost envelope: ≤€1,200/mo at ≤500 tenants.

## Consequences

**Positive:** Trustworthy operational posture from day 1; vendor-neutral instrumentation makes future migration mechanical; status-page transparency reinforces trust-amplification brand.

**Negative:** Grafana Cloud cost grows with retention + cardinality (tracked); PagerDuty has its own EU-residency caveats (verified for our use).

**Deferred:** Self-hosted Grafana (gated by either ≥3000 tenants OR enterprise customer requiring full-stack data residency).

## References

- `docs/engineering/observability-and-on-call.md`
- `docs/engineering/principles.md`
