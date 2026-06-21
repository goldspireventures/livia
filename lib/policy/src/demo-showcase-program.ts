/**
 * Demo showcase business specs — vertical + subvertical per demo slug (policy SSOT).
 * API seed/repair reads here; never fork slug→profile maps in services.
 */
import { DEMO_OPERATOR_EXPERIENCE } from "./demo-guest-world";
import {
  DEMO_WORLD_SCENARIO_SLUGS,
  listDemoSubverticalRoster,
  listDemoWorldSlugs,
  rosterEntryForSlug,
} from "./demo-subvertical-roster";
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

/** Narrative slugs — partner tracks and locale shops (may duplicate a profile showcase). */
const SCENARIO_SUBVERTICAL_BY_SLUG: Partial<Record<string, SubverticalProfileId>> = {
  "aurora-studio": "hair.salon",
  "aurora-mews": "hair.salon",
  "aurora-galway": "hair.salon",
  "stoneybatter-cuts": "hair.barber",
  "dublin-barber-collective": "hair.barber",
  "dundrum-hair-studio": "hair.salon",
  "dundrum-serenity-spa": "wellness.massage",
  "london-rose-spa": "hair.salon",
  "berlin-studio-neun": "hair.barber",
  "paris-belle-vue": "beauty.multi",
};

function rosterMaps() {
  const subverticalBySlug: Partial<Record<string, SubverticalProfileId>> = {
    ...SCENARIO_SUBVERTICAL_BY_SLUG,
  };
  const tierBySlug: Partial<Record<string, BusinessTier>> = {};
  for (const row of listDemoSubverticalRoster()) {
    subverticalBySlug[row.slug] = row.subverticalProfileId;
    if (row.tier) tierBySlug[row.slug] = row.tier;
    if (row.childLocation) {
      subverticalBySlug[row.childLocation.slug] = row.subverticalProfileId;
      if (row.tier) tierBySlug[row.childLocation.slug] = row.tier;
    }
  }
  return { subverticalBySlug, tierBySlug };
}

const { subverticalBySlug: SUBVERTICAL_BY_SLUG, tierBySlug: TIER_BY_SLUG } = rosterMaps();

function operatorSpecForSlug(slug: string) {
  return Object.values(DEMO_OPERATOR_EXPERIENCE).find((o) => o.slug === slug) ?? null;
}

function verticalForSlug(slug: string): BusinessVertical | null {
  const roster = rosterEntryForSlug(slug);
  if (roster) {
    return getSubverticalProfile(roster.subverticalProfileId)?.vertical ?? null;
  }
  const registry = VERTICAL_COVERAGE_REGISTRY.find((r) => r.demoSlug === slug);
  if (registry?.codeVertical) return registry.codeVertical;
  const op = operatorSpecForSlug(slug);
  if (op) {
    const profile = getSubverticalProfile(op.subverticalProfileId);
    return profile?.vertical ?? null;
  }
  if ((DEMO_WORLD_SCENARIO_SLUGS as readonly string[]).includes(slug)) {
    const profileId = SCENARIO_SUBVERTICAL_BY_SLUG[slug];
    if (profileId) return getSubverticalProfile(profileId)?.vertical ?? null;
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

/** All policy-known demo showcase slugs (roster + scenario extras). */
export function listDemoShowcaseBusinessSpecs(): DemoShowcaseBusinessSpec[] {
  return listDemoWorldSlugs()
    .map((slug) => resolveDemoShowcaseBusinessSpec(slug))
    .filter((s): s is DemoShowcaseBusinessSpec => s != null);
}

export { listDemoWorldSlugs, listDemoSubverticalRoster } from "./demo-subvertical-roster";
