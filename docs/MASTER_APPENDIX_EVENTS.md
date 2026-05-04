# Appendix — event taxonomy

## Implemented (`src/lib/events.ts`)

Canonical string types live in **`BliqEventTypes`** — business, membership, staff, service, staff–service, customer, channel identity, booking, availability rules, time off, feature flags, payment intents, Stripe webhook unknown intent.

**Target / aspirational catalog:** [elite/BLIQ_EVENT_CATALOG.md](./elite/BLIQ_EVENT_CATALOG.md) — grow `BliqEventTypes` + `logEvent` usage toward that list over time.

## Future (master spec alignment)

When product needs them, extend **carefully** (migration of consumers + dashboards):

- Auth: `USER_SIGNED_UP`, `USER_SIGNED_IN`, …  
- Booking funnel: `BOOKING_ATTEMPTED`, `BOOKING_FAILED`, …  
- Notifications: `NOTIFICATION_SENT`, `NOTIFICATION_FAILED`, …  
- AI: `AI_REQUESTED`, `AI_RESPONSE`, `AI_ERROR`, `AI_OBSERVATION_CREATED`, …  
- Ops: `INCIDENT_CREATED`, `REMEDIATION_ACTION_CREATED`, …
- Stripe: `STRIPE_WEBHOOK_UNKNOWN_INTENT` (no matching `PaymentIntentRecord`)

## Rules

- `logEvent` must **never** throw the caller’s flow; payloads must stay **non-secret**.  
- Prefer **small JSON payloads**; reference ids, not full PII dumps.
