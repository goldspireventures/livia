// "My Day" — staff-scoped slice of a business. Read-only.
// Returns: today's appointments assigned to me, my next appointment,
// the customers I've served before, and a small ack-counter for the UI.
//
// Filtering rule: if `staffId` is set we filter all reads to that
// staff member. If unset (e.g. STAFF user has no staff row yet) we
// return an empty payload rather than fall back to "all" — that
// fallback would leak cross-staff data.

import { db, bookingsTable, customersTable } from "@workspace/db";
import { and, eq, gte, lte, inArray, sql, desc } from "drizzle-orm";
import { enrichBooking } from "./bookings.service";

export async function getMyDay(businessId: string, staffId: string | null) {
  if (!staffId) {
    return {
      staffId: null,
      today: [],
      next: null,
      myCustomers: [],
      todayCount: 0,
      weekCount: 0,
    };
  }

  const now = new Date();
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date(now);
  todayEnd.setHours(23, 59, 59, 999);
  const weekEnd = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  const todayRaw = await db
    .select()
    .from(bookingsTable)
    .where(
      and(
        eq(bookingsTable.businessId, businessId),
        eq(bookingsTable.staffId, staffId),
        gte(bookingsTable.startAt, todayStart),
        lte(bookingsTable.startAt, todayEnd),
        inArray(bookingsTable.status, ["PENDING", "CONFIRMED", "COMPLETED"]),
      ),
    )
    .orderBy(bookingsTable.startAt);

  const today = await Promise.all(todayRaw.map(enrichBooking));

  const next =
    today.find(
      (b) => new Date(b.startAt) >= now && (b.status === "CONFIRMED" || b.status === "PENDING"),
    ) ?? null;

  const [weekCountRow] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(bookingsTable)
    .where(
      and(
        eq(bookingsTable.businessId, businessId),
        eq(bookingsTable.staffId, staffId),
        gte(bookingsTable.startAt, now),
        lte(bookingsTable.startAt, weekEnd),
        inArray(bookingsTable.status, ["PENDING", "CONFIRMED"]),
      ),
    );

  // "My customers" = anyone I've served (or am scheduled to serve) in
  // this business. Distinct on customerId, sorted by most-recent.
  const customerRows = await db
    .selectDistinct({ customerId: bookingsTable.customerId, lastAt: bookingsTable.startAt })
    .from(bookingsTable)
    .where(
      and(eq(bookingsTable.businessId, businessId), eq(bookingsTable.staffId, staffId)),
    )
    .orderBy(desc(bookingsTable.startAt))
    .limit(50);

  const customerIds = Array.from(new Set(customerRows.map((r) => r.customerId)));
  const customers = customerIds.length
    ? await db
        .select()
        .from(customersTable)
        .where(
          and(eq(customersTable.businessId, businessId), inArray(customersTable.id, customerIds)),
        )
    : [];

  // Preserve recency order
  const customerMap = new Map(customers.map((c) => [c.id, c]));
  const myCustomers = customerIds
    .map((id) => customerMap.get(id))
    .filter((c): c is (typeof customers)[number] => !!c);

  return {
    staffId,
    today,
    next,
    myCustomers,
    todayCount: today.length,
    weekCount: weekCountRow?.count ?? 0,
  };
}
