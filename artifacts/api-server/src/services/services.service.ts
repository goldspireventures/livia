import { db, servicesTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { generateId } from "../lib/id";
import { getBusinessById } from "./businesses.service";

export async function listServices(businessId: string, isActive?: boolean) {
  const conditions = [eq(servicesTable.businessId, businessId)];
  if (isActive !== undefined) conditions.push(eq(servicesTable.isActive, isActive));
  return db.select().from(servicesTable).where(and(...conditions));
}

export async function getServiceById(businessId: string, serviceId: string) {
  const [s] = await db
    .select()
    .from(servicesTable)
    .where(and(eq(servicesTable.id, serviceId), eq(servicesTable.businessId, businessId)));
  return s ?? null;
}

export async function createService(
  businessId: string,
  data: {
    name: string;
    description?: string;
    category?: string;
    durationMinutes: number;
    bufferBeforeMinutes?: number;
    bufferAfterMinutes?: number;
    priceMinor?: number;
    currency?: string;
    imageUrl?: string;
    sortOrder?: number;
  },
) {
  let currency = data.currency;
  if (!currency) {
    const biz = await getBusinessById(businessId);
    currency = biz?.currency ?? "EUR";
  }

  const [s] = await db
    .insert(servicesTable)
    .values({
      id: generateId(),
      businessId,
      name: data.name,
      description: data.description,
      category: data.category,
      durationMinutes: data.durationMinutes,
      bufferBeforeMinutes: data.bufferBeforeMinutes ?? 0,
      bufferAfterMinutes: data.bufferAfterMinutes ?? 0,
      priceMinor: data.priceMinor ?? 0,
      currency,
      imageUrl: data.imageUrl,
      sortOrder: data.sortOrder ?? 0,
    })
    .returning();
  return s;
}

export async function updateService(
  businessId: string,
  serviceId: string,
  data: Partial<typeof servicesTable.$inferInsert>,
) {
  const [s] = await db
    .update(servicesTable)
    .set({ ...data, updatedAt: new Date() })
    .where(and(eq(servicesTable.id, serviceId), eq(servicesTable.businessId, businessId)))
    .returning();
  return s ?? null;
}

export async function deactivateService(businessId: string, serviceId: string) {
  const [s] = await db
    .update(servicesTable)
    .set({ isActive: false, updatedAt: new Date() })
    .where(and(eq(servicesTable.id, serviceId), eq(servicesTable.businessId, businessId)))
    .returning();
  return s ?? null;
}
