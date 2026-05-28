import { db, customersTable, bookingsTable, channelIdentitiesTable } from "@workspace/db";
import { eq, and, or, ilike, sql, desc, inArray } from "drizzle-orm";
import { generateId } from "../lib/id";

// STAFF-scoped: list customers I (the staff row) have served. Mirrors
// the shape of `listCustomers` so the route can swap them transparently.
// When `staffId` is null (a STAFF user has no linked staff row yet) we
// return an empty page instead of leaking the full roster.
export async function listCustomersServedByStaff(
  businessId: string,
  staffId: string | null,
  opts: { search?: string; isBlocked?: boolean; limit?: number; offset?: number },
) {
  if (!staffId) return { data: [], total: 0, limit: opts.limit ?? 50, offset: opts.offset ?? 0 };
  const { search, isBlocked, limit = 50, offset = 0 } = opts;

  const servedRows = await db
    .selectDistinct({ customerId: bookingsTable.customerId })
    .from(bookingsTable)
    .where(and(eq(bookingsTable.businessId, businessId), eq(bookingsTable.staffId, staffId)));
  const ids = servedRows.map((r) => r.customerId);
  if (ids.length === 0) return { data: [], total: 0, limit, offset };

  const conditions = [eq(customersTable.businessId, businessId), inArray(customersTable.id, ids)];
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

export async function isCustomerServedByStaff(
  businessId: string,
  customerId: string,
  staffId: string,
): Promise<boolean> {
  const [hit] = await db
    .select({ id: bookingsTable.id })
    .from(bookingsTable)
    .where(
      and(
        eq(bookingsTable.businessId, businessId),
        eq(bookingsTable.customerId, customerId),
        eq(bookingsTable.staffId, staffId),
      ),
    )
    .limit(1);
  return !!hit;
}

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

  const channelIdentities = await db
    .select()
    .from(channelIdentitiesTable)
    .where(
      and(
        eq(channelIdentitiesTable.businessId, businessId),
        eq(channelIdentitiesTable.customerId, customerId),
      ),
    );

  return {
    ...customer,
    recentBookings,
    totalBookings: countResult?.count ?? 0,
    noShowCount: customer.noShowCount ?? noShowResult?.count ?? 0,
    channelIdentities,
  };
}

export async function lookupCustomersForLiv(
  businessId: string,
  query: string,
  limit = 8,
) {
  return listCustomers(businessId, { search: query, limit, offset: 0 });
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
