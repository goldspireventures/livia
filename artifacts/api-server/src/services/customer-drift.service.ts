import { db, bookingsTable, customersTable, servicesTable } from "@workspace/db";
import { and, eq, inArray, sql, desc, gt, lt } from "drizzle-orm";

export type DriftCandidateRow = {
  customerId: string;
  customerName: string;
  email: string | null;
  phone: string | null;
  lastServiceName: string | null;
  lastVisitAt: string;
  daysSinceVisit: number;
};

export function draftDriftRecoveryMessage(args: {
  businessName: string;
  customerName: string;
  lastServiceName?: string | null;
  daysSinceVisit: number;
}): string {
  const first = args.customerName.split(/\s+/)[0] || "there";
  const svc = args.lastServiceName?.trim();
  const weeks = Math.max(1, Math.round(args.daysSinceVisit / 7));
  if (svc) {
    return `Hi ${first}, it's Liv from ${args.businessName}. It's been about ${weeks} week${weeks === 1 ? "" : "s"} since your ${svc} — we'd love to see you again. Reply here or book when suits you.`;
  }
  return `Hi ${first}, it's Liv from ${args.businessName}. We haven't seen you in a while and have openings this week — reply if you'd like to book again.`;
}

/**
 * Customers with a past completed/confirmed visit but no booking in the last `minDays` days
 * and no future confirmed/pending visit.
 */
export async function listCustomerDriftCandidates(
  businessId: string,
  opts?: { minDays?: number; limit?: number },
): Promise<DriftCandidateRow[]> {
  const minDays = Math.max(30, opts?.minDays ?? 90);
  const limit = Math.min(50, Math.max(1, opts?.limit ?? 15));
  const cutoff = new Date(Date.now() - minDays * 24 * 60 * 60 * 1000);

  const pastStatuses = ["COMPLETED", "CONFIRMED"] as const;

  const lastVisits = await db
    .select({
      customerId: bookingsTable.customerId,
      lastVisitAt: sql<string>`max(${bookingsTable.startAt})`.as("last_visit_at"),
    })
    .from(bookingsTable)
    .where(
      and(
        eq(bookingsTable.businessId, businessId),
        inArray(bookingsTable.status, [...pastStatuses]),
        lt(bookingsTable.startAt, new Date()),
      ),
    )
    .groupBy(bookingsTable.customerId)
    .having(sql`max(${bookingsTable.startAt}) < ${cutoff}`);

  if (lastVisits.length === 0) return [];

  const customerIds = lastVisits.map((r) => r.customerId);

  const upcoming = await db
    .selectDistinct({ customerId: bookingsTable.customerId })
    .from(bookingsTable)
    .where(
      and(
        eq(bookingsTable.businessId, businessId),
        inArray(bookingsTable.customerId, customerIds),
        inArray(bookingsTable.status, ["PENDING", "CONFIRMED"]),
        gt(bookingsTable.startAt, new Date()),
      ),
    );

  const hasUpcoming = new Set(upcoming.map((r) => r.customerId));
  const eligible = lastVisits.filter((r) => !hasUpcoming.has(r.customerId));
  if (eligible.length === 0) return [];

  const sorted = [...eligible].sort(
    (a, b) => new Date(a.lastVisitAt).getTime() - new Date(b.lastVisitAt).getTime(),
  );
  const slice = sorted.slice(0, limit);
  const sliceIds = slice.map((r) => r.customerId);

  const customers = await db
    .select()
    .from(customersTable)
    .where(
      and(eq(customersTable.businessId, businessId), inArray(customersTable.id, sliceIds)),
    );

  const byCustomer = new Map(customers.map((c) => [c.id, c]));

  const lastBookingRows = await Promise.all(
    slice.map(async (row) => {
      const [booking] = await db
        .select({
          serviceId: bookingsTable.serviceId,
          startAt: bookingsTable.startAt,
        })
        .from(bookingsTable)
        .where(
          and(
            eq(bookingsTable.businessId, businessId),
            eq(bookingsTable.customerId, row.customerId),
            inArray(bookingsTable.status, [...pastStatuses]),
          ),
        )
        .orderBy(desc(bookingsTable.startAt))
        .limit(1);
      return { customerId: row.customerId, booking };
    }),
  );

  const serviceIds = [
    ...new Set(
      lastBookingRows.map((r) => r.booking?.serviceId).filter((id): id is string => Boolean(id)),
    ),
  ];
  const serviceRows =
    serviceIds.length > 0
      ? await db
          .select({ id: servicesTable.id, name: servicesTable.name })
          .from(servicesTable)
          .where(inArray(servicesTable.id, serviceIds))
      : [];
  const serviceNameById = new Map(serviceRows.map((s) => [s.id, s.name]));

  const now = Date.now();
  return slice.map((row) => {
    const c = byCustomer.get(row.customerId);
    const lastB = lastBookingRows.find((x) => x.customerId === row.customerId)?.booking;
    const lastVisitAt = row.lastVisitAt;
    const daysSinceVisit = Math.floor(
      (now - new Date(lastVisitAt).getTime()) / (24 * 60 * 60 * 1000),
    );
    const name =
      c?.displayName?.trim() ||
      [c?.firstName, c?.lastName].filter(Boolean).join(" ").trim() ||
      "Guest";
    return {
      customerId: row.customerId,
      customerName: name,
      email: c?.email ?? null,
      phone: c?.phone ?? null,
      lastServiceName: lastB?.serviceId
        ? (serviceNameById.get(lastB.serviceId) ?? null)
        : null,
      lastVisitAt,
      daysSinceVisit,
    };
  });
}
