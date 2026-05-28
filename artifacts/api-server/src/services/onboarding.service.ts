import { resolveOnboardingDefaults, type BusinessTier, type BusinessVertical } from "@workspace/policy";
import { createService } from "./services.service";
import { createStaff, setStaffServices } from "./staff.service";
import { getBusinessById, updateBusiness } from "./businesses.service";

export async function seedBusinessFromOnboardingPack(
  businessId: string,
  args: {
    name: string;
    country?: string | null;
    category?: string | null;
    vertical?: BusinessVertical | null;
    tier?: BusinessTier | null;
  },
) {
  const defaults = resolveOnboardingDefaults({
    name: args.name,
    country: args.country,
    category: args.category,
    vertical: args.vertical,
    tier: args.tier,
  });

  await updateBusiness(businessId, {
    country: defaults.country,
    currency: defaults.currency,
    locale: defaults.locale,
    timezone: defaults.timezone,
    euRegion: defaults.euRegion,
    vertical: defaults.vertical,
    tier: defaults.tier,
    category: defaults.category,
    aiGreeting: defaults.aiGreeting,
  });

  const biz = await getBusinessById(businessId);
  if (!biz) return defaults;

  const currency = biz.currency;

  const serviceIds: string[] = [];
  for (const svc of defaults.services) {
    const service = await createService(businessId, {
      name: svc.name,
      description: svc.description,
      category: svc.category,
      durationMinutes: svc.durationMinutes,
      priceMinor: svc.priceMinor,
      currency,
    });
    serviceIds.push(service.id);
  }

  const staffTemplate = defaults.staff[0];
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

  return defaults;
}
