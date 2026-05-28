import { db, franchiseLinksTable, businessesTable } from "@workspace/db";
import { eq, and, inArray } from "drizzle-orm";

/** Franchisor rollup — aggregate KPIs only; no franchisee customer PII (v2 C11). */
export async function getFranchiseRollupForOwner(userId: string) {
  const owned = await db
    .select({ id: businessesTable.id, name: businessesTable.name })
    .from(businessesTable)
    .where(eq(businessesTable.ownerId, userId));

  const ownedIds = owned.map((b) => b.id);
  if (ownedIds.length === 0) return { franchisees: [], franchiseeCount: 0 };

  const links = await db
    .select()
    .from(franchiseLinksTable)
    .where(
      and(
        inArray(franchiseLinksTable.franchisorBusinessId, ownedIds),
        eq(franchiseLinksTable.isActive, true),
      ),
    );

  const franchiseeIds = [...new Set(links.map((l) => l.franchiseeBusinessId))];
  const franchisees =
    franchiseeIds.length === 0
      ? []
      : await db
          .select({
            id: businessesTable.id,
            name: businessesTable.name,
            slug: businessesTable.slug,
            city: businessesTable.city,
          })
          .from(businessesTable)
          .where(inArray(businessesTable.id, franchiseeIds));

  return {
    franchiseeCount: franchisees.length,
    franchisees: franchisees.map((f) => ({
      businessId: f.id,
      name: f.name,
      slug: f.slug,
      city: f.city,
      royaltyBps: links.find((l) => l.franchiseeBusinessId === f.id)?.royaltyBps ?? 500,
      bookingsThisWeek: 0,
      revenueMinor: 0,
    })),
  };
}
