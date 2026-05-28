import { eq } from "drizzle-orm";
import { db, businessesTable, franchiseLinksTable } from "@workspace/db";
import { generateId } from "../lib/id";
import { linkHostRenter, listHostRenters, updateHostRenterRentStatus } from "./chair-rental.service";

/** Demo chair-host + franchise links for hierarchy Phase 4 showcase. */
export async function seedDemoHierarchyLinks(): Promise<{
  hostLinkId: string | null;
  franchiseLinkId: string | null;
}> {
  let hostLinkId: string | null = null;
  let franchiseLinkId: string | null = null;

  const [host] = await db
    .select({ id: businessesTable.id })
    .from(businessesTable)
    .where(eq(businessesTable.slug, "aurora-studio"))
    .limit(1);
  const [renter] = await db
    .select({ id: businessesTable.id })
    .from(businessesTable)
    .where(eq(businessesTable.slug, "conors-cut-co"))
    .limit(1);

  if (host && renter) {
    await db
      .update(businessesTable)
      .set({ tier: "chair-host" })
      .where(eq(businessesTable.id, host.id));

    const renters = await listHostRenters(host.id);
    let linkId = renters.find((r) => r.renter.id === renter.id)?.id;
    if (!linkId) {
      const row = await linkHostRenter(host.id, {
        renterBusinessId: renter.id,
        chairLabel: "Chair 3 — window",
        weeklyRentMinor: 18000,
        currency: "EUR",
      });
      linkId = row?.id;
    }
    if (linkId) {
      hostLinkId = linkId;
      await updateHostRenterRentStatus(host.id, linkId, "due");
    }
  }

  const franchisor = host;
  const [franchisee] = await db
    .select({ id: businessesTable.id })
    .from(businessesTable)
    .where(eq(businessesTable.slug, "bloom-beauty-dublin"))
    .limit(1);

  if (franchisor && franchisee) {
    await db
      .update(businessesTable)
      .set({ tier: "franchise" })
      .where(eq(businessesTable.id, franchisor.id));

    const [link] = await db
      .select({ id: franchiseLinksTable.id })
      .from(franchiseLinksTable)
      .where(eq(franchiseLinksTable.franchiseeBusinessId, franchisee.id))
      .limit(1);

    if (!link) {
      const id = generateId();
      await db.insert(franchiseLinksTable).values({
        id,
        franchisorBusinessId: franchisor.id,
        franchiseeBusinessId: franchisee.id,
        royaltyBps: 600,
        isActive: true,
      });
      franchiseLinkId = id;
    } else {
      franchiseLinkId = link.id;
    }
  }

  return { hostLinkId, franchiseLinkId };
}
