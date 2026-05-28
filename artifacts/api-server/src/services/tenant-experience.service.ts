import { resolveTenantExperience, type OnboardingState } from "@workspace/policy";
import { getBusinessById } from "./businesses.service";

export async function getTenantExperienceForBusiness(businessId: string) {
  const biz = await getBusinessById(businessId);
  if (!biz) return null;

  const onboardingState = biz.onboardingState as OnboardingState | null | undefined;

  return resolveTenantExperience({
    vertical: biz.vertical,
    category: biz.category,
    country: biz.country,
    businessName: biz.name,
    onboardingState: onboardingState ?? null,
  });
}
