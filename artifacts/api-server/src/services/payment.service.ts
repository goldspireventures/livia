import Stripe from "stripe";
import {
  db,
  bookingsTable,
  paymentIntentRecordsTable,
  paymentsTable,
  refundsTable,
} from "@workspace/db";
import { and, eq, sql } from "drizzle-orm";
import { getStripe, isStripeConfigured, logStripeSkip } from "../lib/stripe";
import { generateId } from "../lib/id";
import { logger } from "../lib/logger";
import { logEvent } from "./events.service";
import { EventType } from "@workspace/db";
import { recordProviderDlq } from "./stripe-events.service";
import { withBoundedProviderRetry } from "../lib/provider-retry";

export class PaymentInvariantError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PaymentInvariantError";
  }
}

/** Pure helper — refund cannot exceed captured minus prior refunds. */
export function computeMaxRefundableMinor(capturedMinor: number, refundedMinor: number): number {
  return Math.max(0, capturedMinor - refundedMinor);
}

export function validateRefundAmount(args: {
  capturedMinor: number;
  alreadyRefundedMinor: number;
  requestedMinor: number;
}): void {
  if (args.requestedMinor <= 0) {
    throw new PaymentInvariantError("Refund amount must be positive");
  }
  const max = computeMaxRefundableMinor(args.capturedMinor, args.alreadyRefundedMinor);
  if (args.requestedMinor > max) {
    throw new PaymentInvariantError(
      `Refund ${args.requestedMinor} exceeds refundable ${max} (captured ${args.capturedMinor}, refunded ${args.alreadyRefundedMinor})`,
    );
  }
}

export async function getPaymentLedgerForBooking(businessId: string, bookingId: string) {
  const intents = await db
    .select()
    .from(paymentIntentRecordsTable)
    .where(
      and(
        eq(paymentIntentRecordsTable.businessId, businessId),
        eq(paymentIntentRecordsTable.bookingId, bookingId),
      ),
    );
  const paymentRows = await db
    .select()
    .from(paymentsTable)
    .where(
      and(eq(paymentsTable.businessId, businessId), eq(paymentsTable.bookingId, bookingId)),
    );
  const refundRows: Array<(typeof refundsTable.$inferSelect)> = [];
  for (const p of paymentRows) {
    const rows = await db.select().from(refundsTable).where(eq(refundsTable.paymentId, p.id));
    refundRows.push(...rows);
  }
  return { intents, payments: paymentRows, refunds: refundRows };
}

export async function createBookingPaymentIntent(args: {
  businessId: string;
  bookingId: string;
  customerId?: string | null;
  amountMinor: number;
  currency?: string;
  description?: string;
}): Promise<{
  paymentIntentRecordId: string;
  clientSecret: string | null;
  checkoutUrl: string | null;
  providerPaymentIntentId: string | null;
  status: string;
}> {
  if (args.amountMinor <= 0) {
    throw new PaymentInvariantError("Payment amount must be positive");
  }

  const currency = (args.currency ?? "EUR").toUpperCase();
  const recordId = generateId();
  const stripe = getStripe();

  if (!stripe || !isStripeConfigured()) {
    logStripeSkip("createBookingPaymentIntent");
    await db.insert(paymentIntentRecordsTable).values({
      id: recordId,
      businessId: args.businessId,
      customerId: args.customerId ?? null,
      bookingId: args.bookingId,
      amountMinor: args.amountMinor,
      currency,
      status: "PENDING",
      metadata: { simulated: true, description: args.description ?? null },
    });
    await logEvent({
      businessId: args.businessId,
      type: EventType.PAYMENT_INTENT_CREATED,
      entityType: "booking",
      entityId: args.bookingId,
      context: { paymentIntentRecordId: recordId, simulated: true, amountMinor: args.amountMinor },
    });
    return {
      paymentIntentRecordId: recordId,
      clientSecret: null,
      checkoutUrl: null,
      providerPaymentIntentId: null,
      status: "PENDING",
    };
  }

  let pi: Stripe.PaymentIntent;
  try {
    pi = await withBoundedProviderRetry(
      "stripe",
      "paymentIntents.create",
      args.businessId,
      () =>
        stripe.paymentIntents.create({
          amount: args.amountMinor,
          currency: currency.toLowerCase(),
          metadata: {
            businessId: args.businessId,
            bookingId: args.bookingId,
            customerId: args.customerId ?? "",
            paymentIntentRecordId: recordId,
          },
          description: args.description ?? `Booking ${args.bookingId}`,
          automatic_payment_methods: { enabled: true },
        }),
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    await recordProviderDlq({
      provider: "stripe",
      operation: "paymentIntents.create",
      businessId: args.businessId,
      payload: { bookingId: args.bookingId, amountMinor: args.amountMinor },
      error: msg,
    });
    throw err;
  }

  await db.insert(paymentIntentRecordsTable).values({
    id: recordId,
    businessId: args.businessId,
    customerId: args.customerId ?? null,
    bookingId: args.bookingId,
    providerPaymentIntentId: pi.id,
    amountMinor: args.amountMinor,
    currency,
    status: mapStripePiStatus(pi.status),
    metadata: { stripeStatus: pi.status },
  });

  await logEvent({
    businessId: args.businessId,
    type: EventType.PAYMENT_INTENT_CREATED,
    entityType: "booking",
    entityId: args.bookingId,
    context: {
      paymentIntentRecordId: recordId,
      providerPaymentIntentId: pi.id,
      amountMinor: args.amountMinor,
    },
  });

  return {
    paymentIntentRecordId: recordId,
    clientSecret: pi.client_secret,
    checkoutUrl: null,
    providerPaymentIntentId: pi.id,
    status: mapStripePiStatus(pi.status),
  };
}

function mapStripePiStatus(status: Stripe.PaymentIntent.Status): "PENDING" | "REQUIRES_ACTION" | "PROCESSING" | "SUCCEEDED" | "FAILED" | "CANCELLED" {
  switch (status) {
    case "requires_payment_method":
    case "requires_confirmation":
      return "PENDING";
    case "requires_action":
      return "REQUIRES_ACTION";
    case "processing":
      return "PROCESSING";
    case "succeeded":
      return "SUCCEEDED";
    case "canceled":
      return "CANCELLED";
    default:
      return "FAILED";
  }
}

export async function upsertPaymentFromStripeIntent(
  pi: Stripe.PaymentIntent,
): Promise<{ paymentId: string | null; businessId: string | null }> {
  const businessId = pi.metadata?.businessId ?? null;
  const bookingId = pi.metadata?.bookingId ?? null;
  const recordId = pi.metadata?.paymentIntentRecordId ?? null;

  if (recordId) {
    await db
      .update(paymentIntentRecordsTable)
      .set({
        status: mapStripePiStatus(pi.status),
        providerPaymentIntentId: pi.id,
        updatedAt: new Date(),
      })
      .where(eq(paymentIntentRecordsTable.id, recordId));
  } else if (businessId && bookingId) {
    const existing = await db
      .select()
      .from(paymentIntentRecordsTable)
      .where(eq(paymentIntentRecordsTable.providerPaymentIntentId, pi.id))
      .limit(1);
    if (!existing[0]) {
      await db.insert(paymentIntentRecordsTable).values({
        id: generateId(),
        businessId,
        bookingId,
        providerPaymentIntentId: pi.id,
        amountMinor: pi.amount,
        currency: pi.currency.toUpperCase(),
        status: mapStripePiStatus(pi.status),
      });
    }
  }

  if (pi.status !== "succeeded") {
    if (pi.status === "canceled" || pi.status === "requires_payment_method") {
      await logEvent({
        businessId,
        type: EventType.PAYMENT_FAILED,
        entityType: "booking",
        entityId: bookingId,
        context: { providerPaymentIntentId: pi.id, status: pi.status },
      });
    }
    return { paymentId: null, businessId };
  }

  const chargeId =
    typeof pi.latest_charge === "string"
      ? pi.latest_charge
      : pi.latest_charge?.id ?? null;

  const [existingPayment] = chargeId
    ? await db
        .select()
        .from(paymentsTable)
        .where(eq(paymentsTable.providerChargeId, chargeId))
        .limit(1)
    : [];

  if (existingPayment) {
    return { paymentId: existingPayment.id, businessId: existingPayment.businessId };
  }

  const intentRecord = recordId
    ? (
        await db
          .select()
          .from(paymentIntentRecordsTable)
          .where(eq(paymentIntentRecordsTable.id, recordId))
          .limit(1)
      )[0]
    : (
        await db
          .select()
          .from(paymentIntentRecordsTable)
          .where(eq(paymentIntentRecordsTable.providerPaymentIntentId, pi.id))
          .limit(1)
      )[0];

  const paymentId = generateId();
  await db.insert(paymentsTable).values({
    id: paymentId,
    businessId: businessId ?? intentRecord?.businessId ?? null,
    customerId: intentRecord?.customerId ?? null,
    bookingId: bookingId ?? intentRecord?.bookingId ?? null,
    paymentIntentId: intentRecord?.id ?? recordId,
    providerChargeId: chargeId,
    amountMinor: pi.amount_received || pi.amount,
    currency: pi.currency.toUpperCase(),
    status: "SUCCEEDED",
    paidAt: new Date(),
    metadata: { providerPaymentIntentId: pi.id },
  });

  if (bookingId && businessId) {
    await db
      .update(bookingsTable)
      .set({
        depositPaidEurCents: pi.amount_received || pi.amount,
        updatedAt: new Date(),
      })
      .where(and(eq(bookingsTable.id, bookingId), eq(bookingsTable.businessId, businessId)));
  }

  await logEvent({
    businessId,
    type: EventType.PAYMENT_SUCCEEDED,
    entityType: "booking",
    entityId: bookingId,
    context: {
      paymentId,
      providerPaymentIntentId: pi.id,
      amountMinor: pi.amount_received || pi.amount,
    },
  });

  return { paymentId, businessId };
}

export async function applyStripeRefundEvent(refund: Stripe.Refund): Promise<void> {
  const chargeId =
    typeof refund.charge === "string" ? refund.charge : refund.charge?.id ?? null;
  if (!chargeId) return;

  const [payment] = await db
    .select()
    .from(paymentsTable)
    .where(eq(paymentsTable.providerChargeId, chargeId))
    .limit(1);
  if (!payment) {
    logger.warn({ chargeId, refundId: refund.id }, "Stripe refund for unknown charge");
    return;
  }

  const [existing] = await db
    .select()
    .from(refundsTable)
    .where(eq(refundsTable.providerRefundId, refund.id))
    .limit(1);
  if (existing) return;

  const refundId = generateId();
  await db.insert(refundsTable).values({
    id: refundId,
    businessId: payment.businessId!,
    paymentId: payment.id,
    bookingId: payment.bookingId,
    providerRefundId: refund.id,
    amountMinor: refund.amount ?? 0,
    currency: (refund.currency ?? payment.currency).toUpperCase(),
    reason: refund.reason ?? null,
    status: refund.status === "succeeded" ? "SUCCEEDED" : refund.status === "failed" ? "FAILED" : "PENDING",
  });

  const [{ totalRefunded }] = await db
    .select({ totalRefunded: sql<number>`coalesce(sum(${refundsTable.amountMinor}), 0)::int` })
    .from(refundsTable)
    .where(and(eq(refundsTable.paymentId, payment.id), eq(refundsTable.status, "SUCCEEDED")));

  const newStatus =
    totalRefunded >= payment.amountMinor
      ? "REFUNDED"
      : totalRefunded > 0
        ? "PARTIALLY_REFUNDED"
        : payment.status;

  await db
    .update(paymentsTable)
    .set({ status: newStatus, updatedAt: new Date() })
    .where(eq(paymentsTable.id, payment.id));

  if (payment.bookingId && payment.businessId && totalRefunded >= payment.amountMinor) {
    await db
      .update(bookingsTable)
      .set({ depositPaidEurCents: 0, updatedAt: new Date() })
      .where(
        and(
          eq(bookingsTable.id, payment.bookingId),
          eq(bookingsTable.businessId, payment.businessId),
        ),
      );
  }
}

export async function issueRefundForPayment(args: {
  businessId: string;
  paymentId: string;
  amountMinor: number;
  reason?: string;
  bookingId?: string | null;
}): Promise<{ refundId: string; status: string; providerRefundId: string | null }> {
  const [payment] = await db
    .select()
    .from(paymentsTable)
    .where(and(eq(paymentsTable.id, args.paymentId), eq(paymentsTable.businessId, args.businessId)))
    .limit(1);

  if (!payment) throw new PaymentInvariantError("Payment not found");
  if (payment.status !== "SUCCEEDED" && payment.status !== "PARTIALLY_REFUNDED") {
    throw new PaymentInvariantError(`Payment status ${payment.status} is not refundable`);
  }

  const [{ refunded }] = await db
    .select({ refunded: sql<number>`coalesce(sum(${refundsTable.amountMinor}), 0)::int` })
    .from(refundsTable)
    .where(
      and(
        eq(refundsTable.paymentId, payment.id),
        eq(refundsTable.status, "SUCCEEDED"),
      ),
    );

  validateRefundAmount({
    capturedMinor: payment.amountMinor,
    alreadyRefundedMinor: refunded,
    requestedMinor: args.amountMinor,
  });

  const refundId = generateId();
  const stripe = getStripe();

  if (!stripe || !payment.providerChargeId) {
    await db.insert(refundsTable).values({
      id: refundId,
      businessId: args.businessId,
      paymentId: payment.id,
      bookingId: args.bookingId ?? payment.bookingId,
      amountMinor: args.amountMinor,
      currency: payment.currency,
      reason: args.reason ?? null,
      status: "SUCCEEDED",
      providerRefundId: `demo-refund-${refundId.slice(-8)}`,
    });
    await syncPaymentRefundStatus(payment.id);
    return { refundId, status: "SUCCEEDED", providerRefundId: null };
  }

  await db.insert(refundsTable).values({
    id: refundId,
    businessId: args.businessId,
    paymentId: payment.id,
    bookingId: args.bookingId ?? payment.bookingId,
    amountMinor: args.amountMinor,
    currency: payment.currency,
    reason: args.reason ?? null,
    status: "PENDING",
  });

  let stripeRefund: Stripe.Refund;
  try {
    stripeRefund = await withBoundedProviderRetry(
      "stripe",
      "refunds.create",
      args.businessId,
      () =>
        stripe.refunds.create({
          charge: payment.providerChargeId!,
          amount: args.amountMinor,
          metadata: {
            businessId: args.businessId,
            paymentId: payment.id,
            refundRecordId: refundId,
          },
          reason: args.reason ? "requested_by_customer" : undefined,
        }),
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    await db
      .update(refundsTable)
      .set({ status: "FAILED", updatedAt: new Date() })
      .where(eq(refundsTable.id, refundId));
    await recordProviderDlq({
      provider: "stripe",
      operation: "refunds.create",
      businessId: args.businessId,
      payload: { paymentId: payment.id, amountMinor: args.amountMinor },
      error: msg,
    });
    throw err;
  }

  await db
    .update(refundsTable)
    .set({
      providerRefundId: stripeRefund.id,
      status: stripeRefund.status === "succeeded" ? "SUCCEEDED" : "PENDING",
      updatedAt: new Date(),
    })
    .where(eq(refundsTable.id, refundId));

  if (stripeRefund.status === "succeeded") {
    await syncPaymentRefundStatus(payment.id);
  }

  return {
    refundId,
    status: stripeRefund.status === "succeeded" ? "SUCCEEDED" : "PENDING",
    providerRefundId: stripeRefund.id,
  };
}

async function syncPaymentRefundStatus(paymentId: string): Promise<void> {
  const [payment] = await db.select().from(paymentsTable).where(eq(paymentsTable.id, paymentId)).limit(1);
  if (!payment) return;

  const [{ totalRefunded }] = await db
    .select({ totalRefunded: sql<number>`coalesce(sum(${refundsTable.amountMinor}), 0)::int` })
    .from(refundsTable)
    .where(and(eq(refundsTable.paymentId, paymentId), eq(refundsTable.status, "SUCCEEDED")));

  const newStatus =
    totalRefunded >= payment.amountMinor
      ? "REFUNDED"
      : totalRefunded > 0
        ? "PARTIALLY_REFUNDED"
        : payment.status;

  await db
    .update(paymentsTable)
    .set({ status: newStatus, updatedAt: new Date() })
    .where(eq(paymentsTable.id, paymentId));
}

export async function getPaymentOpsSummary() {
  // TODO: add time-windowed queries; keep simple counts for now.
  const [pendingRefunds, failedPayments, stuckIntents] = await Promise.all([
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(refundsTable)
      .where(eq(refundsTable.status, "PENDING")),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(paymentsTable)
      .where(eq(paymentsTable.status, "FAILED")),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(paymentIntentRecordsTable)
      .where(
        and(
          eq(paymentIntentRecordsTable.status, "PENDING"),
          sql`${paymentIntentRecordsTable.createdAt} < ${new Date(Date.now() - 24 * 60 * 60 * 1000)}`,
        ),
      ),
  ]);

  return {
    pendingRefunds: pendingRefunds[0]?.count ?? 0,
    failedPayments: failedPayments[0]?.count ?? 0,
    stuckPaymentIntents: stuckIntents[0]?.count ?? 0,
    stripeConfigured: isStripeConfigured(),
  };
}
