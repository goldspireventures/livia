import {
  buildSetupGuidedFlow,
  onboardingStateSchema,
  readinessActHintsFromCapabilities,
  flattenLaunchEssentialCapabilityBlockers,
  type ResolvedPlatformCapability,
} from "@workspace/policy";
import { getBusinessById } from "./businesses.service";
import { getBusinessActivationSnapshot } from "./activation-metrics.service";
import { getTenantCapabilities } from "./capability-resolution.service";

export type SetupCapabilityBlocker = {
  capabilityId: string;
  capabilityName: string;
  blocker: string;
};

function flattenCapabilityBlockers(
  platformCapabilities: ResolvedPlatformCapability[],
): SetupCapabilityBlocker[] {
  return flattenLaunchEssentialCapabilityBlockers(platformCapabilities);
}

export async function getSetupGuidedFlowForBusiness(businessId: string) {
  const business = await getBusinessById(businessId);
  if (!business) return null;

  const parsed = onboardingStateSchema.safeParse(business.onboardingState);
  const state = parsed.success ? parsed.data : null;

  const [activation, capabilities] = await Promise.all([
    getBusinessActivationSnapshot(businessId),
    getTenantCapabilities(businessId),
  ]);
  const sacredMetricMet = activation?.sacredMetricMet ?? false;

  const flow = buildSetupGuidedFlow({
    onboardingState: state,
    vertical: business.vertical,
    slug: business.slug,
    sacredMetricMet,
    hasAvailabilityRules: capabilities?.readinessFacts?.hasAvailabilityRules ?? false,
  });

  const capabilityBlockers = flattenCapabilityBlockers(
    capabilities?.platformCapabilities ?? [],
  );
  const readinessActHints = readinessActHintsFromCapabilities({
    facts: capabilities?.readinessFacts ?? {
      serviceCount: 0,
      staffCount: 0,
      hasPublicSlug: Boolean(business.slug),
      hasAvailabilityRules: false,
      paymentsConnected: false,
      messagingConfigured: false,
      aiEnabled: business.aiEnabled !== "false" && business.aiEnabled !== "0",
      sacredMetricMet,
    },
    capabilities: capabilities?.platformCapabilities ?? [],
    state,
  });

  return {
    ...flow,
    capabilityBlockers,
    readinessActHints,
    activation: {
      status: activation?.status ?? "not_started",
      sacredMetricMet,
      timeToFirstBookingLabel: activation?.timeToFirstBookingLabel ?? null,
    },
    percentComplete: state?.percentComplete ?? 0,
  };
}
