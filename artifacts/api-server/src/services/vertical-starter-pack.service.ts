import {
  getVerticalPack,
  getVerticalStarterPackServicesForProfile,
  inferPublicServiceImageFromName,
  mergeOnboardingAfterMenuSeed,
  verticalStarterPackIncludesRetail,
  type BusinessVertical,
  type OnboardingState,
} from "@workspace/policy";
import { createService, listServices } from "./services.service";
import { createStaff, setStaffServices } from "./staff.service";
import { getBusinessById, updateBusiness } from "./businesses.service";
import { seedRetailTemplatesForBusiness } from "./beauty-retail.service";

/** Opt-in onboarding seed — full vertical starter menu (+ beauty retail). */
export async function seedVerticalStarterPack(businessId: string) {
  const biz = await getBusinessById(businessId);
  const vertical = biz?.vertical as BusinessVertical | undefined;
  if (!biz || !vertical) {
    return { seeded: false as const, reason: "no_business" };
  }

  const existing = await listServices(businessId, true);
  if (existing.length > 0) {
    return { seeded: false as const, reason: "menu_exists" };
  }

  const templates = getVerticalStarterPackServicesForProfile(
    vertical,
    biz.subverticalProfileId,
  );
  const currency = biz.currency ?? "EUR";
  const serviceIds: string[] = [];

  for (let i = 0; i < templates.length; i++) {
    const t = templates[i]!;
    const service = await createService(businessId, {
      name: t.name,
      description: t.description,
      category: t.category,
      durationMinutes: t.durationMinutes,
      priceMinor: t.priceMinor,
      currency,
      sortOrder: i + 1,
      serviceKind: t.serviceKind ?? null,
      rebookIntervalDays: t.rebookIntervalDays ?? null,
      requiresPatchTest: t.requiresPatchTest ?? false,
      imageUrl: inferPublicServiceImageFromName(t.name),
    });
    serviceIds.push(service.id);
  }

  const staffTemplate = getVerticalPack(vertical).defaultStaff[0];
  if (staffTemplate) {
    const staff = await createStaff(businessId, {
      firstName: staffTemplate.firstName,
      lastName: staffTemplate.lastName,
      displayName: staffTemplate.displayName,
      color: staffTemplate.color,
    });
    if (serviceIds.length > 0) {
      await setStaffServices(staff.id, serviceIds);
    }
  }

  let retailSeeded = 0;
  if (verticalStarterPackIncludesRetail(vertical)) {
    const retail = await seedRetailTemplatesForBusiness(businessId);
    retailSeeded = retail.seeded;
  }

  const raw = (biz.onboardingState ?? {}) as OnboardingState;
  const next = mergeOnboardingAfterMenuSeed(raw, vertical);

  await updateBusiness(businessId, {
    onboardingState: next as unknown as Record<string, unknown>,
  });

  return {
    seeded: true as const,
    vertical,
    services: serviceIds.length,
    retail: retailSeeded,
  };
}

/** @deprecated use seedVerticalStarterPack */
export const seedBeautyStarterPack = seedVerticalStarterPack;
