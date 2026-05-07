# Engineering blueprint — F8

**Status:** F8 (2026-05-07). Engineering choices flow from F3 depth-per-persona commitments and F6 switching aids. This directory + 6 new ADRs (0012–0017) is the spine.

## Why this exists

The risk this blueprint prevents: shipping beautiful one-off surfaces that drift apart, an agent runtime cobbled together per-feature, an AI layer with no eval harness, no on-call story, and a design system that's "Aurora-Midnight tokens + vibes." Six months in, every new feature would cost 3× because there's no spine.

F3 commits Liv to **Rung 5 for P2b solo (the deepest bet)** and **Rung 3–4 for P1/P2a Owners** within year 1. Rung 5 demands persistent context Liv carries across the day, durable workflow orchestration across days, and an eval framework that catches regressions before they ship. The architectural choices below are the cheapest credible ways to deliver that.

## Contents

- `principles.md` — async-first, documentation-first, kill-switch culture, the bar for new features.
- `code-organization.md` — monorepo layout principles + package boundaries + what's shared vs what's local.
- `agent-runtime.md` — sketch + ADR pointer (0012).
- `event-bus-and-workflows.md` — sketch + ADR pointer (0013).
- `multi-tenant-isolation.md` — sketch + ADR pointer (0014).
- `audit-log-physical-design.md` — sketch + ADR pointer (0015).
- `ai-eval-and-guardrails.md` — sketch + ADR pointer (0016).
- `observability-and-on-call.md` — sketch + ADR pointer (0017).
- `design-system.md` — type, motion, character, components, states.

## ADRs landed in this phase

- **ADR 0012** — Agent runtime: per-tenant runtime over single shared service.
- **ADR 0013** — Workflow engine: Inngest as v1 (managed; cheaper than Temporal; durable enough for refund-ladder + time-off + escalation).
- **ADR 0014** — Multi-tenant isolation: row-level by `business_id` for v1; schema-per-tenant for chains ≥10 shops at v1.5.
- **ADR 0015** — Audit log: append-only Postgres table, EU-resident, 7-year retention, hash-chained.
- **ADR 0016** — AI eval framework: golden datasets per persona + online evals from production traces + auto-rollback class.
- **ADR 0017** — Observability: OpenTelemetry + Grafana Cloud (managed), per-surface SLO budgets.

## Principles cascade

The blueprint earns the F7 category commitment ("operator-as-a-service for European appointment-based service businesses") only if engineering posture matches. The bar:

- Every persona's target rung is achievable on the runtime we choose.
- Every cross-level workflow (refund ladder, time-off, hiring, escalation, owner-on-holiday) is durable across LLM outages.
- Every Liv decision is auditable end-to-end.
- Every feature has a documented retire-condition (kill-switch culture).

## Out of scope

Building any of this. Each ADR enumerates the next-step task. Vendor selection beyond ADR-level rationale; cost forecasting (feeds F9).
