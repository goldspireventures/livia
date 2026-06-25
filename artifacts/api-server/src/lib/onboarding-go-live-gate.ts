import type { OnboardingState } from "@workspace/policy";

/** A12 completes in onboarding — test booking remains a post-open activation metric on Today. */
export function validateOnboardingGoLive(_state: OnboardingState): string | null {
  return null;
}
