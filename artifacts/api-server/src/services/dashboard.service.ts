import { db, bookingsTable, customersTable, conversationsTable, eventsTable, businessesTable, enquiriesTable } from "@workspace/db";
import { eq, and, gte, lte, sql, inArray } from "drizzle-orm";
import { enrichBookingsBatch } from "./bookings.service";
import { desc } from "drizzle-orm";
import { getVoiceDigestForBusiness } from "./voice-call.service";
import { resolveBillingState } from "./billing.service";
import { listBookingResources } from "./booking-resources.service";
import { getPackageCreditSummary } from "./package-credits.service";
import { ensureWellnessShowcaseDepth } from "./wellness-demo-depth";
import { ensureAutomotiveBayResources } from "./automotive-ops.service";
import { getBusinessActivationSnapshot } from "./activation-metrics.service";
import { listAtRiskGuestPreviews } from "./relationship.service";
import { listRecentVisitFeedback } from "./visit-feedback.service";
import { formatCommerceMinor, getCommerceSnapshot } from "./commerce-intelligence.service";
import { syncCommerceIntelligenceLoop } from "./commerce-signals.service";
import { enrichActivityFeedItem, isConsultFirstVertical, resolveOperatingPulse, studioPendingBookingCount, guestActionPendingBookingCount } from "@workspace/policy";
import { countActiveWaitlist } from "./waitlist.service";

export async function getDashboardSummary(businessId: string) {
  const now = new Date();
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date(now);
  todayEnd.setHours(23, 59, 59, 999);
  const weekEnd = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  const [biz] = await db
    .select({ vertical: businessesTable.vertical })
    .from(businessesTable)
    .where(eq(businessesTable.id, businessId))
    .limit(1);

  const isWellness = biz?.vertical === "wellness";
  const isAutomotive = biz?.vertical === "automotive-detailing";
  if (isWellness) {
    const existingRooms = await listBookingResources(businessId, true);
    if (!existingRooms.some((r) => r.resourceType === "room")) {
      await ensureWellnessShowcaseDepth(businessId);
    }
  }
  if (isAutomotive) {
    await ensureAutomotiveBayResources(businessId);
  }
  if (biz?.vertical === "fitness") {
    const { ensureFitnessShowcaseClasses } = await import("./fitness-demo-depth");
    await ensureFitnessShowcaseClasses(businessId).catch(() => undefined);
  }

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

  const pendingRows = await db
    .select({ pendingReason: bookingsTable.pendingReason })
    .from(bookingsTable)
    .where(
      and(eq(bookingsTable.businessId, businessId), eq(bookingsTable.status, "PENDING")),
    );

  const pendingCount = pendingRows.length;
  const studioPendingCount = studioPendingBookingCount(pendingRows);
  const guestActionPendingCount = guestActionPendingBookingCount(pendingRows);

  const [handedOffCount] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(conversationsTable)
    .where(
      and(
        eq(conversationsTable.businessId, businessId),
        eq(conversationsTable.status, "HANDED_OFF"),
        sql`coalesce(${conversationsTable.resolution}->>'operatorViewedAt', '') = ''`,
      ),
    );

  const [needsYouCount] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(conversationsTable)
    .where(
      and(
        eq(conversationsTable.businessId, businessId),
        eq(conversationsTable.status, "OPEN"),
        eq(conversationsTable.aiHandled, false),
      ),
    );

  const [livHandlingInboxCount] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(conversationsTable)
    .where(
      and(
        eq(conversationsTable.businessId, businessId),
        eq(conversationsTable.status, "OPEN"),
        eq(conversationsTable.aiHandled, true),
      ),
    );

  const consultFirst = isConsultFirstVertical(biz?.vertical);
  let newEnquiriesCount = 0;
  if (consultFirst) {
    const [newEnq] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(enquiriesTable)
      .where(
        and(eq(enquiriesTable.businessId, businessId), eq(enquiriesTable.status, "new")),
      );
    newEnquiriesCount = newEnq?.count ?? 0;
  }
  const inboxAttentionCount = consultFirst
    ? newEnquiriesCount + (handedOffCount?.count ?? 0)
    : (needsYouCount?.count ?? 0) + (handedOffCount?.count ?? 0);

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

  const upcomingBookings = await enrichBookingsBatch(upcomingRaw, { businessId });

  const [voiceDigest, billing, bookingResources, packageCreditSummary, wellnessReports, activation, atRiskGuests, recentFeedback, commerceRaw] =
    await Promise.all([
      getVoiceDigestForBusiness(businessId),
      resolveBillingState(businessId).catch(() => null),
      isWellness || isAutomotive ? listBookingResources(businessId, true) : Promise.resolve([]),
      isWellness ? getPackageCreditSummary(businessId) : Promise.resolve(null),
      isWellness
        ? import("./wellness-reports.service").then((m) =>
            m.getWellnessReportsBundle(businessId).catch(() => null),
          )
        : Promise.resolve(null),
      getBusinessActivationSnapshot(businessId),
      listAtRiskGuestPreviews(businessId, { limit: 5 }),
      listRecentVisitFeedback(businessId, 14),
      getCommerceSnapshot(businessId),
    ]);

  const commerce =
    commerceRaw.paymentCount30d > 0 || commerceRaw.captureRatePercent != null
      ? {
          capturedMinor30d: commerceRaw.capturedMinor30d,
          captureRatePercent: commerceRaw.captureRatePercent,
          paymentCount30d: commerceRaw.paymentCount30d,
          currency: commerceRaw.currency,
          capturedLabel: formatCommerceMinor(
            commerceRaw.capturedMinor30d,
            commerceRaw.currency,
          ),
        }
      : undefined;

  if (process.env.NODE_ENV !== "development") {
    void syncCommerceIntelligenceLoop(businessId).catch(() => undefined);
  }

  const pendingUpcoming = upcomingBookings.filter((b) => b.status === "PENDING");
  const operatingPulse = resolveOperatingPulse({
    pendingBookings: pendingUpcoming,
    inboxNeedsYou: needsYouCount?.count ?? 0,
    inboxHandedOff: handedOffCount?.count ?? 0,
    inboxLivHandling: livHandlingInboxCount?.count ?? 0,
  });

  const activeWaitlistCount = await countActiveWaitlist(businessId);

  return {
    todayBookings: todayCount?.count ?? 0,
    weekBookings: weekCount?.count ?? 0,
    pendingCount,
    studioPendingCount,
    guestActionPendingCount,
    handedOffCount: handedOffCount?.count ?? 0,
    needsYouCount: needsYouCount?.count ?? 0,
    newEnquiriesCount: consultFirst ? newEnquiriesCount : undefined,
    inboxAttentionCount,
    confirmedCount: confirmedCount?.count ?? 0,
    completedTodayCount: completedToday?.count ?? 0,
    noShowTodayCount: noShowToday?.count ?? 0,
    totalCustomers: totalCustomers?.count ?? 0,
    upcomingBookings,
    bookingResources: isWellness || isAutomotive ? bookingResources : undefined,
    packageCreditSummary: isWellness ? packageCreditSummary : undefined,
    wellnessTomorrowStress: isWellness
      ? (wellnessReports?.tomorrowStress ?? null)
      : undefined,
    voiceBookingsThisWeek: voiceDigest.voiceBookingsThisWeek,
    voiceRecoveredValueEurCents: voiceDigest.voiceRecoveredValueEurCents,
    voiceOutcomeShareEurCents: billing?.voiceOutcomeShareEurCents ?? 0,
    activation: activation ?? undefined,
    atRiskGuests,
    recentVisitFeedback: recentFeedback.slice(0, 5).map((r) => ({
      id: r.id,
      bookingId: r.bookingId,
      score: r.score,
      comment: r.comment,
      createdAt: r.createdAt.toISOString(),
    })),
    lowFeedbackCount: recentFeedback.filter((r) => r.score <= 3).length,
    commerce,
    operatingPulse,
    activeWaitlistCount,
  };
}

export type EnrichedActivityFeedItem = {
  id: string;
  type: string;
  source: string;
  level: string;
  businessId: string | null;
  userId: string | null;
  entityType: string | null;
  entityId: string | null;
  context: unknown;
  createdAt: Date;
  label: string;
  detail?: string;
  href?: string;
  priority: "info" | "watch" | "act";
};

export async function getActivityFeed(
  businessId: string,
  limit: number = 20,
): Promise<EnrichedActivityFeedItem[]> {
  const rows = await db
    .select()
    .from(eventsTable)
    .where(eq(eventsTable.businessId, businessId))
    .orderBy(desc(eventsTable.createdAt))
    .limit(limit);

  return rows.map((row) => {
    const enriched = enrichActivityFeedItem({
      type: row.type,
      entityType: row.entityType,
      entityId: row.entityId,
      context: row.context as Record<string, unknown> | null,
    });
    return {
      ...row,
      label: enriched.label,
      detail: enriched.detail,
      href: enriched.href,
      priority: enriched.priority,
    };
  });
}
