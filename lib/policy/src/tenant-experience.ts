import { businessVocabulary } from "./vocabulary";
import { getVerticalOnboardingExtras } from "./vertical-onboarding";
import { getVerticalPlaybook } from "./vertical-playbooks";
import { resolveVerticalKey } from "./vocabulary";
import type { BusinessVertical } from "./types";
import { resolveJurisdictionCode } from "./jurisdictions";
import {
  activationStepsFromState,
  blockingOnboardingPercent,
  isOnboardingAppUnlocked,
  type BLOCKING_ONBOARDING_ACTS,
} from "./onboarding-program";
import type { OnboardingState } from "./onboarding-state";

export type TenantExperienceSkin = {
  shell: string;
  display: "serif" | "sans";
  market: string;
  accentHex: string;
};

export type TenantExperienceActivationStep = {
  id: string;
  label: string;
  done: boolean;
  href: string;
};

export type TenantExperiencePublicAppearance = {
  slug: string;
  publicPreviewUrl: string;
  logoUrl: string | null;
  coverImageUrl: string | null;
  brandAccentHex: string | null;
  presentationPresetId: string;
};

export type TenantExperience = {
  vertical: BusinessVertical;
  vocabulary: ReturnType<typeof businessVocabulary>;
  playbook: ReturnType<typeof getVerticalPlaybook>;
  onboardingExtras: ReturnType<typeof getVerticalOnboardingExtras>;
  skin: TenantExperienceSkin;
  onboarding: {
    appUnlocked: boolean;
    blockingPercent: number;
    tourPercent: number;
    activationSteps: TenantExperienceActivationStep[];
    welcomeHeadline: string;
    welcomeSubline: string;
  };
};

/** Relative `/b/{slug}` path for settings preview iframe (same origin). */
export function resolvePublicPreviewPath(slug: string): string {
  const clean = slug.trim().replace(/^\/+|\/+$/g, "");
  return `/b/${clean}`;
}

const ACCENT_HEX: Record<BusinessVertical, string> = {
  hair: "#D4A72C",
  beauty: "#EC4899",
  "body-art": "#F97316",
  wellness: "#14B8A6",
  fitness: "#22C55E",
  medspa: "#A78BFA",
  "allied-health": "#0EA5E9",
  "pet-grooming": "#A855F7",
  "automotive-detailing": "#94A3B8",
};

const SHELL: Record<BusinessVertical, string> = {
  hair: "warm",
  beauty: "soft",
  "body-art": "bold",
  wellness: "soft",
  fitness: "bold",
  medspa: "clinical",
  "allied-health": "clinical",
  "pet-grooming": "playful",
  "automotive-detailing": "industrial",
};

const DISPLAY: Record<BusinessVertical, "serif" | "sans"> = {
  hair: "serif",
  beauty: "serif",
  "body-art": "sans",
  wellness: "serif",
  fitness: "sans",
  medspa: "sans",
  "allied-health": "sans",
  "pet-grooming": "sans",
  "automotive-detailing": "sans",
};

export function resolveTenantExperienceSkin(
  vertical?: string | null,
  category?: string | null,
  country?: string | null,
): TenantExperienceSkin {
  const key = resolveVerticalKey(vertical, category);
  return {
    shell: SHELL[key],
    display: DISPLAY[key],
    market: resolveJurisdictionCode(country).toLowerCase(),
    accentHex: ACCENT_HEX[key],
  };
}

export function resolveTenantExperience(args: {
  vertical?: string | null;
  category?: string | null;
  country?: string | null;
  businessName?: string | null;
  onboardingState?: OnboardingState | null;
}): TenantExperience {
  const key = resolveVerticalKey(args.vertical, args.category);
  const vocabulary = businessVocabulary(args.vertical, args.category);
  const playbook = getVerticalPlaybook(key);
  const onboardingExtras = getVerticalOnboardingExtras(key);
  const skin = resolveTenantExperienceSkin(args.vertical, args.category, args.country);
  const state = args.onboardingState ?? null;
  const tourPercent = state?.percentComplete ?? 100;
  const blockingPercent = state
    ? blockingOnboardingPercent(state.completedActs ?? [])
    : 100;
  const appUnlocked = isOnboardingAppUnlocked(state ?? undefined);
  const name = args.businessName?.trim() || vocabulary.locationNoun;

  const welcomeHeadline = appUnlocked
    ? `Welcome to ${name}`
    : `Set up ${name}`;
  const welcomeSubline = appUnlocked
    ? playbook.wedge
    : `A few minutes — then Liv runs your ${vocabulary.serviceNoun.toLowerCase()}s and inbox.`;

  return {
    vertical: key,
    vocabulary,
    playbook,
    onboardingExtras,
    skin,
    onboarding: {
      appUnlocked,
      blockingPercent,
      tourPercent,
      activationSteps: activationStepsFromState(state),
      welcomeHeadline,
      welcomeSubline,
    },
  };
}
