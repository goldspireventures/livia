import { db, shiftTemplatesTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { generateId } from "../lib/id";
import { materializeShiftTemplatesWeek } from "./demo-operational-cases.seed";

export async function listShiftTemplates(businessId: string) {
  return db
    .select()
    .from(shiftTemplatesTable)
    .where(eq(shiftTemplatesTable.businessId, businessId));
}

export async function createShiftTemplate(args: {
  businessId: string;
  name: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  label?: string;
  roleHint?: string;
  minStaff?: number;
}) {
  const id = generateId();
  const [row] = await db
    .insert(shiftTemplatesTable)
    .values({
      id,
      businessId: args.businessId,
      name: args.name,
      dayOfWeek: args.dayOfWeek,
      startTime: args.startTime,
      endTime: args.endTime,
      label: args.label ?? null,
      roleHint: args.roleHint ?? null,
      minStaff: args.minStaff ?? 1,
    })
    .returning();
  return row;
}

export async function applyShiftTemplatesForWeek(
  businessId: string,
  weekStart: Date,
  staffIds: string[],
) {
  return materializeShiftTemplatesWeek(businessId, weekStart, staffIds);
}

export { materializeShiftTemplatesWeek };
