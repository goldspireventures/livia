import { db, bookingsTable, EventType, businessesTable, staffTable, servicesTable, customersTable } from "@workspace/db";
import { and, eq, gte, lte, sql } from "drizzle-orm";
import { generateId } from "../lib/id";
import { generateMorningBriefingForBusiness } from "./morning-briefing.service";
import { seedDemoInbox } from "./demo-inbox.seed";
import { getBusinessById } from "./businesses.service";
import { enrichBookingsBatch } from "./bookings.service";
import { logEvent } from "./events.service";

type BookingStatus = "PENDING" | "CONFIRMED" | "COMPLETED";

function todayWindow() {
  const now = new Date();
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  const end = new Date(now);
  end.setHours(23, 59, 59, 999);
  return { start, end, now };
}

/**
 * Ensures a business feels "live" on first open: today bookings, briefing, activity events.
 * Safe to call repeatedly (skips if today already has bookings).
 */
export async function ensureLiveDayForBusiness(
  businessId: string,
  opts?: {
    force?: boolean;
    seedInbox?: boolean;
    customerSeed?: Array<{ id: string; displayName: string; email: string; phone: string }>;
    staffIds?: string[];
    serviceIds?: string[];
  },
): Promise<{ seededBookings: number; briefing: boolean }> {
  const biz = await getBusinessById(businessId);
  if (!biz) return { seededBookings: 0, briefing: false };

  const { start, end } = todayWindow();

  const [existingToday] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(bookingsTable)
    .where(
      and(
        eq(bookingsTable.businessId, businessId),
        gte(bookingsTable.startAt, start),
        lte(bookingsTable.startAt, end),
      ),
    );

  let seededBookings = 0;
  if (opts?.force || (existingToday?.count ?? 0) === 0) {
    const staffIds = opts?.staffIds ?? [];
    const serviceIds = opts?.serviceIds ?? [];
    const customers = opts?.customerSeed ?? [];
    if (staffIds.length > 0 && serviceIds.length > 0 && customers.length > 0) {
      const slots: Array<{ ci: number; si: number; vi: number; status: BookingStatus; hour: number }> =
        [
          { ci: 0, si: 0, vi: 0, status: "CONFIRMED", hour: 9 },
          { ci: 1, si: 0, vi: Math.min(1, serviceIds.length - 1), status: "PENDING", hour: 12 },
          { ci: 2, si: Math.min(1, staffIds.length - 1), vi: 0, status: "CONFIRMED", hour: 14 },
          { ci: 0, si: Math.min(2, staffIds.length - 1), vi: Math.min(2, serviceIds.length - 1), status: "CONFIRMED", hour: 16 },
        ];
      const rows = slots.map((s) => {
        const startAt = new Date();
        startAt.setHours(s.hour, 0, 0, 0);
        const endAt = new Date(startAt.getTime() + 60 * 60_000);
        return {
          id: generateId(),
          businessId,
          customerId: customers[s.ci].id,
          staffId: staffIds[s.si],
          serviceId: serviceIds[s.vi],
          status: s.status,
          startAt,
          endAt,
          channelType: "WEB" as const,
          pendingReason: s.status === "PENDING" ? ("awaiting_staff_confirm" as const) : null,
        };
      });
      await db.insert(bookingsTable).values(rows);
      seededBookings = rows.length;
    }
  }

  if (opts?.seedInbox && opts.customerSeed?.length) {
    await seedDemoInbox(businessId, opts.customerSeed, {
      pendingBookingNotes: "Liv created — confirm when ready",
    });
  }

  await generateMorningBriefingForBusiness(businessId);

  const enriched = await enrichBookingsBatch(
    await db
      .select()
      .from(bookingsTable)
      .where(
        and(
          eq(bookingsTable.businessId, businessId),
          gte(bookingsTable.startAt, start),
          lte(bookingsTable.startAt, end),
        ),
      )
      .limit(3),
  );

  for (const b of enriched) {
    const cust = b.customer as { displayName?: string; firstName?: string } | null;
    const name = cust?.displayName ?? cust?.firstName ?? "Guest";
    await logEvent({
      type: b.status === "PENDING" ? EventType.BOOKING_CREATED : EventType.BOOKING_CONFIRMED,
      businessId,
      entityType: "booking",
      entityId: b.id,
      context: { customerName: name, simulated: true },
    });
  }

  return { seededBookings, briefing: true };
}

/** Idempotent — top up today's bookings for demo tenants that have staff/services/customers. */
export async function refreshDemoLiveDaysForSlugs(
  slugs: readonly string[],
): Promise<{ businesses: number; bookingsAdded: number }> {
  let bookingsAdded = 0;
  let businesses = 0;

  for (const slug of slugs) {
    const [biz] = await db
      .select({ id: businessesTable.id })
      .from(businessesTable)
      .where(eq(businessesTable.slug, slug))
      .limit(1);
    if (!biz) continue;

    const staffRows = await db
      .select({ id: staffTable.id })
      .from(staffTable)
      .where(eq(staffTable.businessId, biz.id))
      .limit(4);
    const serviceRows = await db
      .select({ id: servicesTable.id })
      .from(servicesTable)
      .where(eq(servicesTable.businessId, biz.id))
      .limit(8);
    const customerRows = await db
      .select({
        id: customersTable.id,
        displayName: customersTable.displayName,
        firstName: customersTable.firstName,
        email: customersTable.email,
        phone: customersTable.phone,
      })
      .from(customersTable)
      .where(eq(customersTable.businessId, biz.id))
      .limit(4);

    if (!staffRows.length || !serviceRows.length || !customerRows.length) continue;

    const result = await ensureLiveDayForBusiness(biz.id, {
      force: false,
      staffIds: staffRows.map((s) => s.id),
      serviceIds: serviceRows.map((s) => s.id),
      customerSeed: customerRows.map((c) => ({
        id: c.id,
        displayName: c.displayName ?? c.firstName ?? "Guest",
        email: c.email ?? "",
        phone: c.phone ?? "",
      })),
    });
    bookingsAdded += result.seededBookings;
    businesses += 1;
  }

  return { businesses, bookingsAdded };
}
