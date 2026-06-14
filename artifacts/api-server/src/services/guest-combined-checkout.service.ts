import { db, paymentIntentRecordsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import type { RetailCartItemInput } from "@workspace/policy";
import { getGuestBookingByToken } from "./booking-guest-access.service";
import { policiesFromBusiness } from "./policies.service";
import { computeDepositDueMinor } from "./guest-deposit-pay.service";
import { createPublicRetailOrder, createRetailOrderCheckout } from "./beauty-retail.service";
import { getStripe, isStripeConfigured, logStripeSkip, guestMaySimulatePayments } from "../lib/stripe";
import { createBookingPaymentIntent } from "./payment.service";
import { resolveGuestTokenUrl } from "../lib/guest-public-urls";
import { businessesTable } from "@workspace/db";

export type GuestCombinedCheckoutResult =
  | { mode: "stripe"; checkoutUrl: string; totalMinor: number; depositMinor: number; retailMinor: number }
  | { mode: "dev"; message: string; payUrl: string }
  | { mode: "error"; message: string };

/** One Stripe session for booking deposit + retail bag (same shop, same guest). */
export async function createGuestCombinedCheckout(args: {
  slug: string;
  payToken: string;
  items: RetailCartItemInput[];
  fulfillmentMode?: string | null;
  fulfillmentDetail?: string | null;
}): Promise<GuestCombinedCheckoutResult> {
  const view = await getGuestBookingByToken(args.slug, args.payToken);
  if (!view) return { mode: "error", message: "Booking not found" };

  const [biz] = await db
    .select()
    .from(businessesTable)
    .where(eq(businessesTable.id, view.businessId))
    .limit(1);
  if (!biz) return { mode: "error", message: "Shop not found" };

  const policies = policiesFromBusiness(biz);
  const depositDueMinor = computeDepositDueMinor({
    priceMinor: view.priceMinor,
    depositPercent: policies.operational.depositPercent ?? 0,
    depositRequired: policies.operational.depositRequired,
    depositPaidMinor: view.depositPaidEurCents,
  });

  const retailItems = args.items ?? [];
  if (depositDueMinor <= 0 && retailItems.length === 0) {
    return { mode: "error", message: "Nothing to pay" };
  }

  if (retailItems.length === 0) {
    const { createGuestDepositCheckout } = await import("./guest-deposit-pay.service");
    const dep = await createGuestDepositCheckout(args.slug, args.payToken);
    if (dep.mode === "stripe" && dep.checkoutUrl) {
      return {
        mode: "stripe",
        checkoutUrl: dep.checkoutUrl,
        totalMinor: depositDueMinor,
        depositMinor: depositDueMinor,
        retailMinor: 0,
      };
    }
    if (dep.mode === "dev") {
      return {
        mode: "dev",
        message: dep.message,
        payUrl: resolveGuestTokenUrl(args.slug, "pay", args.payToken),
      };
    }
    return { mode: "error", message: dep.mode === "error" ? dep.message : "Could not start checkout" };
  }

  const retailOrder = await createPublicRetailOrder({
    businessId: view.businessId,
    items: retailItems,
    customerId: view.customerId,
    bookingId: view.bookingId,
    guestName: view.customerFirstName ?? undefined,
    fulfillmentMode: args.fulfillmentMode,
    fulfillmentDetail: args.fulfillmentDetail,
  });
  if (!retailOrder) return { mode: "error", message: "Retail items unavailable" };

  const retailMinor = retailOrder.order.amountMinor;
  const totalMinor = depositDueMinor + retailMinor;
  const payUrl = resolveGuestTokenUrl(args.slug, "pay", args.payToken);

  if (depositDueMinor <= 0) {
    const only = await createRetailOrderCheckout(args.slug, retailOrder.payToken);
    if (only.mode === "stripe" && only.checkoutUrl) {
      return {
        mode: "stripe",
        checkoutUrl: only.checkoutUrl,
        totalMinor: retailMinor,
        depositMinor: 0,
        retailMinor,
      };
    }
    if (only.mode === "dev") {
      return { mode: "dev", message: only.message, payUrl: only.payUrl };
    }
    return { mode: "error", message: only.mode === "error" ? only.message : "Could not start checkout" };
  }

  const stripe = getStripe();
  if (!stripe || !isStripeConfigured()) {
    if (!guestMaySimulatePayments()) {
      return { mode: "error", message: "Card checkout is not available yet" };
    }
    logStripeSkip("guest-combined-checkout");
    const { applySimulatedGuestDeposit } = await import("./guest-deposit-pay.service");
    const { markRetailOrderPaid } = await import("./beauty-retail.service");
    if (depositDueMinor > 0) {
      await applySimulatedGuestDeposit({
        businessId: view.businessId,
        bookingId: view.bookingId,
        amountMinor: depositDueMinor,
      });
    }
    await markRetailOrderPaid(retailOrder.order.id, view.businessId);
    const { confirmBookingAfterStripePayment } = await import("./wellness-ops.service");
    await confirmBookingAfterStripePayment(view.businessId, view.bookingId);
    return {
      mode: "dev",
      message: "Deposit and bag recorded — your booking is updated.",
      payUrl,
    };
  }

  const lineViews = await import("./beauty-retail.service").then((m) =>
    m.resolveRetailOrderLines(retailOrder.order),
  );

  const stripeLineItems: Array<{
    price_data: { currency: string; unit_amount: number; product_data: { name: string; description?: string } };
    quantity: number;
  }> = [];

  if (depositDueMinor > 0) {
    stripeLineItems.push({
      price_data: {
        currency: view.currency.toLowerCase(),
        unit_amount: depositDueMinor,
        product_data: {
          name: `Deposit — ${view.serviceName}`,
          description: view.businessName,
        },
      },
      quantity: 1,
    });
  }

  for (const line of lineViews) {
    stripeLineItems.push({
      price_data: {
        currency: line.currency.toLowerCase(),
        unit_amount: line.unitPriceMinor,
        product_data: { name: line.productName, description: view.businessName },
      },
      quantity: line.quantity,
    });
  }

  const intent = await createBookingPaymentIntent({
    businessId: view.businessId,
    bookingId: view.bookingId,
    customerId: view.customerId,
    amountMinor: totalMinor,
    currency: view.currency,
    description: `Visit + take-home — ${view.serviceName}`,
    metadata: {
      kind: "guest_combined",
      retailOrderId: retailOrder.order.id,
      depositMinor: String(depositDueMinor),
      retailMinor: String(retailMinor),
    },
  });

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    line_items: stripeLineItems,
    payment_intent_data: {
      metadata: {
        businessId: view.businessId,
        bookingId: view.bookingId,
        customerId: view.customerId,
        paymentIntentRecordId: intent.paymentIntentRecordId,
        kind: "guest_combined",
        retailOrderId: retailOrder.order.id,
        depositMinor: String(depositDueMinor),
        retailMinor: String(retailMinor),
        guestPayToken: args.payToken,
      },
    },
    metadata: {
      businessId: view.businessId,
      bookingId: view.bookingId,
      kind: "guest_combined",
      retailOrderId: retailOrder.order.id,
      depositMinor: String(depositDueMinor),
      retailMinor: String(retailMinor),
      guestPayToken: args.payToken,
    },
    success_url: `${payUrl}?status=success&combined=1`,
    cancel_url: `${payUrl}?status=cancel`,
  });

  if (session.url) {
    await db
      .update(paymentIntentRecordsTable)
      .set({ checkoutUrl: session.url, updatedAt: new Date() })
      .where(eq(paymentIntentRecordsTable.id, intent.paymentIntentRecordId));
    return {
      mode: "stripe",
      checkoutUrl: session.url,
      totalMinor,
      depositMinor: depositDueMinor,
      retailMinor,
    };
  }

  return { mode: "error", message: "Could not start checkout" };
}
