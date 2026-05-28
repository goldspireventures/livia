import type { OnboardingState } from "@workspace/policy";

/** Blocks marking A12 complete until a test booking exists on the checklist. */
export function validateOnboardingGoLive(state: OnboardingState): string | null {
  const completed = new Set(state.completedActs);
  if (!completed.has("a12_go_live")) return null;
  if (state.checklist?.testBooking) return null;
  return "ONBOARDING_GO_LIVE_BLOCKED";
}
