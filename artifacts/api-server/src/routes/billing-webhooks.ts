import { Router, type IRouter } from "express";
import type { Request, Response } from "express";
import Stripe from "stripe";
import { db, businessesTable, paymentsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { getStripe, planIdFromPriceId, stripeWebhookSecret } from "../lib/stripe";
import { syncBusinessPlanFromStripe } from "../services/billing.service";
import { logger } from "../lib/logger";
import { redactObject } from "../lib/pii-redaction";
import { sendError } from "../lib/http-errors";
import { claimStripeEvent } from "../services/stripe-events.service";
import {
  applyStripeRefundEvent,
  upsertPaymentFromStripeIntent,
} from "../services/payment.service";

const router: IRouter = Router();

router.post("/", async (req: Request, res: Response): Promise<void> => {
  const stripe = getStripe();
  const secret = stripeWebhookSecret();
  if (!stripe || !secret) {
    sendError(res, req, 503, "Stripe webhooks not configured");
    return;
  }

  const sig = req.headers["stripe-signature"];
  if (typeof sig !== "string") {
    sendError(res, req, 400, "Missing stripe-signature");
    return;
  }

  const raw = req.body as Buffer;
  if (!Buffer.isBuffer(raw)) {
    sendError(res, req, 400, "Webhook requires raw body");
    return;
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(raw, sig, secret);
  } catch (err) {
    logger.warn({ err: redactObject(err) }, "Stripe webhook signature verification failed");
    sendError(res, req, 400, "Invalid signature");
    return;
  }

  const businessId =
    (event.data.object as { metadata?: { businessId?: string } }).metadata?.businessId ?? null;

  const isNew = await claimStripeEvent({
    eventId: event.id,
    type: event.type,
    livemode: event.livemode,
    businessId,
    payload: { type: event.type },
  });

  if (!isNew) {
    res.json({ received: true, duplicate: true });
    return;
  }

  try {
    switch (event.type) {
      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const sub = event.data.object as Stripe.Subscription;
        await handleSubscription(sub);
        break;
      }
      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        const bid = sub.metadata?.businessId;
        if (bid) {
          await db
            .update(businessesTable)
            .set({
              stripeSubscriptionStatus: "canceled",
              planId: "trial",
              entitlementDenylist: ["voice_receptionist"],
              updatedAt: new Date(),
            })
            .where(eq(businessesTable.id, bid));
        }
        break;
      }
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.mode === "subscription" && session.subscription && session.metadata?.businessId) {
          const sub = await stripe.subscriptions.retrieve(session.subscription as string);
          await handleSubscription(sub);
        }
        break;
      }
      case "payment_intent.succeeded":
      case "payment_intent.payment_failed":
      case "payment_intent.canceled": {
        const pi = event.data.object as Stripe.PaymentIntent;
        await upsertPaymentFromStripeIntent(pi);
        break;
      }
      case "charge.refunded": {
        const charge = event.data.object as Stripe.Charge;
        const refunds = charge.refunds?.data ?? [];
        for (const refund of refunds) {
          await applyStripeRefundEvent(refund);
        }
        break;
      }
      case "charge.dispute.created": {
        const dispute = event.data.object as Stripe.Dispute;
        const chargeId =
          typeof dispute.charge === "string" ? dispute.charge : dispute.charge?.id;
        if (chargeId) {
          await db
            .update(paymentsTable)
            .set({ status: "DISPUTED", updatedAt: new Date() })
            .where(eq(paymentsTable.providerChargeId, chargeId));
        }
        break;
      }
      default:
        break;
    }
    res.json({ received: true });
  } catch (err) {
    logger.error(
      { err: redactObject(err), type: event.type, eventId: event.id },
      "Stripe webhook handler failed",
    );
    sendError(res, req, 500, "Webhook handler failed");
  }
});

async function handleSubscription(sub: Stripe.Subscription): Promise<void> {
  const businessId = sub.metadata?.businessId;
  if (!businessId) return;

  const item = sub.items.data[0];
  const priceId = item?.price?.id;
  const planId =
    sub.metadata?.planId ??
    (priceId ? planIdFromPriceId(priceId) : null) ??
    "solo";

  const periodStart = new Date((sub.current_period_start ?? 0) * 1000);
  const customerId =
    typeof sub.customer === "string" ? sub.customer : sub.customer?.id ?? "";

  await syncBusinessPlanFromStripe({
    businessId,
    planId,
    stripeCustomerId: customerId,
    stripeSubscriptionId: sub.id,
    status: sub.status,
    billingPeriodStart: periodStart,
  });
}

export default router;
