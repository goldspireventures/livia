import "server-only";

import type { PaymentIntentStatus } from "@prisma/client";
import Stripe from "stripe";

import { env } from "@/lib/env";

export function isStripeSecretConfigured(): boolean {
  return Boolean(env.STRIPE_SECRET_KEY && env.STRIPE_SECRET_KEY.length > 0);
}

export function getStripeClient(): Stripe {
  if (!isStripeSecretConfigured()) {
    throw new Error("STRIPE_SECRET_KEY is not configured.");
  }
  return new Stripe(env.STRIPE_SECRET_KEY!, {
    typescript: true,
  });
}

/**
 * Map Stripe PaymentIntent.status to our `PaymentIntentStatus`.
 * @see https://stripe.com/docs/api/payment_intents/object
 */
export function mapStripePaymentIntentStatus(status: Stripe.PaymentIntent.Status): PaymentIntentStatus {
  switch (status) {
    case "requires_payment_method":
      return "CREATED";
    case "requires_confirmation":
    case "requires_action":
      return "REQUIRES_ACTION";
    case "processing":
      return "PROCESSING";
    case "succeeded":
      return "SUCCEEDED";
    case "canceled":
      return "CANCELED";
    default:
      return "FAILED";
  }
}

type CreateStripePaymentIntentArgs = {
  amountMinorUnits: number;
  currency: string;
  metadata: {
    bliqPaymentIntentRecordId: string;
    businessId: string;
    bookingId?: string | null;
  };
  idempotencyKey: string;
};

export async function createStripePaymentIntent({
  amountMinorUnits,
  currency,
  metadata,
  idempotencyKey,
}: CreateStripePaymentIntentArgs): Promise<Stripe.PaymentIntent> {
  const stripe = getStripeClient();
  const meta: Stripe.MetadataParam = {
    bliqPaymentIntentRecordId: metadata.bliqPaymentIntentRecordId,
    businessId: metadata.businessId,
  };
  if (metadata.bookingId) {
    meta.bookingId = metadata.bookingId;
  }

  return stripe.paymentIntents.create(
    {
      amount: amountMinorUnits,
      currency: currency.toLowerCase(),
      automatic_payment_methods: { enabled: true },
      metadata: meta,
    },
    { idempotencyKey },
  );
}
