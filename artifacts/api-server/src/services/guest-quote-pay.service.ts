import { db, businessesTable, quotesTable, enquiriesTable } from "@workspace/db";
import { and, eq } from "drizzle-orm";
import { resolveQuoteMilestonePayment } from "@workspace/policy";
import { getStripe, isStripeConfigured, logStripeSkip } from "../lib/stripe";
import { getStagingRelaxations } from "../lib/staging-relaxations";
import { safeClientMessage } from "../lib/http-errors";
import { logger } from "../lib/logger";
import { createBookingPaymentIntent } from "./payment.service";
import { resolveGuestQuoteUrl } from "../lib/guest-public-urls";
import { EventType } from "@workspace/db";
import { logEvent } from "./events.service";
import { onBookingSecured } from "./event-vendor-lifecycle.service";

function guestQuotePayDevSimAllowed(): boolean {
  return process.env.NODE_ENV !== "production" || getStagingRelaxations().active;
}

export async function getGuestQuotePayView(slug: string, token: string) {
  const [biz] = await db
    .select()
    .from(businessesTable)
    .where(eq(businessesTable.slug, slug))
    .limit(1);
  if (!biz) return null;

  const [quote] = await db
    .select()
    .from(quotesTable)
    .where(and(eq(quotesTable.businessId, biz.id), eq(quotesTable.publicToken, token)))
    .limit(1);
  if (!quote) return null;

  const payment = resolveQuoteMilestonePayment(quote);
  const canPay =
    quote.status === "accepted" &&
    payment.nextDueMinor > 0 &&
    (isStripeConfigured() || guestQuotePayDevSimAllowed());

  return {
    businessName: biz.name,
    slug: biz.slug,
    quoteId: quote.id,
    status: quote.status,
    currency: biz.currency,
    subtotalMinor: quote.subtotalMinor,
    depositAmountMinor: quote.depositAmountMinor,
    depositPaidMinor: quote.depositPaidMinor,
    depositDueMinor: payment.nextDueMinor,
    nextPaymentLabel: payment.nextLabel,
    nextPaymentDueDate: payment.nextDueDate ?? null,
    dateSecured: payment.dateSecured,
    scheduleFullyPaid: payment.scheduleFullyPaid,
    milestones: payment.milestones,
    checkoutAvailable: canPay,
    logoUrl: biz.logoUrl,
    vertical: biz.vertical,
  };
}

export type GuestQuoteCheckoutResult =
  | { mode: "stripe"; checkoutUrl: string }
  | { mode: "dev"; message: string }
  | { mode: "error"; message: string };

async function recordGuestQuoteDevDeposit(
  quote: typeof quotesTable.$inferSelect,
  amountMinor: number,
): Promise<GuestQuoteCheckoutResult> {
  const result = await applyGuestQuoteDepositFromWebhook({
    businessId: quote.businessId,
    quoteId: quote.id,
    amountMinor,
  });

  if (!result.applied) {
    return { mode: "error", message: "No payment due" };
  }

  return {
    mode: "dev",
    message: result.scheduleFullyPaid
      ? "Payment received — your celebration is fully paid. Thank you!"
      : result.dateSecured
        ? "Payment recorded — your date is secured. Thank you!"
        : "Payment recorded — thank you!",
  };
}

export async function createGuestQuoteDepositCheckout(
  slug: string,
  token: string,
): Promise<GuestQuoteCheckoutResult> {
  const view = await getGuestQuotePayView(slug, token);
  if (!view) return { mode: "error", message: "Quote not found" };
  if (view.status !== "accepted") {
    return { mode: "error", message: "Accept the quote before paying" };
  }
  if (view.depositDueMinor <= 0) {
    return { mode: "error", message: "No payment due right now" };
  }

  const [quote] = await db
    .select()
    .from(quotesTable)
    .where(eq(quotesTable.id, view.quoteId))
    .limit(1);
  if (!quote) return { mode: "error", message: "Quote not found" };

  const devSim = guestQuotePayDevSimAllowed();

  if (!isStripeConfigured()) {
    if (!devSim) {
      return { mode: "error", message: "Card checkout is not available yet" };
    }
    logStripeSkip("guest-quote-deposit-checkout");
    return recordGuestQuoteDevDeposit(quote, view.depositDueMinor);
  }

  const stripe = getStripe();
  if (!stripe) {
    if (!devSim) return { mode: "error", message: "Card checkout is not available yet" };
    logStripeSkip("guest-quote-deposit-checkout");
    return recordGuestQuoteDevDeposit(quote, view.depositDueMinor);
  }

  try {
    const intent = await createBookingPaymentIntent({
      businessId: quote.businessId,
      bookingId: null,
      customerId: quote.customerId,
      amountMinor: view.depositDueMinor,
      currency: view.currency,
      description: `${view.nextPaymentLabel} — ${view.businessName}`,
      metadata: {
        quoteId: quote.id,
        kind: "guest_quote_deposit",
        quoteToken: token,
        milestoneLabel: view.nextPaymentLabel,
      },
    });

    const returnPath = resolveGuestQuoteUrl(slug, token);

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency: view.currency.toLowerCase(),
            unit_amount: view.depositDueMinor,
            product_data: {
              name: `${view.nextPaymentLabel} — ${view.businessName}`,
              description: "Event quote payment",
            },
          },
          quantity: 1,
        },
      ],
      payment_intent_data: {
        metadata: {
          businessId: quote.businessId,
          quoteId: quote.id,
          paymentIntentRecordId: intent.paymentIntentRecordId,
          kind: "guest_quote_deposit",
          quoteToken: token,
          milestoneLabel: view.nextPaymentLabel,
        },
      },
      metadata: {
        businessId: quote.businessId,
        quoteId: quote.id,
        kind: "guest_quote_deposit",
        quoteToken: token,
        milestoneLabel: view.nextPaymentLabel,
      },
      success_url: `${returnPath}?status=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${returnPath}?status=cancel`,
    });

    if (!session.url) return { mode: "error", message: "Could not start checkout" };
    return { mode: "stripe", checkoutUrl: session.url };
  } catch (err) {
    logger.warn({ err, slug, token }, "[guest-quote-pay] stripe checkout failed");
    if (devSim) {
      logStripeSkip("guest-quote-deposit-checkout-fallback");
      return recordGuestQuoteDevDeposit(quote, view.depositDueMinor);
    }
    return {
      mode: "error",
      message: safeClientMessage(err, "Could not start checkout"),
    };
  }
}

export type GuestQuoteDepositApplyResult =
  | { applied: true; depositPaidMinor: number; dateSecured: boolean; scheduleFullyPaid: boolean }
  | { applied: false; reason: "quote_not_found" | "already_paid" };

/** Idempotent — safe for webhook retries and checkout return confirm. */
export async function applyGuestQuoteDepositFromWebhook(args: {
  businessId: string;
  quoteId: string;
  amountMinor: number;
}): Promise<GuestQuoteDepositApplyResult> {
  const [quote] = await db
    .select()
    .from(quotesTable)
    .where(and(eq(quotesTable.id, args.quoteId), eq(quotesTable.businessId, args.businessId)))
    .limit(1);
  if (!quote) return { applied: false, reason: "quote_not_found" };

  const before = resolveQuoteMilestonePayment(quote);
  if (before.nextDueMinor <= 0) return { applied: false, reason: "already_paid" };

  const creditMinor = Math.min(args.amountMinor, before.nextDueMinor);
  const depositPaidMinor = quote.depositPaidMinor + creditMinor;
  const after = resolveQuoteMilestonePayment({ ...quote, depositPaidMinor });
  const wasSecured = before.dateSecured;

  await db
    .update(quotesTable)
    .set({
      depositPaidMinor,
      updatedAt: new Date(),
    })
    .where(eq(quotesTable.id, quote.id));

  if (!wasSecured && after.dateSecured && quote.enquiryId) {
    await db
      .update(enquiriesTable)
      .set({ status: "booked", updatedAt: new Date() })
      .where(eq(enquiriesTable.id, quote.enquiryId));
  }

  if (after.scheduleFullyPaid) {
    void onBookingSecured(args.businessId, args.quoteId).catch(() => undefined);
  }

  await logEvent({
    businessId: args.businessId,
    type: EventType.PAYMENT_SUCCEEDED,
    entityType: "quote",
    entityId: args.quoteId,
    context: {
      guestQuoteDeposit: true,
      amountMinor: creditMinor,
      milestoneLabel: before.nextLabel,
    },
  });

  return {
    applied: true,
    depositPaidMinor,
    dateSecured: after.dateSecured,
    scheduleFullyPaid: after.scheduleFullyPaid,
  };
}

export type GuestQuoteDepositConfirmResult =
  | { mode: "applied" | "already_paid" }
  | { mode: "pending" }
  | { mode: "error"; message: string };

/** Called from guest return URL — applies deposit if Stripe session is paid (webhook fallback). */
export async function confirmGuestQuoteDepositCheckout(
  slug: string,
  token: string,
  sessionId: string,
): Promise<GuestQuoteDepositConfirmResult> {
  const view = await getGuestQuotePayView(slug, token);
  if (!view) return { mode: "error", message: "Quote not found" };
  if (view.depositDueMinor <= 0) return { mode: "already_paid" };

  const stripe = getStripe();
  if (!stripe || !isStripeConfigured()) {
    return { mode: "pending" };
  }

  let session;
  try {
    session = await stripe.checkout.sessions.retrieve(sessionId);
  } catch (err) {
    logger.warn({ err, slug, token, sessionId }, "[guest-quote-pay] session retrieve failed");
    return { mode: "error", message: "Could not verify payment" };
  }

  if (session.payment_status !== "paid") {
    return { mode: "pending" };
  }
  if (session.metadata?.kind !== "guest_quote_deposit") {
    return { mode: "error", message: "Invalid checkout session" };
  }
  if (session.metadata.quoteToken !== token || session.metadata.quoteId !== view.quoteId) {
    return { mode: "error", message: "Checkout does not match this quote" };
  }

  const businessId = session.metadata.businessId;
  if (!businessId) return { mode: "error", message: "Invalid checkout session" };

  const amountMinor = session.amount_total ?? view.depositDueMinor;
  const result = await applyGuestQuoteDepositFromWebhook({
    businessId,
    quoteId: view.quoteId,
    amountMinor,
  });

  if (result.applied) return { mode: "applied" };
  if (result.reason === "already_paid") return { mode: "already_paid" };
  return { mode: "error", message: "Quote not found" };
}
