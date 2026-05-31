import { getGuestBookingByToken } from "./booking-guest-access.service";
import { policiesFromBusiness } from "./policies.service";
import { db, businessesTable } from "@workspace/db";
import { eq } from "drizzle-orm";

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
  /** Stripe Checkout not wired in R2 — UI shows amount + policy copy. */
  checkoutAvailable: boolean;
};

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
  const depositDueMinor = depositRequired
    ? Math.max(0, Math.round((view.priceMinor * depositPercent) / 100) - view.depositPaidEurCents)
    : 0;

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
    checkoutAvailable: false,
  };
}
