import { getGuestBookingByToken } from "./booking-guest-access.service";
import { policiesFromBusiness } from "./policies.service";
import { createBookingPaymentIntent } from "./payment.service";
import { resolveGuestTokenUrl } from "../lib/guest-public-urls";
import { getStripe, isStripeConfigured, logStripeSkip, guestMaySimulatePayments } from "../lib/stripe";
import { db, bookingsTable, businessesTable } from "@workspace/db";
import { and, eq } from "drizzle-orm";
import { EventType } from "@workspace/db";
import { logEvent } from "./events.service";

export type GuestDepositPayView = {
  bookingId: string;
  businessName: string;
  slug: string;
  vertical: string | null;
  status: string;
  startAt: string;
  serviceName: string;
  staffDisplayName: string | null;
  customerFirstName: string | null;
  currency: string;
  priceMinor: number;
  depositPaidMinor: number;
  depositDueMinor: number;
  depositPercent: number;
  depositRequired: boolean;
  logoUrl: string | null;
  checkoutAvailable: boolean;
};

export function computeDepositDueMinor(args: {
  priceMinor: number;
  depositPercent: number;
  depositRequired: boolean;
  depositPaidMinor: number;
}): number {
  if (!args.depositRequired) return 0;
  const target = Math.round((args.priceMinor * args.depositPercent) / 100);
  return Math.max(0, target - args.depositPaidMinor);
}

export async function getGuestDepositPayView(
  slug: string,
  token: string,
): Promise<GuestDepositPayView | null> {
  const view = await getGuestBookingByToken(slug, token);
  if (!view) return null;

  const [biz] = await db
    .select()
    .from(businessesTable)
    .where(eq(businessesTable.id, view.businessId))
    .limit(1);
  if (!biz) return null;

  const policies = policiesFromBusiness(biz);
  const depositRequired = policies.operational.depositRequired;
  const depositPercent = policies.operational.depositPercent ?? 0;
  const depositDueMinor = computeDepositDueMinor({
    priceMinor: view.priceMinor,
    depositPercent,
    depositRequired,
    depositPaidMinor: view.depositPaidEurCents,
  });

  const canPay =
    depositDueMinor > 0 &&
    (isStripeConfigured() || guestMaySimulatePayments());

  return {
    bookingId: view.bookingId,
    businessName: view.businessName,
    slug: view.slug,
    vertical: view.vertical,
    status: view.status,
    startAt: view.startAt.toISOString(),
    serviceName: view.serviceName,
    staffDisplayName: view.staffDisplayName,
    customerFirstName: view.customerFirstName,
    currency: view.currency,
    priceMinor: view.priceMinor,
    depositPaidMinor: view.depositPaidEurCents,
    depositDueMinor,
    depositPercent,
    depositRequired,
    logoUrl: view.logoUrl,
    checkoutAvailable: canPay,
  };
}

export async function applySimulatedGuestDeposit(args: {
  businessId: string;
  bookingId: string;
  amountMinor: number;
}): Promise<void> {
  const [row] = await db
    .select({ depositPaidEurCents: bookingsTable.depositPaidEurCents })
    .from(bookingsTable)
    .where(
      and(eq(bookingsTable.id, args.bookingId), eq(bookingsTable.businessId, args.businessId)),
    )
    .limit(1);
  if (!row) return;

  const nextPaid = row.depositPaidEurCents + args.amountMinor;
  await db
    .update(bookingsTable)
    .set({ depositPaidEurCents: nextPaid, updatedAt: new Date() })
    .where(
      and(eq(bookingsTable.id, args.bookingId), eq(bookingsTable.businessId, args.businessId)),
    );

  await logEvent({
    businessId: args.businessId,
    type: EventType.PAYMENT_SUCCEEDED,
    entityType: "booking",
    entityId: args.bookingId,
    context: { simulated: true, amountMinor: args.amountMinor, guestDeposit: true },
  });
}

export type GuestDepositCheckoutResult =
  | { mode: "stripe"; checkoutUrl: string }
  | { mode: "dev"; message: string }
  | { mode: "error"; message: string };

/** Start Stripe Checkout or simulate deposit in non-production when Stripe is off. */
export async function createGuestDepositCheckout(
  slug: string,
  token: string,
): Promise<GuestDepositCheckoutResult> {
  const view = await getGuestBookingByToken(slug, token);
  if (!view) return { mode: "error", message: "Payment link not found" };

  const [biz] = await db
    .select()
    .from(businessesTable)
    .where(eq(businessesTable.id, view.businessId))
    .limit(1);
  if (!biz) return { mode: "error", message: "Shop not found" };

  const policies = policiesFromBusiness(biz);
  const depositPercent = policies.operational.depositPercent ?? 0;
  const depositDueMinor = computeDepositDueMinor({
    priceMinor: view.priceMinor,
    depositPercent,
    depositRequired: policies.operational.depositRequired,
    depositPaidMinor: view.depositPaidEurCents,
  });

  if (depositDueMinor <= 0) {
    return { mode: "error", message: "No deposit due on this booking" };
  }

  const stripe = getStripe();
  if (!stripe || !isStripeConfigured()) {
    if (!guestMaySimulatePayments()) {
      return { mode: "error", message: "Card checkout is not available yet" };
    }
    logStripeSkip("guest-deposit-checkout");
    await applySimulatedGuestDeposit({
      businessId: view.businessId,
      bookingId: view.bookingId,
      amountMinor: depositDueMinor,
    });
    const { confirmBookingAfterStripePayment } = await import("./wellness-ops.service");
    await confirmBookingAfterStripePayment(view.businessId, view.bookingId);
    return {
      mode: "dev",
      message: "Deposit recorded — your booking is updated.",
    };
  }

  const intent = await createBookingPaymentIntent({
    businessId: view.businessId,
    bookingId: view.bookingId,
    customerId: view.customerId,
    amountMinor: depositDueMinor,
    currency: view.currency,
    description: `Deposit — ${view.serviceName}`,
  });

  const returnPath = resolveGuestTokenUrl(slug, "pay", token);

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    line_items: [
      {
        price_data: {
          currency: view.currency.toLowerCase(),
          unit_amount: depositDueMinor,
          product_data: {
            name: `Deposit — ${view.serviceName}`,
            description: `${view.businessName} · ${view.startAt.toLocaleDateString("en-IE")}`,
          },
        },
        quantity: 1,
      },
    ],
    payment_intent_data: {
      metadata: {
        businessId: view.businessId,
        bookingId: view.bookingId,
        customerId: view.customerId,
        paymentIntentRecordId: intent.paymentIntentRecordId,
        kind: "guest_deposit",
        guestPayToken: token,
      },
    },
    metadata: {
      businessId: view.businessId,
      bookingId: view.bookingId,
      kind: "guest_deposit",
      guestPayToken: token,
    },
    success_url: `${returnPath}?status=success`,
    cancel_url: `${returnPath}?status=cancel`,
  });

  if (!session.url) {
    return { mode: "error", message: "Could not start checkout" };
  }

  return { mode: "stripe", checkoutUrl: session.url };
}
