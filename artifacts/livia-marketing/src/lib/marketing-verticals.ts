import type { BusinessVertical } from "@workspace/policy";

/**
 * Home constellation orbit — eight shippable code verticals (clockwise from top).
 * Short labels keep SVG legible; slugs match policy + /demo wedge.
 */
export const CONSTELLATION_ORBIT_VERTICALS: ReadonlyArray<{
  slug: BusinessVertical;
  en: string;
  de: string;
}> = [
  { slug: "hair", en: "Hair", de: "Hair" },
  { slug: "medspa", en: "Medspa", de: "Medspa" },
  { slug: "fitness", en: "Fitness", de: "Fitness" },
  { slug: "pet-grooming", en: "Pets", de: "Tier" },
  { slug: "wellness", en: "Wellness", de: "Wellness" },
  { slug: "body-art", en: "Tattoo", de: "Tattoo" },
  { slug: "allied-health", en: "Allied", de: "Therapie" },
  { slug: "beauty", en: "Beauty", de: "Beauty" },
] as const;

/** M4/M5 vertical index — non-hair first for people-business GTM. */
export const MARKETING_VERTICAL_LINKS = [
  { slug: "body-art", label: "Body art & piercing", hint: "Consent, deposits, session continuity" },
  { slug: "medspa", label: "Medspa & aesthetics", hint: "Clinical intake, rooms, provider handoffs" },
  { slug: "wellness", label: "Wellness & therapy", hint: "Packages, recurring clients, calm inbox" },
  { slug: "beauty", label: "Beauty & nails", hint: "Chair turnover, formulas, walk-ins" },
  { slug: "fitness", label: "Fitness & studios", hint: "Class slots, packs, no-show policy" },
  { slug: "allied-health", label: "Allied health", hint: "Care notes, physio continuity" },
  { slug: "pet-grooming", label: "Pet grooming", hint: "Pet profiles, breed notes, repeats" },
  { slug: "automotive-detailing", label: "Automotive detailing", hint: "Bay time, vehicle notes, upsells" },
  { slug: "hair", label: "Hair & barbering", hint: "Chairs, colour memory, queue" },
] as const;
