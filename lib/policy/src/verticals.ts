import type { BusinessVertical, VerticalPack } from "./types";
import { businessVerticalSchema } from "./types";
import { defineVerticalPack } from "./vertical-pack-factory";

const OWNER_STAFF = (name: string, color: string) => ({
  firstName: name,
  displayName: name,
  color,
});

const VERTICAL_PACKS_RAW: Record<BusinessVertical, VerticalPack> = {
  hair: {
    vertical: "hair",
    label: "Hair & barbering",
    categoryAliases: ["barbershop", "salon", "hair", "barber"],
    livVocabularyHint: "Use cut, colour, trim, client. Be brisk in barbershops, warmer in salons.",
    defaultStaff: [OWNER_STAFF("You", "#6366f1")],
    defaultServices: [
      { name: "Cut & finish", durationMinutes: 45, priceMinor: 4500, category: "Hair" },
      { name: "Colour", durationMinutes: 90, priceMinor: 9500, category: "Hair" },
      { name: "Beard trim", durationMinutes: 20, priceMinor: 1800, category: "Grooming" },
    ],
  },
  beauty: {
    vertical: "beauty",
    label: "Beauty & nails",
    categoryAliases: ["beauty", "nails", "lashes", "brows", "spa"],
    livVocabularyHint: "Use treatment, client, tech/artist. Intimate-respectful tone.",
    defaultStaff: [OWNER_STAFF("You", "#ec4899")],
    defaultServices: [
      { name: "Classic manicure", durationMinutes: 45, priceMinor: 3500, category: "Nails" },
      { name: "Lash fill", durationMinutes: 60, priceMinor: 5500, category: "Lashes" },
      { name: "Brow shape", durationMinutes: 30, priceMinor: 2500, category: "Brows" },
    ],
  },
  "body-art": {
    vertical: "body-art",
    label: "Tattoo & piercing",
    categoryAliases: ["tattoo", "piercing", "body-art"],
    livVocabularyHint: "Use piece, client, artist. Never rush; relationships are long-term.",
    defaultStaff: [OWNER_STAFF("You", "#f97316")],
    defaultServices: [
      { name: "Consultation", durationMinutes: 30, priceMinor: 0, category: "Consult" },
      { name: "Tattoo session (2h)", durationMinutes: 120, priceMinor: 20000, category: "Tattoo" },
      { name: "Piercing", durationMinutes: 30, priceMinor: 4000, category: "Piercing" },
    ],
  },
  wellness: {
    vertical: "wellness",
    label: "Wellness & therapy",
    categoryAliases: ["wellness", "massage", "therapy", "holistic"],
    livVocabularyHint: "Use session, guest, therapist. Calmer cadence.",
    defaultStaff: [OWNER_STAFF("You", "#14b8a6")],
    defaultServices: [
      { name: "60 min massage", durationMinutes: 60, priceMinor: 7000, category: "Massage" },
      { name: "90 min massage", durationMinutes: 90, priceMinor: 9500, category: "Massage" },
    ],
  },
  fitness: {
    vertical: "fitness",
    label: "Fitness & training",
    categoryAliases: ["fitness", "gym", "pt", "personal-training", "pilates"],
    livVocabularyHint: "Use session, member, coach. Brisker energy.",
    defaultStaff: [OWNER_STAFF("You", "#22c55e")],
    defaultServices: [
      { name: "Group class (45 min)", durationMinutes: 45, priceMinor: 2200, category: "Class" },
      { name: "PT session (60 min)", durationMinutes: 60, priceMinor: 6000, category: "Training" },
      { name: "10-session pack", durationMinutes: 60, priceMinor: 50000, category: "Package" },
      { name: "Intro assessment", durationMinutes: 45, priceMinor: 0, category: "Assessment" },
    ],
  },
  medspa: {
    vertical: "medspa",
    label: "Medspa & aesthetics",
    categoryAliases: ["medspa", "aesthetics", "clinic"],
    livVocabularyHint: "Clinical-precise. No jokes. Consent language explicit.",
    defaultStaff: [OWNER_STAFF("Practitioner", "#8b5cf6")],
    defaultServices: [
      { name: "Consultation", durationMinutes: 30, priceMinor: 0, category: "Consult" },
      { name: "Treatment (60 min)", durationMinutes: 60, priceMinor: 15000, category: "Treatment" },
    ],
  },
  "allied-health": {
    vertical: "allied-health",
    label: "Allied health",
    categoryAliases: ["physio", "osteopathy", "chiropractic", "dental-hygiene"],
    livVocabularyHint: "Use session, patient, practitioner. Clinical but warmer than medspa.",
    defaultStaff: [OWNER_STAFF("Practitioner", "#0ea5e9")],
    defaultServices: [
      { name: "Initial assessment", durationMinutes: 45, priceMinor: 6500, category: "Assessment" },
      { name: "Follow-up session", durationMinutes: 30, priceMinor: 4500, category: "Session" },
    ],
  },
  "pet-grooming": {
    vertical: "pet-grooming",
    label: "Pet grooming",
    categoryAliases: ["pet", "grooming", "dog-grooming", "cat-grooming", "pet-spa"],
    livVocabularyHint: "Use pet and parent (owner). Ask breed, temperament, vaccination when relevant.",
    defaultStaff: [OWNER_STAFF("You", "#a855f7")],
    defaultServices: [
      { name: "Full groom (medium dog)", durationMinutes: 90, priceMinor: 5500, category: "Groom" },
      { name: "Bath & tidy", durationMinutes: 60, priceMinor: 3500, category: "Groom" },
      { name: "Nail trim", durationMinutes: 20, priceMinor: 1500, category: "Add-on" },
    ],
  },
  "automotive-detailing": {
    vertical: "automotive-detailing",
    label: "Automotive detailing",
    categoryAliases: ["detailing", "valeting", "car-wash", "auto-detailing"],
    livVocabularyHint: "Use vehicle and client. Confirm make/model and bay access.",
    defaultStaff: [OWNER_STAFF("You", "#64748b")],
    defaultServices: [
      { name: "Exterior detail", durationMinutes: 120, priceMinor: 12000, category: "Detail" },
      { name: "Interior + exterior", durationMinutes: 180, priceMinor: 18000, category: "Detail" },
      { name: "Maintenance wash", durationMinutes: 45, priceMinor: 4500, category: "Wash" },
    ],
  },
  "event-vendors": {
    vertical: "event-vendors",
    label: "Event vendors & decor",
    categoryAliases: ["event-decor", "wedding-decor", "party-styling", "event-vendor", "balloons"],
    livVocabularyHint: "Use client, event date, theme. Consult-first — enquire before quoting.",
    defaultStaff: [OWNER_STAFF("You", "#d97706")],
    defaultServices: [
      { name: "Balloon garland", durationMinutes: 0, priceMinor: 18000, category: "Balloons" },
      { name: "Table centrepieces", durationMinutes: 0, priceMinor: 1200, category: "Tables" },
      { name: "Backdrop styling", durationMinutes: 0, priceMinor: 25000, category: "Backdrops" },
      { name: "Setup & delivery", durationMinutes: 0, priceMinor: 8000, category: "Logistics" },
    ],
  },
};

/** All packs validated via `defineVerticalPack()` (R3 hub factory). */
export const VERTICAL_PACKS: Record<BusinessVertical, VerticalPack> = Object.fromEntries(
  businessVerticalSchema.options.map((vertical) => [
    vertical,
    defineVerticalPack(VERTICAL_PACKS_RAW[vertical]),
  ]),
) as Record<BusinessVertical, VerticalPack>;

export function resolveVerticalFromCategory(category?: string | null): BusinessVertical {
  const raw = (category ?? "").toLowerCase();
  for (const pack of Object.values(VERTICAL_PACKS)) {
    if (pack.categoryAliases.some((a) => raw.includes(a) || a.includes(raw))) {
      return pack.vertical;
    }
  }
  return "hair";
}

export function getVerticalPack(vertical: BusinessVertical): VerticalPack {
  return VERTICAL_PACKS[vertical];
}

export function listVerticalCatalog() {
  return Object.values(VERTICAL_PACKS).map((v) => ({
    vertical: v.vertical,
    label: v.label,
    categoryAliases: v.categoryAliases,
  }));
}
