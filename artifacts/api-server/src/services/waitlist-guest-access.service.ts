import {
  db,
  businessesTable,
  bookingsTable,
  servicesTable,
  slotWaitlistEntriesTable,
  customersTable,
} from "@workspace/db";
import { and, eq } from "drizzle-orm";
import { createBooking, getBookingById } from "./bookings.service";
import { publishDomainEvent } from "../lib/domain-events";

export type GuestWaitlistOfferView = {
  entryId: string;
  businessId: string;
  businessName: string;
  slug: string;
  vertical: string | null;
  status: string;
  serviceName: string | null;
  startAt: string | null;
  expiresAt: string | null;
  logoUrl: string | null;
  customerFirstName: string | null;
};

export async function getGuestWaitlistOfferByToken(
  slug: string,
  token: string,
): Promise<GuestWaitlistOfferView | null> {
  const [row] = await db
    .select({
      entryId: slotWaitlistEntriesTable.id,
      businessId: slotWaitlistEntriesTable.businessId,
      status: slotWaitlistEntriesTable.status,
      expiresAt: slotWaitlistEntriesTable.expiresAt,
      offeredBookingId: slotWaitlistEntriesTable.offeredBookingId,
      businessName: businessesTable.name,
      slug: businessesTable.slug,
      vertical: businessesTable.vertical,
      logoUrl: businessesTable.logoUrl,
      serviceName: servicesTable.name,
      customerFirstName: customersTable.firstName,
      bookingStartAt: bookingsTable.startAt,
    })
    .from(slotWaitlistEntriesTable)
    .innerJoin(businessesTable, eq(slotWaitlistEntriesTable.businessId, businessesTable.id))
    .leftJoin(servicesTable, eq(slotWaitlistEntriesTable.serviceId, servicesTable.id))
    .leftJoin(customersTable, eq(slotWaitlistEntriesTable.customerId, customersTable.id))
    .leftJoin(bookingsTable, eq(slotWaitlistEntriesTable.offeredBookingId, bookingsTable.id))
    .where(
      and(
        eq(slotWaitlistEntriesTable.offerToken, token),
        eq(businessesTable.slug, slug),
      ),
    )
    .limit(1);

  if (!row) return null;
  return {
    entryId: row.entryId,
    businessId: row.businessId,
    businessName: row.businessName,
    slug: row.slug,
    vertical: row.vertical,
    status: row.status,
    serviceName: row.serviceName,
    startAt: row.bookingStartAt ? new Date(row.bookingStartAt).toISOString() : null,
    expiresAt: row.expiresAt ? new Date(row.expiresAt).toISOString() : null,
    logoUrl: row.logoUrl,
    customerFirstName: row.customerFirstName,
  };
}

export async function acceptGuestWaitlistOfferByToken(
  slug: string,
  token: string,
): Promise<{ ok: true; bookingId: string; message: string } | { ok: false; error: string }> {
  const offer = await getGuestWaitlistOfferByToken(slug, token);
  if (!offer) return { ok: false, error: "not_found" };

  if (offer.status !== "offered") {
    return { ok: false, error: offer.status === "accepted" ? "already_accepted" : "not_available" };
  }

  if (offer.expiresAt && new Date(offer.expiresAt).getTime() < Date.now()) {
    await db
      .update(slotWaitlistEntriesTable)
      .set({ status: "expired", updatedAt: new Date() })
      .where(eq(slotWaitlistEntriesTable.id, offer.entryId));
    return { ok: false, error: "expired" };
  }

  const [entry] = await db
    .select()
    .from(slotWaitlistEntriesTable)
    .where(eq(slotWaitlistEntriesTable.id, offer.entryId))
    .limit(1);

  if (!entry?.offeredBookingId || !entry.serviceId || !entry.customerId) {
    return { ok: false, error: "incomplete_offer" };
  }

  const cancelled = await getBookingById(offer.businessId, entry.offeredBookingId);
  if (!cancelled || cancelled.status !== "CANCELLED") {
    return { ok: false, error: "slot_taken" };
  }

  const [biz] = await db
    .select({ timezone: businessesTable.timezone })
    .from(businessesTable)
    .where(eq(businessesTable.id, offer.businessId))
    .limit(1);

  const created = await createBooking(offer.businessId, {
    serviceId: cancelled.serviceId,
    customerId: entry.customerId,
    staffId: cancelled.staffId ?? undefined,
    startAt: new Date(cancelled.startAt).toISOString(),
    channelType: "WEB",
    source: "waitlist-offer",
    notes: "Accepted waitlist offer via guest link",
  });

  await db
    .update(slotWaitlistEntriesTable)
    .set({ status: "accepted", updatedAt: new Date() })
    .where(eq(slotWaitlistEntriesTable.id, offer.entryId));

  void publishDomainEvent(
    "booking.created",
    {
      businessId: offer.businessId,
      bookingId: created.id,
      customerId: entry.customerId,
      serviceId: created.serviceId,
      staffId: created.staffId,
      source: "web",
      sourceConversationId: null,
      startAt: new Date(created.startAt).toISOString(),
    },
    `${offer.businessId}:${created.id}:waitlist-accept-web`,
  );

  const when = new Date(created.startAt).toLocaleString("en-IE", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: biz?.timezone ?? "Europe/Dublin",
  });

  return {
    ok: true,
    bookingId: created.id,
    message: `You're booked for ${when}. We'll send a confirmation shortly.`,
  };
}
