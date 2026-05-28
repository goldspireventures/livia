import {
  db,
  businessesTable,
  bookingsTable,
  customersTable,
  servicesTable,
} from "@workspace/db";
import { and, eq, gte, lte } from "drizzle-orm";
import { getAvailableSlots } from "./slots.service";
import { findOrCreateCustomer } from "./customers.service";
import { createBooking } from "./bookings.service";
import { emitBookingCreated } from "../lib/booking-events";

export async function getPartnerBusinessBySlug(slug: string) {
  const [biz] = await db
    .select({
      id: businessesTable.id,
      name: businessesTable.name,
      slug: businessesTable.slug,
      timezone: businessesTable.timezone,
      vertical: businessesTable.vertical,
      country: businessesTable.country,
      currency: businessesTable.currency,
    })
    .from(businessesTable)
    .where(eq(businessesTable.slug, slug));
  return biz ?? null;
}

export async function listPartnerBookings(
  businessId: string,
  from: Date,
  to: Date,
): Promise<
  Array<{
    id: string;
    status: string;
    startAt: string;
    endAt: string;
    serviceId: string | null;
    staffId: string | null;
  }>
> {
  const rows = await db
    .select({
      id: bookingsTable.id,
      status: bookingsTable.status,
      startAt: bookingsTable.startAt,
      endAt: bookingsTable.endAt,
      serviceId: bookingsTable.serviceId,
      staffId: bookingsTable.staffId,
    })
    .from(bookingsTable)
    .where(
      and(
        eq(bookingsTable.businessId, businessId),
        gte(bookingsTable.startAt, from),
        lte(bookingsTable.startAt, to),
      ),
    );

  return rows.map((r) => ({
    id: r.id,
    status: r.status,
    startAt: r.startAt.toISOString(),
    endAt: r.endAt.toISOString(),
    serviceId: r.serviceId,
    staffId: r.staffId,
  }));
}

/** Partner-safe customer export — no email/phone (PII minimization). */
export async function listPartnerCustomers(businessId: string) {
  const rows = await db
    .select({
      id: customersTable.id,
      displayName: customersTable.displayName,
      customerTypology: customersTable.customerTypology,
      isBlocked: customersTable.isBlocked,
      createdAt: customersTable.createdAt,
    })
    .from(customersTable)
    .where(eq(customersTable.businessId, businessId));

  return rows.map((r) => ({
    id: r.id,
    displayName: r.displayName,
    customerTypology: r.customerTypology,
    isBlocked: r.isBlocked,
    createdAt: r.createdAt.toISOString(),
  }));
}

export async function listPartnerServices(businessId: string) {
  const rows = await db
    .select({
      id: servicesTable.id,
      name: servicesTable.name,
      durationMinutes: servicesTable.durationMinutes,
      priceMinor: servicesTable.priceMinor,
      currency: servicesTable.currency,
      isActive: servicesTable.isActive,
    })
    .from(servicesTable)
    .where(eq(servicesTable.businessId, businessId));

  return rows;
}

export async function listPartnerSlots(opts: {
  businessId: string;
  serviceId: string;
  date: string;
  staffId?: string;
  timezone: string;
}) {
  return getAvailableSlots(opts);
}

export async function createPartnerBooking(
  businessId: string,
  input: {
    serviceId: string;
    startAt: string;
    staffId?: string;
    customerFirstName: string;
    customerLastName?: string;
    customerEmail?: string;
    customerPhone?: string;
    notes?: string;
  },
) {
  const customer = await findOrCreateCustomer(businessId, {
    firstName: input.customerFirstName,
    lastName: input.customerLastName,
    email: input.customerEmail,
    phone: input.customerPhone,
  });
  const booking = await createBooking(businessId, {
    serviceId: input.serviceId,
    customerId: customer.id,
    staffId: input.staffId,
    startAt: input.startAt,
    channelType: "WEB",
    source: "partner-api",
    notes: input.notes,
  });
  await emitBookingCreated({
    id: booking.id,
    businessId: booking.businessId,
    customerId: booking.customerId,
    serviceId: booking.serviceId,
    staffId: booking.staffId,
    source: booking.source,
    sourceConversationId: booking.sourceConversationId,
    startAt: booking.startAt,
    status: booking.status,
  });
  return {
    bookingId: booking.id,
    status: booking.status,
    startAt: booking.startAt.toISOString(),
    endAt: booking.endAt.toISOString(),
  };
}
