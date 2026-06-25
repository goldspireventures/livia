import { z } from "zod/v4";

/** Onboarding acts A1–A12 (A0 sign-up is Clerk, outside wizard). */
export const ONBOARDING_ACT_IDS = [
  "a1_create_business",
  "a2_shop_profile",
  "a3_service_menu",
  "a4_team",
  "a5_hours",
  "a6_liv",
  "a7_channels",
  "a8_public_link",
  "a9_billing",
  "a10_invite_team",
  "a11_migration",
  "a12_go_live",
] as const;

export type OnboardingActId = (typeof ONBOARDING_ACT_IDS)[number];

export const onboardingActIdSchema = z.enum(ONBOARDING_ACT_IDS);

export const activationSourceSchema = z.enum([
  "public",
  "owner-manual",
  "staff",
  "walk-in",
  "unknown",
]);

export type ActivationSource = z.infer<typeof activationSourceSchema>;

export const onboardingChecklistSchema = z.object({
  testBooking: z.boolean().default(false),
  /** ISO timestamp — first booking that marks sacred V1 activation */
  firstBookingAt: z.string().datetime().optional(),
  firstBookingId: z.string().optional(),
  activationSource: activationSourceSchema.optional(),
  livEnabled: z.boolean().default(false),
  publicLinkShared: z.boolean().default(false),
  smsOrVoiceConnected: z.boolean().default(false),
  teamInvited: z.boolean().default(false),
  billingStarted: z.boolean().default(false),
  servicesConfirmed: z.boolean().default(false),
  hoursConfirmed: z.boolean().default(false),
  socialChannelsStarted: z.boolean().default(false),
  presentationPresetReviewed: z.boolean().default(false),
  /** Set when universal CSV import completes during onboarding */
  migrationImported: z.boolean().default(false),
  /** fresh = starter pack; switching = import-first fast track */
  migrationIntent: z.enum(["fresh", "switching"]).optional(),
  /** IncumbentMigrationSource id when switching */
  migrationSource: z.string().optional(),
  /** Public booking URL for menu mirror (Booksy, etc.) */
  migrationBookingUrl: z.string().max(512).optional(),
  /** Partner / external business identifier for future API ingest */
  migrationExternalId: z.string().max(128).optional(),
});

export type OnboardingChecklist = z.infer<typeof onboardingChecklistSchema>;

export const onboardingStateSchema = z.object({
  currentAct: onboardingActIdSchema,
  completedActs: z.array(onboardingActIdSchema).default([]),
  percentComplete: z.number().min(0).max(100),
  checklist: onboardingChecklistSchema.optional(),
  updatedAt: z.string().datetime().optional(),
});

export type OnboardingState = z.infer<typeof onboardingStateSchema>;

const ACT_COUNT = ONBOARDING_ACT_IDS.length;

export function percentFromCompletedActs(completed: OnboardingActId[]): number {
  const unique = new Set(completed.filter((a) => ONBOARDING_ACT_IDS.includes(a)));
  return Math.min(100, Math.round((unique.size / ACT_COUNT) * 100));
}

export function initialOnboardingState(): OnboardingState {
  return {
    currentAct: "a1_create_business",
    completedActs: [],
    percentComplete: 0,
    checklist: onboardingChecklistSchema.parse({}),
    updatedAt: new Date().toISOString(),
  };
}


export function mergeOnboardingState(
  existing: unknown,
  patch: Partial<OnboardingState>,
): OnboardingState {
  const base = onboardingStateSchema.safeParse(existing).success
    ? onboardingStateSchema.parse(existing)
    : initialOnboardingState();

  const completedActs = patch.completedActs ?? base.completedActs;
  const currentAct = patch.currentAct ?? base.currentAct;
  const percentComplete =
    patch.percentComplete ?? percentFromCompletedActs(completedActs);

  return onboardingStateSchema.parse({
    ...base,
    ...patch,
    completedActs,
    currentAct,
    percentComplete,
    updatedAt: new Date().toISOString(),
  });
}

export function completeOnboardingAct(
  state: OnboardingState,
  actId: OnboardingActId,
): OnboardingState {
  const completedActs = [...new Set([...state.completedActs, actId])];
  const idx = ONBOARDING_ACT_IDS.indexOf(actId);
  const next =
    idx >= 0 && idx < ONBOARDING_ACT_IDS.length - 1
      ? ONBOARDING_ACT_IDS[idx + 1]
      : actId;

  return {
    ...state,
    completedActs,
    currentAct: state.currentAct === actId ? next : state.currentAct,
    percentComplete: percentFromCompletedActs(completedActs),
    updatedAt: new Date().toISOString(),
  };
}

export const ONBOARDING_ACT_LABELS: Record<OnboardingActId, string> = {
  a1_create_business: "Create your business",
  a2_shop_profile: "Shop profile",
  a3_service_menu: "Service menu",
  a4_team: "Team",
  a5_hours: "Opening hours",
  a6_liv: "Meet Liv",
  a7_channels: "WhatsApp, Instagram & SMS",
  a8_public_link: "Public booking link",
  a9_billing: "Choose your plan",
  a10_invite_team: "Invite your team",
  a11_migration: "Import your shop",
  a12_go_live: "Go-live checklist",
};
