import {
  db,
  bookingsTable,
  servicesTable,
  customersTable,
  staffTable,
  staffServicesTable,
  mediaAssetsTable,
  isValidTransition,
} from "@workspace/db";
import { eq, and, gte, lte, or, sql, desc, inArray } from "drizzle-orm";
import { generateId } from "../lib/id";
import {
  sendBookingConfirmationEmail,
  sendBookingCancellationEmail,
} from "./booking-emails.service";
import { derivePendingReason } from "../lib/booking-pending";
import { getPoliciesForBusinessId, policiesFromBusiness } from "./policies.service";
import { businessesTable } from "@workspace/db";
import {
  resolveResourceForService,
  resourceCapacityAvailable,
} from "./booking-resources.service";

export async function listBookings(
  businessId: string,
  opts: {
    status?: string;
    staffId?: string;
    customerId?: string;
    source?: string;
    from?: string;
    to?: string;
    limit?: number;
    offset?: number;
  },
) {
  const { status, staffId, customerId, source, from, to, limit = 50, offset = 0 } = opts;
  const conditions = [eq(bookingsTable.businessId, businessId)];

  if (status) conditions.push(eq(bookingsTable.status, status as any));
  if (staffId) conditions.push(eq(bookingsTable.staffId, staffId));
  if (customerId) conditions.push(eq(bookingsTable.customerId, customerId));
  if (source) conditions.push(eq(bookingsTable.source, source as any));
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

  const enriched = await enrichBookingsBatch(bookings);

  return { data: enriched, total: countResult?.count ?? 0, limit, offset };
}

/** Batched enrichment — one query per related table instead of 3×N. */
export async function enrichBookingsBatch(
  bookings: Array<typeof bookingsTable.$inferSelect>,
) {
  if (!bookings.length) return [];

  const serviceIds = [...new Set(bookings.map((b) => b.serviceId))];
  const customerIds = [...new Set(bookings.map((b) => b.customerId))];
  const staffIds = [
    ...new Set(bookings.map((b) => b.staffId).filter((id): id is string => !!id)),
  ];

  const [services, customers, staffRows] = await Promise.all([
    db.select().from(servicesTable).where(inArray(servicesTable.id, serviceIds)),
    db.select().from(customersTable).where(inArray(customersTable.id, customerIds)),
    staffIds.length
      ? db.select().from(staffTable).where(inArray(staffTable.id, staffIds))
      : Promise.resolve([]),
  ]);

  const serviceMap = new Map(services.map((s) => [s.id, s]));
  const customerMap = new Map(customers.map((c) => [c.id, c]));
  const staffMap = new Map(staffRows.map((s) => [s.id, s]));

  return bookings.map((b) => ({
    ...b,
    service: serviceMap.get(b.serviceId) ?? null,
    customer: customerMap.get(b.customerId) ?? null,
    staff: b.staffId ? (staffMap.get(b.staffId) ?? null) : null,
  }));
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

  const media = await db
    .select()
    .from(mediaAssetsTable)
    .where(
      and(
        eq(mediaAssetsTable.businessId, booking.businessId),
        eq(mediaAssetsTable.entityType, "booking"),
        eq(mediaAssetsTable.entityId, booking.id),
      ),
    )
    .orderBy(desc(mediaAssetsTable.createdAt));

  return { ...booking, service, customer, staff, media };
}

export async function getBookingById(businessId: string, bookingId: string) {
  const [b] = await db
    .select()
    .from(bookingsTable)
    .where(and(eq(bookingsTable.id, bookingId), eq(bookingsTable.businessId, businessId)));
  if (!b) return null;
  return enrichBooking(b);
}

function channelTypeToSource(channelType?: string): (typeof bookingsTable.$inferInsert)["source"] {
  switch (channelType) {
    case "VOICE":
      return "voice";
    case "SMS":
      return "sms";
    case "WHATSAPP":
      return "whatsapp";
    case "INSTAGRAM":
      return "instagram";
    case "MESSENGER":
      return "messenger";
    default:
      return "web";
  }
}

export async function createBooking(
  businessId: string,
  data: {
    serviceId: string;
    customerId: string;
    staffId?: string;
    resourceId?: string;
    startAt: string;
    channelType?: string;
    source?: string;
    sourceConversationId?: string;
    notes?: string;
    usePackageCredit?: boolean;
    packageLedgerId?: string;
  },
) {
  const [service] = await db
    .select()
    .from(servicesTable)
    .where(and(eq(servicesTable.id, data.serviceId), eq(servicesTable.businessId, businessId)));

  if (!service) throw new Error("SERVICE_NOT_FOUND");

  const [biz] = await db
    .select()
    .from(businessesTable)
    .where(eq(businessesTable.id, businessId));
  if (!biz) throw new Error("BUSINESS_NOT_FOUND");
  const policies = (await getPoliciesForBusinessId(businessId)) ?? policiesFromBusiness(biz);
  const aiCanBookDirectly = (biz.aiCanBookDirectly ?? "true") === "true";
  const op = policies.operational;
  const depositRequired = op.depositRequired;
  const source = (data.source ?? channelTypeToSource(data.channelType)) as string;

  const [custRow] = await db
    .select({
      trustedClient: customersTable.trustedClient,
      strikeCount: customersTable.strikeCount,
      phone: customersTable.phone,
      email: customersTable.email,
      firstName: customersTable.firstName,
      lastName: customersTable.lastName,
      preferredStaffId: customersTable.preferredStaffId,
    })
    .from(customersTable)
    .where(
      and(eq(customersTable.id, data.customerId), eq(customersTable.businessId, businessId)),
    );

  let resolvedStaffId = data.staffId ?? custRow?.preferredStaffId ?? undefined;

  const resolvedResourceId = await resolveResourceForService(
    businessId,
    data.serviceId,
    data.resourceId,
  );

  let customerTrusted = false;
  if (depositRequired && op.requireDepositAfterStrikes && custRow) {
    customerTrusted =
      !!custRow.trustedClient ||
      (custRow.strikeCount ?? 0) < op.noShowStrikeThreshold;
  }

  const pendingReason = derivePendingReason({
    source,
    aiCanBookDirectly,
    depositRequired: depositRequired && !customerTrusted,
    depositPaidEurCents: 0,
    autoConfirmWhenNoDeposit: op.autoConfirmWhenNoDeposit,
    customerTrusted,
    bookingContinuityEnabled: op.bookingContinuityEnabled,
    customerHasPhone: !!custRow?.phone?.trim(),
    customerHasEmail: !!custRow?.email?.trim(),
  });
  const initialStatus = pendingReason ? "PENDING" : "CONFIRMED";

  const startAt = new Date(data.startAt);
  const endAt = new Date(
    startAt.getTime() +
      (service.durationMinutes + service.bufferAfterMinutes) * 60_000,
  );

  if (!resolvedStaffId) {
    const { assignStaffForBooking } = await import("./staff-assign.service");
    resolvedStaffId =
      (await assignStaffForBooking({
        businessId,
        serviceId: data.serviceId,
        startAt,
        endAt,
        customerId: data.customerId,
        preferredStaffId: custRow?.preferredStaffId,
      })) ?? undefined;
  }

  if (resolvedStaffId) {
    const [staffRow] = await db
      .select({ id: staffTable.id })
      .from(staffTable)
      .where(
        and(
          eq(staffTable.id, resolvedStaffId),
          eq(staffTable.businessId, businessId),
          eq(staffTable.isActive, true),
        ),
      );
    if (!staffRow) throw new Error("STAFF_NOT_FOUND");

    const [assignment] = await db
      .select({ staffId: staffServicesTable.staffId })
      .from(staffServicesTable)
      .where(
        and(
          eq(staffServicesTable.staffId, resolvedStaffId),
          eq(staffServicesTable.serviceId, data.serviceId),
        ),
      )
      .limit(1);
    if (!assignment) throw new Error("STAFF_NOT_ASSIGNED_TO_SERVICE");
  }

  if (resolvedResourceId) {
    const ok = await resourceCapacityAvailable({
      businessId,
      resourceId: resolvedResourceId,
      startAt,
      endAt,
    });
    if (!ok) throw new Error("RESOURCE_AT_CAPACITY");
  }

  const inserted = await db.transaction(async (tx) => {
    await tx.execute(sql`SELECT pg_advisory_xact_lock(hashtextextended(${businessId}, 0))`);

    const conflicts = await tx
      .select({ id: bookingsTable.id })
      .from(bookingsTable)
      .where(
        and(
          eq(bookingsTable.businessId, businessId),
          resolvedStaffId ? eq(bookingsTable.staffId, resolvedStaffId) : undefined,
          or(eq(bookingsTable.status, "CONFIRMED"), eq(bookingsTable.status, "PENDING")),
          lte(bookingsTable.startAt, endAt),
          gte(bookingsTable.endAt, startAt),
        ),
      );

    if (conflicts.length > 0) throw new Error("SLOT_CONFLICT");

    if (resolvedResourceId) {
      const ok = await resourceCapacityAvailable({
        businessId,
        resourceId: resolvedResourceId,
        startAt,
        endAt,
      });
      if (!ok) throw new Error("RESOURCE_AT_CAPACITY");
    }

    const [b] = await tx
      .insert(bookingsTable)
      .values({
        id: generateId(),
        businessId,
        serviceId: data.serviceId,
        customerId: data.customerId,
        staffId: resolvedStaffId ?? null,
        resourceId: resolvedResourceId,
        startAt,
        endAt,
        channelType: (data.channelType ?? "WEB") as any,
        source: source as any,
        sourceConversationId: data.sourceConversationId ?? null,
        status: initialStatus,
        pendingReason: pendingReason ?? null,
        notes: data.notes,
      })
      .returning();

    return b;
  });

  const enriched = await enrichBooking(inserted);

  if (data.usePackageCredit || data.packageLedgerId) {
    const { burnPackageCredit, findActivePackageCredit } = await import(
      "./package-credits.service"
    );
    const ledgerId =
      data.packageLedgerId ??
      (await findActivePackageCredit(businessId, data.customerId))?.id;
    if (ledgerId) {
      const burn = await burnPackageCredit(businessId, ledgerId, 1);
      if ("ledger" in burn) {
        await db
          .update(bookingsTable)
          .set({
            notes: [data.notes, `Package credit applied (${burn.ledger?.packageName})`]
              .filter(Boolean)
              .join(" · "),
            updatedAt: new Date(),
          })
          .where(eq(bookingsTable.id, inserted.id));
      }
    }
  }

  // Fire-and-forget: confirmation email.
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

  const clearPending =
    existing.pendingReason != null &&
    (updates.status === "CONFIRMED" ||
      updates.status === "CANCELLED" ||
      updates.status === "COMPLETED" ||
      updates.status === "NO_SHOW");

  const [updated] = await db
    .update(bookingsTable)
    .set({
      ...(updates.status ? { status: updates.status as any } : {}),
      ...(clearPending ? { pendingReason: null } : {}),
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

  if (updates.status === "NO_SHOW" && existing.status !== "NO_SHOW" && existing.customerId) {
    await db
      .update(customersTable)
      .set({
        noShowCount: sql`${customersTable.noShowCount} + 1`,
        strikeCount: sql`${customersTable.strikeCount} + 1`,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(customersTable.id, existing.customerId),
          eq(customersTable.businessId, businessId),
        ),
      );
  }

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

export async function confirmBooking(businessId: string, bookingId: string) {
  const [existing] = await db
    .select()
    .from(bookingsTable)
    .where(and(eq(bookingsTable.id, bookingId), eq(bookingsTable.businessId, businessId)));
  if (!existing) return null;
  if (!isValidTransition(existing.status, "CONFIRMED")) {
    throw new Error(`INVALID_TRANSITION:${existing.status}->CONFIRMED`);
  }
  const [updated] = await db
    .update(bookingsTable)
    .set({
      status: "CONFIRMED",
      pendingReason: null,
      updatedAt: new Date(),
    })
    .where(and(eq(bookingsTable.id, bookingId), eq(bookingsTable.businessId, businessId)))
    .returning();
  if (!updated) return null;
  return enrichBooking(updated);
}

export async function cancelBookingWithReason(
  businessId: string,
  bookingId: string,
  reason?: string,
) {
  return updateBookingStatus(businessId, bookingId, {
    status: "CANCELLED",
    cancellationReason: reason ?? "Cancelled",
  });
}

export async function rescheduleBooking(
  businessId: string,
  bookingId: string,
  newStartAt: string,
) {
  const existing = await getBookingById(businessId, bookingId);
  if (!existing) throw new Error("BOOKING_NOT_FOUND");
  if (!["PENDING", "CONFIRMED"].includes(existing.status)) {
    throw new Error("INVALID_STATUS_FOR_RESCHEDULE");
  }

  const [service] = await db
    .select()
    .from(servicesTable)
    .where(
      and(eq(servicesTable.id, existing.serviceId), eq(servicesTable.businessId, businessId)),
    );
  if (!service) throw new Error("SERVICE_NOT_FOUND");

  const startAt = new Date(newStartAt);
  const endAt = new Date(
    startAt.getTime() +
      (service.durationMinutes + service.bufferAfterMinutes) * 60_000,
  );

  const inserted = await db.transaction(async (tx) => {
    await tx.execute(sql`SELECT pg_advisory_xact_lock(hashtextextended(${businessId}, 0))`);
    const staffId = existing.staffId;
    const conflicts = await tx
      .select({ id: bookingsTable.id })
      .from(bookingsTable)
      .where(
        and(
          eq(bookingsTable.businessId, businessId),
          staffId ? eq(bookingsTable.staffId, staffId) : undefined,
          or(eq(bookingsTable.status, "CONFIRMED"), eq(bookingsTable.status, "PENDING")),
          lte(bookingsTable.startAt, endAt),
          gte(bookingsTable.endAt, startAt),
        ),
      );
    const others = conflicts.filter((c) => c.id !== bookingId);
    if (others.length > 0) throw new Error("SLOT_CONFLICT");

    const [row] = await tx
      .update(bookingsTable)
      .set({ startAt, endAt, updatedAt: new Date() })
      .where(and(eq(bookingsTable.id, bookingId), eq(bookingsTable.businessId, businessId)))
      .returning();
    return row;
  });

  return enrichBooking(inserted);
}
