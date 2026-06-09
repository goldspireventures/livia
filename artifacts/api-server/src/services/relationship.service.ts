import { db, bookingsTable, conversationsTable, customersTable } from "@workspace/db";
import { and, eq, inArray, gt, sql, desc } from "drizzle-orm";
import {
  deriveRelationshipSignals,
  relationshipStageLabel,
  relationshipSummarySchema,
  atRiskGuestPreviewSchema,
  atRiskStageFromDays,
  atRiskGuestHeadline,
  type RelationshipSummary,
  type AtRiskGuestPreview,
} from "@workspace/policy";
import { listLivMemoryForEntity } from "./liv-memory.service";
import { getCustomerById } from "./customers.service";

function daysBetween(from: Date, to: Date): number {
  return Math.floor((to.getTime() - from.getTime()) / 86400000);
}

export async function getRelationshipSummary(
  businessId: string,
  customerId: string,
): Promise<RelationshipSummary | null> {
  const customer = await getCustomerById(businessId, customerId);
  if (!customer) return null;

  const now = new Date();

  const [bookingStats] = await db
    .select({
      total: sql<number>`count(*)::int`,
      completed: sql<number>`count(*) filter (where ${bookingsTable.status} = 'COMPLETED')::int`,
      lastCompletedAt: sql<string | null>`max(${bookingsTable.startAt}) filter (where ${bookingsTable.status} = 'COMPLETED' and ${bookingsTable.startAt} < ${now})`,
    })
    .from(bookingsTable)
    .where(and(eq(bookingsTable.businessId, businessId), eq(bookingsTable.customerId, customerId)));

  const [nextBooking] = await db
    .select({ startAt: bookingsTable.startAt })
    .from(bookingsTable)
    .where(
      and(
        eq(bookingsTable.businessId, businessId),
        eq(bookingsTable.customerId, customerId),
        inArray(bookingsTable.status, ["PENDING", "CONFIRMED"]),
        gt(bookingsTable.startAt, now),
      ),
    )
    .orderBy(bookingsTable.startAt)
    .limit(1);

  const [convStats] = await db
    .select({
      count: sql<number>`count(*)::int`,
      lastMessageAt: sql<Date | null>`max(${conversationsTable.lastMessageAt})`,
    })
    .from(conversationsTable)
    .where(
      and(eq(conversationsTable.businessId, businessId), eq(conversationsTable.customerId, customerId)),
    );

  const [noShowResult] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(bookingsTable)
    .where(
      and(
        eq(bookingsTable.businessId, businessId),
        eq(bookingsTable.customerId, customerId),
        eq(bookingsTable.status, "NO_SHOW"),
      ),
    );

  const lastCompletedAt = bookingStats?.lastCompletedAt
    ? new Date(bookingStats.lastCompletedAt)
    : null;
  const daysSinceLastVisit =
    lastCompletedAt && !Number.isNaN(lastCompletedAt.getTime())
      ? daysBetween(lastCompletedAt, now)
      : null;

  const lastMessageAt = convStats?.lastMessageAt ?? null;
  const daysSinceLastMessage =
    lastMessageAt && !Number.isNaN(lastMessageAt.getTime())
      ? daysBetween(lastMessageAt, now)
      : null;

  const memoryRows = await listLivMemoryForEntity({
    businessId,
    entityType: "customer",
    entityId: customerId,
    limit: 3,
  });
  const memoryHighlight =
    memoryRows.find((m) => m.kind === "preference" || m.kind === "ritual")?.content ??
    memoryRows[0]?.content ??
    null;

  const derived = deriveRelationshipSignals({
    totalBookings: bookingStats?.total ?? 0,
    completedVisits: bookingStats?.completed ?? 0,
    daysSinceLastVisit,
    hasUpcomingBooking: Boolean(nextBooking),
    trustedClient: Boolean(customer.trustedClient),
    noShowCount: customer.noShowCount ?? noShowResult?.count ?? 0,
    conversationCount: convStats?.count ?? 0,
    daysSinceLastMessage,
  });

  return relationshipSummarySchema.parse({
    customerId,
    stage: derived.stage,
    stageLabel: relationshipStageLabel(derived.stage),
    trajectory: derived.trajectory,
    headline: derived.headline,
    signals: derived.signals,
    completedVisits: bookingStats?.completed ?? 0,
    totalBookings: bookingStats?.total ?? 0,
    daysSinceLastVisit,
    nextBookingAt: nextBooking?.startAt
      ? nextBooking.startAt instanceof Date
        ? nextBooking.startAt.toISOString()
        : String(nextBooking.startAt)
      : null,
    conversationCount: convStats?.count ?? 0,
    lastMessageAt: lastMessageAt?.toISOString() ?? null,
    memoryHighlight,
  });
}

function displayNameFromRow(row: {
  displayName: string | null;
  firstName: string | null;
  lastName: string | null;
}): string {
  return (
    row.displayName?.trim() ||
    [row.firstName, row.lastName].filter(Boolean).join(" ").trim() ||
    "Guest"
  );
}

/** SQL-backed at-risk list for owner home — avoids N+1 full relationship fetches. */
export async function listAtRiskGuestPreviews(
  businessId: string,
  opts?: { limit?: number },
): Promise<AtRiskGuestPreview[]> {
  const limit = Math.min(10, Math.max(1, opts?.limit ?? 5));
  const now = new Date();
  const atRiskCutoff = new Date(now.getTime() - 60 * 86400000);

  const result = await db.execute<{
    customer_id: string;
    last_visit: string;
    display_name: string | null;
    first_name: string | null;
    last_name: string | null;
  }>(sql`
    SELECT b.customer_id,
           MAX(b.start_at) AS last_visit,
           c.display_name,
           c.first_name,
           c.last_name
    FROM bookings b
    INNER JOIN customers c ON c.id = b.customer_id
    WHERE b.business_id = ${businessId}
      AND b.status = 'COMPLETED'
      AND b.start_at < ${now}
    GROUP BY b.customer_id, c.display_name, c.first_name, c.last_name
    HAVING MAX(b.start_at) < ${atRiskCutoff}
    ORDER BY MAX(b.start_at) ASC
    LIMIT ${limit * 3}
  `);

  const rows = result.rows ?? [];
  if (rows.length === 0) return [];

  const customerIds = rows.map((r) => r.customer_id);
  const upcoming = await db
    .selectDistinct({ customerId: bookingsTable.customerId })
    .from(bookingsTable)
    .where(
      and(
        eq(bookingsTable.businessId, businessId),
        inArray(bookingsTable.customerId, customerIds),
        inArray(bookingsTable.status, ["PENDING", "CONFIRMED"]),
        gt(bookingsTable.startAt, now),
      ),
    );
  const hasUpcoming = new Set(upcoming.map((u) => u.customerId));

  const previews: AtRiskGuestPreview[] = [];
  for (const row of rows) {
    if (hasUpcoming.has(row.customer_id)) continue;
    const lastVisit = new Date(row.last_visit);
    if (Number.isNaN(lastVisit.getTime())) continue;
    const daysSinceLastVisit = Math.floor((now.getTime() - lastVisit.getTime()) / 86400000);
    const displayName = displayNameFromRow({
      displayName: row.display_name,
      firstName: row.first_name,
      lastName: row.last_name,
    });
    const stage = atRiskStageFromDays(daysSinceLastVisit);
    previews.push(
      atRiskGuestPreviewSchema.parse({
        customerId: row.customer_id,
        displayName,
        stage,
        daysSinceLastVisit,
        headline: atRiskGuestHeadline(stage, displayName),
      }),
    );
    if (previews.length >= limit) break;
  }
  return previews;
}

/** At-risk / lapsed guests for owner nudges (bounded). */
export async function listRelationshipAtRisk(
  businessId: string,
  opts?: { limit?: number },
): Promise<RelationshipSummary[]> {
  const previews = await listAtRiskGuestPreviews(businessId, opts);
  const summaries: RelationshipSummary[] = [];
  for (const preview of previews) {
    const summary = await getRelationshipSummary(businessId, preview.customerId);
    if (summary && (summary.stage === "at_risk" || summary.stage === "lapsed")) {
      summaries.push(summary);
    }
  }
  return summaries;
}
