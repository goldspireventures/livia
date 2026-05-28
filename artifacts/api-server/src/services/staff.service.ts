import { db, staffTable, staffServicesTable, servicesTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { generateId } from "../lib/id";

export async function listStaff(
  businessId: string,
  opts?: { isActive?: boolean; serviceId?: string },
) {
  const { isActive, serviceId } = opts ?? {};
  if (serviceId) {
    const conditions = [
      eq(staffTable.businessId, businessId),
      eq(staffServicesTable.serviceId, serviceId),
    ];
    if (isActive !== undefined) conditions.push(eq(staffTable.isActive, isActive));
    const rows = await db
      .select({ staff: staffTable })
      .from(staffTable)
      .innerJoin(staffServicesTable, eq(staffServicesTable.staffId, staffTable.id))
      .where(and(...conditions));
    return rows.map((r) => r.staff);
  }
  const conditions = [eq(staffTable.businessId, businessId)];
  if (isActive !== undefined) conditions.push(eq(staffTable.isActive, isActive));
  return db.select().from(staffTable).where(and(...conditions));
}

export async function getStaffById(businessId: string, staffId: string) {
  const [s] = await db
    .select()
    .from(staffTable)
    .where(and(eq(staffTable.id, staffId), eq(staffTable.businessId, businessId)));
  return s ?? null;
}

export async function createStaff(
  businessId: string,
  data: {
    firstName: string;
    lastName?: string;
    displayName: string;
    email?: string;
    phone?: string;
    photoUrl?: string;
    bio?: string;
    color?: string;
  },
) {
  const [s] = await db
    .insert(staffTable)
    .values({ id: generateId(), businessId, ...data })
    .returning();
  return s;
}

export async function updateStaff(
  businessId: string,
  staffId: string,
  data: Partial<typeof staffTable.$inferInsert>,
) {
  const [s] = await db
    .update(staffTable)
    .set({ ...data, updatedAt: new Date() })
    .where(and(eq(staffTable.id, staffId), eq(staffTable.businessId, businessId)))
    .returning();
  return s ?? null;
}

export async function deactivateStaff(businessId: string, staffId: string) {
  const [s] = await db
    .update(staffTable)
    .set({ isActive: false, updatedAt: new Date() })
    .where(and(eq(staffTable.id, staffId), eq(staffTable.businessId, businessId)))
    .returning();
  return s ?? null;
}

export async function getStaffServicesForStaff(businessId: string, staffId: string) {
  const assignments = await db
    .select({ serviceId: staffServicesTable.serviceId })
    .from(staffServicesTable)
    .where(eq(staffServicesTable.staffId, staffId));

  if (!assignments.length) return [];

  const serviceIds = assignments.map((a) => a.serviceId);
  const services = await Promise.all(
    serviceIds.map((id) =>
      db
        .select()
        .from(servicesTable)
        .where(and(eq(servicesTable.id, id), eq(servicesTable.businessId, businessId))),
    ),
  );
  return services.flat();
}

export async function setStaffServices(staffId: string, serviceIds: string[]) {
  await db.delete(staffServicesTable).where(eq(staffServicesTable.staffId, staffId));
  if (serviceIds.length > 0) {
    await db.insert(staffServicesTable).values(
      serviceIds.map((serviceId) => ({ staffId, serviceId })),
    );
  }
}
