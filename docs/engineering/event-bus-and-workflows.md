# Event bus & workflow engine

**Status:** F8 (2026-05-07). Companion to ADR 0013.

## The question

Cross-level workflows (refund ladder, time-off, hiring, escalation, owner-on-holiday handoff) need durable orchestration. Decision: Postgres-as-queue (cheapest), Inngest (managed), Temporal (heaviest), or NATS+custom.

## The decision

**Inngest for v1.** Captured in ADR 0013.

### Why

1. **Durable across LLM outages.** Workflows survive the runtime crashing, the LLM going down, and overnight gaps. Postgres-as-queue doesn't get us replay + retry semantics out of the box; we'd build them ourselves.
2. **Right-sized vs Temporal.** Temporal is excellent and we'd grow into it, but it's a meaningful operational burden in year 1. Inngest gives us 80% of Temporal's value with 10% of the operational cost.
3. **TypeScript-native.** Our stack is TS-first; Inngest is TS-first; cognitive load is low.
4. **EU-resident option.** Inngest supports EU-only execution (verified before commitment).
5. **Migration path.** If we outgrow Inngest, the workflow definitions are portable to Temporal with mechanical effort. Lock-in is acceptable.

### Workflows we run on it

| Workflow | Trigger | Steps | Durability requirement |
|---|---|---|---|
| Refund ladder | Customer requests refund | 5–8 steps depending on amount + cap | Days (Owner may take 24h to approve above-cap) |
| Time-off request | Staff submits | Manager review → owner approval if needed → calendar updates → rebook drafts | Days |
| Owner-on-holiday | Owner sets dates | Cap elevation → manager briefing → daily check-ins → handover-back | Weeks |
| No-show recovery | Booking time +15min, no-show | Charge deposit → soft-touch DM → waitlist offer → close | Hours |
| Hiring | Owner opens role | Job post → application gather → screening DM → interview slots → offer | Weeks |
| Weekly digest | Sunday 18:00 local | Aggregate week → draft → send → log read receipt | Hours |
| Drift detection | Weekly cron | Identify drift customers → score → propose owner-controlled re-engagement | Hours |
| Cross-tenant intelligence rollup | Nightly | Aggregate per peer-set → publish if k≥10 | Hours |

### Failure semantics

- Every step is idempotent.
- Every step has a max-retry of 5 with exponential backoff.
- After max-retry: workflow pauses; on-call gets paged; Owner sees "Liv is waiting on a fix" in the cockpit.
- No silent failure. Ever.

### Cost

Inngest pricing model fits our v1 envelope. Per-tenant cost amortises across all workflows; tracked weekly.

## What this earns us

Refund ladders that don't drop on the floor. Time-off requests that don't get lost. Owner-on-holiday handoffs that survive a Liv runtime restart. The "trust-amplification by default" principle has teeth here.

## Open questions

- Does Inngest's EU residency cover our compliance posture? (Verify before contract signature.)
- At what scale do we need self-hosted Temporal? (Estimate: ≥5k active tenants OR ≥3 enterprise customers requiring SOC2 evidence.)
