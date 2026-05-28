# Livia — 30-minute go-live checklist

> Goal: a repeatable script that yields a binary **GO / NO-GO** for real usage.

## 0) Preconditions (5 min)
- [ ] You have production env vars set (Stripe/Twilio/Meta/Clerk/DB).
- [ ] You know your production API base URL (e.g. `https://api.livia.app`).
- [ ] You have `INTERNAL_OPS_SECRET` for production operator checks.

## 1) Gates (5–8 min)
- [ ] `pnpm run typecheck`
- [ ] `node scripts/production-readiness-gate.mjs --api-base=<prodBase>`
- [ ] `node scripts/platform-truth-audit.mjs` (no failing checks; review “Known hollow”)

## 2) Provider wiring sanity (5 min)
### Stripe
- [ ] Stripe webhook endpoint is created and points to: `<prodBase>/api/billing/webhooks`
- [ ] Webhook secret configured in API: `STRIPE_WEBHOOK_SECRET`
- [ ] Events enabled at minimum:
  - `payment_intent.succeeded`
  - `payment_intent.payment_failed`
  - `payment_intent.canceled`
  - `charge.refunded`
  - (plus subscription events if you’re using plans)

### Twilio (SMS + Voice)
- [ ] SMS number(s) configured and can send outbound
- [ ] Voice webhook configured (incoming call):
  - `<prodBase>/api/channels/voice/inbound`
  - Status callback:
  - `<prodBase>/api/channels/voice/status`

### Meta (WhatsApp + IG + Messenger)
- [ ] Meta webhook configured:
  - `<prodBase>/api/channels/meta`
- [ ] `META_APP_SECRET` and `META_WEBHOOK_VERIFY_TOKEN` set
- [ ] `META_ACCESS_TOKEN` set (or `WHATSAPP_ACCESS_TOKEN`)
- [ ] Each production business has `messagingChannels.whatsapp.phoneNumberId` and/or IG/Messenger `pageId`

## 3) Live transactional test (10 min)
Do this once end-to-end on a real tenant you control.

### Booking → payment intent → payment succeed
- [ ] Create a booking (Dashboard or API)
- [ ] Create a payment intent:
  - `POST /api/businesses/:businessId/bookings/:bookingId/payment-intent { amountMinor }`
- [ ] Confirm Stripe shows the intent succeeded (or complete it from your payment UI)
- [ ] Verify ledger:
  - `GET /api/businesses/:businessId/bookings/:bookingId/payments`
  - Expect: one `payment_intent_records` row and one `payments` row
  - Booking `depositPaidEurCents` updated

### Partial refund
- [ ] Issue a partial refund via API:
  - `POST /api/businesses/:businessId/payments/:paymentId/refunds { amountMinor }`
- [ ] Verify webhook updates ledger:
  - refund row exists, payment status becomes `PARTIALLY_REFUNDED` (or `REFUNDED`)

## 4) Comms test (5 min)
- [ ] SMS outbound send succeeds for a real phone
- [ ] WhatsApp outbound send succeeds for a provisioned business (provider message id returned)
- [ ] IG and Messenger inbound messages create/append a conversation, and AI reply works (if enabled)

## 5) Operator view + rollback readiness (2 min)
- [ ] Internal monitoring overview loads:
  - `GET /api/internal/ops/monitoring/overview` (with ops headers)
  - Check `live.payments` + `live.providerDlqRecent`
- [ ] You can disable automation quickly (mandate rung down / disable AI handling) if needed

## Decision
- **GO** if every checkbox above is green.
- **NO-GO** if any gate fails, webhooks aren’t idempotent, or provider failures aren’t visible (DLQ/monitoring).

