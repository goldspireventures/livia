import { db, businessesTable, bookingsTable, businessMembershipsTable, usersTable } from "@workspace/db";
import { and, eq, lt, sql, isNull, or } from "drizzle-orm";
import { onboardingStateSchema } from "@workspace/policy";
import { findStuckOnboardingBusinesses } from "./onboarding-nudge.service";

export type RadarProactiveFeed = {
  id: string;
  kind: "stuck_onboarding" | "zero_bookings";
  businessId: string;
  businessName: string;
  slug: string;
  detail: string;
  ownerEmail: string | null;
  detectedAt: string;
};

/** Tenants with no booking in the last N days (or never). */
export async function findZeroBookingBusinesses(days = 14, limit = 50) {
  const cutoff = new Date(Date.now() - days * 24 * 60 * 60_000);

  const lastBookingSub = db
    .select({
      businessId: bookingsTable.businessId,
      lastAt: sql<Date>`max(${bookingsTable.startAt})`.as("last_at"),
    })
    .from(bookingsTable)
    .groupBy(bookingsTable.businessId)
    .as("last_booking");

  const rows = await db
    .select({
      id: businessesTable.id,
      name: businessesTable.name,
      slug: businessesTable.slug,
      onboardingState: businessesTable.onboardingState,
      lastAt: lastBookingSub.lastAt,
    })
    .from(businessesTable)
    .leftJoin(lastBookingSub, eq(lastBookingSub.businessId, businessesTable.id))
    .where(or(isNull(lastBookingSub.lastAt), lt(lastBookingSub.lastAt, cutoff)))
    .limit(limit);

  const feeds: RadarProactiveFeed[] = [];
  for (const r of rows) {
    const parsed = onboardingStateSchema.safeParse(r.onboardingState);
    if (parsed.success && parsed.data.completedActs.includes("a12_go_live")) continue;

    const [owner] = await db
      .select({ email: usersTable.email })
      .from(businessMembershipsTable)
      .innerJoin(usersTable, eq(usersTable.id, businessMembershipsTable.userId))
      .where(
        and(
          eq(businessMembershipsTable.businessId, r.id),
          eq(businessMembershipsTable.role, "OWNER"),
        ),
      )
      .limit(1);

    feeds.push({
      id: `zero-${r.id}`,
      kind: "zero_bookings",
      businessId: r.id,
      businessName: r.name,
      slug: r.slug,
      detail: r.lastAt
        ? `No bookings since ${new Date(r.lastAt).toLocaleDateString("en-IE")}`
        : "No bookings recorded yet",
      ownerEmail: owner?.email ?? null,
      detectedAt: new Date().toISOString(),
    });
  }
  return feeds;
}

export async function getRadarProactiveFeeds(limit = 30): Promise<RadarProactiveFeed[]> {
  const [stuck, zero] = await Promise.all([
    findStuckOnboardingBusinesses(Math.min(limit, 50)),
    findZeroBookingBusinesses(14, Math.min(limit, 50)),
  ]);

  const stuckFeeds: RadarProactiveFeed[] = stuck.map((s) => ({
    id: `stuck-${s.id}`,
    kind: "stuck_onboarding",
    businessId: s.id,
    businessName: s.name,
    slug: s.slug,
    detail: `${s.percentComplete}% complete · act ${s.currentAct}`,
    ownerEmail: s.ownerEmail,
    detectedAt: s.updatedAt.toISOString(),
  }));

  return [...stuckFeeds, ...zero].slice(0, limit);
}
