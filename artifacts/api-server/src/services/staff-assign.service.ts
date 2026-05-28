import {
  db,
  staffTable,
  staffServicesTable,
  bookingsTable,
  customersTable,
  availabilityRulesTable,
  timeOffTable,
} from "@workspace/db";
import { and, eq, gte, lte, sql } from "drizzle-orm";

export type StaffAssignCandidate = {
  staffId: string;
  displayName: string | null;
  score: number;
};

export async function assignStaffForBooking(args: {
  businessId: string;
  serviceId: string;
  startAt: Date;
  endAt: Date;
  customerId?: string;
  preferredStaffId?: string | null;
}): Promise<string | null> {
  const candidates = await rankStaffForSlot(args);
  return candidates[0]?.staffId ?? null;
}

export async function rankStaffForSlot(args: {
  businessId: string;
  serviceId: string;
  startAt: Date;
  endAt: Date;
  customerId?: string;
  preferredStaffId?: string | null;
}): Promise<StaffAssignCandidate[]> {
  const eligible = await db
    .select({ staffId: staffServicesTable.staffId, displayName: staffTable.displayName })
    .from(staffServicesTable)
    .innerJoin(staffTable, eq(staffTable.id, staffServicesTable.staffId))
    .where(
      and(
        eq(staffTable.businessId, args.businessId),
        eq(staffServicesTable.serviceId, args.serviceId),
        eq(staffTable.isActive, true),
      ),
    );

  if (eligible.length === 0) return [];

  let preferred: string | null = args.preferredStaffId ?? null;
  if (!preferred && args.customerId) {
    const [cust] = await db
      .select({ preferredStaffId: customersTable.preferredStaffId })
      .from(customersTable)
      .where(
        and(eq(customersTable.id, args.customerId), eq(customersTable.businessId, args.businessId)),
      )
      .limit(1);
    preferred = cust?.preferredStaffId ?? null;
  }

  const dayOfWeek = args.startAt.getDay();
  const scored: StaffAssignCandidate[] = [];

  for (const row of eligible) {
    let score = 50;
    if (preferred && row.staffId === preferred) score += 40;

    const [avail] = await db
      .select({ id: availabilityRulesTable.id })
      .from(availabilityRulesTable)
      .where(
        and(
          eq(availabilityRulesTable.businessId, args.businessId),
          eq(availabilityRulesTable.staffId, row.staffId),
          eq(availabilityRulesTable.dayOfWeek, dayOfWeek),
        ),
      )
      .limit(1);
    if (!avail) score -= 30;

    const [off] = await db
      .select({ id: timeOffTable.id })
      .from(timeOffTable)
      .where(
        and(
          eq(timeOffTable.businessId, args.businessId),
          eq(timeOffTable.staffId, row.staffId),
          lte(timeOffTable.startsAt, args.endAt),
          gte(timeOffTable.endsAt, args.startAt),
        ),
      )
      .limit(1);
    if (off) score -= 100;

    const [conflict] = await db
      .select({ id: bookingsTable.id })
      .from(bookingsTable)
      .where(
        and(
          eq(bookingsTable.businessId, args.businessId),
          eq(bookingsTable.staffId, row.staffId),
          lte(bookingsTable.startAt, args.endAt),
          gte(bookingsTable.endAt, args.startAt),
          sql`${bookingsTable.status} NOT IN ('CANCELLED', 'NO_SHOW')`,
        ),
      )
      .limit(1);
    if (conflict) score -= 100;

    const [{ count }] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(bookingsTable)
      .where(
        and(
          eq(bookingsTable.businessId, args.businessId),
          eq(bookingsTable.staffId, row.staffId),
          gte(bookingsTable.startAt, new Date(args.startAt.getTime() - 7 * 86400_000)),
          sql`${bookingsTable.status} NOT IN ('CANCELLED')`,
        ),
      );
    score -= Math.min(20, count ?? 0);

    scored.push({ staffId: row.staffId, displayName: row.displayName, score });
  }

  return scored.filter((s) => s.score > 0).sort((a, b) => b.score - a.score);
}
