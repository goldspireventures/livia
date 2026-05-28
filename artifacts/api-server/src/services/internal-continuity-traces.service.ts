import { db, bookingsTable, businessesTable, customersTable } from "@workspace/db";
import { desc, eq, sql } from "drizzle-orm";

export type ContinuityTraceRow = {
  bookingId: string;
  businessId: string;
  businessName: string;
  businessSlug: string;
  customerName: string | null;
  status: string;
  pendingReason: string | null;
  continuitySentAt: string | null;
  startAt: string;
};

export async function listPlatformContinuityTraces(limit = 75): Promise<ContinuityTraceRow[]> {
  const rows = await db
    .select({
      bookingId: bookingsTable.id,
      businessId: bookingsTable.businessId,
      businessName: businessesTable.name,
      businessSlug: businessesTable.slug,
      customerFirst: customersTable.firstName,
      customerLast: customersTable.lastName,
      customerDisplay: customersTable.displayName,
      status: bookingsTable.status,
      pendingReason: bookingsTable.pendingReason,
      continuitySentAt: bookingsTable.continuitySentAt,
      startAt: bookingsTable.startAt,
    })
    .from(bookingsTable)
    .innerJoin(businessesTable, eq(bookingsTable.businessId, businessesTable.id))
    .leftJoin(customersTable, eq(bookingsTable.customerId, customersTable.id))
    .where(
      sql`(
        ${bookingsTable.pendingReason} = 'awaiting_continuity'
        OR ${bookingsTable.continuitySentAt} IS NOT NULL
      )`,
    )
    .orderBy(desc(bookingsTable.createdAt))
    .limit(limit);

  return rows.map((r) => ({
    bookingId: r.bookingId,
    businessId: r.businessId,
    businessName: r.businessName,
    businessSlug: r.businessSlug,
    customerName:
      r.customerDisplay ??
      ([r.customerFirst, r.customerLast].filter(Boolean).join(" ") || null),
    status: r.status,
    pendingReason: r.pendingReason,
    continuitySentAt: r.continuitySentAt?.toISOString() ?? null,
    startAt: r.startAt.toISOString(),
  }));
}
