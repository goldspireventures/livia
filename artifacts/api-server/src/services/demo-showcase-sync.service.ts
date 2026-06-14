import { db, businessesTable, retailOrdersTable, retailProductsTable } from "@workspace/db";
import {
  isKnownDemoShowcaseSlug,
  resolveDemoShowcaseBusinessSpec,
  resolveTenantRetailPack,
  verticalSupportsRetail,
} from "@workspace/policy";
import { eq } from "drizzle-orm";
import { getBusinessById } from "./businesses.service";

/** Apply policy showcase spec (vertical, subvertical, tier) to a demo business row. */
export async function syncDemoBusinessShowcaseMeta(
  businessId: string,
  slug: string,
): Promise<{ updated: boolean; spec: ReturnType<typeof resolveDemoShowcaseBusinessSpec> }> {
  const spec = resolveDemoShowcaseBusinessSpec(slug);
  if (!spec) return { updated: false, spec: null };

  const [row] = await db
    .select({
      id: businessesTable.id,
      vertical: businessesTable.vertical,
      subverticalProfileId: businessesTable.subverticalProfileId,
      tier: businessesTable.tier,
    })
    .from(businessesTable)
    .where(eq(businessesTable.id, businessId))
    .limit(1);
  if (!row) return { updated: false, spec };

  const patch: Partial<{
    vertical: typeof spec.vertical;
    subverticalProfileId: string;
    tier: typeof spec.tier;
  }> = {};

  if (row.vertical !== spec.vertical) patch.vertical = spec.vertical;
  if (row.subverticalProfileId !== spec.subverticalProfileId) {
    patch.subverticalProfileId = spec.subverticalProfileId;
  }
  if (spec.tier && row.tier !== spec.tier) patch.tier = spec.tier;

  if (Object.keys(patch).length === 0) return { updated: false, spec };

  await db
    .update(businessesTable)
    .set({ ...patch, updatedAt: new Date() })
    .where(eq(businessesTable.id, businessId));

  return { updated: true, spec };
}

function retailProductsMatchPack(
  products: Array<{ category?: string | null }>,
  pack: ReturnType<typeof resolveTenantRetailPack>,
): boolean {
  if (!pack || products.length === 0) return true;
  const cats = new Set(pack.categories);
  return products.some((p) => p.category != null && cats.has(p.category));
}

async function clearDemoRetailCatalog(businessId: string) {
  await db.delete(retailOrdersTable).where(eq(retailOrdersTable.businessId, businessId));
  await db.delete(retailProductsTable).where(eq(retailProductsTable.businessId, businessId));
}

/** Sync showcase meta from policy, then seed or repair retail SKUs for the resolved pack. */
export async function ensureDemoRetailShowcaseDepth(
  businessId: string,
  slug: string,
): Promise<number> {
  if (!isKnownDemoShowcaseSlug(slug)) {
    const { ensureRetailShowcaseDepth } = await import("./beauty-retail.service");
    return ensureRetailShowcaseDepth(businessId);
  }

  await syncDemoBusinessShowcaseMeta(businessId, slug);

  const biz = await getBusinessById(businessId);
  if (!biz || !verticalSupportsRetail(biz.vertical)) return 0;

  const pack = resolveTenantRetailPack(biz.vertical, biz.subverticalProfileId);
  if (!pack) return 0;

  const products = await db
    .select({
      id: retailProductsTable.id,
      category: retailProductsTable.category,
    })
    .from(retailProductsTable)
    .where(eq(retailProductsTable.businessId, businessId));

  if (products.length === 0) {
    const { seedRetailTemplatesForBusiness } = await import("./beauty-retail.service");
    const result = await seedRetailTemplatesForBusiness(businessId, { enableStore: true });
    return result.seeded;
  }

  if (!retailProductsMatchPack(products, pack)) {
    await clearDemoRetailCatalog(businessId);
    const { seedRetailTemplatesForBusiness } = await import("./beauty-retail.service");
    const result = await seedRetailTemplatesForBusiness(businessId, { enableStore: true });
    return result.seeded;
  }

  return products.length;
}

/** Repair all policy-known demo businesses after provision/sync. */
export async function syncAllDemoShowcaseMetaAndRetail(): Promise<{
  metaPatched: number;
  retailSeeded: number;
}> {
  const { listDemoShowcaseBusinessSpecs } = await import("@workspace/policy");
  let metaPatched = 0;
  let retailSeeded = 0;

  for (const spec of listDemoShowcaseBusinessSpecs()) {
    const [row] = await db
      .select({ id: businessesTable.id })
      .from(businessesTable)
      .where(eq(businessesTable.slug, spec.slug))
      .limit(1);
    if (!row) continue;

    const meta = await syncDemoBusinessShowcaseMeta(row.id, spec.slug);
    if (meta.updated) metaPatched += 1;

    if (verticalSupportsRetail(spec.vertical)) {
      retailSeeded += await ensureDemoRetailShowcaseDepth(row.id, spec.slug);
    }
  }

  return { metaPatched, retailSeeded };
}
