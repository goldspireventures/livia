import {
  BLOCKING_ONBOARDING_ACTS,
  nextRecommendedAct,
  verticalRequiresMenuSetup,
} from "./onboarding-program";
import type { OnboardingActId, OnboardingState } from "./onboarding-state";
import { ONBOARDING_ACT_LABELS } from "./onboarding-state";
import { guestBookPath } from "./guest-book-url";

export type SetupGuidedFlowPhaseId = "setup" | "publish" | "billing" | "first_booking";

export type SetupGuidedFlowPhase = {
  id: SetupGuidedFlowPhaseId;
  label: string;
  headline: string;
  done: boolean;
  current: boolean;
  href: string;
  optional?: boolean;
  livPrompt: string;
};

const ACT_HREF: Partial<Record<OnboardingActId, string>> = {
  a2_shop_profile: "/onboarding",
  a3_service_menu: "/services",
  a5_hours: "/onboarding",
  a6_liv: "/settings?tab=liv",
  a8_public_link: "/onboarding",
  a9_billing: "/settings?tab=billing",
  a12_go_live: "/onboarding",
};

function setupEssentialsDone(
  state: OnboardingState | null | undefined,
  vertical?: string | null,
): boolean {
  if (!state) return false;
  const completed = new Set(state.completedActs ?? []);
  const checklist = state.checklist;
  const menuOk =
    !verticalRequiresMenuSetup(vertical) ||
    completed.has("a3_service_menu") ||
    checklist?.servicesConfirmed === true;
  return (
    menuOk &&
    completed.has("a2_shop_profile") &&
    (completed.has("a5_hours") || checklist?.hoursConfirmed === true) &&
    (completed.has("a6_liv") || checklist?.livEnabled === true)
  );
}

function publishDone(state: OnboardingState | null | undefined): boolean {
  if (!state) return false;
  const completed = new Set(state.completedActs ?? []);
  return completed.has("a8_public_link") || state.checklist?.publicLinkShared === true;
}

function billingDone(state: OnboardingState | null | undefined): boolean {
  if (!state) return false;
  const completed = new Set(state.completedActs ?? []);
  return completed.has("a9_billing") || state.checklist?.billingStarted === true;
}

function hrefForAct(act: OnboardingActId): string {
  return ACT_HREF[act] ?? "/onboarding";
}

export function buildSetupGuidedFlow(args: {
  onboardingState: OnboardingState | null | undefined;
  vertical?: string | null;
  slug?: string | null;
  sacredMetricMet: boolean;
  hasAvailabilityRules?: boolean;
}): {
  phases: SetupGuidedFlowPhase[];
  currentPhaseId: SetupGuidedFlowPhaseId;
  complete: boolean;
  publicPath: string | null;
  nextHref: string;
  nextLivPrompt: string;
  nextAct: OnboardingActId | null;
} {
  const { onboardingState: state, vertical, slug, sacredMetricMet } = args;
  const hasAvailabilityRules = args.hasAvailabilityRules ?? false;
  const publicPath = slug ? guestBookPath(slug) : null;
  const nextAct = state ? nextRecommendedAct(state) : "a2_shop_profile";

  const setupDone = setupEssentialsDone(state, vertical);
  const publishPhaseDone = publishDone(state);
  const billingPhaseDone = billingDone(state);
  const firstBookingDone = sacredMetricMet;

  const phaseDone = {
    setup: setupDone,
    publish: publishPhaseDone,
    billing: billingPhaseDone,
    first_booking: firstBookingDone,
  };

  let currentPhaseId: SetupGuidedFlowPhaseId = "first_booking";
  if (!setupDone) currentPhaseId = "setup";
  else if (!publishPhaseDone) currentPhaseId = "publish";
  else if (!firstBookingDone) currentPhaseId = "first_booking";
  else if (!billingPhaseDone) currentPhaseId = "billing";

  const hoursReady = hasAvailabilityRules;

  const setupHeadline = setupDone
    ? "Shop essentials are in place."
    : `Next: ${ONBOARDING_ACT_LABELS[nextAct] ?? "finish setup"}`;

  const phases: SetupGuidedFlowPhase[] = [
    {
      id: "setup",
      label: "Set up shop",
      headline: setupHeadline,
      done: setupDone,
      current: currentPhaseId === "setup",
      href: hrefForAct(nextAct),
      livPrompt: `Help me complete ${ONBOARDING_ACT_LABELS[nextAct] ?? "setup"}.`,
    },
    {
      id: "publish",
      label: "Publish booking page",
      headline: publishPhaseDone
        ? "Your public link is live."
        : publicPath
          ? "Confirm and share your booking link."
          : "Add a slug, then publish your booking page.",
      done: publishPhaseDone,
      current: currentPhaseId === "publish",
      href: publicPath ?? "/onboarding",
      livPrompt: "Confirm my public booking link is ready to share.",
    },
    {
      id: "billing",
      label: "Billing",
      headline: billingPhaseDone
        ? "Plan selected or beta noted."
        : "Closed beta is free — pick a plan when you're ready.",
      done: billingPhaseDone,
      current: currentPhaseId === "billing",
      href: "/settings?tab=billing",
      optional: true,
      livPrompt: "Walk me through billing and what I need before launch.",
    },
    {
      id: "first_booking",
      label: "First booking",
      headline: firstBookingDone
        ? "You're activated — first booking received."
        : !hoursReady
          ? "Set opening hours first — then pick a time on your booking page."
          : "Book a test visit on your public page — Liv chat or the form both count. Pending studio confirm is fine.",
      done: firstBookingDone,
      current: currentPhaseId === "first_booking",
      href: !hoursReady ? "/onboarding" : publicPath ?? "/bookings/new",
      livPrompt: !hoursReady
        ? "Help me set opening hours so guests can pick a time."
        : "How do I get my first real booking?",
    },
  ];

  const current = phases.find((p) => p.id === currentPhaseId)!;
  const blockingRemaining = state
    ? BLOCKING_ONBOARDING_ACTS.filter((a) => !(state.completedActs ?? []).includes(a))
    : BLOCKING_ONBOARDING_ACTS;

  return {
    phases,
    currentPhaseId,
    complete: sacredMetricMet && publishPhaseDone && setupDone,
    publicPath,
    nextHref: current.href,
    nextLivPrompt: current.livPrompt,
    nextAct: blockingRemaining[0] ?? (firstBookingDone ? null : nextAct),
  };
}
