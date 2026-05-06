import { db, businessesTable, businessMembershipsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { generateId } from "../lib/id";

export async function getBusinessById(id: string) {
  const [biz] = await db.select().from(businessesTable).where(eq(businessesTable.id, id));
  return biz ?? null;
}

export async function getBusinessBySlug(slug: string) {
  const [biz] = await db.select().from(businessesTable).where(eq(businessesTable.slug, slug));
  return biz ?? null;
}

export async function getBusinessesForUser(userId: string) {
  const memberships = await db
    .select({ businessId: businessMembershipsTable.businessId })
    .from(businessMembershipsTable)
    .where(eq(businessMembershipsTable.userId, userId));

  const ownedBusinesses = await db
    .select()
    .from(businessesTable)
    .where(eq(businessesTable.ownerId, userId));

  const memberBusinessIds = memberships.map((m) => m.businessId);
  const memberBusinesses =
    memberBusinessIds.length > 0
      ? await Promise.all(
          memberBusinessIds.map((id) =>
            db.select().from(businessesTable).where(eq(businessesTable.id, id)),
          ),
        ).then((results) => results.flat())
      : [];

  const allMap = new Map<string, typeof ownedBusinesses[0]>();
  for (const b of [...ownedBusinesses, ...memberBusinesses]) {
    allMap.set(b.id, b);
  }
  return Array.from(allMap.values());
}

export async function createBusiness(
  ownerId: string,
  data: {
    name: string;
    slug: string;
    description?: string;
    category?: string;
    email?: string;
    phone?: string;
    timezone?: string;
    city?: string;
    country?: string;
    logoUrl?: string;
    instagramHandle?: string;
  },
) {
  const id = generateId();

  const [biz] = await db
    .insert(businessesTable)
    .values({
      id,
      ownerId,
      name: data.name,
      slug: data.slug,
      description: data.description,
      category: data.category,
      email: data.email,
      phone: data.phone,
      timezone: data.timezone ?? "Europe/London",
      city: data.city,
      country: data.country ?? "GB",
      logoUrl: data.logoUrl,
      instagramHandle: data.instagramHandle,
    })
    .returning();

  // Auto-enroll owner as OWNER membership
  await db.insert(businessMembershipsTable).values({
    id: generateId(),
    businessId: id,
    userId: ownerId,
    role: "OWNER",
  });

  return biz;
}

export async function updateBusiness(id: string, data: Partial<typeof businessesTable.$inferInsert>) {
  const [updated] = await db
    .update(businessesTable)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(businessesTable.id, id))
    .returning();
  return updated ?? null;
}

export async function userHasAccessToBusiness(userId: string, businessId: string): Promise<boolean> {
  const [owned] = await db
    .select({ id: businessesTable.id })
    .from(businessesTable)
    .where(and(eq(businessesTable.id, businessId), eq(businessesTable.ownerId, userId)));
  if (owned) return true;

  const [member] = await db
    .select()
    .from(businessMembershipsTable)
    .where(
      and(
        eq(businessMembershipsTable.businessId, businessId),
        eq(businessMembershipsTable.userId, userId),
      ),
    );
  return !!member;
}
