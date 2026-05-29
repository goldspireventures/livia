import { ONBOARDING_ACT_IDS, type OnboardingActId } from "@/lib/onboarding-acts";
import type { OnboardingStatePayload } from "@/components/onboarding/onboarding-wizard";

/** Stable fake tenant id — never sent to API in preview mode. */
export const ONBOARDING_PREVIEW_BUSINESS_ID = "00000000-0000-4000-8000-000000000099";

/** Demo seed slug (public /b page works without sign-in). Override with ?slug= */
export const ONBOARDING_PREVIEW_DEFAULT_SLUG = "luxe-salon-spa";

export const ONBOARDING_PREVIEW_SHOP_NAME = "Luxe Salon & Spa";

export function parsePreviewAct(raw: string | null): OnboardingActId {
  if (raw && ONBOARDING_ACT_IDS.includes(raw as OnboardingActId)) {
    return raw as OnboardingActId;
  }
  return "a6_liv";
}

export function previewStateForAct(act: OnboardingActId): OnboardingStatePayload {
  const idx = Math.max(0, ONBOARDING_ACT_IDS.indexOf(act));
  const completed = ONBOARDING_ACT_IDS.slice(0, idx).filter((a) => a !== "a1_create_business");
  return {
    currentAct: act,
    completedActs: [...completed, "a1_create_business"],
    percentComplete: Math.min(100, Math.round((idx / ONBOARDING_ACT_IDS.length) * 100)),
    checklist: {
      testBooking: false,
      livEnabled: true,
      servicesConfirmed: idx > 2,
      hoursConfirmed: idx > 4,
    },
  };
}
