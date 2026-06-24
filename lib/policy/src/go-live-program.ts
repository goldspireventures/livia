/**
 * Go-live ribbon — sacred metric path before first client booking.
 * UI: dashboard GoLiveRibbon, mobile SetupGuidedFlowCard, Liv setup guided flow API.
 */
import type { BusinessActivationSnapshot } from "./activation-metrics";
import { buildSetupGuidedFlow } from "./setup-guided-flow";
import type { OnboardingState } from "./onboarding-state";

export const GO_LIVE_RIBBON_COPY = {
  eyebrow: "Go live",
  titleUntilActivated: "Get your first booking",
  titleActivated: "You're live",
  subtitleUntilActivated:
    "Four steps — shop, publish your link, first booking. Billing and channels can wait.",
  sharePrompt: "Send this link to a guest or book a test visit yourself.",
  copyLink: "Copy booking link",
  copied: "Link copied",
  preview: "Preview page",
  bookTest: "Book a test visit",
  askLiv: "Ask Liv",
  continue: "Continue",
  sacredMetricLabel: "First real booking",
} as const;

export function shouldShowGoLiveRibbon(args: {
  sacredMetricMet?: boolean;
  onboardingState?: OnboardingState | null;
  vertical?: string | null;
  slug?: string | null;
  isDemoTenant?: boolean;
}): boolean {
  if (args.isDemoTenant) return false;
  if (args.sacredMetricMet === true) return false;
  const flow = buildSetupGuidedFlow({
    onboardingState: args.onboardingState,
    vertical: args.vertical,
    slug: args.slug,
    sacredMetricMet: args.sacredMetricMet ?? false,
  });
  return !flow.complete;
}

export function goLiveRibbonFromActivation(args: {
  activation?: Pick<BusinessActivationSnapshot, "sacredMetricMet"> | null;
  onboardingState?: OnboardingState | null;
  vertical?: string | null;
  slug?: string | null;
  isDemoTenant?: boolean;
}): boolean {
  return shouldShowGoLiveRibbon({
    sacredMetricMet: args.activation?.sacredMetricMet,
    onboardingState: args.onboardingState,
    vertical: args.vertical,
    slug: args.slug,
    isDemoTenant: args.isDemoTenant,
  });
}
