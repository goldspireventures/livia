/** Mirrors @workspace/policy lifecycle labels for dashboard UI. */
export const TIER_OPTIONS = [
  {
    value: "solo",
    label: "Solo practitioner",
    description: "Just you — Liv runs ops while you work the chair.",
  },
  {
    value: "studio",
    label: "Small studio",
    description: "Team with managers and front desk. Studio plan + seats.",
  },
  {
    value: "chain",
    label: "Multi-location",
    description: "Two or more shops — chain glance and per-shop billing.",
  },
  {
    value: "chair-host",
    label: "Chair-rental host",
    description: "Host independent stylists with scoped renter data.",
  },
  {
    value: "white-label",
    label: "Multi-brand portfolio",
    description: "Distinct brands with strict customer isolation.",
  },
] as const;

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
