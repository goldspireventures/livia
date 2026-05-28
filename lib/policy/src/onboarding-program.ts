import type { OnboardingActId, OnboardingChecklist, OnboardingState } from "./onboarding-state";
import {
  ONBOARDING_ACT_IDS,
  onboardingChecklistSchema,
  percentFromCompletedActs,
} from "./onboarding-state";

/** Acts required before the owner can use the full app (App Store / self-serve path). */
export const BLOCKING_ONBOARDING_ACTS: OnboardingActId[] = [
  "a2_shop_profile",
  "a5_hours",
  "a6_liv",
  "a8_public_link",
];

/** Seeded on create — no click-through required. */
export const AUTO_COMPLETED_ON_CREATE_ACTS: OnboardingActId[] = [
  "a1_create_business",
  "a3_service_menu",
  "a4_team",
];

export function blockingOnboardingPercent(completed: OnboardingActId[]): number {
  const done = new Set(completed);
  const n = BLOCKING_ONBOARDING_ACTS.filter((a) => done.has(a)).length;
  return Math.min(100, Math.round((n / BLOCKING_ONBOARDING_ACTS.length) * 100));
}

/** Owner can use the product (dashboard/mobile) — essentials done; test booking is activation, not a hard lock. */
export function isOnboardingAppUnlocked(state: OnboardingState | null | undefined): boolean {
  if (!state) return true;
  const completed = new Set(state.completedActs ?? []);
  if (BLOCKING_ONBOARDING_ACTS.every((a) => completed.has(a))) return true;
  if ((state.percentComplete ?? 0) >= 100) return true;
  return false;
}

export function activationStepsFromState(state: OnboardingState | null | undefined): {
  id: string;
  label: string;
  done: boolean;
  href: string;
}[] {
  const completed = new Set(state?.completedActs ?? []);
  const checklist = state?.checklist ?? ({} as OnboardingChecklist);
  return [
    {
      id: "profile",
      label: "Location profile",
      done: completed.has("a2_shop_profile"),
      href: "/onboarding",
    },
    {
      id: "hours",
      label: "Opening hours",
      done: completed.has("a5_hours") || checklist.hoursConfirmed === true,
      href: "/onboarding",
    },
    {
      id: "liv",
      label: "Liv voice & booking",
      done: completed.has("a6_liv") || checklist.livEnabled === true,
      href: "/settings?tab=liv",
    },
    {
      id: "test-booking",
      label: "Test booking",
      done: checklist.testBooking === true,
      href: "/bookings/new",
    },
    {
      id: "channels",
      label: "Connect WhatsApp or SMS",
      done: completed.has("a7_channels") || checklist.smsOrVoiceConnected === true,
      href: "/settings?tab=comms",
    },
    {
      id: "team",
      label: "Invite your team",
      done: completed.has("a10_invite_team") || checklist.teamInvited === true,
      href: "/staff",
    },
  ];
}

export function mergePercentWithBlocking(state: OnboardingState): OnboardingState {
  const tourPercent = percentFromCompletedActs(state.completedActs);
  const blockingPercent = blockingOnboardingPercent(state.completedActs);
  return {
    ...state,
    percentComplete: Math.max(tourPercent, blockingPercent),
  };
}

export function afterBusinessCreatedStateWithSeed(): OnboardingState {
  const completed = [...AUTO_COMPLETED_ON_CREATE_ACTS] as OnboardingActId[];
  return mergePercentWithBlocking({
    currentAct: "a2_shop_profile",
    completedActs: completed,
    percentComplete: 0,
    checklist: onboardingChecklistSchema.parse({
      servicesConfirmed: true,
    }),
    updatedAt: new Date().toISOString(),
  });
}

export function nextRecommendedAct(state: OnboardingState): OnboardingActId {
  const completed = new Set(state.completedActs);
  for (const act of BLOCKING_ONBOARDING_ACTS) {
    if (!completed.has(act)) return act;
  }
  for (const act of ONBOARDING_ACT_IDS) {
    if (!completed.has(act)) return act;
  }
  return "a12_go_live";
}
