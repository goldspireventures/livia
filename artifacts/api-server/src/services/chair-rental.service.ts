import { db, businessesTable, hostRenterLinksTable, customersTable, bookingsTable } from "@workspace/db";
import { eq, and, isNull, sql } from "drizzle-orm";
import { generateId } from "../lib/id";
import { getBusinessById } from "./businesses.service";

export type HostRenterRow = {
  id: string;
  chairLabel: string;
  weeklyRentMinor: number;
  currency: string;
  rentStatus: string;
  isActive: boolean;
  renter: { id: string; name: string; slug: string };
};

export async function listHostRenters(hostBusinessId: string): Promise<HostRenterRow[]> {
  const rows = await db
    .select({
      link: hostRenterLinksTable,
      renterName: businessesTable.name,
      renterSlug: businessesTable.slug,
    })
    .from(hostRenterLinksTable)
    .innerJoin(businessesTable, eq(hostRenterLinksTable.renterBusinessId, businessesTable.id))
    .where(
      and(
        eq(hostRenterLinksTable.hostBusinessId, hostBusinessId),
        isNull(hostRenterLinksTable.endedAt),
      ),
    );

  return rows.map((r) => ({
    id: r.link.id,
    chairLabel: r.link.chairLabel,
    weeklyRentMinor: r.link.weeklyRentMinor,
    currency: r.link.currency,
    rentStatus: r.link.rentStatus,
    isActive: r.link.isActive,
    renter: {
      id: r.link.renterBusinessId,
      name: r.renterName,
      slug: r.renterSlug,
    },
  }));
}

export async function linkHostRenter(
  hostBusinessId: string,
  input: {
    renterBusinessId: string;
    chairLabel: string;
    weeklyRentMinor?: number;
    currency?: string;
  },
) {
  const host = await getBusinessById(hostBusinessId);
  const renter = await getBusinessById(input.renterBusinessId);
  if (!host || !renter) return null;
  if (host.id === renter.id) return null;

  const id = generateId();
  const [row] = await db
    .insert(hostRenterLinksTable)
    .values({
      id,
      hostBusinessId,
      renterBusinessId: input.renterBusinessId,
      chairLabel: input.chairLabel.trim(),
      weeklyRentMinor: input.weeklyRentMinor ?? 0,
      currency: input.currency ?? host.currency ?? "EUR",
    })
    .returning();
  return row ?? null;
}

export async function updateHostRenterRentStatus(
  hostBusinessId: string,
  linkId: string,
  rentStatus: "due" | "paid" | "waived",
) {
  const [row] = await db
    .update(hostRenterLinksTable)
    .set({ rentStatus, updatedAt: new Date() })
    .where(
      and(
        eq(hostRenterLinksTable.id, linkId),
        eq(hostRenterLinksTable.hostBusinessId, hostBusinessId),
      ),
    )
    .returning();
  return row ?? null;
}

export async function getHostDashboardSummary(hostBusinessId: string) {
  const renters = await listHostRenters(hostBusinessId);
  const activeChairs = renters.filter((r) => r.isActive).length;
  const dueCount = renters.filter((r) => r.rentStatus === "due").length;
  const dueTotalMinor = renters
    .filter((r) => r.rentStatus === "due")
    .reduce((s, r) => s + r.weeklyRentMinor, 0);
  return {
    activeChairs,
    totalChairs: renters.length,
    rentDueCount: dueCount,
    rentDueTotalMinor: dueTotalMinor,
    renters,
  };
}

/** End chair rental; renter retains full customer CRM export (GDPR portability). */
export async function endHostRenterLink(
  hostBusinessId: string,
  linkId: string,
): Promise<{
  link: typeof hostRenterLinksTable.$inferSelect;
  portability: {
    renterBusinessId: string;
    customerCount: number;
    customers: Array<{
      id: string;
      displayName: string | null;
      phone: string | null;
      email: string | null;
      bookingCount: number;
    }>;
  };
} | null> {
  const [link] = await db
    .select()
    .from(hostRenterLinksTable)
    .where(
      and(
        eq(hostRenterLinksTable.id, linkId),
        eq(hostRenterLinksTable.hostBusinessId, hostBusinessId),
        isNull(hostRenterLinksTable.endedAt),
      ),
    );
  if (!link) return null;

  const customers = await db
    .select()
    .from(customersTable)
    .where(eq(customersTable.businessId, link.renterBusinessId));

  const enriched = [];
  for (const c of customers) {
    const [countRow] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(bookingsTable)
      .where(
        and(eq(bookingsTable.businessId, link.renterBusinessId), eq(bookingsTable.customerId, c.id)),
      );
    enriched.push({
      id: c.id,
      displayName: c.displayName,
      phone: c.phone,
      email: c.email,
      bookingCount: countRow?.count ?? 0,
    });
  }

  const now = new Date();
  const [updated] = await db
    .update(hostRenterLinksTable)
    .set({
      isActive: false,
      endedAt: now,
      portabilityExportedAt: now,
      updatedAt: now,
    })
    .where(eq(hostRenterLinksTable.id, linkId))
    .returning();

  return {
    link: updated!,
    portability: {
      renterBusinessId: link.renterBusinessId,
      customerCount: enriched.length,
      customers: enriched,
    },
  };
}
