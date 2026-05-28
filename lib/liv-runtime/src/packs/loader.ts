export type VerticalPackManifest = {
  id: string;
  label: string;
  promptModule: string;
  extraToolIds: string[];
};

const DEFAULT_PACK: VerticalPackManifest = {
  id: "generic",
  label: "Generic appointment business",
  promptModule:
    "You help customers book appointments. Be clear about services, duration, and price before confirming.",
  extraToolIds: [],
};

const HAIR_PACK: VerticalPackManifest = {
  id: "hair",
  label: "Hair & barbering",
  promptModule:
    "This is a hair or barber business. Prefer offering the customer's previous stylist when possible. Mention patch tests or consultations for colour services when relevant.",
  extraToolIds: [],
};

const BODY_ART_PACK: VerticalPackManifest = {
  id: "body-art",
  label: "Tattoo & piercing",
  promptModule:
    "Tattoo and piercing studio. Offer consultation before long sessions. Mention design proof approval when art is involved.",
  extraToolIds: [],
};

const ALLIED_PACK: VerticalPackManifest = {
  id: "allied-health",
  label: "Allied health",
  promptModule:
    "Physio or clinical practice. Use patient-appropriate language. Never promise outcomes; suggest speaking to the clinician for clinical questions.",
  extraToolIds: [],
};

const MEDSPA_PACK: VerticalPackManifest = {
  id: "medspa",
  label: "Medspa",
  promptModule:
    "Medspa and aesthetics. Clinical tone. Consent and procedure clarity before confirming treatments.",
  extraToolIds: [],
};

const PACKS: Record<string, VerticalPackManifest> = {
  generic: DEFAULT_PACK,
  hair: HAIR_PACK,
  "hair-barbering": HAIR_PACK,
  beauty: {
    id: "beauty",
    label: "Beauty & nails",
    promptModule: "Beauty studio. Mention patch tests or consultations for new treatments when relevant.",
    extraToolIds: [],
  },
  wellness: {
    id: "wellness",
    label: "Wellness",
    promptModule: "Wellness or spa. Calm tone; packages and room capacity may apply.",
    extraToolIds: [],
  },
  fitness: {
    id: "fitness",
    label: "Fitness",
    promptModule: "Gym or PT studio. Sessions, classes, and packs — confirm coach when asked.",
    extraToolIds: [],
  },
  "body-art": BODY_ART_PACK,
  tattoo: BODY_ART_PACK,
  medspa: MEDSPA_PACK,
  aesthetics: MEDSPA_PACK,
  "allied-health": ALLIED_PACK,
  physio: ALLIED_PACK,
  "pet-grooming": {
    id: "pet-grooming",
    label: "Pet grooming",
    promptModule: "Pet grooming salon. Ask about pet name, breed, and behaviour; use parent/guardian for the human.",
    extraToolIds: [],
  },
  "automotive-detailing": {
    id: "automotive-detailing",
    label: "Automotive detailing",
    promptModule: "Vehicle detailing. Capture make/model; bay time blocks matter.",
    extraToolIds: [],
  },
};

export type LivPackConfigOverride = {
  verticalId?: string;
  promptModule?: string;
  extraToolIds?: string[];
  label?: string;
};

/** Resolve vertical pack from business.vertical or DB liv_pack_config override. */
export function loadVerticalPack(
  verticalId: string | null | undefined,
  packConfig?: LivPackConfigOverride | Record<string, unknown> | null,
): VerticalPackManifest {
  const raw = packConfig as LivPackConfigOverride | undefined;
  const baseKey = raw?.verticalId ?? verticalId;
  const base = !baseKey
    ? DEFAULT_PACK
    : (PACKS[baseKey.trim().toLowerCase()] ?? DEFAULT_PACK);

  if (!raw?.promptModule && !(raw?.extraToolIds?.length)) {
    return base;
  }

  return {
    id: raw.verticalId ?? base.id,
    label: raw.label ?? base.label,
    promptModule: raw.promptModule?.trim() || base.promptModule,
    extraToolIds: raw.extraToolIds?.length ? [...raw.extraToolIds] : base.extraToolIds,
  };
}
