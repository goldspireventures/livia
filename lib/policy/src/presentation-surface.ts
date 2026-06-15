/**
 * Presentation surface morph — maps preset → layout primitive for thin surfaces.
 * @see docs/design/SURFACE-AND-BREAKPOINTS.md
 * @see docs/engineering/COMPOSABLE-EVOLUTION.md
 */
import type { BusinessVertical } from "./types";
import { businessVerticalSchema } from "./types";
import {
  PRESENTATION_PRESETS,
  PLATFORM_DEFAULT_PRESET_ID,
  filterPresetsForPicker,
  resolvePresentationPreset,
  type PresentationPreset,
} from "./presentation-presets";

/** Stable morph id on `html[data-layout-morph]` — drives shell + module layout. */
export type PresentationLayoutMorph =
  | "constellation"
  | "standard"
  | "atrium"
  | "timeline-rail"
  | "ledger"
  | "pipeline"
  | "split-inbox"
  | "menu-card"
  | "cockpit";

const WELLNESS_MORPH_BY_CSS: Record<string, PresentationLayoutMorph> = {
  "platform-default": "constellation",
  "harbour-light": "atrium",
  "session-rail": "timeline-rail",
  "evening-ledger": "ledger",
};

/** Beauty native skins — distinct Today shells (not palette-only). */
const BEAUTY_MORPH_BY_CSS: Record<string, PresentationLayoutMorph> = {
  "noir-dusk": "split-inbox",
  "soft-studio": "atrium",
  editorial: "menu-card",
  "premium-dark": "cockpit",
};

/** Event-vendor consult-first — gallery enquire, quote pipeline, playful party grid. */
const EVENT_VENDORS_MORPH_BY_CSS: Record<string, PresentationLayoutMorph> = {
  "event-atelier": "atrium",
  "wedding-ledger": "pipeline",
  "party-pop": "menu-card",
};

const BODY_ART_MORPH_BY_CSS: Record<string, PresentationLayoutMorph> = {
  "studio-dark": "pipeline",
  "flash-light": "pipeline",
  "minimal-mono": "standard",
};

const GENERIC_LAYOUT_MORPH: Record<string, PresentationLayoutMorph> = {
  cards: "standard",
  list: "standard",
  timeline: "timeline-rail",
  pipeline: "pipeline",
  spatial: "atrium",
};

function resolvePresetRef(
  vertical: BusinessVertical,
  presetOrId?: PresentationPreset | string | null,
): PresentationPreset {
  if (presetOrId && typeof presetOrId === "object") return presetOrId;
  const presets = PRESENTATION_PRESETS[vertical];
  if (typeof presetOrId === "string" && presetOrId) {
    const byId = presets.find((p) => p.id === presetOrId);
    if (byId) return byId;
    const byCss = presets.find((p) => p.cssPreset === presetOrId);
    if (byCss) return byCss;
  }
  return resolvePresentationPreset(vertical, presetOrId);
}

export function resolvePresentationLayoutMorph(
  vertical: BusinessVertical,
  presetOrId?: PresentationPreset | string | null,
): PresentationLayoutMorph {
  const preset = resolvePresetRef(vertical, presetOrId);

  if (vertical === "wellness" && preset.cssPreset in WELLNESS_MORPH_BY_CSS) {
    return WELLNESS_MORPH_BY_CSS[preset.cssPreset]!;
  }
  if (vertical === "beauty" && preset.cssPreset in BEAUTY_MORPH_BY_CSS) {
    return BEAUTY_MORPH_BY_CSS[preset.cssPreset]!;
  }
  if (vertical === "event-vendors" && preset.cssPreset in EVENT_VENDORS_MORPH_BY_CSS) {
    return EVENT_VENDORS_MORPH_BY_CSS[preset.cssPreset]!;
  }
  if (vertical === "body-art" && preset.cssPreset in BODY_ART_MORPH_BY_CSS) {
    return BODY_ART_MORPH_BY_CSS[preset.cssPreset]!;
  }
  if (preset.cssPreset === "platform-default") {
    return "constellation";
  }
  return GENERIC_LAYOUT_MORPH[preset.tokens.layout] ?? "standard";
}

export type VerticalPresentationHandshake = {
  vertical: BusinessVertical;
  presetCount: number;
  includesPlatformDefault: boolean;
  morphs: PresentationLayoutMorph[];
  ok: boolean;
  errors: string[];
};

/** R3 handshake — vertical pack must ship Platform Default + 3 native presets with distinct morphs (wellness). */
export function validateVerticalPresentationPack(
  vertical: BusinessVertical,
): VerticalPresentationHandshake {
  const presets = PRESENTATION_PRESETS[vertical];
  const errors: string[] = [];
  const includesPlatformDefault = presets.some((p) => p.id === PLATFORM_DEFAULT_PRESET_ID);
  const morphs = presets.map((p) => resolvePresentationLayoutMorph(vertical, p));

  if (!includesPlatformDefault) {
    errors.push(`${vertical}: missing platform-default preset`);
  }
  if (presets.length < 4) {
    errors.push(`${vertical}: expected 4 presets (platform-default + 3 native), got ${presets.length}`);
  }
  const native = presets.filter((p) => p.id !== PLATFORM_DEFAULT_PRESET_ID);
  if (native.length < 3) {
    errors.push(`${vertical}: expected 3 vertical-native presets, got ${native.length}`);
  }

  if (vertical === "wellness") {
    const required: PresentationLayoutMorph[] = ["constellation", "atrium", "timeline-rail", "ledger"];
    for (const m of required) {
      if (!morphs.includes(m)) {
        errors.push(`wellness: missing layout morph "${m}"`);
      }
    }
    const nativeMorphs = native.map((p) => resolvePresentationLayoutMorph(vertical, p));
    if (new Set(nativeMorphs).size !== nativeMorphs.length) {
      errors.push("wellness: native presets must have distinct layout morphs");
    }
  }

  if (vertical === "beauty") {
    const required: PresentationLayoutMorph[] = [
      "constellation",
      "split-inbox",
      "atrium",
      "menu-card",
      "cockpit",
    ];
    for (const m of required) {
      if (!morphs.includes(m)) {
        errors.push(`beauty: missing layout morph "${m}"`);
      }
    }
    const nativeMorphs = native
      .filter((p) => p.cssPreset !== "platform-default")
      .map((p) => resolvePresentationLayoutMorph(vertical, p));
    if (new Set(nativeMorphs).size !== nativeMorphs.length) {
      errors.push("beauty: native presets must have distinct layout morphs");
    }
  }

  if (vertical === "event-vendors") {
    const required: PresentationLayoutMorph[] = [
      "constellation",
      "atrium",
      "pipeline",
      "menu-card",
    ];
    for (const m of required) {
      if (!morphs.includes(m)) {
        errors.push(`event-vendors: missing layout morph "${m}"`);
      }
    }
    const nativeMorphs = native.map((p) => resolvePresentationLayoutMorph(vertical, p));
    if (new Set(nativeMorphs).size !== nativeMorphs.length) {
      errors.push("event-vendors: native presets must have distinct layout morphs");
    }
  }

  return {
    vertical,
    presetCount: presets.length,
    includesPlatformDefault,
    morphs,
    ok: errors.length === 0,
    errors,
  };
}

/** Owner picker — visible presets only (sign-up default + shipped vertical skins). */
export function listPresentationPresetsForOwnerPicker(
  vertical: BusinessVertical,
): PresentationPreset[] {
  return filterPresetsForPicker(PRESENTATION_PRESETS[vertical]);
}

/** Internal ops + CI — presentation pack health across all verticals. */
export function auditAllVerticalPresentationPacks(): VerticalPresentationHandshake[] {
  return (Object.keys(PRESENTATION_PRESETS) as BusinessVertical[]).map((vertical) =>
    validateVerticalPresentationPack(vertical),
  );
}

/** Owner-facing morph label — web + mobile bookings headers. */
export function presentationLayoutMorphLabel(morph: PresentationLayoutMorph | null): string {
  switch (morph) {
    case "atrium":
      return "Room swimlanes";
    case "timeline-rail":
      return "Session timeline";
    case "ledger":
      return "Voucher ledger";
    case "constellation":
      return "Constellation";
    case "pipeline":
      return "Pipeline";
    case "split-inbox":
      return "Split inbox";
    case "menu-card":
      return "Treatment menu";
    case "cockpit":
      return "Floor cockpit";
    default:
      return "Standard";
  }
}

const BOOKINGS_MORPH_BAND_FALLBACK: Partial<Record<PresentationLayoutMorph, string>> = {
  "split-inbox": "Schedule below · pending confirmations pinned first",
  ledger: "Prepaid balance — confirm before close",
};

/** Per-vertical morph band lines on bookings list — no salon defaults on wrong verticals. */
const BOOKINGS_MORPH_BAND_BY_VERTICAL: Record<
  BusinessVertical,
  Partial<Record<PresentationLayoutMorph, string>>
> = {
  hair: {
    "split-inbox": "Chair queue below · pending confirmations pinned first",
  },
  beauty: {
    "split-inbox": "Treatment queue below · confirm bookings first",
  },
  "body-art": {
    "split-inbox": "Studio queue below · pending confirmations pinned first",
  },
  wellness: {
    ledger: "Prepaid sessions & settlements — confirm redemptions before close",
    "split-inbox": "Session schedule below · pending pinned first",
  },
  fitness: {
    "split-inbox": "Class roster below · pending confirmations pinned first",
  },
  medspa: {
    "split-inbox": "Appointment queue below · pending pinned first",
  },
  "allied-health": {
    "split-inbox": "Session queue below · pending pinned first",
  },
  "pet-grooming": {
    "split-inbox": "Grooming queue below · pending pinned first",
  },
  "automotive-detailing": {
    "split-inbox": "Bay queue below · pending pinned first",
  },
  "event-vendors": {
    "split-inbox": "Enquiry queue below · pending quotes pinned first",
    pipeline: "Quote pipeline below · follow-ups pinned first",
  },
};

/** Bookings morph context band — null when morph has no band line. */
export function bookingsMorphBandLine(
  morph: PresentationLayoutMorph | null,
  vertical?: string | null,
  _category?: string | null,
): string | null {
  if (!morph) return null;
  const key =
    vertical && businessVerticalSchema.options.includes(vertical as BusinessVertical)
      ? (vertical as BusinessVertical)
      : "hair";
  return (
    BOOKINGS_MORPH_BAND_BY_VERTICAL[key]?.[morph] ??
    BOOKINGS_MORPH_BAND_FALLBACK[morph] ??
    null
  );
}
