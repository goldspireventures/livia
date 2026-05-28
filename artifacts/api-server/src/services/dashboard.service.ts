import { db, bookingsTable, customersTable, conversationsTable, eventsTable } from "@workspace/db";
import { eq, and, gte, lte, sql, inArray } from "drizzle-orm";
import { enrichBookingsBatch } from "./bookings.service";
import { desc } from "drizzle-orm";
import { getVoiceDigestForBusiness } from "./voice-call.service";
import { resolveBillingState } from "./billing.service";

export async function getDashboardSummary(businessId: string) {
  const now = new Date();
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date(now);
  todayEnd.setHours(23, 59, 59, 999);
  const weekEnd = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  const [todayCount] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(bookingsTable)
    .where(
      and(
        eq(bookingsTable.businessId, businessId),
        gte(bookingsTable.startAt, todayStart),
        lte(bookingsTable.startAt, todayEnd),
      ),
    );

  const [weekCount] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(bookingsTable)
    .where(
      and(
        eq(bookingsTable.businessId, businessId),
        gte(bookingsTable.startAt, now),
        lte(bookingsTable.startAt, weekEnd),
      ),
    );

  const [pendingCount] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(bookingsTable)
    .where(
      and(eq(bookingsTable.businessId, businessId), eq(bookingsTable.status, "PENDING")),
    );

  const [handedOffCount] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(conversationsTable)
    .where(
      and(
        eq(conversationsTable.businessId, businessId),
        eq(conversationsTable.status, "HANDED_OFF"),
      ),
    );

  const [confirmedCount] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(bookingsTable)
    .where(
      and(eq(bookingsTable.businessId, businessId), eq(bookingsTable.status, "CONFIRMED")),
    );

  const [completedToday] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(bookingsTable)
    .where(
      and(
        eq(bookingsTable.businessId, businessId),
        eq(bookingsTable.status, "COMPLETED"),
        gte(bookingsTable.updatedAt, todayStart),
        lte(bookingsTable.updatedAt, todayEnd),
      ),
    );

  const [noShowToday] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(bookingsTable)
    .where(
      and(
        eq(bookingsTable.businessId, businessId),
        eq(bookingsTable.status, "NO_SHOW"),
        gte(bookingsTable.updatedAt, todayStart),
        lte(bookingsTable.updatedAt, todayEnd),
      ),
    );

  const [totalCustomers] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(customersTable)
    .where(eq(customersTable.businessId, businessId));

  // Upcoming actionable bookings (today + next 7 days). Include both PENDING and
  // CONFIRMED so the dashboard's Action Queue, Live Timeline, and "Staff on shift"
  // derivations all see the same source of truth. Also include today's COMPLETED
  // bookings so the timeline shows the full day, not just what's left.
  const upcomingRaw = await db
    .select()
    .from(bookingsTable)
    .where(
      and(
        eq(bookingsTable.businessId, businessId),
        gte(bookingsTable.startAt, todayStart),
        lte(bookingsTable.startAt, weekEnd),
        inArray(bookingsTable.status, ["PENDING", "CONFIRMED", "COMPLETED"]),
      ),
    )
    .orderBy(bookingsTable.startAt)
    .limit(40);

  const upcomingBookings = await enrichBookingsBatch(upcomingRaw);

  const [voiceDigest, billing] = await Promise.all([
    getVoiceDigestForBusiness(businessId),
    resolveBillingState(businessId).catch(() => null),
  ]);

  return {
    todayBookings: todayCount?.count ?? 0,
    weekBookings: weekCount?.count ?? 0,
    pendingCount: pendingCount?.count ?? 0,
    handedOffCount: handedOffCount?.count ?? 0,
    confirmedCount: confirmedCount?.count ?? 0,
    completedTodayCount: completedToday?.count ?? 0,
    noShowTodayCount: noShowToday?.count ?? 0,
    totalCustomers: totalCustomers?.count ?? 0,
    upcomingBookings,
    voiceBookingsThisWeek: voiceDigest.voiceBookingsThisWeek,
    voiceRecoveredValueEurCents: voiceDigest.voiceRecoveredValueEurCents,
    voiceOutcomeShareEurCents: billing?.voiceOutcomeShareEurCents ?? 0,
  };
}

export async function getActivityFeed(businessId: string, limit: number = 20) {
  return db
    .select()
    .from(eventsTable)
    .where(eq(eventsTable.businessId, businessId))
    .orderBy(desc(eventsTable.createdAt))
    .limit(limit);
}
