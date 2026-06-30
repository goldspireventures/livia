import type { BusinessVertical } from "./types";
import { SETTINGS_CHANNELS_SETUP_HREF } from "./capability-instances";
import {
  filterActivationStepsForOperator,
  type OperatorNavSignals,
} from "./operator-nav-policy";
import { blockingOnboardingActsForSession } from "./migration-fast-track-program";
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

/** Consult-first verticals — catalogue + public site, not opening hours. */
export function blockingOnboardingActsForVertical(
  vertical?: string | null,
): OnboardingActId[] {
  if (vertical === "event-vendors") {
    return ["a2_shop_profile", "a3_service_menu", "a6_liv", "a8_public_link"];
  }
  return BLOCKING_ONBOARDING_ACTS;
}

/** Auto-completed on POST /businesses before any opt-in seed. */
export const AUTO_COMPLETED_ON_CREATE_ACTS: OnboardingActId[] = ["a1_create_business"];

/** Acts completed when `starterPack: true` or legacy `seedDefaults: true` seeds menu + staff. */
export const AUTO_COMPLETED_ON_MENU_SEED_ACTS: OnboardingActId[] = [
  "a3_service_menu",
  "a4_team",
];

export function blockingOnboardingPercent(
  completed: OnboardingActId[],
  vertical?: string | null,
  checklist?: Partial<OnboardingChecklist> | null,
): number {
  const blocking = blockingOnboardingActsForSession(vertical, checklist);
  const done = new Set(completed);
  const n = blocking.filter((a) => done.has(a)).length;
  return Math.min(100, Math.round((n / blocking.length) * 100));
}

/** Owner can use the product (dashboard/mobile) — essentials done; test booking is activation, not a hard lock. */
export function isOnboardingAppUnlocked(
  state: OnboardingState | null | undefined,
  vertical?: string | null,
): boolean {
  if (!state) return true;
  const completed = new Set(state.completedActs ?? []);
  const blocking = blockingOnboardingActsForSession(vertical, state.checklist);
  if (blocking.every((a) => completed.has(a))) return true;
  if ((state.percentComplete ?? 0) >= 100) return true;
  return false;
}

export function menuActivationLabel(vertical?: string | null): string {
  if (vertical === "event-vendors") return "Build your decor catalogue";
  if (vertical === "beauty") return "Build your treatment menu";
  if (vertical === "hair") return "Build your service menu";
  if (vertical === "wellness") return "Set up your session menu";
  return "Set up your service menu";
}

/** Heartland verticals must configure menu — do not auto-complete a3 on create. */
export function verticalRequiresMenuSetup(vertical?: string | null): boolean {
  return vertical === "beauty" || vertical === "hair";
}

export function activationStepsFromState(
  state: OnboardingState | null | undefined,
  vertical?: string | null,
  operatorSignals?: OperatorNavSignals | null,
): {
  id: string;
  label: string;
  done: boolean;
  href: string;
}[] {
  const completed = new Set(state?.completedActs ?? []);
  const checklist = state?.checklist ?? ({} as OnboardingChecklist);
  const menuDone =
    completed.has("a3_service_menu") || checklist.servicesConfirmed === true;

  const steps =
    vertical === "event-vendors"
      ? [
          {
            id: "menu",
            label: menuActivationLabel(vertical),
            done: menuDone,
            href: "/services",
          },
          {
            id: "profile",
            label: "Studio profile",
            done: completed.has("a2_shop_profile"),
            href: "/onboarding",
          },
          {
            id: "website",
            label: "Polish your website",
            done: checklist.presentationPresetReviewed === true,
            href: "/event-site",
          },
          {
            id: "liv",
            label: "Liv voice for enquiries",
            done: completed.has("a6_liv") || checklist.livEnabled === true,
            href: "/settings?tab=liv",
          },
          {
            id: "first-quote",
            label: "Send your first quote",
            done: checklist.testBooking === true,
            href: "/inbox",
          },
          {
            id: "channels",
            label: "Connect WhatsApp or SMS",
            done: completed.has("a7_channels") || checklist.smsOrVoiceConnected === true,
            href: SETTINGS_CHANNELS_SETUP_HREF,
          },
        ]
      : [
          {
            id: "menu",
            label: menuActivationLabel(vertical),
            done: menuDone,
            href: "/services",
          },
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
            href: SETTINGS_CHANNELS_SETUP_HREF,
          },
          {
            id: "team",
            label: "Invite your team",
            done: completed.has("a10_invite_team") || checklist.teamInvited === true,
            href: "/staff",
          },
        ];
  return filterActivationStepsForOperator(steps, operatorSignals ?? null);
}

export function mergePercentWithBlocking(state: OnboardingState): OnboardingState {
  const tourPercent = percentFromCompletedActs(state.completedActs);
  const blockingPercent = blockingOnboardingPercent(state.completedActs);
  return {
    ...state,
    percentComplete: Math.max(tourPercent, blockingPercent),
  };
}

/** Onboarding after POST /businesses — menu never auto-completed; use starterPack opt-in to seed. */
export function afterBusinessCreatedStateForVertical(
  vertical: BusinessVertical,
): OnboardingState {
  const needsMenu = verticalRequiresMenuSetup(vertical);
  // The create form (onboarding Chapter 1 "Your Shop") captures the full shop
  // profile — name, trade/vertical, location, timezone, legal entity — so the
  // a2_shop_profile act is satisfied on create. Marking it here is essential:
  // a2_shop_profile is a *blocking* act, but the portal wizard's nav skips the
  // separate "Profile" step, so without this a fresh owner can never unlock the
  // app (isOnboardingAppUnlocked stays false) and gets trapped on /onboarding.
  const completed = [...AUTO_COMPLETED_ON_CREATE_ACTS, "a2_shop_profile" as const];
  return mergePercentWithBlocking({
    currentAct: needsMenu ? "a3_service_menu" : "a5_hours",
    completedActs: completed,
    percentComplete: 0,
    checklist: onboardingChecklistSchema.parse({
      servicesConfirmed: false,
    }),
    updatedAt: new Date().toISOString(),
  });
}

/** API + dashboard create path — pass business vertical when known. */
export function afterBusinessCreatedState(vertical?: BusinessVertical): OnboardingState {
  return afterBusinessCreatedStateForVertical(vertical ?? "hair");
}

/** Merge menu + team acts after starterPack or legacy seedDefaults seeding. */
export function mergeOnboardingAfterMenuSeed(
  state: OnboardingState,
  vertical: BusinessVertical,
): OnboardingState {
  const completed = new Set(state.completedActs);
  for (const act of AUTO_COMPLETED_ON_MENU_SEED_ACTS) completed.add(act);
  return mergePercentWithBlocking({
    ...state,
    currentAct: verticalRequiresMenuSetup(vertical) ? "a2_shop_profile" : state.currentAct,
    completedActs: [...completed],
    checklist: onboardingChecklistSchema.parse({
      ...state.checklist,
      servicesConfirmed: true,
    }),
    updatedAt: new Date().toISOString(),
  });
}

/** Onboarding after opt-in starter pack — menu + owner staff seeded. */
export function afterBusinessCreatedStateWithStarterPack(
  vertical: BusinessVertical = "fitness",
): OnboardingState {
  return mergeOnboardingAfterMenuSeed(afterBusinessCreatedStateForVertical(vertical), vertical);
}

/** Post seedDefaults or starterPack — menu + team acts complete. */
export function afterBusinessCreatedStateWithSeed(
  vertical: BusinessVertical = "fitness",
): OnboardingState {
  return afterBusinessCreatedStateWithStarterPack(vertical);
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

/** Prefer capability-readiness hints when acts are still incomplete. */
export function nextRecommendedActWithReadiness(
  state: OnboardingState | null | undefined,
  readinessActHints: OnboardingActId[] = [],
): OnboardingActId {
  if (!state) return readinessActHints[0] ?? "a2_shop_profile";
  const completed = new Set(state.completedActs ?? []);
  for (const act of readinessActHints) {
    if (!completed.has(act)) return act;
  }
  return nextRecommendedAct(state);
}
