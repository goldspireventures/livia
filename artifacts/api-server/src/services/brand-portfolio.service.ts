import { db, businessesTable } from "@workspace/db";
import { eq, and, or } from "drizzle-orm";

export type BrandPortfolioGroup = {
  brandShell: { id: string; name: string; slug: string };
  locations: Array<{ id: string; name: string; slug: string; city: string | null }>;
};

/** Multi-brand (C13): brand_entity shells + child location businesses. */
export async function getBrandPortfolioForOwner(ownerId: string): Promise<BrandPortfolioGroup[]> {
  const owned = await db
    .select()
    .from(businessesTable)
    .where(eq(businessesTable.ownerId, ownerId));

  const shells = owned.filter((b) => b.structureKind === "brand_entity");
  const standalone = owned.filter(
    (b) => b.structureKind === "standalone" || b.structureKind === "location",
  );

  const groups: BrandPortfolioGroup[] = [];

  for (const shell of shells) {
    const locations = owned.filter((b) => b.parentBusinessId === shell.id);
    groups.push({
      brandShell: { id: shell.id, name: shell.name, slug: shell.slug },
      locations: locations.map((l) => ({
        id: l.id,
        name: l.name,
        slug: l.slug,
        city: l.city,
      })),
    });
  }

  const orphanLocations = standalone.filter(
    (b) => !b.parentBusinessId && b.structureKind === "location",
  );
  if (orphanLocations.length > 0 && groups.length === 0) {
    for (const loc of orphanLocations) {
      groups.push({
        brandShell: { id: loc.id, name: loc.name, slug: loc.slug },
        locations: [],
      });
    }
  }

  return groups;
}

export async function listOwnerBrandShells(ownerId: string) {
  return db
    .select({
      id: businessesTable.id,
      name: businessesTable.name,
      slug: businessesTable.slug,
      structureKind: businessesTable.structureKind,
    })
    .from(businessesTable)
    .where(
      and(
        eq(businessesTable.ownerId, ownerId),
        eq(businessesTable.structureKind, "brand_entity"),
      ),
    );
}
