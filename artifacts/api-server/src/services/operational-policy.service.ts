import {
  mergeOperationalPolicy,
  parseOperationalPolicy,
  type OperationalPolicy,
} from "@workspace/policy";
import { getBusinessById, updateBusiness } from "./businesses.service";
import { policiesFromBusiness } from "./policies.service";

export async function getOperationalPolicyForBusiness(businessId: string) {
  const biz = await getBusinessById(businessId);
  if (!biz) return null;
  const policies = policiesFromBusiness(biz);
  return {
    policy: parseOperationalPolicy(biz.operationalPolicy),
    resolved: policies.operational,
    depositPolicySummary: policies.depositPolicySummary,
    bookingTermsBlock: policies.bookingTermsBlock,
  };
}

export async function patchOperationalPolicy(
  businessId: string,
  partial: Partial<OperationalPolicy>,
) {
  const biz = await getBusinessById(businessId);
  if (!biz) return null;
  const current = parseOperationalPolicy(biz.operationalPolicy);
  const merged = mergeOperationalPolicy(partial, current);
  const updated = await updateBusiness(businessId, {
    operationalPolicy: merged as unknown as Record<string, unknown>,
  });
  if (!updated) return null;
  return getOperationalPolicyForBusiness(businessId);
}
