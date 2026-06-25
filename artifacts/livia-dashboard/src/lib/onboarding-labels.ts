/** @deprecated Import ONBOARDING_TIER_OPTIONS / resolveOnboardingTierOptions from @workspace/policy */
export {
  ONBOARDING_TIER_OPTIONS as TIER_OPTIONS,
  resolveOnboardingTierOptions,
} from "@workspace/policy";

export const VERTICAL_OPTIONS = [
  { value: "hair", label: "Hair & barbering" },
  { value: "beauty", label: "Beauty & nails" },
  { value: "body-art", label: "Tattoo & piercing" },
  { value: "wellness", label: "Wellness & therapy" },
  { value: "fitness", label: "Fitness & training" },
  { value: "medspa", label: "Medspa & aesthetics" },
  { value: "allied-health", label: "Allied health & dental" },
  { value: "pet-grooming", label: "Pet grooming" },
  { value: "automotive-detailing", label: "Automotive detailing" },
] as const;
