/**
 * Outbound payment providers (e.g. Stripe) must be called only from `src/services/payments/*`,
 * never from API routes or UI.
 *
 * Phase 7: `stripeAdapter.ts` creates Stripe PaymentIntents when `STRIPE_SECRET_KEY` is set;
 * `stripeWebhookService.ts` verifies `/api/webhooks/stripe` and updates `PaymentIntentRecord` + `Payment`.
 */

export type MoneyMinorUnits = {
  amountMinorUnits: number;
  currency: string;
};
