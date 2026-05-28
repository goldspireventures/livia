import {
  db,
  premisesTable,
  premisesTenantsTable,
  businessesTable,
  businessMembershipsTable,
} from "@workspace/db";
import { eq, and, asc } from "drizzle-orm";
import { generateId } from "../lib/id";
import { createBusiness, getBusinessById } from "./businesses.service";
import type { BusinessVertical, BusinessTier } from "@workspace/policy";

export type PremisesTenantPublic = {
  businessId: string;
  publicLabel: string;
  slug: string;
  name: string;
  vertical: string;
  logoUrl: string | null;
  isPrimary: boolean;
  sortOrder: number;
};

export type PremisesDetail = {
  id: string;
  slug: string;
  displayName: string;
  addressLine1: string | null;
  city: string | null;
  country: string;
  routingMode: string;
  tenants: PremisesTenantPublic[];
};

function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48);
}

export async function getPremisesBySlug(slug: string): Promise<PremisesDetail | null> {
  const [row] = await db.select().from(premisesTable).where(eq(premisesTable.slug, slug));
  if (!row) return null;
  return getPremisesDetail(row.id);
}

export async function getPremisesDetail(premisesId: string): Promise<PremisesDetail | null> {
  const [row] = await db.select().from(premisesTable).where(eq(premisesTable.id, premisesId));
  if (!row) return null;

  const links = await db
    .select({
      link: premisesTenantsTable,
      biz: businessesTable,
    })
    .from(premisesTenantsTable)
    .innerJoin(businessesTable, eq(premisesTenantsTable.businessId, businessesTable.id))
    .where(eq(premisesTenantsTable.premisesId, premisesId))
    .orderBy(asc(premisesTenantsTable.sortOrder));

  const tenants: PremisesTenantPublic[] = links.map((r) => ({
    businessId: r.biz.id,
    publicLabel: r.link.publicLabel,
    slug: r.biz.slug,
    name: r.biz.name,
    vertical: r.biz.vertical,
    logoUrl: r.biz.logoUrl,
    isPrimary: r.link.isPrimary,
    sortOrder: r.link.sortOrder,
  }));

  return {
    id: row.id,
    slug: row.slug,
    displayName: row.displayName,
    addressLine1: row.addressLine1,
    city: row.city,
    country: row.country,
    routingMode: row.routingMode,
    tenants,
  };
}

export async function listPremisesForUser(userId: string) {
  const rows = await db
    .select()
    .from(premisesTable)
    .where(eq(premisesTable.ownerUserId, userId));
  const out = [];
  for (const row of rows) {
    const detail = await getPremisesDetail(row.id);
    if (detail) out.push(detail);
  }
  return out;
}

async function assertOwnerMembership(userId: string, businessId: string) {
  const [m] = await db
    .select()
    .from(businessMembershipsTable)
    .where(
      and(
        eq(businessMembershipsTable.businessId, businessId),
        eq(businessMembershipsTable.userId, userId),
        eq(businessMembershipsTable.role, "OWNER"),
      ),
    );
  if (!m) throw Object.assign(new Error("FORBIDDEN"), { code: "FORBIDDEN" });
}

export async function createPremises(
  ownerUserId: string,
  input: {
    displayName: string;
    slug?: string;
    addressLine1?: string;
    city?: string;
    country?: string;
    sharedPhone?: string;
    routingMode?: "menu" | "default";
    defaultBusinessId?: string;
    anchorBusinessId: string;
    anchorPublicLabel?: string;
  },
) {
  await assertOwnerMembership(ownerUserId, input.anchorBusinessId);

  const anchor = await getBusinessById(input.anchorBusinessId);
  if (!anchor) throw Object.assign(new Error("ANCHOR_NOT_FOUND"), { code: "NOT_FOUND" });

  const baseSlug = slugify(input.slug ?? input.displayName);
  let slug = baseSlug;
  let n = 0;
  while (await getPremisesBySlug(slug)) {
    n += 1;
    slug = `${baseSlug}-${n}`;
  }

  const premisesId = generateId();
  const tenantLinkId = generateId();

  await db.transaction(async (tx) => {
    await tx.insert(premisesTable).values({
      id: premisesId,
      slug,
      displayName: input.displayName.trim(),
      ownerUserId,
      addressLine1: input.addressLine1 ?? anchor.addressLine1,
      addressLine2: anchor.addressLine2,
      city: input.city ?? anchor.city,
      state: anchor.state,
      postalCode: anchor.postalCode,
      country: input.country ?? anchor.country ?? "IE",
      sharedPhone: input.sharedPhone ?? anchor.phone,
      routingMode: input.routingMode ?? "menu",
      defaultBusinessId: input.defaultBusinessId ?? input.anchorBusinessId,
    });

    await tx.insert(premisesTenantsTable).values({
      id: tenantLinkId,
      premisesId,
      businessId: input.anchorBusinessId,
      publicLabel: input.anchorPublicLabel ?? anchor.name,
      sortOrder: 0,
      isPrimary: true,
    });
  });

  return getPremisesDetail(premisesId);
}

export async function linkBusinessToPremises(
  ownerUserId: string,
  premisesId: string,
  input: {
    businessId: string;
    publicLabel: string;
    sortOrder?: number;
    isPrimary?: boolean;
  },
) {
  const [prem] = await db.select().from(premisesTable).where(eq(premisesTable.id, premisesId));
  if (!prem || prem.ownerUserId !== ownerUserId) {
    throw Object.assign(new Error("FORBIDDEN"), { code: "FORBIDDEN" });
  }
  await assertOwnerMembership(ownerUserId, input.businessId);

  if (input.isPrimary) {
    await db
      .update(premisesTenantsTable)
      .set({ isPrimary: false })
      .where(eq(premisesTenantsTable.premisesId, premisesId));
    await db
      .update(premisesTable)
      .set({ defaultBusinessId: input.businessId, updatedAt: new Date() })
      .where(eq(premisesTable.id, premisesId));
  }

  const [existing] = await db
    .select()
    .from(premisesTenantsTable)
    .where(
      and(
        eq(premisesTenantsTable.premisesId, premisesId),
        eq(premisesTenantsTable.businessId, input.businessId),
      ),
    );

  if (existing) {
    await db
      .update(premisesTenantsTable)
      .set({
        publicLabel: input.publicLabel.trim(),
        sortOrder: input.sortOrder ?? existing.sortOrder,
        isPrimary: input.isPrimary ?? existing.isPrimary,
      })
      .where(eq(premisesTenantsTable.id, existing.id));
  } else {
    await db.insert(premisesTenantsTable).values({
      id: generateId(),
      premisesId,
      businessId: input.businessId,
      publicLabel: input.publicLabel.trim(),
      sortOrder: input.sortOrder ?? 10,
      isPrimary: input.isPrimary ?? false,
    });
  }

  return getPremisesDetail(premisesId);
}

/** Create a new independent tenant at the same premises (hair + spa, etc.). */
export async function provisionCoTenantAtPremises(
  ownerUserId: string,
  premisesId: string,
  input: {
    name: string;
    slug: string;
    publicLabel: string;
    vertical: BusinessVertical;
    tier?: BusinessTier;
    email?: string;
    phone?: string;
  },
) {
  const [prem] = await db.select().from(premisesTable).where(eq(premisesTable.id, premisesId));
  if (!prem || prem.ownerUserId !== ownerUserId) {
    throw Object.assign(new Error("FORBIDDEN"), { code: "FORBIDDEN" });
  }

  const biz = await createBusiness(ownerUserId, {
    name: input.name,
    slug: input.slug,
    vertical: input.vertical,
    tier: input.tier ?? "solo",
    email: input.email,
    phone: input.phone ?? prem.sharedPhone ?? undefined,
    addressLine1: prem.addressLine1 ?? undefined,
    city: prem.city ?? undefined,
    country: prem.country,
    structureKind: "standalone",
  });

  await linkBusinessToPremises(ownerUserId, premisesId, {
    businessId: biz.id,
    publicLabel: input.publicLabel,
    sortOrder: 20,
  });

  return { premises: await getPremisesDetail(premisesId), business: biz };
}

export async function resolveBusinessFromSharedPhone(
  phone: string,
): Promise<{ premisesId: string; tenants: PremisesTenantPublic[] } | null> {
  const normalized = phone.replace(/\s+/g, "");
  const [prem] = await db
    .select()
    .from(premisesTable)
    .where(eq(premisesTable.sharedPhone, normalized));
  if (!prem) return null;
  const detail = await getPremisesDetail(prem.id);
  if (!detail) return null;
  return { premisesId: prem.id, tenants: detail.tenants };
}

export async function getPremisesForBusiness(businessId: string): Promise<PremisesDetail | null> {
  const [link] = await db
    .select()
    .from(premisesTenantsTable)
    .where(eq(premisesTenantsTable.businessId, businessId));
  if (!link) return null;
  return getPremisesDetail(link.premisesId);
}

export async function listBusinessIdsAtPremises(premisesId: string): Promise<string[]> {
  const rows = await db
    .select({ businessId: premisesTenantsTable.businessId })
    .from(premisesTenantsTable)
    .where(eq(premisesTenantsTable.premisesId, premisesId));
  return rows.map((r) => r.businessId);
}
