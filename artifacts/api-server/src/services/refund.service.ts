import { db, refundLedgerTable } from "@workspace/db";
import { generateId } from "../lib/id";
import {
  getPaymentLedgerForBooking,
  issueRefundForPayment,
  PaymentInvariantError,
} from "./payment.service";

/** Record a refund — uses Stripe ledger when configured; simulated ledger in dev/demo. */
export async function processRefund(args: {
  businessId: string;
  bookingId?: string | null;
  conversationId?: string | null;
  proposalId?: string | null;
  amountMinor: number;
  reason?: string;
}): Promise<{ id: string; status: string; providerRef: string | null }> {
  const stripeConfigured = !!process.env["STRIPE_SECRET_KEY"];

  if (args.bookingId && stripeConfigured) {
    const ledger = await getPaymentLedgerForBooking(args.businessId, args.bookingId);
    const payment = ledger.payments.find(
      (p) => p.status === "SUCCEEDED" || p.status === "PARTIALLY_REFUNDED",
    );
    if (payment) {
      try {
        const result = await issueRefundForPayment({
          businessId: args.businessId,
          paymentId: payment.id,
          amountMinor: args.amountMinor,
          reason: args.reason,
          bookingId: args.bookingId,
        });
        await db.insert(refundLedgerTable).values({
          id: generateId(),
          businessId: args.businessId,
          bookingId: args.bookingId ?? null,
          conversationId: args.conversationId ?? null,
          proposalId: args.proposalId ?? null,
          amountMinor: args.amountMinor,
          status: result.status === "SUCCEEDED" ? "processed" : "pending",
          providerRef: result.providerRefundId,
          metadata: args.reason ? { reason: args.reason } : null,
        });
        return {
          id: result.refundId,
          status: result.status.toLowerCase(),
          providerRef: result.providerRefundId,
        };
      } catch (err) {
        if (err instanceof PaymentInvariantError) {
          // Fall through to legacy ledger when invariants fail (e.g. no capture yet)
        } else {
          throw err;
        }
      }
    }
  }

  const id = generateId();
  const providerRef = stripeConfigured ? null : `demo-refund-${id.slice(-8)}`;
  const status = stripeConfigured ? "pending" : "processed";

  await db.insert(refundLedgerTable).values({
    id,
    businessId: args.businessId,
    bookingId: args.bookingId ?? null,
    conversationId: args.conversationId ?? null,
    proposalId: args.proposalId ?? null,
    amountMinor: args.amountMinor,
    status,
    providerRef,
    metadata: args.reason ? { reason: args.reason } : null,
  });

  return { id, status, providerRef };
}
