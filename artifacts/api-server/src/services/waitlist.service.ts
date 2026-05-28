import { db, slotWaitlistEntriesTable, customersTable } from "@workspace/db";
import { and, asc, eq } from "drizzle-orm";
import { generateId } from "../lib/id";

export async function joinSlotWaitlist(args: {
  businessId: string;
  serviceId?: string;
  preferredStaffId?: string;
  customerId?: string;
  phone?: string;
  email?: string;
  notes?: string;
}) {
  const id = generateId();
  const [row] = await db
    .insert(slotWaitlistEntriesTable)
    .values({
      id,
      businessId: args.businessId,
      customerId: args.customerId ?? null,
      serviceId: args.serviceId ?? null,
      preferredStaffId: args.preferredStaffId ?? null,
      phone: args.phone?.trim() || null,
      email: args.email?.trim() || null,
      notes: args.notes?.trim() || null,
      status: "active",
    })
    .returning();
  return row!;
}

export async function listActiveWaitlist(businessId: string, limit = 100) {
  return db
    .select()
    .from(slotWaitlistEntriesTable)
    .where(
      and(
        eq(slotWaitlistEntriesTable.businessId, businessId),
        eq(slotWaitlistEntriesTable.status, "active"),
      ),
    )
    .orderBy(asc(slotWaitlistEntriesTable.createdAt))
    .limit(limit);
}

/** First matching active entry for service/staff when a slot opens */
export async function popNextWaitlistCandidate(args: {
  businessId: string;
  serviceId: string;
  staffId?: string;
}) {
  const rows = await db
    .select()
    .from(slotWaitlistEntriesTable)
    .where(
      and(
        eq(slotWaitlistEntriesTable.businessId, args.businessId),
        eq(slotWaitlistEntriesTable.status, "active"),
        eq(slotWaitlistEntriesTable.serviceId, args.serviceId),
      ),
    )
    .orderBy(asc(slotWaitlistEntriesTable.createdAt))
    .limit(20);

  const match =
    rows.find(
      (r) =>
        !r.preferredStaffId ||
        r.preferredStaffId === args.staffId ||
        !args.staffId,
    ) ?? rows[0];
  return match ?? null;
}

export async function markWaitlistOffered(entryId: string, bookingId: string) {
  const [row] = await db
    .update(slotWaitlistEntriesTable)
    .set({
      status: "offered",
      offeredBookingId: bookingId,
      offeredAt: new Date(),
      expiresAt: new Date(Date.now() + 2 * 60 * 60 * 1000),
      updatedAt: new Date(),
    })
    .where(eq(slotWaitlistEntriesTable.id, entryId))
    .returning();
  return row ?? null;
}

export async function resolveWaitlistContact(entry: {
  customerId: string | null;
  phone: string | null;
  email: string | null;
  businessId: string;
}) {
  if (entry.customerId) {
    const [c] = await db
      .select()
      .from(customersTable)
      .where(eq(customersTable.id, entry.customerId))
      .limit(1);
    if (c) return { phone: c.phone, email: c.email, name: c.displayName };
  }
  return { phone: entry.phone, email: entry.email, name: null };
}

export async function countActiveWaitlist(businessId: string): Promise<number> {
  const rows = await listActiveWaitlist(businessId, 500);
  return rows.length;
}
