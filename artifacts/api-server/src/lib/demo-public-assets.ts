import { resolvePresentationPreset, type BusinessVertical } from "@workspace/policy";
import { updateBusiness } from "../services/businesses.service";

/** Stable Unsplash URLs for demo public pages — no API keys, CDN-hosted. */
const ASSETS: Partial<
  Record<
    BusinessVertical,
    { coverImageUrl: string; logoUrl: string; instagramHandle: string }
  >
> = {
  hair: {
    coverImageUrl:
      "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=1200&h=600&fit=crop",
    logoUrl:
      "https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?w=200&h=200&fit=crop",
    instagramHandle: "aurorastudio.dublin",
  },
  beauty: {
    coverImageUrl:
      "https://images.unsplash.com/photo-1516975080664-ed2fc6a32937?w=1200&h=600&fit=crop",
    logoUrl:
      "https://images.unsplash.com/photo-1516975080664-ed2fc6a32937?w=200&h=200&fit=crop",
    instagramHandle: "bloombeauty.dublin",
  },
  wellness: {
    coverImageUrl:
      "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=1200&h=600&fit=crop",
    logoUrl:
      "https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=200&h=200&fit=crop",
    instagramHandle: "harbourwellness",
  },
  "body-art": {
    coverImageUrl:
      "https://images.unsplash.com/photo-1719376885101-0c4ddd5a3834?w=1200&h=600&fit=crop",
    logoUrl:
      "https://images.unsplash.com/photo-1745777723328-6228e34ed2aa?w=200&h=200&fit=crop",
    instagramHandle: "inkanchorgalway",
  },
  "pet-grooming": {
    coverImageUrl:
      "https://images.unsplash.com/photo-1583337130417-3346a1be7dee?w=1200&h=600&fit=crop",
    logoUrl:
      "https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=200&h=200&fit=crop",
    instagramHandle: "pawsparlour",
  },
  medspa: {
    coverImageUrl:
      "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=1200&h=600&fit=crop",
    logoUrl:
      "https://images.unsplash.com/photo-1616394584738-fc6e612e71b9?w=200&h=200&fit=crop",
    instagramHandle: "claritymedspa",
  },
  "allied-health": {
    coverImageUrl:
      "https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=1200&h=600&fit=crop",
    logoUrl:
      "https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=200&h=200&fit=crop",
    instagramHandle: "motionphysio",
  },
  "automotive-detailing": {
    coverImageUrl:
      "https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=1200&h=600&fit=crop",
    logoUrl:
      "https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=200&h=200&fit=crop",
    instagramHandle: "shinestudiobelfast",
  },
  fitness: {
    coverImageUrl:
      "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=1200&h=600&fit=crop",
    logoUrl:
      "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=200&h=200&fit=crop",
    instagramHandle: "peakfitnessdublin",
  },
};

export async function applyDemoPublicBranding(
  businessId: string,
  vertical: BusinessVertical,
  overrides?: { instagramHandle?: string },
) {
  const pack = ASSETS[vertical];
  if (!pack) return;
  const preset = resolvePresentationPreset(vertical);
  await updateBusiness(businessId, {
    coverImageUrl: pack.coverImageUrl,
    logoUrl: pack.logoUrl,
    instagramHandle: overrides?.instagramHandle ?? pack.instagramHandle,
    presentationPresetId: preset.id,
  });
}

/** Re-apply stable CDN branding for all demo tenants (fixes dead Unsplash IDs). */
export async function backfillAllDemoPublicBranding(
  slugs: readonly string[],
): Promise<number> {
  const { db, businessesTable } = await import("@workspace/db");
  const { inArray } = await import("drizzle-orm");
  const rows = await db
    .select({
      id: businessesTable.id,
      slug: businessesTable.slug,
      vertical: businessesTable.vertical,
    })
    .from(businessesTable)
    .where(inArray(businessesTable.slug, [...slugs]));

  let updated = 0;
  for (const row of rows) {
    const vertical = row.vertical as BusinessVertical | null;
    if (!vertical || !ASSETS[vertical]) continue;
    await applyDemoPublicBranding(row.id, vertical);
    updated += 1;
  }
  return updated;
}
