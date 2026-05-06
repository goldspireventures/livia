import { db, customersTable, bookingsTable } from "@workspace/db";
import { eq, and, or, ilike, sql, desc } from "drizzle-orm";
import { generateId } from "../lib/id";

export async function listCustomers(
  businessId: string,
  opts: { search?: string; isBlocked?: boolean; limit?: number; offset?: number },
) {
  const { search, isBlocked, limit = 50, offset = 0 } = opts;

  const conditions = [eq(customersTable.businessId, businessId)];
  if (isBlocked !== undefined) conditions.push(eq(customersTable.isBlocked, isBlocked));
  if (search) {
    conditions.push(
      or(
        ilike(customersTable.displayName, `%${search}%`),
        ilike(customersTable.firstName, `%${search}%`),
        ilike(customersTable.lastName, `%${search}%`),
        ilike(customersTable.email, `%${search}%`),
        ilike(customersTable.phone, `%${search}%`),
      )!,
    );
  }

  const whereClause = and(...conditions);

  const [countResult] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(customersTable)
    .where(whereClause);

  const data = await db
    .select()
    .from(customersTable)
    .where(whereClause)
    .limit(limit)
    .offset(offset)
    .orderBy(desc(customersTable.createdAt));

  return { data, total: countResult?.count ?? 0, limit, offset };
}

export async function getCustomerById(businessId: string, customerId: string) {
  const [c] = await db
    .select()
    .from(customersTable)
    .where(and(eq(customersTable.id, customerId), eq(customersTable.businessId, businessId)));
  return c ?? null;
}

export async function getCustomerDetail(businessId: string, customerId: string) {
  const customer = await getCustomerById(businessId, customerId);
  if (!customer) return null;

  const recentBookings = await db
    .select()
    .from(bookingsTable)
    .where(
      and(eq(bookingsTable.customerId, customerId), eq(bookingsTable.businessId, businessId)),
    )
    .orderBy(desc(bookingsTable.startAt))
    .limit(10);

  const [countResult] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(bookingsTable)
    .where(and(eq(bookingsTable.customerId, customerId), eq(bookingsTable.businessId, businessId)));

  const [noShowResult] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(bookingsTable)
    .where(
      and(
        eq(bookingsTable.customerId, customerId),
        eq(bookingsTable.businessId, businessId),
        eq(bookingsTable.status, "NO_SHOW"),
      ),
    );

  return {
    ...customer,
    recentBookings,
    totalBookings: countResult?.count ?? 0,
    noShowCount: noShowResult?.count ?? 0,
  };
}

export async function findOrCreateCustomer(
  businessId: string,
  data: {
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
  },
): Promise<typeof customersTable.$inferSelect> {
  if (data.email) {
    const [existing] = await db
      .select()
      .from(customersTable)
      .where(and(eq(customersTable.businessId, businessId), eq(customersTable.email, data.email)));
    if (existing) return existing;
  } else if (data.phone) {
    const [existing] = await db
      .select()
      .from(customersTable)
      .where(
        and(eq(customersTable.businessId, businessId), eq(customersTable.phone, data.phone)),
      );
    if (existing) return existing;
  }

  const displayName =
    [data.firstName, data.lastName].filter(Boolean).join(" ") ||
    data.email?.split("@")[0] ||
    data.phone ||
    "Unknown";

  const [c] = await db
    .insert(customersTable)
    .values({
      id: generateId(),
      businessId,
      firstName: data.firstName,
      lastName: data.lastName,
      displayName,
      email: data.email,
      phone: data.phone,
    })
    .returning();
  return c;
}

export async function createCustomer(businessId: string, data: Partial<typeof customersTable.$inferInsert>) {
  const displayName =
    [data.firstName, data.lastName].filter(Boolean).join(" ") ||
    data.email?.split("@")[0] ||
    data.phone ||
    "Unknown";

  const [c] = await db
    .insert(customersTable)
    .values({ id: generateId(), businessId, displayName, ...data })
    .returning();
  return c;
}

export async function updateCustomer(
  businessId: string,
  customerId: string,
  data: Partial<typeof customersTable.$inferInsert>,
) {
  const [c] = await db
    .update(customersTable)
    .set({ ...data, updatedAt: new Date() })
    .where(and(eq(customersTable.id, customerId), eq(customersTable.businessId, businessId)))
    .returning();
  return c ?? null;
}
