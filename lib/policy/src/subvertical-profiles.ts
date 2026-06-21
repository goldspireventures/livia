/**
 * Sub-segment onboarding profiles — configuration, not code forks.
 */
import type { BusinessTier, BusinessVertical } from "./types";

export type SubverticalProfileId = string;

export type OrgShapeTemplate = "solo" | "owner_plus_staff" | "chair_rental" | "multi_site";

export type SubverticalProfile = {
  id: SubverticalProfileId;
  vertical: BusinessVertical;
  label: string;
  description: string;
  defaultOrgShape: OrgShapeTemplate;
  starterPackCategory?: string;
  guestMyModuleHints?: string[];
};

const PROFILES: SubverticalProfile[] = [
  // Beauty — full retail aisle
  { id: "beauty.lash", vertical: "beauty", label: "Lash studio", description: "Fills, classics, volume", defaultOrgShape: "owner_plus_staff", starterPackCategory: "Lashes" },
  { id: "beauty.nail", vertical: "beauty", label: "Nail salon", description: "Mani, gel, BIAB, pedi", defaultOrgShape: "owner_plus_staff", starterPackCategory: "Nails" },
  { id: "beauty.brow", vertical: "beauty", label: "Brow bar", description: "Lamination, tint, shape", defaultOrgShape: "solo" },
  { id: "beauty.wax", vertical: "beauty", label: "Waxing studio", description: "Face and body wax", defaultOrgShape: "owner_plus_staff" },
  { id: "beauty.facial", vertical: "beauty", label: "Facial & skin", description: "Non-clinical facials", defaultOrgShape: "owner_plus_staff" },
  { id: "beauty.tan", vertical: "beauty", label: "Spray tan", description: "Seasonal tan booth", defaultOrgShape: "solo" },
  { id: "beauty.pmu_light", vertical: "beauty", label: "PMU / lip blush", description: "Light permanent makeup", defaultOrgShape: "solo" },
  { id: "beauty.mobile", vertical: "beauty", label: "Mobile beauty", description: "Travel to client", defaultOrgShape: "solo" },
  { id: "beauty.chair_rental", vertical: "beauty", label: "Chair rental host (beauty)", description: "Lash/brow renters on one floor", defaultOrgShape: "chair_rental" },
  { id: "beauty.multi", vertical: "beauty", label: "Multi-service studio", description: "Lash, nail, brow under one roof", defaultOrgShape: "owner_plus_staff" },
  // Hair
  { id: "hair.salon", vertical: "hair", label: "Hair salon", description: "Cut, colour, style", defaultOrgShape: "owner_plus_staff" },
  { id: "hair.barber", vertical: "hair", label: "Barbershop", description: "Cuts and grooming", defaultOrgShape: "owner_plus_staff", starterPackCategory: "Grooming" },
  { id: "hair.colour", vertical: "hair", label: "Colour studio", description: "Long colour blocks", defaultOrgShape: "owner_plus_staff", starterPackCategory: "Colour" },
  { id: "hair.chair_rental", vertical: "hair", label: "Chair rental host", description: "Renters on one floor", defaultOrgShape: "chair_rental" },
  { id: "hair.mobile", vertical: "hair", label: "Mobile stylist", description: "Travel appointments", defaultOrgShape: "solo" },
  // Wellness
  { id: "wellness.massage", vertical: "wellness", label: "Massage studio", description: "Rooms and therapists", defaultOrgShape: "owner_plus_staff" },
  { id: "wellness.spa", vertical: "wellness", label: "Day spa", description: "Packages and rooms", defaultOrgShape: "owner_plus_staff" },
  { id: "wellness.float", vertical: "wellness", label: "Float centre", description: "Tank sessions", defaultOrgShape: "solo" },
  { id: "wellness.holistic", vertical: "wellness", label: "Holistic practice", description: "Reiki, holistic", defaultOrgShape: "solo" },
  { id: "wellness.couples", vertical: "wellness", label: "Couples spa", description: "Dual-room bookings", defaultOrgShape: "owner_plus_staff" },
  { id: "wellness.multi_site", vertical: "wellness", label: "Multi-location spa group", description: "Chain rollup across sites", defaultOrgShape: "multi_site" },
  // Body art
  { id: "body_art.custom", vertical: "body-art", label: "Custom tattoo studio", description: "Consult → proof → session", defaultOrgShape: "owner_plus_staff" },
  { id: "body_art.flash", vertical: "body-art", label: "Walk-in / flash", description: "Numbered flash days", defaultOrgShape: "solo" },
  { id: "body_art.piercing", vertical: "body-art", label: "Piercing studio", description: "Pierce and jewellery", defaultOrgShape: "owner_plus_staff" },
  // Medspa
  { id: "medspa.injectables", vertical: "medspa", label: "Injectables clinic", description: "Botox, filler", defaultOrgShape: "owner_plus_staff" },
  { id: "medspa.laser", vertical: "medspa", label: "Laser & skin clinic", description: "Course treatments", defaultOrgShape: "owner_plus_staff" },
  // Allied health
  { id: "allied.physio", vertical: "allied-health", label: "Physiotherapy", description: "Plan and follow-ups", defaultOrgShape: "owner_plus_staff" },
  { id: "allied.chiro", vertical: "allied-health", label: "Chiropractic", description: "Adjustments and plans", defaultOrgShape: "owner_plus_staff" },
  // Fitness
  { id: "fitness.class", vertical: "fitness", label: "Boutique class studio", description: "Capacity and waitlist", defaultOrgShape: "owner_plus_staff" },
  { id: "fitness.pt", vertical: "fitness", label: "PT studio", description: "1:1 blocks and packs", defaultOrgShape: "solo" },
  // Pet
  { id: "pet.salon", vertical: "pet-grooming", label: "Grooming salon", description: "Salon-based pets", defaultOrgShape: "owner_plus_staff" },
  { id: "pet.mobile", vertical: "pet-grooming", label: "Mobile groomer", description: "Van route", defaultOrgShape: "solo" },
  // Automotive
  { id: "auto.detail", vertical: "automotive-detailing", label: "Detail studio", description: "Bay scheduling", defaultOrgShape: "owner_plus_staff" },
  { id: "auto.mobile", vertical: "automotive-detailing", label: "Mobile detail", description: "Pickup and drop-off", defaultOrgShape: "solo" },
  { id: "event.decor", vertical: "event-vendors", label: "Event decor & styling", description: "Enquire → quote → book", defaultOrgShape: "solo" },
  { id: "event.wedding", vertical: "event-vendors", label: "Wedding vendor", description: "Date-bound quotes and milestones", defaultOrgShape: "solo" },
];

export function listSubverticalProfiles(vertical: BusinessVertical): SubverticalProfile[] {
  return PROFILES.filter((p) => p.vertical === vertical);
}

export function getSubverticalProfile(id: SubverticalProfileId): SubverticalProfile | null {
  return PROFILES.find((p) => p.id === id) ?? null;
}

export function defaultSubverticalProfile(vertical: BusinessVertical): SubverticalProfile {
  const list = listSubverticalProfiles(vertical);
  return list[0] ?? {
    id: `${vertical}.default`,
    vertical,
    label: vertical,
    description: "Default studio",
    defaultOrgShape: "owner_plus_staff",
  };
}

/** Multi-category studio under one vertical (lash+nail+brow, full day spa, etc.). */
export function isMultiSegmentProfile(profile: SubverticalProfile): boolean {
  return (
    profile.id.endsWith(".multi") ||
    profile.id === "wellness.spa" ||
    profile.id === "hair.salon"
  );
}

/** Maps org-shape template → billing tier when owner has not picked a specific plan. */
export function suggestedTierFromSubvertical(profile: SubverticalProfile): BusinessTier | null {
  switch (profile.defaultOrgShape) {
    case "chair_rental":
      return "chair-host";
    case "multi_site":
      return "chain";
    default:
      return null;
  }
}

export function resolveOnboardingTierFromSubvertical(
  profile: SubverticalProfile,
  currentTier: BusinessTier,
  tierManuallySet: boolean,
): BusinessTier {
  const suggested = suggestedTierFromSubvertical(profile);
  if (!suggested || tierManuallySet) return currentTier;
  return suggested;
}

export function onboardingHintForSubvertical(profile: SubverticalProfile): string | null {
  if (profile.defaultOrgShape === "chair_rental") {
    return "Chair-rental host — renter dashboards, PII firewall, and /host. Team size switches to Host.";
  }
  if (isMultiSegmentProfile(profile)) {
    return "Multi-service under one roof — starter menu spans main categories; trim or add services anytime.";
  }
  if (profile.defaultOrgShape === "multi_site") {
    return "Multi-site group — use Chain team size and add locations under one brand entity.";
  }
  return null;
}

/** Cross-vertical shared premises (salon + spa in one building) — separate businesses, one brand. */
export const SHARED_PREMISES_ONBOARDING_NOTE =
  "Different business types in the same building (e.g. salon + spa) are separate Livia businesses — pick one vertical here, then add linked locations or a brand entity for the group.";
