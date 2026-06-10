import {
  resolveTenantExperience,
  resolvePresentationPreset,
  presentationPresetsActive,
  PLATFORM_DEFAULT_PRESET_ID,
  type BusinessVertical,
  type OnboardingState,
} from "@workspace/policy";
import { and, eq, sql } from "drizzle-orm";
import { db, staffTable } from "@workspace/db";
import { getBusinessById } from "./businesses.service";

async function countActiveStaff(businessId: string): Promise<number> {
  const [row] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(staffTable)
    .where(and(eq(staffTable.businessId, businessId), eq(staffTable.isActive, true)));
  return row?.count ?? 0;
}

export async function getTenantExperienceForBusiness(businessId: string) {
  const biz = await getBusinessById(businessId);
  if (!biz) return null;

  const onboardingState = biz.onboardingState as OnboardingState | null | undefined;
  const vertical = biz.vertical as BusinessVertical;
  const presetId = biz.presentationPresetId ?? PLATFORM_DEFAULT_PRESET_ID;
  const preset = resolvePresentationPreset(vertical, presetId);
  const activeStaffCount = await countActiveStaff(businessId);

  return {
    ...resolveTenantExperience({
      vertical: biz.vertical,
      category: biz.category,
      country: biz.country,
      businessName: biz.name,
      onboardingState: onboardingState ?? null,
      tier: biz.tier ?? biz.planId ?? "solo",
      activeStaffCount,
      subverticalProfileId: biz.subverticalProfileId ?? null,
    }),
    presentation: {
      presetId: preset.id,
      cssPreset: preset.cssPreset,
      label: preset.label,
      tokens: preset.tokens,
      brandAccentHex: biz.brandAccentHex ?? null,
      presetsEnabled: presentationPresetsActive(),
    },
    publicAppearance: {
      slug: biz.slug,
      publicPreviewUrl: `/book/${biz.slug}`,
      logoUrl: biz.logoUrl ?? null,
      coverImageUrl: biz.coverImageUrl ?? null,
      brandAccentHex: biz.brandAccentHex ?? null,
      presentationPresetId: preset.id,
    },
  };
}
