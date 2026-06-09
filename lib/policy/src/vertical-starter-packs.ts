import type { BusinessVertical } from "./types";
import { BEAUTY_SERVICE_TEMPLATES } from "./beauty-service-templates";
import { BEAUTY_RETAIL_PROGRAM } from "./beauty-retail";
import { getSubverticalProfile, isMultiSegmentProfile } from "./subvertical-profiles";
import { getVerticalPack } from "./verticals";

export type StarterPackServiceTemplate = {
  name: string;
  description?: string;
  durationMinutes: number;
  priceMinor: number;
  category?: string;
  serviceKind?: string | null;
  rebookIntervalDays?: number | null;
  requiresPatchTest?: boolean;
};

export type VerticalStarterPackOffer = {
  label: string;
  description: string;
  serviceCount: number;
  /** Extra line for UI — e.g. mini store on beauty */
  extraLine?: string;
};

const HAIR_STARTER: StarterPackServiceTemplate[] = [
  { name: "Cut & finish", category: "Cuts", durationMinutes: 45, priceMinor: 4500, description: "Wash, cut, and blow-dry." },
  { name: "Restyle cut", category: "Cuts", durationMinutes: 60, priceMinor: 5500 },
  { name: "Full colour", category: "Colour", durationMinutes: 120, priceMinor: 9500, description: "Root-to-tip colour with toner." },
  { name: "Highlights / balayage", category: "Colour", durationMinutes: 150, priceMinor: 12000 },
  { name: "Blow dry", category: "Styling", durationMinutes: 45, priceMinor: 4000 },
  { name: "Beard trim", category: "Grooming", durationMinutes: 20, priceMinor: 1800 },
  { name: "Skin fade", category: "Grooming", durationMinutes: 40, priceMinor: 3200 },
  { name: "Hot towel shave", category: "Grooming", durationMinutes: 30, priceMinor: 2800 },
  { name: "Children's cut", category: "Cuts", durationMinutes: 30, priceMinor: 3500 },
];

const BEAUTY_STARTER: StarterPackServiceTemplate[] = BEAUTY_SERVICE_TEMPLATES.map((t) => ({
  name: t.name,
  description: t.description,
  category: t.category,
  durationMinutes: t.durationMinutes,
  priceMinor: t.priceMinor,
  serviceKind: t.serviceKind ?? null,
  rebookIntervalDays: t.rebookIntervalDays ?? null,
  requiresPatchTest: t.requiresPatchTest,
}));

const BODY_ART_STARTER: StarterPackServiceTemplate[] = [
  { name: "Design consultation", category: "Consult", durationMinutes: 30, priceMinor: 0, description: "Sketch and placement — required before long sessions." },
  { name: "Tattoo session (2h)", category: "Tattoo", durationMinutes: 120, priceMinor: 20000 },
  { name: "Tattoo session (4h)", category: "Tattoo", durationMinutes: 240, priceMinor: 38000 },
  { name: "Touch-up session", category: "Tattoo", durationMinutes: 90, priceMinor: 8000 },
  { name: "Ear piercing", category: "Piercing", durationMinutes: 30, priceMinor: 4000 },
  { name: "Jewellery change", category: "Piercing", durationMinutes: 20, priceMinor: 2500 },
];

const WELLNESS_STARTER: StarterPackServiceTemplate[] = [
  { name: "60 min massage", category: "Massage", durationMinutes: 60, priceMinor: 7000 },
  { name: "90 min massage", category: "Massage", durationMinutes: 90, priceMinor: 9500 },
  { name: "Hot stone massage", category: "Massage", durationMinutes: 75, priceMinor: 8500 },
  { name: "Couples massage", category: "Massage", durationMinutes: 60, priceMinor: 13000, description: "Two therapists — book as one slot." },
  { name: "Express back & neck", category: "Massage", durationMinutes: 30, priceMinor: 4500 },
];

const FITNESS_STARTER: StarterPackServiceTemplate[] = [
  { name: "Intro assessment", category: "Assessment", durationMinutes: 45, priceMinor: 0 },
  { name: "PT session (60 min)", category: "Training", durationMinutes: 60, priceMinor: 6000 },
  { name: "Group HIIT class", category: "Class", durationMinutes: 45, priceMinor: 2200 },
  { name: "Small group training", category: "Class", durationMinutes: 60, priceMinor: 3500 },
  { name: "10-session pack", category: "Package", durationMinutes: 60, priceMinor: 50000, description: "Credits tracked in Livia — redeem per session." },
];

const MEDSPA_STARTER: StarterPackServiceTemplate[] = [
  { name: "Aesthetic consultation", category: "Consult", durationMinutes: 30, priceMinor: 0 },
  { name: "Botox — one area", category: "Injectables", durationMinutes: 30, priceMinor: 25000 },
  { name: "Dermal filler — lips", category: "Injectables", durationMinutes: 45, priceMinor: 35000 },
  { name: "Skin booster facial", category: "Facial", durationMinutes: 60, priceMinor: 15000 },
  { name: "LED therapy add-on", category: "Facial", durationMinutes: 20, priceMinor: 4500 },
];

const ALLIED_HEALTH_STARTER: StarterPackServiceTemplate[] = [
  { name: "Initial assessment", category: "Assessment", durationMinutes: 45, priceMinor: 6500 },
  { name: "Follow-up session", category: "Session", durationMinutes: 30, priceMinor: 4500 },
  { name: "Extended treatment", category: "Session", durationMinutes: 60, priceMinor: 7500 },
  { name: "Sports rehab block", category: "Session", durationMinutes: 45, priceMinor: 5500 },
];

const PET_STARTER: StarterPackServiceTemplate[] = [
  { name: "Full groom (medium dog)", category: "Groom", durationMinutes: 90, priceMinor: 5500 },
  { name: "Full groom (large dog)", category: "Groom", durationMinutes: 120, priceMinor: 7500 },
  { name: "Bath & tidy", category: "Groom", durationMinutes: 60, priceMinor: 3500 },
  { name: "Nail trim", category: "Add-on", durationMinutes: 20, priceMinor: 1500 },
  { name: "Puppy introduction groom", category: "Groom", durationMinutes: 45, priceMinor: 4000 },
];

const AUTO_STARTER: StarterPackServiceTemplate[] = [
  { name: "Maintenance wash", category: "Wash", durationMinutes: 45, priceMinor: 4500 },
  { name: "Exterior detail", category: "Detail", durationMinutes: 120, priceMinor: 12000 },
  { name: "Interior + exterior", category: "Detail", durationMinutes: 180, priceMinor: 18000 },
  { name: "Ceramic protection", category: "Detail", durationMinutes: 240, priceMinor: 45000, description: "Paint prep + coating — allow full day bay." },
];

const STARTER_SERVICES: Record<BusinessVertical, StarterPackServiceTemplate[]> = {
  hair: HAIR_STARTER,
  beauty: BEAUTY_STARTER,
  "body-art": BODY_ART_STARTER,
  wellness: WELLNESS_STARTER,
  fitness: FITNESS_STARTER,
  medspa: MEDSPA_STARTER,
  "allied-health": ALLIED_HEALTH_STARTER,
  "pet-grooming": PET_STARTER,
  "automotive-detailing": AUTO_STARTER,
};

const STARTER_OFFERS: Record<BusinessVertical, Omit<VerticalStarterPackOffer, "serviceCount">> = {
  hair: {
    label: "Start with a template service menu",
    description: "Cuts, colour, styling, and grooming — edit prices and durations after.",
  },
  beauty: {
    label: "Start with template menu + mini store",
    description:
      "Lash, nail, and brow treatments plus take-home products on your /b page — edit or remove anything after.",
    extraLine: `${BEAUTY_RETAIL_PROGRAM.maxActiveProducts} aftercare products on your /b page.`,
  },
  "body-art": {
    label: "Start with a template service menu",
    description: "Consult, tattoo sessions, piercing, and touch-ups — ready to customise.",
  },
  wellness: {
    label: "Start with a template session menu",
    description: "Massage lengths and couples options — tune for your rooms and therapists.",
  },
  fitness: {
    label: "Start with a template session menu",
    description: "PT, classes, assessment, and a pack — adjust for your studio model.",
  },
  medspa: {
    label: "Start with a template procedure menu",
    description: "Consult plus injectables and facial tiers — align with your consent flow.",
  },
  "allied-health": {
    label: "Start with a template session menu",
    description: "Assessment and follow-up sessions — set your clinical durations.",
  },
  "pet-grooming": {
    label: "Start with a template groom menu",
    description: "Full grooms, bath & tidy, and add-ons by size — edit for your salon.",
  },
  "automotive-detailing": {
    label: "Start with a template service menu",
    description: "Wash through full detail packages — match bay time and pricing.",
  },
};

export function getVerticalStarterPackServices(
  vertical: BusinessVertical,
): StarterPackServiceTemplate[] {
  return STARTER_SERVICES[vertical] ?? getVerticalPack(vertical).defaultServices;
}

/** Filter starter menu when business has a subvertical profile with starterPackCategory. */
export function getVerticalStarterPackServicesForProfile(
  vertical: BusinessVertical,
  subverticalProfileId?: string | null,
): StarterPackServiceTemplate[] {
  const all = getVerticalStarterPackServices(vertical);
  if (!subverticalProfileId) return all;
  const profile = getSubverticalProfile(subverticalProfileId);
  if (!profile) return all;
  if (isMultiSegmentProfile(profile)) return all;
  if (!profile.starterPackCategory) return all;
  const filtered = all.filter((s) => s.category === profile.starterPackCategory);
  return filtered.length >= 3 ? filtered : all;
}

export function getVerticalStarterPackOffer(vertical: BusinessVertical): VerticalStarterPackOffer {
  const base = STARTER_OFFERS[vertical];
  const services = getVerticalStarterPackServices(vertical);
  return {
    ...base,
    serviceCount: services.length,
  };
}

export function verticalStarterPackIncludesRetail(vertical: BusinessVertical): boolean {
  return vertical === "beauty";
}

/** @deprecated use getVerticalStarterPackOffer("beauty") */
export const BEAUTY_STARTER_PACK_OFFER = getVerticalStarterPackOffer("beauty");
