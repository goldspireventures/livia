# ADR 0013 — Workflow engine: Inngest for v1

**Status:** Accepted (2026-05-07).
**Context:** F8 engineering blueprint.

## Context

Cross-level workflows (refund ladder, time-off, hiring, escalation, owner-on-holiday, no-show recovery, weekly digest, drift detection, cross-tenant rollup) need durable orchestration that survives LLM outages, runtime restarts, and overnight gaps.

Options considered:
1. **Postgres-as-queue** (cheapest; we'd build replay + retry semantics ourselves).
2. **Inngest** (managed; TS-native; EU residency option; right-sized for v1).
3. **Temporal** (industry standard; heaviest operational burden; v3 destination).
4. **NATS + custom orchestration** (flexible; high build cost).

## Decision

**Inngest for v1.** Workflow definitions are TS-native; portable to Temporal with mechanical effort if we outgrow Inngest.

Workflows: refund ladder, time-off, owner-on-holiday, no-show recovery, hiring, weekly digest, drift detection, cross-tenant intelligence rollup. Each step idempotent; max-retry 5 with exponential backoff; pause + on-call page after exhaustion. No silent failure.

EU residency verified before contract signature.

## Consequences

**Positive:** Refund ladders, time-off, holiday handoffs survive Liv runtime restarts; engineering team productivity stays high; migration path to Temporal is clean.

**Negative:** Vendor lock-in to Inngest's API surface (acceptable; portable). Cost scales with execution count (tracked).

**Deferred:** Temporal migration (gated by ≥5k active tenants OR enterprise SOC2 demand).

## References

- `docs/engineering/event-bus-and-workflows.md`
- `docs/workflows/`
