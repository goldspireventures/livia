import { loadVerticalPack, type LivPackConfigOverride } from "@workspace/liv-runtime";
import { getBusinessById, updateBusiness } from "./businesses.service";
import { invalidateTenantRuntime } from "../lib/tenant-runtime-pool";

export async function getLivPackForBusiness(businessId: string) {
  const biz = await getBusinessById(businessId);
  if (!biz) return null;
  const config = (biz.livPackConfig ?? {}) as LivPackConfigOverride;
  const resolved = loadVerticalPack(biz.vertical, config);
  return {
    vertical: biz.vertical,
    config,
    resolved,
  };
}

export async function patchLivPackForBusiness(
  businessId: string,
  partial: LivPackConfigOverride,
) {
  const biz = await getBusinessById(businessId);
  if (!biz) return null;
  const current = (biz.livPackConfig ?? {}) as LivPackConfigOverride;
  const merged = { ...current, ...partial };
  const updated = await updateBusiness(businessId, {
    livPackConfig: merged as unknown as Record<string, unknown>,
  });
  invalidateTenantRuntime(businessId);
  if (!updated) return null;
  return getLivPackForBusiness(businessId);
}
