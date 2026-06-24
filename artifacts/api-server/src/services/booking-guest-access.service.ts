import { randomBytes } from "node:crypto";
import {
  db,
  bookingGuestAccessTable,
  bookingsTable,
  businessesTable,
  customersTable,
  servicesTable,
  staffTable,
} from "@workspace/db";
import { and, eq } from "drizzle-orm";

export async function ensureBookingGuestAccess(
  businessId: string,
  bookingId: string,
): Promise<string> {
  const [existing] = await db
    .select({ token: bookingGuestAccessTable.token })
    .from(bookingGuestAccessTable)
    .where(eq(bookingGuestAccessTable.bookingId, bookingId))
    .limit(1);
  if (existing?.token) return existing.token;

  const token = randomBytes(18).toString("base64url");
  await db.insert(bookingGuestAccessTable).values({
    bookingId,
    businessId,
    token,
  });
  return token;
}

export type GuestBookingView = {
  bookingId: string;
  businessId: string;
  businessName: string;
  slug: string;
  vertical: string | null;
  status: string;
  pendingReason: string | null;
  startAt: Date;
  endAt: Date;
  serviceName: string;
  staffDisplayName: string | null;
  customerId: string;
  customerFirstName: string | null;
  currency: string;
  priceMinor: number;
  depositPaidEurCents: number;
  timezone: string;
  logoUrl: string | null;
};

export async function getGuestBookingByToken(
  slug: string,
  token: string,
): Promise<GuestBookingView | null> {
  const normalizedToken = token.trim();
  if (!normalizedToken) return null;
  const [row] = await db
    .select({
      bookingId: bookingsTable.id,
      businessId: bookingsTable.businessId,
      status: bookingsTable.status,
      pendingReason: bookingsTable.pendingReason,
      startAt: bookingsTable.startAt,
      endAt: bookingsTable.endAt,
      businessName: businessesTable.name,
      slug: businessesTable.slug,
      vertical: businessesTable.vertical,
      timezone: businessesTable.timezone,
      logoUrl: businessesTable.logoUrl,
      serviceName: servicesTable.name,
      priceMinor: servicesTable.priceMinor,
      currency: servicesTable.currency,
      depositPaidEurCents: bookingsTable.depositPaidEurCents,
      staffDisplayName: staffTable.displayName,
      customerId: customersTable.id,
      customerFirstName: customersTable.firstName,
      token: bookingGuestAccessTable.token,
    })
    .from(bookingGuestAccessTable)
    .innerJoin(bookingsTable, eq(bookingGuestAccessTable.bookingId, bookingsTable.id))
    .innerJoin(businessesTable, eq(bookingsTable.businessId, businessesTable.id))
    .innerJoin(servicesTable, eq(bookingsTable.serviceId, servicesTable.id))
    .innerJoin(customersTable, eq(bookingsTable.customerId, customersTable.id))
    .leftJoin(staffTable, eq(bookingsTable.staffId, staffTable.id))
    .where(
      and(eq(bookingGuestAccessTable.token, normalizedToken), eq(businessesTable.slug, slug)),
    )
    .limit(1);

  if (!row) return null;
  return {
    bookingId: row.bookingId,
    businessId: row.businessId,
    businessName: row.businessName,
    slug: row.slug,
    vertical: row.vertical,
    status: row.status,
    pendingReason: row.pendingReason,
    startAt: row.startAt,
    endAt: row.endAt,
    serviceName: row.serviceName,
    staffDisplayName: row.staffDisplayName,
    customerId: row.customerId,
    customerFirstName: row.customerFirstName,
    currency: row.currency,
    priceMinor: row.priceMinor,
    depositPaidEurCents: row.depositPaidEurCents,
    timezone: row.timezone,
    logoUrl: row.logoUrl,
  };
}
