# Stripe (Phase 7)

## Environment

| Variable | When |
|----------|------|
| `STRIPE_SECRET_KEY` | Required to create Stripe PaymentIntents from `POST /api/businesses/[businessId]/payment-intents`. If unset, only local `PaymentIntentRecord` rows are created (Phase 6 behavior). |
| `STRIPE_WEBHOOK_SECRET` | Required for `POST /api/webhooks/stripe` signature verification. |

## Flow

1. **Owner/admin** calls tenant `POST .../payment-intents` with `actorUserId`, amount, currency. If Stripe is configured, a Stripe PaymentIntent is created and `externalId` + status are persisted.
2. **Stripe** sends lifecycle events to **`/api/webhooks/stripe`**. Bliq updates `PaymentIntentRecord` and inserts **`Payment`** on success.

## Local testing

```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

Use the signing secret the CLI prints as `STRIPE_WEBHOOK_SECRET` in `.env`.

## Notes

- Webhook endpoint is **global** (not under `/api/businesses/[businessId]/...`) because Stripe calls one URL per endpoint configuration.
- Unknown PaymentIntents (no matching Bliq row) log `STRIPE_WEBHOOK_UNKNOWN_INTENT`; the HTTP handler returns `{ received: true }` when the Stripe signature is valid so Stripe does not infinite-retry a payload you intentionally ignore.
