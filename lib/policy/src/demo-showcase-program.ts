/**
 * Demo showcase business specs — vertical + subvertical per demo slug (policy SSOT).
 * API seed/repair reads here; never fork slug→profile maps in services.
 */
import { DEMO_OPERATOR_EXPERIENCE } from "./demo-guest-world";
import { VERTICAL_COVERAGE_REGISTRY } from "./vertical-coverage";
import {
  defaultSubverticalProfile,
  getSubverticalProfile,
  type SubverticalProfileId,
} from "./subvertical-profiles";
import type { BusinessTier, BusinessVertical } from "./types";

export type DemoShowcaseBusinessSpec = {
  slug: string;
  vertical: BusinessVertical;
  subverticalProfileId: SubverticalProfileId;
  tier?: BusinessTier;
};

/** Chain + scenario slugs not carried on VERTICAL_COVERAGE_REGISTRY rows alone. */
const EXTRA_DEMO_SHOWCASE: Array<{ slug: string; vertical: BusinessVertical }> = [
  { slug: "aurora-studio", vertical: "hair" },
  { slug: "aurora-mews", vertical: "hair" },
  { slug: "aurora-galway", vertical: "hair" },
  { slug: "conors-cut-co", vertical: "hair" },
  { slug: "stoneybatter-cuts", vertical: "hair" },
  { slug: "dublin-barber-collective", vertical: "hair" },
  { slug: "dundrum-hair-studio", vertical: "hair" },
  { slug: "dundrum-serenity-spa", vertical: "wellness" },
];

/**
 * Narrative subvertical per slug — overrides defaultSubverticalProfile(vertical).
 * Operator archetypes (DEMO_OPERATOR_EXPERIENCE) win when present.
 */
const SUBVERTICAL_BY_SLUG: Partial<Record<string, SubverticalProfileId>> = {
  "luxe-salon-spa": "hair.salon",
  "conors-cut-co": "hair.barber",
  "aurora-studio": "hair.salon",
  "aurora-mews": "hair.salon",
  "aurora-galway": "hair.salon",
  "dundrum-hair-studio": "hair.salon",
  "bloom-beauty-dublin": "beauty.lash",
  "harbour-wellness-cork": "wellness.massage",
  "copenhagen-havn-wellness": "wellness.spa",
  "dundrum-serenity-spa": "wellness.massage",
  "ink-anchor-galway": "body_art.custom",
  "peak-fitness-dublin": "fitness.pt",
  "clarity-medspa-dublin": "medspa.injectables",
  "motion-physio-cork": "allied.physio",
  "paws-parlour-dublin": "pet.salon",
  "shine-studio-belfast": "auto.detail",
  "atelier-decor-dublin": "event.decor",
};

const TIER_BY_SLUG: Partial<Record<string, BusinessTier>> = {
  "conors-cut-co": "solo",
  "stoneybatter-cuts": "solo",
  "dundrum-serenity-spa": "solo",
  "dublin-barber-collective": "studio",
  "dundrum-hair-studio": "studio",
  "aurora-studio": "studio",
  "aurora-mews": "studio",
  "aurora-galway": "studio",
  "luxe-salon-spa": "studio",
};

function operatorSpecForSlug(slug: string) {
  return Object.values(DEMO_OPERATOR_EXPERIENCE).find((o) => o.slug === slug) ?? null;
}

function verticalForSlug(slug: string): BusinessVertical | null {
  const registry = VERTICAL_COVERAGE_REGISTRY.find((r) => r.demoSlug === slug);
  if (registry?.codeVertical) return registry.codeVertical;
  const extra = EXTRA_DEMO_SHOWCASE.find((e) => e.slug === slug);
  if (extra) return extra.vertical;
  const op = operatorSpecForSlug(slug);
  if (op) {
    const profile = getSubverticalProfile(op.subverticalProfileId);
    return profile?.vertical ?? null;
  }
  return null;
}

export function resolveDemoShowcaseSubverticalProfileId(
  slug: string,
  vertical: BusinessVertical,
): SubverticalProfileId {
  const op = operatorSpecForSlug(slug);
  if (op?.subverticalProfileId) return op.subverticalProfileId;
  const override = SUBVERTICAL_BY_SLUG[slug];
  if (override) return override;
  return defaultSubverticalProfile(vertical).id;
}

export function resolveDemoShowcaseTier(slug: string): BusinessTier | undefined {
  const op = operatorSpecForSlug(slug);
  if (op?.tier) return op.tier;
  return TIER_BY_SLUG[slug];
}

export function resolveDemoShowcaseBusinessSpec(slug: string): DemoShowcaseBusinessSpec | null {
  const vertical = verticalForSlug(slug);
  if (!vertical) return null;
  return {
    slug,
    vertical,
    subverticalProfileId: resolveDemoShowcaseSubverticalProfileId(slug, vertical),
    tier: resolveDemoShowcaseTier(slug),
  };
}

export function isKnownDemoShowcaseSlug(slug: string): boolean {
  return resolveDemoShowcaseBusinessSpec(slug) != null;
}

/** All policy-known demo showcase slugs (registry + extras + operator tracks). */
export function listDemoShowcaseBusinessSpecs(): DemoShowcaseBusinessSpec[] {
  const slugs = new Set<string>();
  for (const row of VERTICAL_COVERAGE_REGISTRY) {
    if (row.demoSlug) slugs.add(row.demoSlug);
  }
  for (const extra of EXTRA_DEMO_SHOWCASE) slugs.add(extra.slug);
  for (const op of Object.values(DEMO_OPERATOR_EXPERIENCE)) slugs.add(op.slug);
  return [...slugs]
    .map((slug) => resolveDemoShowcaseBusinessSpec(slug))
    .filter((s): s is DemoShowcaseBusinessSpec => s != null)
    .sort((a, b) => a.slug.localeCompare(b.slug));
}
