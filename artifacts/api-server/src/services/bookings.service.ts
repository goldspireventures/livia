import {
  db,
  bookingsTable,
  servicesTable,
  customersTable,
  staffTable,
  isValidTransition,
} from "@workspace/db";
import { eq, and, gte, lte, or, sql, desc } from "drizzle-orm";
import { generateId } from "../lib/id";
import {
  sendBookingConfirmationEmail,
  sendBookingCancellationEmail,
} from "./booking-emails.service";

export async function listBookings(
  businessId: string,
  opts: {
    status?: string;
    staffId?: string;
    customerId?: string;
    from?: string;
    to?: string;
    limit?: number;
    offset?: number;
  },
) {
  const { status, staffId, customerId, from, to, limit = 50, offset = 0 } = opts;
  const conditions = [eq(bookingsTable.businessId, businessId)];

  if (status) conditions.push(eq(bookingsTable.status, status as any));
  if (staffId) conditions.push(eq(bookingsTable.staffId, staffId));
  if (customerId) conditions.push(eq(bookingsTable.customerId, customerId));
  if (from) conditions.push(gte(bookingsTable.startAt, new Date(from)));
  if (to) conditions.push(lte(bookingsTable.startAt, new Date(to)));

  const whereClause = and(...conditions);

  const [countResult] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(bookingsTable)
    .where(whereClause);

  const bookings = await db
    .select()
    .from(bookingsTable)
    .where(whereClause)
    .orderBy(desc(bookingsTable.startAt))
    .limit(limit)
    .offset(offset);

  // Enrich with service, customer, staff
  const enriched = await Promise.all(bookings.map(enrichBooking));

  return { data: enriched, total: countResult?.count ?? 0, limit, offset };
}

export async function enrichBooking(booking: typeof bookingsTable.$inferSelect) {
  const [service] = await db
    .select()
    .from(servicesTable)
    .where(eq(servicesTable.id, booking.serviceId));

  const [customer] = await db
    .select()
    .from(customersTable)
    .where(eq(customersTable.id, booking.customerId));

  let staff = null;
  if (booking.staffId) {
    const [s] = await db.select().from(staffTable).where(eq(staffTable.id, booking.staffId));
    staff = s ?? null;
  }

  return { ...booking, service, customer, staff };
}

export async function getBookingById(businessId: string, bookingId: string) {
  const [b] = await db
    .select()
    .from(bookingsTable)
    .where(and(eq(bookingsTable.id, bookingId), eq(bookingsTable.businessId, businessId)));
  if (!b) return null;
  return enrichBooking(b);
}

export async function createBooking(
  businessId: string,
  data: {
    serviceId: string;
    customerId: string;
    staffId?: string;
    startAt: string;
    channelType?: string;
    notes?: string;
  },
) {
  const [service] = await db
    .select()
    .from(servicesTable)
    .where(and(eq(servicesTable.id, data.serviceId), eq(servicesTable.businessId, businessId)));

  if (!service) throw new Error("SERVICE_NOT_FOUND");

  const startAt = new Date(data.startAt);
  const endAt = new Date(
    startAt.getTime() +
      (service.durationMinutes + service.bufferAfterMinutes) * 60_000,
  );

  const inserted = await db.transaction(async (tx) => {
    await tx.execute(sql`SELECT pg_advisory_xact_lock(hashtextextended(${businessId}, 0))`);

    const conflicts = await tx
      .select({ id: bookingsTable.id })
      .from(bookingsTable)
      .where(
        and(
          eq(bookingsTable.businessId, businessId),
          data.staffId ? eq(bookingsTable.staffId, data.staffId) : undefined,
          or(eq(bookingsTable.status, "CONFIRMED"), eq(bookingsTable.status, "PENDING")),
          lte(bookingsTable.startAt, endAt),
          gte(bookingsTable.endAt, startAt),
        ),
      );

    if (conflicts.length > 0) throw new Error("SLOT_CONFLICT");

    const [b] = await tx
      .insert(bookingsTable)
      .values({
        id: generateId(),
        businessId,
        serviceId: data.serviceId,
        customerId: data.customerId,
        staffId: data.staffId ?? null,
        startAt,
        endAt,
        channelType: (data.channelType ?? "WEB") as any,
        status: "PENDING",
        notes: data.notes,
      })
      .returning();

    return b;
  });

  const enriched = await enrichBooking(inserted);

  // Fire-and-forget: confirmation email. Failure must not affect the
  // booking write — `sendBookingConfirmationEmail` swallows + logs errors
  // and writes a FAILED row to notificationLogs for retry.
  void sendBookingConfirmationEmail({
    business: enriched.businessId,
    booking: enriched as Parameters<typeof sendBookingConfirmationEmail>[0]["booking"],
  });

  return enriched;
}

export async function updateBookingStatus(
  businessId: string,
  bookingId: string,
  updates: {
    status?: string;
    internalNotes?: string;
    cancellationReason?: string;
    staffId?: string;
  },
) {
  const [existing] = await db
    .select()
    .from(bookingsTable)
    .where(and(eq(bookingsTable.id, bookingId), eq(bookingsTable.businessId, businessId)));

  if (!existing) return null;

  if (updates.status && updates.status !== existing.status) {
    if (!isValidTransition(existing.status, updates.status)) {
      throw new Error(`INVALID_TRANSITION:${existing.status}->${updates.status}`);
    }
  }

  const [updated] = await db
    .update(bookingsTable)
    .set({
      ...(updates.status ? { status: updates.status as any } : {}),
      ...(updates.internalNotes !== undefined ? { internalNotes: updates.internalNotes } : {}),
      ...(updates.cancellationReason !== undefined
        ? { cancellationReason: updates.cancellationReason }
        : {}),
      ...(updates.staffId !== undefined ? { staffId: updates.staffId } : {}),
      updatedAt: new Date(),
    })
    .where(and(eq(bookingsTable.id, bookingId), eq(bookingsTable.businessId, businessId)))
    .returning();

  if (!updated) return null;
  const enriched = await enrichBooking(updated);

  // Fire-and-forget cancellation email when transitioning to CANCELLED.
  if (updates.status === "CANCELLED" && existing.status !== "CANCELLED") {
    void sendBookingCancellationEmail({
      business: enriched.businessId,
      booking: enriched as Parameters<typeof sendBookingCancellationEmail>[0]["booking"],
      reason: updates.cancellationReason ?? null,
    });
  }

  return enriched;
}
