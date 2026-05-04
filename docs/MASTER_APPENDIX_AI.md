# Appendix — AI-native architecture (condensed)

**Principles:** Modular, observable, auditable, **constrained**, provider-agnostic where practical. AI is **not** the source of truth for bookings, payments, or permissions (see BLIQ_BUILD_PLAN Part A §10).

## Layers (target layout under `src/` when built)

1. **Shared infrastructure** — central client, retries, logging to `AIInteraction` + `Event`, prompt templates, safety wrappers.
2. **Product AI** — booking assistant, customer insights, risk/rebooking/service suggestions (assistive only in early tranches).
3. **Ops AI** — log summarization, incident narrative, anomaly hints, remediation *suggestions* (human approval before any action).

## Lifecycle (signals → knowledge)

1. Raw signals (bookings, errors, messages, AI calls).  
2. Structured `Event` rows.  
3. `AIObservation` / deterministic rollups.  
4. Serious issues → `Incident`.  
5. `RemediationAction` with approval flags.  
6. Durable `KnowledgeEntry` when patterns stabilize.

## Safety (MVP / v1)

**Allowed:** summarize, classify, recommend low-risk UX copy, draft owner-visible insights.  
**Not allowed:** auto-delete bookings, change prices, send unreviewed bulk comms, mutate tenancy without policy.

## Failure mode

If AI is down, **core booking and dashboard remain deterministic** — degrade AI panels only.

## Code placement (when implemented)

Prefer `src/lib/ai/*` and `src/services/ai/*` (or `src/ai/*` modules) behind one exported client; **no** ad-hoc OpenAI calls from route handlers.
