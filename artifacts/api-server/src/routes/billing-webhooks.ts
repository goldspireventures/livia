import { Router, type IRouter } from "express";
import type { Request, Response } from "express";
import Stripe from "stripe";
import { db, businessesTable, paymentsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { getStripe, planIdFromPriceId, stripeWebhookSecret } from "../lib/stripe";
import { syncBusinessPlanFromStripe, grantAddonBundle, markBillingOnboardingComplete } from "../services/billing.service";
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
        const bid = session.metadata?.businessId;
        const addonId = session.metadata?.addon;
        if (session.mode === "subscription" && bid && addonId) {
          await grantAddonBundle(bid, addonId);
        }
        if (
          session.mode === "subscription" &&
          session.subscription &&
          bid &&
          !addonId
        ) {
          const sub = await stripe.subscriptions.retrieve(session.subscription as string);
          await handleSubscription(sub);
        }
        if (session.mode === "payment" && session.metadata?.kind === "retail_order" && session.metadata.retailOrderId) {
          const { markRetailOrderPaid } = await import("../services/beauty-retail.service");
          await markRetailOrderPaid(session.metadata.retailOrderId, session.metadata.businessId);
        }
        if (session.mode === "payment" && session.metadata?.kind === "guest_combined") {
          const bid = session.metadata.businessId;
          const bookingId = session.metadata.bookingId;
          const retailOrderId = session.metadata.retailOrderId;
          const depositMinor = Math.max(0, Number(session.metadata.depositMinor ?? 0));
          if (bid && bookingId && depositMinor > 0) {
            const { db, bookingsTable } = await import("@workspace/db");
            const { eq, and } = await import("drizzle-orm");
            const [row] = await db
              .select({ depositPaidEurCents: bookingsTable.depositPaidEurCents })
              .from(bookingsTable)
              .where(and(eq(bookingsTable.id, bookingId), eq(bookingsTable.businessId, bid)))
              .limit(1);
            const nextPaid = (row?.depositPaidEurCents ?? 0) + depositMinor;
            await db
              .update(bookingsTable)
              .set({ depositPaidEurCents: nextPaid, updatedAt: new Date() })
              .where(and(eq(bookingsTable.id, bookingId), eq(bookingsTable.businessId, bid)));
          }
          if (retailOrderId) {
            const { markRetailOrderPaid } = await import("../services/beauty-retail.service");
            await markRetailOrderPaid(retailOrderId, bid);
          }
        }
        if (session.mode === "payment" && session.metadata?.kind === "guest_deposit") {
          const bid = session.metadata.businessId;
          const bookingId = session.metadata.bookingId;
          const token = session.metadata.guestPayToken;
          if (bid && bookingId && token && session.payment_intent) {
            const piId =
              typeof session.payment_intent === "string"
                ? session.payment_intent
                : session.payment_intent.id;
            const pi = await stripe.paymentIntents.retrieve(piId);
            await upsertPaymentFromStripeIntent(pi);
          }
        }
        if (session.mode === "payment" && session.metadata?.kind === "guest_balance") {
          const bid = session.metadata.businessId;
          const bookingId = session.metadata.bookingId;
          if (bid && bookingId && session.payment_intent) {
            const piId =
              typeof session.payment_intent === "string"
                ? session.payment_intent
                : session.payment_intent.id;
            const pi = await stripe.paymentIntents.retrieve(piId);
            await upsertPaymentFromStripeIntent(pi);
          }
        }
        if (session.mode === "payment" && session.metadata?.kind === "guest_quote_deposit") {
          const bid = session.metadata.businessId;
          const quoteId = session.metadata.quoteId;
          const amountMinor = session.amount_total ?? 0;
          if (bid && quoteId && amountMinor > 0) {
            const { applyGuestQuoteDepositFromWebhook } = await import(
              "../services/guest-quote-pay.service"
            );
            await applyGuestQuoteDepositFromWebhook({
              businessId: bid,
              quoteId,
              amountMinor,
            });
          }
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

  if (sub.metadata?.addon) {
    await grantAddonBundle(businessId, sub.metadata.addon);
    return;
  }

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

  if (sub.status === "active" || sub.status === "trialing") {
    await markBillingOnboardingComplete(businessId);
  }
}

export default router;
