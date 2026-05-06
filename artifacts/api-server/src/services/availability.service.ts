import { db, availabilityRulesTable, timeOffTable } from "@workspace/db";
import { eq, and, gte, lte } from "drizzle-orm";
import { generateId } from "../lib/id";

export async function listAvailabilityRules(businessId: string, staffId?: string) {
  if (staffId) {
    return db
      .select()
      .from(availabilityRulesTable)
      .where(eq(availabilityRulesTable.staffId, staffId));
  }
  return db
    .select()
    .from(availabilityRulesTable)
    .where(eq(availabilityRulesTable.businessId, businessId));
}

export async function setAvailabilityRules(
  businessId: string,
  rules: Array<{ dayOfWeek: number; startTime: string; endTime: string }>,
  staffId?: string,
) {
  if (staffId) {
    await db
      .delete(availabilityRulesTable)
      .where(eq(availabilityRulesTable.staffId, staffId));
  } else {
    await db
      .delete(availabilityRulesTable)
      .where(
        and(
          eq(availabilityRulesTable.businessId, businessId),
          eq(availabilityRulesTable.staffId, null as any),
        ),
      );
  }

  if (rules.length === 0) return [];

  const inserted = await db
    .insert(availabilityRulesTable)
    .values(
      rules.map((r) => ({
        id: generateId(),
        businessId,
        staffId: staffId ?? null,
        dayOfWeek: r.dayOfWeek,
        startTime: r.startTime,
        endTime: r.endTime,
      })),
    )
    .returning();

  return inserted;
}

export async function listTimeOff(
  businessId: string,
  opts: { staffId?: string; from?: string; to?: string },
) {
  const conditions = [eq(timeOffTable.businessId, businessId)];
  if (opts.staffId) conditions.push(eq(timeOffTable.staffId, opts.staffId));
  if (opts.from) conditions.push(gte(timeOffTable.endsAt, new Date(opts.from)));
  if (opts.to) conditions.push(lte(timeOffTable.startsAt, new Date(opts.to)));
  return db.select().from(timeOffTable).where(and(...conditions));
}

export async function createTimeOff(
  businessId: string,
  data: { staffId?: string; startsAt: string; endsAt: string; reason?: string },
) {
  const [t] = await db
    .insert(timeOffTable)
    .values({
      id: generateId(),
      businessId,
      staffId: data.staffId ?? null,
      startsAt: new Date(data.startsAt),
      endsAt: new Date(data.endsAt),
      reason: data.reason,
    })
    .returning();
  return t;
}

export async function deleteTimeOff(businessId: string, timeOffId: string) {
  const [t] = await db
    .delete(timeOffTable)
    .where(and(eq(timeOffTable.id, timeOffId), eq(timeOffTable.businessId, businessId)))
    .returning();
  return t ?? null;
}
