import { db, staffShiftsTable } from "@workspace/db";
import { eq, and, gte, lte, asc } from "drizzle-orm";
import { generateId } from "../lib/id";

export async function listStaffShifts(
  businessId: string,
  opts?: { staffId?: string; from?: Date; to?: Date },
) {
  const conditions = [eq(staffShiftsTable.businessId, businessId)];
  if (opts?.staffId) conditions.push(eq(staffShiftsTable.staffId, opts.staffId));
  if (opts?.from) conditions.push(gte(staffShiftsTable.startsAt, opts.from));
  if (opts?.to) conditions.push(lte(staffShiftsTable.endsAt, opts.to));

  return db
    .select()
    .from(staffShiftsTable)
    .where(and(...conditions))
    .orderBy(asc(staffShiftsTable.startsAt));
}

export async function createStaffShift(
  businessId: string,
  input: { staffId: string; startsAt: string; endsAt: string; label?: string },
) {
  const id = generateId();
  const [row] = await db
    .insert(staffShiftsTable)
    .values({
      id,
      businessId,
      staffId: input.staffId,
      startsAt: new Date(input.startsAt),
      endsAt: new Date(input.endsAt),
      label: input.label,
    })
    .returning();
  return row;
}

export async function deleteStaffShift(businessId: string, shiftId: string) {
  const [row] = await db
    .delete(staffShiftsTable)
    .where(
      and(eq(staffShiftsTable.id, shiftId), eq(staffShiftsTable.businessId, businessId)),
    )
    .returning();
  return row ?? null;
}
