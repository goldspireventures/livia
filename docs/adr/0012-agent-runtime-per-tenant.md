# ADR 0012 — Agent runtime: per-tenant runtime instance

**Status:** Accepted (2026-05-07).
**Context:** F8 engineering blueprint.

## Context

Liv must deliver Rung 5 for P2b solo (the deepest persona bet) within year 1, and Rung 3–4 for P1/P2a Owners. Rung 5 demands persistent context that Liv carries across the day; cross-tenant isolation is non-negotiable; cost-per-tenant must fit the F9 pricing envelope.

Options considered:
1. **Single shared service** — cheapest at low scale; loads tenant context per request; cross-tenant isolation depends on application code being correct every time.
2. **Per-tenant runtime instance, sharded across a small fleet** — more expensive at low scale; structurally isolates tenants; persistent context is natural.
3. **Schema-per-tenant + shared runtime** — uneven trade-off; gets isolation without context.

## Decision

**Option 2.** Each tenant has a runtime instance keyed by `business_id`, lazily spun up, sharded across a small fleet. Active tenants in hot slots; idle tenants spill to warm cache; cold start ≤8s, warm start ≤2s.

LLM-down behaviour: graceful degrade per surface (callback for voice; "I'll have someone get back to you" for DM; explicit "Liv briefly offline" in cockpit). Hard-fail forbidden for any customer-facing surface.

Cost envelope tracked weekly per cell (P2b solo ≤€8/mo; P2a single-shop ≤€25; P1 3-shop ≤€120; P1 12-shop ≤€450; P7 customer touch ≤€0.20).

## Consequences

**Positive:** Rung 5 is structurally achievable; cross-tenant leakage is structurally prevented; replay-the-day-for-this-tenant is tractable; eval surface is per-tenant.

**Negative:** Higher fixed cost at low tenant count (mitigated by aggressive warm-cache spill); fleet management is non-trivial (mitigated by managed K8s + autoscaling).

**Deferred:** Multi-region active-active (v2); edge inference (v3); custom fine-tuning (v2 once golden data is sufficient).

## References

- `docs/engineering/agent-runtime.md`
- `docs/personas.md` v2
- ADR 0010 (multi-tenant + persona model)
