import "server-only";

import type Stripe from "stripe";

import { LiviaEventTypes, logEvent } from "@/lib/events";
import { env } from "@/lib/env";
import { prisma } from "@/lib/prisma";
import { fanOutInAppAndPushToBusinessAdmins } from "@/services/notifications/notifyBusinessAdmins";
import { getStripeClient, mapStripePaymentIntentStatus } from "@/services/payments/stripeAdapter";

function webhookSecret(): string {
  if (!env.STRIPE_WEBHOOK_SECRET || env.STRIPE_WEBHOOK_SECRET.length === 0) {
    throw new Error("STRIPE_WEBHOOK_SECRET is not configured.");
  }
  return env.STRIPE_WEBHOOK_SECRET;
}

export function verifyStripeWebhookEvent(rawBody: string, signature: string | null): Stripe.Event {
  if (!signature) {
    throw new Error("Missing Stripe-Signature header.");
  }
  const stripe = getStripeClient();
  return stripe.webhooks.constructEvent(rawBody, signature, webhookSecret());
}

async function ensurePaymentRowForSucceededIntent({
  businessId,
  bookingId,
  paymentIntentRecordId,
  amountMinorUnits,
  currency,
}: {
  businessId: string;
  bookingId: string | null;
  paymentIntentRecordId: string;
  amountMinorUnits: number;
  currency: string;
}): Promise<boolean> {
  const existing = await prisma.payment.findFirst({
    where: {
      paymentIntentRecordId,
      status: "SUCCEEDED",
    },
    select: { id: true },
  });
  if (existing) return false;

  await prisma.payment.create({
    data: {
      businessId,
      bookingId,
      paymentIntentRecordId,
      amountMinorUnits,
      currency: currency.toUpperCase(),
      status: "SUCCEEDED",
      purpose: "BOOKING",
      occurredAt: new Date(),
    },
  });
  return true;
}

/**
 * Apply Stripe webhook events for PaymentIntents created by Livia.
 * Safe to replay (idempotent status / payment writes).
 */
export async function applyStripeWebhookEvent(event: Stripe.Event): Promise<void> {
  const relevant = new Set([
    "payment_intent.succeeded",
    "payment_intent.payment_failed",
    "payment_intent.canceled",
    "payment_intent.processing",
    "payment_intent.amount_capturable_updated",
  ]);
  if (!relevant.has(event.type)) {
    return;
  }

  const pi = event.data.object as Stripe.PaymentIntent;
  const externalId = pi.id;
  const recordId = pi.metadata?.liviaPaymentIntentRecordId;
  const businessIdMeta = pi.metadata?.businessId;

  let row =
    recordId && businessIdMeta
      ? await prisma.paymentIntentRecord.findFirst({
          where: { id: recordId, businessId: businessIdMeta, provider: "stripe" },
        })
      : null;

  if (!row) {
    row = await prisma.paymentIntentRecord.findFirst({
      where: { externalId, provider: "stripe" },
    });
  }

  if (!row) {
    await logEvent({
      type: LiviaEventTypes.STRIPE_WEBHOOK_UNKNOWN_INTENT,
      source: "system",
      level: "WARN",
      subjectType: "StripeEvent",
      subjectId: event.id,
      payload: { stripePaymentIntentId: externalId, eventType: event.type },
    });
    return;
  }

  let status = mapStripePaymentIntentStatus(pi.status);
  if (event.type === "payment_intent.payment_failed") {
    status = "FAILED";
  }

  const prevMeta =
    row.metadata && typeof row.metadata === "object" && row.metadata !== null
      ? (row.metadata as Record<string, unknown>)
      : {};

  await prisma.paymentIntentRecord.update({
    where: { id: row.id },
    data: {
      externalId,
      status,
      metadata: {
        ...prevMeta,
        stripeLastEventId: event.id,
        stripeLastEventType: event.type,
      },
    },
  });

  await logEvent({
    type: LiviaEventTypes.PAYMENT_INTENT_UPDATED,
    source: "system",
    businessId: row.businessId,
    subjectType: "PaymentIntentRecord",
    subjectId: row.id,
    payload: { source: "stripe_webhook", eventType: event.type, status },
  });

  if (status === "SUCCEEDED") {
    const created = await ensurePaymentRowForSucceededIntent({
      businessId: row.businessId,
      bookingId: row.bookingId,
      paymentIntentRecordId: row.id,
      amountMinorUnits: row.amountMinorUnits,
      currency: row.currency,
    });
    if (created) {
      const cur = row.currency.toUpperCase();
      const amountStr = (row.amountMinorUnits / 100).toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
      const href = row.bookingId ? `/b/${row.businessId}/bookings/${row.bookingId}` : `/b/${row.businessId}/bookings`;
      void fanOutInAppAndPushToBusinessAdmins({
        businessId: row.businessId,
        kind: "PAYMENT_SUCCEEDED",
        title: "Payment received",
        body: `${amountStr} ${cur} · Stripe intent succeeded.`,
        href,
        payload: {
          paymentIntentRecordId: row.id,
          bookingId: row.bookingId,
          amountMinorUnits: row.amountMinorUnits,
          currency: cur,
        },
        push: {
          title: "Payment received",
          body: `${amountStr} ${cur}`,
        },
      }).catch((err) => console.error("[PAYMENT_SUCCEEDED notify]", err));
    }
  }
}
