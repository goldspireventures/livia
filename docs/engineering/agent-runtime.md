# Agent runtime

**Status:** F8 (2026-05-07). Companion to ADR 0012.

## The question

Where does Liv "live"? Single shared agent service, per-tenant runtime, or sharded? What happens when the LLM is down — graceful degrade or hard-fail? Cost-per-tenant-per-month envelope. Cold-start latency budget.

## The decision

**Per-tenant runtime instance, lazily spun up, sharded across a small fleet.** Captured in ADR 0012.

### Why

1. **Rung 5 demands persistent context.** Liv-for-Conor-the-barber has been with him through 100 Tuesdays; she remembers his Friday-cash-close ritual; she carries her morning briefing tone-of-voice consistently. A shared service that re-loads context per request can't earn Rung 5.
2. **Tenant isolation is non-negotiable.** Cross-tenant data leakage from a shared agent is a category-killing bug. Per-tenant runtime makes "did Liv leak across tenants?" a structurally impossible question.
3. **Cost.** A shared service is cheaper at low scale but more expensive at high scale (every request loads tenant context). Per-tenant runtime amortises tenant-context-load across that tenant's requests.
4. **Eval-ability.** Per-tenant runtime makes "replay the last 24h of decisions for this tenant" a tractable operation.

### How

- Each tenant has a runtime instance (a process or a hot pool slot) keyed by `business_id`.
- Cold start budget: ≤2s for a returning tenant (warm cache); ≤8s for a cold tenant (first-of-day).
- Active tenants live in hot slots; idle tenants spill to warm cache (S3-equivalent EU).
- Fleet sized to active-tenant peak + 20% headroom.

### LLM-down behaviour

**Graceful degrade, never silent fail.** Liv has a documented behaviour for LLM-down conditions:

- **Voice receptionist:** falls back to "Liv is briefly unavailable; press 1 to leave a message; we'll call you back within an hour" + creates a callback task in the workflow engine.
- **WhatsApp / SMS:** falls back to "I'll have someone get back to you shortly" + creates a human-handoff task.
- **Owner cockpit:** the briefing-card shows "Liv is briefly offline — your data is safe; check back in a few minutes" with an explicit timestamp.
- **Audit log:** the LLM-down event is logged. Owners can see it.

Hard-fail (returning a 500) is forbidden for any Liv-touching surface that customers see. We eat the latency, we eat the cost, we never break the customer's experience.

### Cost envelope

| Cell | Target unit cost (LLM + runtime, monthly) |
|---|---|
| P2b solo (Conor) | ≤€8 |
| P2a single-shop with manager | ≤€25 |
| P1 multi-shop chain (3 shops) | ≤€120 |
| P1 large chain (12 shops) | ≤€450 |
| P7 customer touch | ≤€0.20 |

Tracked weekly; reviewed monthly. Busts trigger an RFC.

## What this earns us

A runtime that can deliver Rung 5 *for the cells that need it*, without paying Rung-5 cost *for the cells that don't*. The category commitment ("operator-as-a-service") sits on this choice.

## What we deferred

- **Multi-region active-active.** v1 is single-region (Frankfurt) with Dublin warm standby. Multi-region active-active is v2 (when we open to UK).
- **Edge inference.** All inference is in-region; edge is v3 work.
- **Custom model fine-tuning.** v1 uses frontier models with prompting + RAG. Fine-tuning is v2 once we have enough golden data.

## Open questions

- How big is "small fleet"? Initial sizing pending design-partner load model.
- What's the hot-cold spill cost trade-off at 1000 tenants? Pending production data.
