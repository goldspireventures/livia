/** Mirrors @workspace/policy onboarding acts for dashboard UI. */

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
