/**
 * Demo subvertical roster — one showcase tenant per onboarding profile so prospects
 * feel every business type before they onboard.
 */
import {
  getSubverticalProfile,
  suggestedTierFromSubvertical,
  type SubverticalProfileId,
} from "./subvertical-profiles";
import type { BusinessTier, BusinessVertical } from "./types";

export type DemoSubverticalRosterEntry = {
  subverticalProfileId: SubverticalProfileId;
  slug: string;
  name: string;
  city: string;
  country?: string;
  timezone?: string;
  tier?: BusinessTier;
  /** Chain child location for multi_site profiles. */
  childLocation?: { slug: string; name: string; city: string; country?: string };
};

/** Scenario / locale slugs kept for partner tracks — not canonical profile showcases. */
export const DEMO_WORLD_SCENARIO_SLUGS = [
  "aurora-studio",
  "aurora-mews",
  "aurora-galway",
  "stoneybatter-cuts",
  "dublin-barber-collective",
  "dundrum-hair-studio",
  "dundrum-serenity-spa",
  "london-rose-spa",
  "berlin-studio-neun",
  "paris-belle-vue",
] as const;

function tierForProfile(profileId: SubverticalProfileId, override?: BusinessTier): BusinessTier {
  if (override) return override;
  const profile = getSubverticalProfile(profileId);
  if (!profile) return "studio";
  const suggested = suggestedTierFromSubvertical(profile);
  if (suggested) return suggested;
  return profile.defaultOrgShape === "solo" ? "solo" : "studio";
}

function entry(
  subverticalProfileId: SubverticalProfileId,
  slug: string,
  name: string,
  city: string,
  opts?: Omit<DemoSubverticalRosterEntry, "subverticalProfileId" | "slug" | "name" | "city">,
): DemoSubverticalRosterEntry {
  return {
    subverticalProfileId,
    slug,
    name,
    city,
    tier: tierForProfile(subverticalProfileId, opts?.tier),
    ...opts,
  };
}

/** Canonical slug per subvertical profile — SSOT for demo showcase tenants. */
export const DEMO_SUBVERTICAL_ROSTER: DemoSubverticalRosterEntry[] = [
  entry("beauty.lash", "bloom-beauty-dublin", "Bloom Beauty Dublin", "Dublin"),
  entry("beauty.nail", "polish-nail-studio-dublin", "Polish Nail Studio", "Dublin"),
  entry("beauty.brow", "arch-brow-bar-dublin", "Arch Brow Bar", "Dublin", { tier: "solo" }),
  entry("beauty.wax", "silk-wax-studio-dublin", "Silk Wax Studio", "Dublin"),
  entry("beauty.facial", "glow-facial-studio-dublin", "Glow Facial Studio", "Dublin"),
  entry("beauty.tan", "bronze-tan-booth-dublin", "Bronze Tan Booth", "Dublin", { tier: "solo" }),
  entry("beauty.pmu_light", "inked-lip-studio-dublin", "Inked Lip Studio", "Dublin", { tier: "solo" }),
  entry("beauty.mobile", "roam-beauty-dublin", "Roam Beauty Dublin", "Dublin", { tier: "solo" }),
  entry("beauty.chair_rental", "lash-host-dublin", "Lash Host Dublin", "Dublin"),
  entry("beauty.multi", "prism-beauty-studio-dublin", "Prism Beauty Studio", "Dublin"),
  entry("hair.salon", "luxe-salon-spa", "Luxe Salon & Spa", "Dublin"),
  entry("hair.barber", "conors-cut-co", "Conor's Cut Co.", "Cork", { tier: "solo" }),
  entry("hair.colour", "hue-colour-studio-dublin", "Hue Colour Studio", "Dublin"),
  entry("hair.chair_rental", "clipchair-host-dublin", "ClipChair Host", "Dublin"),
  entry("hair.mobile", "roam-cuts-dublin", "Roam Cuts Dublin", "Dublin", { tier: "solo" }),
  entry("wellness.massage", "harbour-wellness-cork", "Harbour Wellness Cork", "Cork"),
  entry("wellness.spa", "copenhagen-havn-wellness", "Havn Wellness Copenhagen", "Copenhagen", {
    country: "DK",
    timezone: "Europe/Copenhagen",
  }),
  entry("wellness.float", "float-lab-dublin", "Float Lab Dublin", "Dublin", { tier: "solo" }),
  entry("wellness.holistic", "sage-holistic-cork", "Sage Holistic Cork", "Cork", { tier: "solo" }),
  entry("wellness.couples", "dual-spa-dublin", "Dual Spa Dublin", "Dublin"),
  entry("wellness.multi_site", "tidal-spa-group-dublin", "Tidal Spa Group", "Dublin", {
    childLocation: {
      slug: "tidal-spa-cork",
      name: "Tidal Spa Cork",
      city: "Cork",
    },
  }),
  entry("body_art.custom", "ink-anchor-galway", "Ink & Anchor Galway", "Galway"),
  entry("body_art.flash", "flash-ink-galway", "Flash Ink Galway", "Galway", { tier: "solo" }),
  entry("body_art.piercing", "steel-piercing-galway", "Steel Piercing Galway", "Galway"),
  entry("medspa.injectables", "clarity-medspa-dublin", "Clarity Medspa Dublin", "Dublin"),
  entry("medspa.laser", "laser-skin-clinic-dublin", "Laser Skin Clinic Dublin", "Dublin"),
  entry("allied.physio", "motion-physio-cork", "Motion Physio Cork", "Cork"),
  entry("allied.chiro", "align-chiro-cork", "Align Chiropractic Cork", "Cork"),
  entry("fitness.class", "tempo-class-studio-dublin", "Tempo Class Studio", "Dublin"),
  entry("fitness.pt", "peak-fitness-dublin", "Peak Fitness Dublin", "Dublin", { tier: "solo" }),
  entry("pet.salon", "paws-parlour-dublin", "Paws Parlour Dublin", "Dublin"),
  entry("pet.mobile", "paws-mobile-dublin", "Paws Mobile Grooming", "Dublin", { tier: "solo" }),
  entry("auto.detail", "shine-studio-belfast", "Shine Studio Belfast", "Belfast", {
    country: "GB",
    timezone: "Europe/London",
  }),
  entry("auto.mobile", "shine-mobile-belfast", "Shine Mobile Detail", "Belfast", {
    country: "GB",
    timezone: "Europe/London",
    tier: "solo",
  }),
  entry("event.decor", "atelier-decor-dublin", "Atelier Decor Dublin", "Dublin", { tier: "solo" }),
  entry("event.wedding", "vow-wedding-styling-dublin", "Vow Wedding Styling", "Dublin", { tier: "solo" }),
];

export function listDemoSubverticalRoster(): DemoSubverticalRosterEntry[] {
  return DEMO_SUBVERTICAL_ROSTER;
}

export function rosterEntryForProfileId(
  profileId: SubverticalProfileId,
): DemoSubverticalRosterEntry | null {
  return DEMO_SUBVERTICAL_ROSTER.find((r) => r.subverticalProfileId === profileId) ?? null;
}

export function rosterEntryForSlug(slug: string): DemoSubverticalRosterEntry | null {
  return (
    DEMO_SUBVERTICAL_ROSTER.find((r) => r.slug === slug || r.childLocation?.slug === slug) ?? null
  );
}

export function verticalForDemoSubverticalRosterSlug(slug: string): BusinessVertical | null {
  const row = rosterEntryForSlug(slug);
  if (!row) return null;
  return getSubverticalProfile(row.subverticalProfileId)?.vertical ?? null;
}

/** All slugs provisioned in demo world (roster + narrative scenario extras). */
export function listDemoWorldSlugs(): string[] {
  const slugs = new Set<string>();
  for (const row of DEMO_SUBVERTICAL_ROSTER) {
    slugs.add(row.slug);
    if (row.childLocation) slugs.add(row.childLocation.slug);
  }
  for (const extra of DEMO_WORLD_SCENARIO_SLUGS) slugs.add(extra);
  return [...slugs].sort((a, b) => a.localeCompare(b));
}
