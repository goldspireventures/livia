/**
 * Presentation presets — tenant-selectable skins within a vertical capability pack.
 *
 * Capability (features, routes, vocabulary) comes from vertical + playbook.
 * Presentation (colors, density, layout chrome) comes from preset + brand overrides.
 *
 * @see docs/design/PRESENTATION-PRESETS-AND-ROLLOUT.md
 * @see docs/design/SURFACE-AND-BREAKPOINTS.md — layout morph (phone/tablet/desktop) is separate from preset tokens
 */
import type { BusinessVertical } from "./types";

export type PresentationDensity = "comfortable" | "compact";
export type PresentationColorMode = "light" | "dark" | "system";
export type PresentationLayout =
  | "cards"
  | "list"
  | "pipeline"
  | "timeline"
  | "spatial";

export type PresentationPreset = {
  /** Stable id, e.g. `hair-warm-chair` */
  id: string;
  vertical: BusinessVertical;
  /** Owner-facing label in Settings / onboarding */
  label: string;
  /** One-line description for picker */
  description: string;
  /** When false, preset stays in catalog but is omitted from owner/onboarding pickers. */
  pickerVisible?: boolean;
  isDefault: boolean;
  tokens: {
    colorMode: PresentationColorMode;
    density: PresentationDensity;
    display: "serif" | "sans";
    layout: PresentationLayout;
    /** Maps to `data-vertical-shell` / public-skin-* */
    shell: string;
    radius: "xl" | "lg" | "md" | "sm";
    motion: "calm" | "crisp" | "clinical";
  };
  /** Value for `html[data-presentation]` CSS token bundle */
  cssPreset: string;
};

/** Shared id — classic Aurora Livia chrome; available in every vertical pack. */
export const PLATFORM_DEFAULT_PRESET_ID = "platform-default";

function platformDefaultPreset(vertical: BusinessVertical): PresentationPreset {
  return {
    id: PLATFORM_DEFAULT_PRESET_ID,
    vertical,
    label: "Platform Default",
    description:
      "Classic Livia Constellation — ink shell, champagne accents, standard Today. Start here, then pick a studio skin.",
    isDefault: false,
    tokens: {
      colorMode: "dark",
      density: "comfortable",
      display: "sans",
      layout: "cards",
      shell: "aurora",
      radius: "xl",
      motion: "crisp",
    },
    cssPreset: "platform-default",
  };
}

const BASE_PRESENTATION_PRESETS: Record<BusinessVertical, PresentationPreset[]> = {
  hair: [
    {
      id: "hair-warm-chair",
      vertical: "hair",
      label: "Warm Chair",
      description: "Classic salon — serif headlines, golden accents, roomy cards.",
      isDefault: true,
      tokens: {
        colorMode: "light",
        density: "comfortable",
        display: "serif",
        layout: "cards",
        shell: "warm",
        radius: "xl",
        motion: "crisp",
      },
      cssPreset: "warm-chair",
    },
    {
      id: "hair-clean-salon",
      vertical: "hair",
      label: "Clean Salon",
      description: "Bright and modern — sans-serif, airy spacing, minimal chrome.",
      isDefault: false,
      tokens: {
        colorMode: "light",
        density: "comfortable",
        display: "sans",
        layout: "timeline",
        shell: "soft",
        radius: "lg",
        motion: "calm",
      },
      cssPreset: "clean-salon",
    },
    {
      id: "hair-barber-bold",
      vertical: "hair",
      label: "Barber Bold",
      description: "Barbershop energy — compact, high contrast, fast scan.",
      isDefault: false,
      tokens: {
        colorMode: "dark",
        density: "compact",
        display: "sans",
        layout: "list",
        shell: "bold",
        radius: "md",
        motion: "crisp",
      },
      cssPreset: "barber-bold",
    },
  ],
  beauty: [
    {
      id: "beauty-noir-dusk",
      vertical: "beauty",
      label: "Noir Dusk",
      description: "Evening studio — charcoal and mauve, inbox-first Today for lash DMs.",
      isDefault: false,
      tokens: {
        colorMode: "dark",
        density: "comfortable",
        display: "serif",
        layout: "cards",
        shell: "soft",
        radius: "xl",
        motion: "calm",
      },
      cssPreset: "noir-dusk",
    },
    {
      id: "beauty-soft-studio",
      vertical: "beauty",
      label: "Soft Studio",
      description: "Daylight studio — blush and rose, atrium Today for calm floor overview.",
      isDefault: false,
      tokens: {
        colorMode: "light",
        density: "comfortable",
        display: "serif",
        layout: "cards",
        shell: "soft",
        radius: "xl",
        motion: "calm",
      },
      cssPreset: "soft-studio",
    },
    {
      id: "beauty-editorial",
      vertical: "beauty",
      label: "Editorial",
      description: "Magazine-clean — wide margins, treatment menu feel.",
      pickerVisible: false,
      isDefault: false,
      tokens: {
        colorMode: "light",
        density: "comfortable",
        display: "serif",
        layout: "list",
        shell: "warm",
        radius: "lg",
        motion: "calm",
      },
      cssPreset: "editorial",
    },
    {
      id: "beauty-premium-dark",
      vertical: "beauty",
      label: "Premium Dark",
      description: "Rose-gold on charcoal — high-end salon cockpit.",
      pickerVisible: false,
      isDefault: false,
      tokens: {
        colorMode: "dark",
        density: "comfortable",
        display: "serif",
        layout: "cards",
        shell: "warm",
        radius: "lg",
        motion: "crisp",
      },
      cssPreset: "premium-dark",
    },
  ],
  "body-art": [
    {
      id: "body-art-studio-dark",
      vertical: "body-art",
      label: "Studio Dark",
      description: "Traditional studio — charcoal walls, flash-paper cards.",
      isDefault: true,
      tokens: {
        colorMode: "dark",
        density: "comfortable",
        display: "sans",
        layout: "pipeline",
        shell: "bold",
        radius: "md",
        motion: "crisp",
      },
      cssPreset: "studio-dark",
    },
    {
      id: "body-art-flash-light",
      vertical: "body-art",
      label: "Flash Light",
      description: "Bright flash-sheet aesthetic — paper on desk, clean proof review.",
      isDefault: false,
      tokens: {
        colorMode: "light",
        density: "comfortable",
        display: "sans",
        layout: "pipeline",
        shell: "bold",
        radius: "md",
        motion: "crisp",
      },
      cssPreset: "flash-light",
    },
    {
      id: "body-art-minimal-mono",
      vertical: "body-art",
      label: "Minimal Mono",
      description: "Typography-first pipeline — solo artists who hate software chrome.",
      isDefault: false,
      tokens: {
        colorMode: "light",
        density: "compact",
        display: "sans",
        layout: "list",
        shell: "bold",
        radius: "sm",
        motion: "calm",
      },
      cssPreset: "minimal-mono",
    },
  ],
  wellness: [
    {
      id: "wellness-harbour-light",
      vertical: "wellness",
      label: "Harbour Light",
      description: "Day spa room board — lanes per room, concierge inbox, gift-ready book.",
      isDefault: true,
      tokens: {
        colorMode: "light",
        density: "comfortable",
        display: "serif",
        layout: "cards",
        shell: "soft",
        radius: "xl",
        motion: "calm",
      },
      cssPreset: "harbour-light",
    },
    {
      id: "wellness-session-rail",
      vertical: "wellness",
      label: "Session Rail",
      description: "Therapist day — vertical time rail, single-column inbox, slot list on /b.",
      isDefault: false,
      tokens: {
        colorMode: "light",
        density: "comfortable",
        display: "sans",
        layout: "timeline",
        shell: "soft",
        radius: "md",
        motion: "calm",
      },
      cssPreset: "session-rail",
    },
    {
      id: "wellness-evening-ledger",
      vertical: "wellness",
      label: "Evening Ledger",
      description: "Retreat evening — voucher ledger, panel inbox, ritual book path.",
      isDefault: false,
      tokens: {
        colorMode: "dark",
        density: "comfortable",
        display: "serif",
        layout: "cards",
        shell: "soft",
        radius: "lg",
        motion: "calm",
      },
      cssPreset: "evening-ledger",
    },
  ],
  fitness: [
    {
      id: "fitness-gym-bold",
      vertical: "fitness",
      label: "Gym Bold",
      description: "High energy — dark chrome, class roster forward.",
      isDefault: true,
      tokens: {
        colorMode: "dark",
        density: "compact",
        display: "sans",
        layout: "timeline",
        shell: "bold",
        radius: "lg",
        motion: "crisp",
      },
      cssPreset: "gym-bold",
    },
    {
      id: "fitness-studio-clean",
      vertical: "fitness",
      label: "Studio Clean",
      description: "Pilates/yoga studio — bright, calm, capacity-visible.",
      isDefault: false,
      tokens: {
        colorMode: "light",
        density: "comfortable",
        display: "sans",
        layout: "cards",
        shell: "bold",
        radius: "xl",
        motion: "calm",
      },
      cssPreset: "studio-clean",
    },
    {
      id: "fitness-coach-compact",
      vertical: "fitness",
      label: "Coach Compact",
      description: "PT-focused — dense day list, pack burn visible.",
      isDefault: false,
      tokens: {
        colorMode: "system",
        density: "compact",
        display: "sans",
        layout: "list",
        shell: "bold",
        radius: "md",
        motion: "crisp",
      },
      cssPreset: "coach-compact",
    },
  ],
  medspa: [
    {
      id: "medspa-clinical-calm",
      vertical: "medspa",
      label: "Clinical Calm",
      description: "Consent-forward — restrained lavender, small radius, audit-visible.",
      isDefault: true,
      tokens: {
        colorMode: "light",
        density: "comfortable",
        display: "sans",
        layout: "cards",
        shell: "clinical",
        radius: "sm",
        motion: "clinical",
      },
      cssPreset: "clinical-calm",
    },
    {
      id: "medspa-luxury-serif",
      vertical: "medspa",
      label: "Luxury Serif",
      description: "Premium aesthetics clinic — serif display, wide spacing.",
      isDefault: false,
      tokens: {
        colorMode: "dark",
        density: "comfortable",
        display: "serif",
        layout: "list",
        shell: "clinical",
        radius: "sm",
        motion: "calm",
      },
      cssPreset: "luxury-serif",
    },
    {
      id: "medspa-minimal-consent",
      vertical: "medspa",
      label: "Minimal Consent",
      description: "Form-first — procedure + mandate steps dominate the layout.",
      isDefault: false,
      tokens: {
        colorMode: "light",
        density: "compact",
        display: "sans",
        layout: "list",
        shell: "clinical",
        radius: "sm",
        motion: "clinical",
      },
      cssPreset: "minimal-consent",
    },
  ],
  "allied-health": [
    {
      id: "allied-clinic-standard",
      vertical: "allied-health",
      label: "Clinic Standard",
      description: "Physio/chiro default — blue clinical, follow-up chain visible.",
      isDefault: true,
      tokens: {
        colorMode: "light",
        density: "comfortable",
        display: "sans",
        layout: "timeline",
        shell: "clinical",
        radius: "md",
        motion: "clinical",
      },
      cssPreset: "clinic-standard",
    },
    {
      id: "allied-practice-warm",
      vertical: "allied-health",
      label: "Practice Warm",
      description: "Approachable clinic — softer tone, patient-friendly copy density.",
      isDefault: false,
      tokens: {
        colorMode: "light",
        density: "comfortable",
        display: "serif",
        layout: "cards",
        shell: "clinical",
        radius: "lg",
        motion: "calm",
      },
      cssPreset: "practice-warm",
    },
    {
      id: "allied-compact-desk",
      vertical: "allied-health",
      label: "Compact Desk",
      description: "Front-desk dense — many short slots, fast patient check-in.",
      isDefault: false,
      tokens: {
        colorMode: "system",
        density: "compact",
        display: "sans",
        layout: "list",
        shell: "clinical",
        radius: "md",
        motion: "crisp",
      },
      cssPreset: "compact-desk",
    },
  ],
  "pet-grooming": [
    {
      id: "pet-playful-paw",
      vertical: "pet-grooming",
      label: "Playful Paw",
      description: "Friendly groomer — rounded cards, pet profile forward.",
      isDefault: true,
      tokens: {
        colorMode: "light",
        density: "comfortable",
        display: "sans",
        layout: "cards",
        shell: "playful",
        radius: "xl",
        motion: "calm",
      },
      cssPreset: "playful-paw",
    },
    {
      id: "pet-clean-groom",
      vertical: "pet-grooming",
      label: "Clean Groom",
      description: "Professional salon — light, tidy, pickup SMS prominent.",
      isDefault: false,
      tokens: {
        colorMode: "light",
        density: "comfortable",
        display: "sans",
        layout: "timeline",
        shell: "playful",
        radius: "lg",
        motion: "calm",
      },
      cssPreset: "clean-groom",
    },
    {
      id: "pet-mobile-van",
      vertical: "pet-grooming",
      label: "Mobile Van",
      description: "Mobile groomer — compact list, route-friendly density.",
      isDefault: false,
      tokens: {
        colorMode: "system",
        density: "compact",
        display: "sans",
        layout: "list",
        shell: "industrial",
        radius: "md",
        motion: "crisp",
      },
      cssPreset: "mobile-van",
    },
  ],
  "automotive-detailing": [
    {
      id: "auto-bay-industrial",
      vertical: "automotive-detailing",
      label: "Bay Industrial",
      description: "Shop floor — gray industrial, bay timeline, vehicle-aware packages.",
      isDefault: true,
      tokens: {
        colorMode: "dark",
        density: "compact",
        display: "sans",
        layout: "spatial",
        shell: "industrial",
        radius: "md",
        motion: "crisp",
      },
      cssPreset: "bay-industrial",
    },
    {
      id: "auto-showroom-light",
      vertical: "automotive-detailing",
      label: "Showroom Light",
      description: "Premium detail — light mode, package cards, valet comms.",
      isDefault: false,
      tokens: {
        colorMode: "light",
        density: "comfortable",
        display: "sans",
        layout: "cards",
        shell: "industrial",
        radius: "lg",
        motion: "calm",
      },
      cssPreset: "showroom-light",
    },
    {
      id: "auto-compact-mobile",
      vertical: "automotive-detailing",
      label: "Compact Mobile",
      description: "Mobile detailer — one-thumb day list, running-late broadcast.",
      isDefault: false,
      tokens: {
        colorMode: "system",
        density: "compact",
        display: "sans",
        layout: "list",
        shell: "industrial",
        radius: "sm",
        motion: "crisp",
      },
      cssPreset: "compact-mobile",
    },
  ],
  "event-vendors": [
    {
      id: "event-vendor-atelier",
      vertical: "event-vendors",
      label: "Atelier",
      description: "Gallery-forward decor — warm neutrals, enquire-first.",
      isDefault: true,
      tokens: {
        colorMode: "light",
        density: "comfortable",
        display: "serif",
        layout: "cards",
        shell: "gallery",
        radius: "lg",
        motion: "calm",
      },
      cssPreset: "event-atelier",
    },
    {
      id: "event-wedding-ledger",
      vertical: "event-vendors",
      label: "Wedding Ledger",
      description: "Muted luxury — quote pipeline and milestone deposits.",
      isDefault: false,
      tokens: {
        colorMode: "light",
        density: "comfortable",
        display: "serif",
        layout: "list",
        shell: "ledger",
        radius: "md",
        motion: "calm",
      },
      cssPreset: "wedding-ledger",
    },
    {
      id: "event-party-pop",
      vertical: "event-vendors",
      label: "Party Pop",
      description: "Birthday and kids parties — playful gallery grid.",
      isDefault: false,
      tokens: {
        colorMode: "light",
        density: "comfortable",
        display: "sans",
        layout: "cards",
        shell: "gallery",
        radius: "xl",
        motion: "crisp",
      },
      cssPreset: "party-pop",
    },
  ],
};

/** Four presets per vertical: Platform Default (Aurora) + three vertical-native skins. */
export const PRESENTATION_PRESETS: Record<BusinessVertical, PresentationPreset[]> = (
  Object.keys(BASE_PRESENTATION_PRESETS) as BusinessVertical[]
).reduce(
  (acc, vertical) => {
    acc[vertical] = [platformDefaultPreset(vertical), ...BASE_PRESENTATION_PRESETS[vertical]];
    return acc;
  },
  {} as Record<BusinessVertical, PresentationPreset[]>,
);

export function listPresentationPresets(vertical: BusinessVertical): PresentationPreset[] {
  return PRESENTATION_PRESETS[vertical];
}

/** Owner/onboarding picker — omits presets with `pickerVisible: false` (future unlock). */
export function filterPresetsForPicker(presets: PresentationPreset[]): PresentationPreset[] {
  return presets.filter((p) => p.pickerVisible !== false);
}

/**
 * API + Settings picker — platform-default + vertical-native skins visible in UI.
 * Sign-up uses platform-default; locked catalog presets stay valid for stored ids.
 */
/** Beauty picker order — platform default, then light, then dark. */
const BEAUTY_PICKER_ORDER = [
  PLATFORM_DEFAULT_PRESET_ID,
  "beauty-soft-studio",
  "beauty-noir-dusk",
] as const;

export function listPresentationPresetsForTenantPicker(
  vertical: BusinessVertical,
): PresentationPreset[] {
  const visible = filterPresetsForPicker(PRESENTATION_PRESETS[vertical]);
  if (vertical === "beauty") {
    return BEAUTY_PICKER_ORDER.map((id) => visible.find((p) => p.id === id)).filter(
      (p): p is PresentationPreset => p != null,
    );
  }
  return visible;
}

export function resolvePresentationPreset(
  vertical: BusinessVertical,
  presetId?: string | null,
): PresentationPreset {
  const presets = PRESENTATION_PRESETS[vertical];
  if (presetId) {
    const found = presets.find((p) => p.id === presetId);
    if (found) return found;
  }
  return presets.find((p) => p.isDefault) ?? presets[0]!;
}

export function isValidPresentationPreset(
  vertical: BusinessVertical,
  presetId: string,
): boolean {
  return PRESENTATION_PRESETS[vertical].some((p) => p.id === presetId);
}

/** Presets are presentation-only — must not pick a shell incompatible with vertical guest gates. */
export function presetPreservesVerticalGates(
  vertical: BusinessVertical,
  presetId: string,
): boolean {
  if (!isValidPresentationPreset(vertical, presetId)) return false;
  const preset = resolvePresentationPreset(vertical, presetId);
  if (vertical === "medspa" || vertical === "allied-health") {
    return ["clinical", "soft", "aurora"].includes(preset.tokens.shell);
  }
  if (vertical === "body-art") {
    return ["bold", "warm", "aurora", "industrial"].includes(preset.tokens.shell);
  }
  return true;
}

/** Staging / dev gate — presentation picker + token bundles. */
/** Wedge / gateway beat visuals — not auto-applied to tenant `presentation_preset_id`. */
export const DEMO_SHOWCASE_PRESENTATION_PRESET_ID: Record<BusinessVertical, string> = {
  hair: "hair-warm-chair",
  beauty: "beauty-noir-dusk",
  wellness: "wellness-harbour-light",
  "body-art": "body-art-studio-dark",
  fitness: "fitness-gym-bold",
  medspa: "medspa-clinical-calm",
  "allied-health": "allied-clinic-standard",
  "pet-grooming": "pet-playful-paw",
  "automotive-detailing": "auto-bay-industrial",
  "event-vendors": "event-vendor-atelier",
};

export function demoShowcasePresentationPresetId(vertical: BusinessVertical): string {
  return DEMO_SHOWCASE_PRESENTATION_PRESET_ID[vertical];
}

export function presentationPresetsEnabled(env?: Record<string, string | undefined>): boolean {
  const e = env ?? (typeof process !== "undefined" ? process.env : {});
  if (e.LIVIA_PRESENTATION_PRESETS === "true") return true;
  if (e.LIVIA_DEPLOY_ENV === "staging") return true;
  if (e.LIVIA_ENV === "staging") return true;
  if (e.RAILWAY_ENVIRONMENT_NAME === "staging") return true;
  if (e.NODE_ENV === "development" || e.NODE_ENV === "test") return true;
  return false;
}

