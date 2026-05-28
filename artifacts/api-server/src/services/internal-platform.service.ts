import {
  db,
  businessesTable,
  bookingsTable,
  medspaConsentRecordsTable,
  slotWaitlistEntriesTable,
} from "@workspace/db";
import { sql, eq, and } from "drizzle-orm";

/** Livia Inc platform snapshot for internal portal (v3 operator surface). */
export async function getInternalPlatformHealth() {
  const [{ count: tenantCount }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(businessesTable);

  const [{ stuckContinuity }] = await db
    .select({ stuckContinuity: sql<number>`count(*)::int` })
    .from(bookingsTable)
    .where(
      and(
        eq(bookingsTable.pendingReason, "awaiting_continuity"),
        sql`${bookingsTable.status} IN ('PENDING', 'CONFIRMED')`,
      ),
    );

  const [{ medspaTenants }] = await db
    .select({ medspaTenants: sql<number>`count(*)::int` })
    .from(businessesTable)
    .where(eq(businessesTable.vertical, "medspa"));

  const [{ deLocaleTenants }] = await db
    .select({ deLocaleTenants: sql<number>`count(*)::int` })
    .from(businessesTable)
    .where(sql`${businessesTable.locale} LIKE 'de%'`);

  const [{ pendingMedspaConsents }] = await db
    .select({ pendingMedspaConsents: sql<number>`count(*)::int` })
    .from(medspaConsentRecordsTable)
    .where(eq(medspaConsentRecordsTable.status, "pending"));

  const [{ activeWaitlist }] = await db
    .select({ activeWaitlist: sql<number>`count(*)::int` })
    .from(slotWaitlistEntriesTable)
    .where(eq(slotWaitlistEntriesTable.status, "active"));

  const [{ petGroomTenants }] = await db
    .select({ petGroomTenants: sql<number>`count(*)::int` })
    .from(businessesTable)
    .where(eq(businessesTable.vertical, "pet-grooming"));

  return {
    service: "livia-api",
    version: process.env.GIT_SHA ?? process.env.RAILWAY_GIT_COMMIT_SHA ?? "dev",
    nodeEnv: process.env.NODE_ENV ?? "development",
    tenantCount,
    inngestEnabled: Boolean(process.env.INNGEST_EVENT_KEY),
    stripeConfigured: Boolean(process.env.STRIPE_SECRET_KEY),
    clerkConfigured: Boolean(process.env.CLERK_SECRET_KEY),
    timestamp: new Date().toISOString(),
    v3: {
      stuckContinuity: stuckContinuity ?? 0,
      medspaTenants: medspaTenants ?? 0,
      deLocaleTenants: deLocaleTenants ?? 0,
      pendingMedspaConsents: pendingMedspaConsents ?? 0,
      activeWaitlist: activeWaitlist ?? 0,
      petGroomTenants: petGroomTenants ?? 0,
      migrations: [
        "011-v3-pet-grooming-continuity",
        "012-v3-medspa-waitlist",
        "013-v3-enterprise-sso",
      ],
    },
  };
}
