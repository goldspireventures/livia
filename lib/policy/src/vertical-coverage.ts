import type { BusinessVertical } from "./types";

/** Coverage tier for go-to-market and beta showcase honesty. */
export type VerticalCoverageTier = "heartland" | "beta-full" | "beta-preview" | "partner-only" | "defer";

export type VerticalCoverageEntry = {
  /** Doc id from verticals.md (V1–V11). */
  docId: string;
  label: string;
  tier: VerticalCoverageTier;
  /** Primary code vertical when shippable. */
  codeVertical: BusinessVertical | null;
  /** Nearest pack when not a first-class enum. */
  nearestPack: BusinessVertical | null;
  demoSlug: string | null;
  revenueNote: string;
};

/**
 * Single registry — product, sales, and eng pull from here so no vertical is "forgotten".
 */
export const VERTICAL_COVERAGE_REGISTRY: VerticalCoverageEntry[] = [
  {
    docId: "V1",
    label: "Hair & barbering",
    tier: "heartland",
    codeVertical: "hair",
    nearestPack: "hair",
    demoSlug: "luxe-salon-spa",
    revenueNote: "Primary wedge; full OS.",
  },
  {
    docId: "V2",
    label: "Beauty & nails",
    tier: "heartland",
    codeVertical: "beauty",
    nearestPack: "beauty",
    demoSlug: "bloom-beauty-dublin",
    revenueNote: "Primary wedge; full OS.",
  },
  {
    docId: "V3",
    label: "Wellness & spa",
    tier: "beta-full",
    codeVertical: "wellness",
    nearestPack: "wellness",
    demoSlug: "harbour-wellness-cork",
    revenueNote: "Gift vouchers + calmer cadence.",
  },
  {
    docId: "V4",
    label: "Body art",
    tier: "beta-full",
    codeVertical: "body-art",
    nearestPack: "body-art",
    demoSlug: "ink-anchor-galway",
    revenueNote: "Design proof + deposit norms.",
  },
  {
    docId: "V5",
    label: "Fitness",
    tier: "beta-full",
    codeVertical: "fitness",
    nearestPack: "fitness",
    demoSlug: "peak-fitness-dublin",
    revenueNote: "Classes + packages.",
  },
  {
    docId: "V6",
    label: "Medspa",
    tier: "beta-full",
    codeVertical: "medspa",
    nearestPack: "medspa",
    demoSlug: "clarity-medspa-dublin",
    revenueNote: "Consent-first; mandate R1 default.",
  },
  {
    docId: "V7",
    label: "Allied health",
    tier: "beta-full",
    codeVertical: "allied-health",
    nearestPack: "allied-health",
    demoSlug: "motion-physio-cork",
    revenueNote: "Lite clinic — not regulated EHR.",
  },
  {
    docId: "V8",
    label: "Dental",
    tier: "partner-only",
    codeVertical: null,
    nearestPack: "allied-health",
    demoSlug: null,
    revenueNote: "Sell with partner; do not pretend full dental stack.",
  },
  {
    docId: "V9",
    label: "Mental health",
    tier: "partner-only",
    codeVertical: null,
    nearestPack: "wellness",
    demoSlug: null,
    revenueNote: "Special-category data; partner or never.",
  },
  {
    docId: "V10",
    label: "Pet grooming",
    tier: "beta-full",
    codeVertical: "pet-grooming",
    nearestPack: "pet-grooming",
    demoSlug: "paws-parlour-dublin",
    revenueNote: "Pet profiles + parent language.",
  },
  {
    docId: "V11",
    label: "Adjacent solo professionals",
    tier: "defer",
    codeVertical: null,
    nearestPack: "hair",
    demoSlug: null,
    revenueNote: "Calendly parity only until salon OS dominates.",
  },
  {
    docId: "V-DK",
    label: "Denmark (wellness flagship)",
    tier: "beta-full",
    codeVertical: "wellness",
    nearestPack: "wellness",
    demoSlug: "copenhagen-havn-wellness",
    revenueNote: "DK locale, DKK, Copenhagen market shop.",
  },
  {
    docId: "V-AD",
    label: "Automotive detailing",
    tier: "beta-full",
    codeVertical: "automotive-detailing",
    nearestPack: "automotive-detailing",
    demoSlug: "shine-studio-belfast",
    revenueNote: "EU valeting/detailing wedge.",
  },
];

export function listVerticalCoverage() {
  return VERTICAL_COVERAGE_REGISTRY;
}

export function getCoverageForCodeVertical(vertical: BusinessVertical): VerticalCoverageEntry | undefined {
  return VERTICAL_COVERAGE_REGISTRY.find((e) => e.codeVertical === vertical);
}
