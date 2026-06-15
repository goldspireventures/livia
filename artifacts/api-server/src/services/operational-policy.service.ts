import {
  buildGuestPolicyTemplates,
  mergeOperationalPolicy,
  parseOperationalPolicy,
  recordAutomationToggleSignals,
  automationToggleUpdatesFromGuestCare,
  automationToggleUpdatesFromRetail,
  type OperationalPolicy,
  type AutomationToggleSignals,
  type BusinessVertical,
  resolveGuestCareAutomation,
} from "@workspace/policy";
import { getBusinessById, updateBusiness } from "./businesses.service";
import { policiesFromBusiness } from "./policies.service";

export async function getOperationalPolicyForBusiness(businessId: string) {
  const biz = await getBusinessById(businessId);
  if (!biz) return null;
  const policies = policiesFromBusiness(biz);
  const policy = parseOperationalPolicy(biz.operationalPolicy);
  return {
    policy,
    resolved: policies.operational,
    depositPolicySummary: policies.depositPolicySummary,
    bookingTermsBlock: policies.bookingTermsBlock,
    bookingTermsTemplate: policies.bookingTermsTemplate,
    privacyNoticeBlock: policies.privacyNoticeBlock,
    houseRulesBlock: policies.houseRulesBlock,
    guestPolicyTemplates: buildGuestPolicyTemplates({
      businessName: biz.name,
      country: biz.country,
      vertical: biz.vertical,
      operational: policy,
    }),
  };
}

function mergePolicyWithToggleSignals(
  partial: Partial<OperationalPolicy>,
  current: OperationalPolicy,
  toggleUpdates?: Partial<Record<string, boolean | string>>,
): OperationalPolicy {
  const merged = mergeOperationalPolicy(partial, current);
  if (!toggleUpdates || Object.keys(toggleUpdates).length === 0) {
    return merged;
  }
  const signals = recordAutomationToggleSignals(
    current.automationToggleSignals as AutomationToggleSignals | undefined,
    toggleUpdates,
  );
  return mergeOperationalPolicy({ automationToggleSignals: signals }, merged);
}

export async function patchOperationalPolicy(
  businessId: string,
  partial: Partial<OperationalPolicy>,
) {
  const biz = await getBusinessById(businessId);
  if (!biz) return null;
  const current = parseOperationalPolicy(biz.operationalPolicy);
  let toggleUpdates: Partial<Record<string, boolean | string>> | undefined;
  if (partial.guestCare) {
    const mergedPreview = mergeOperationalPolicy(partial, current);
    const resolved = resolveGuestCareAutomation({
      vertical: biz.vertical as BusinessVertical,
      operationalPolicy: mergedPreview,
    });
    toggleUpdates = automationToggleUpdatesFromGuestCare(resolved);
  }
  const withSignals = mergePolicyWithToggleSignals(partial, current, toggleUpdates);
  const updated = await updateBusiness(businessId, {
    operationalPolicy: withSignals as unknown as Record<string, unknown>,
  });
  if (!updated) return null;
  return getOperationalPolicyForBusiness(businessId);
}

export async function recordRetailAutomationToggleSignals(
  businessId: string,
  settings: { enabled: boolean; postSessionSuggest: boolean },
) {
  const biz = await getBusinessById(businessId);
  if (!biz) return;
  const current = parseOperationalPolicy(biz.operationalPolicy);
  const signals = recordAutomationToggleSignals(
    current.automationToggleSignals as AutomationToggleSignals | undefined,
    automationToggleUpdatesFromRetail(settings),
  );
  await updateBusiness(businessId, {
    operationalPolicy: mergeOperationalPolicy(
      { automationToggleSignals: signals },
      current,
    ) as unknown as Record<string, unknown>,
  });
}
