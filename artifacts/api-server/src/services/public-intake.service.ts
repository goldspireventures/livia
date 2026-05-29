import { db, bookingsTable, businessesTable } from "@workspace/db";
import { and, desc, eq, gte, sql } from "drizzle-orm";
import { enrichBookingsBatch } from "./bookings.service";
import { getDashboardUrl } from "../lib/public-urls";

const AUTOMATION_STEPS = [
  { id: "created", label: "Booking saved with web source" },
  { id: "continuity", label: "Continuity SMS/email when contact + policy allow" },
  { id: "reminder", label: "Reminder workflow (T-24h)" },
  { id: "confirm", label: "Owner confirm → customer notified" },
  { id: "visit", label: "Guest visit link for running late & feedback" },
] as const;

export async function getPublicIntakeFeed(businessId: string) {
  const [biz] = await db
    .select({ slug: businessesTable.slug, name: businessesTable.name })
    .from(businessesTable)
    .where(eq(businessesTable.id, businessId))
    .limit(1);

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const weekStart = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const baseWeb = and(
    eq(bookingsTable.businessId, businessId),
    eq(bookingsTable.source, "web"),
  );

  const [todayRow] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(bookingsTable)
    .where(and(baseWeb, gte(bookingsTable.createdAt, todayStart)));

  const [weekRow] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(bookingsTable)
    .where(and(baseWeb, gte(bookingsTable.createdAt, weekStart)));

  const [pendingRow] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(bookingsTable)
    .where(
      and(baseWeb, eq(bookingsTable.status, "PENDING")),
    );

  const recentRaw = await db
    .select()
    .from(bookingsTable)
    .where(baseWeb)
    .orderBy(desc(bookingsTable.createdAt))
    .limit(8);

  const recent = await enrichBookingsBatch(recentRaw);

  const dashboardBase = getDashboardUrl();

  return {
    publicUrl: biz?.slug ? `${dashboardBase}/b/${biz.slug}` : null,
    businessName: biz?.name ?? null,
    todayCount: todayRow?.count ?? 0,
    weekCount: weekRow?.count ?? 0,
    pendingCount: pendingRow?.count ?? 0,
    recent: recent.map((b) => ({
      id: b.id,
      status: b.status,
      pendingReason: b.pendingReason,
      startAt: b.startAt,
      createdAt: b.createdAt,
      source: b.source,
      channelType: b.channelType,
      serviceName: b.service?.name ?? null,
      customerName:
        (b.customer?.displayName ??
          [b.customer?.firstName, b.customer?.lastName].filter(Boolean).join(" ")) ||
        "Guest",
      staffDisplayName: b.staff?.displayName ?? null,
    })),
    automationSteps: AUTOMATION_STEPS,
  };
}
