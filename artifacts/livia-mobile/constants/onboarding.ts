/** Offline fallback when `/api/onboarding/catalog` is unreachable — prefer API via `fetchOnboardingCatalog`. */
export const ONBOARDING_JURISDICTIONS = [
  { code: "IE", label: "Ireland" },
  { code: "GB", label: "United Kingdom" },
  { code: "DE", label: "Germany" },
  { code: "ES", label: "Spain" },
  { code: "IT", label: "Italy" },
  { code: "NL", label: "Netherlands" },
  { code: "PL", label: "Poland" },
  { code: "SE", label: "Sweden" },
  { code: "DK", label: "Denmark" },
  { code: "NO", label: "Norway" },
  { code: "FI", label: "Finland" },
] as const;

export const ONBOARDING_VERTICALS = [
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

export const ONBOARDING_TIERS = [
  { value: "solo", label: "Solo", hint: "Just you on the chair" },
  { value: "studio", label: "Studio", hint: "Team + manager" },
  { value: "chain", label: "Multi-location", hint: "2+ shops" },
] as const;
