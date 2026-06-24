/**
 * Beauty experiential layer — policy hub for ambiance, motion, morph intent, and picker copy.
 * Mirrors wellness-experience.ts; surfaces stay thin (CSS + layout morph from presentation-surface).
 *
 * Shipped picker: Platform Default + Soft Studio (light) + Noir Dusk (dark).
 * Editorial + Premium Dark remain in catalog for future unlock (`pickerVisible: false`).
 */
import type { PresentationLayoutMorph } from "./presentation-surface";
import { PLATFORM_DEFAULT_PRESET_ID } from "./presentation-presets";

export type BeautyShippedCssPreset = "noir-dusk" | "soft-studio";

export type BeautyAmbienceTokens = {
  breathPeriodMs: number;
  glowPrimary: string;
  glowSecondary: string;
  driftTier: 0 | 1 | 2;
  /** Time-of-day wash on native skins */
  timeOfDayWash: boolean;
};

export type BeautyMotionBeats = {
  pageEnter: "fade-rise" | "fade";
  listStaggerMs: number;
  inboxHighlightMs: number;
  bookingConfirmGlowMs: number;
  livThinkingPulse: boolean;
};

export type BeautySurfaceErgonomics = {
  touchMinPx: number;
  splitInboxDesktop: boolean;
  treatmentMenuProminent: boolean;
};

export type BeautyPickerMeta = {
  presetId: string;
  label: string;
  colorScheme: string;
  morph: PresentationLayoutMorph;
  morphLabel: string;
  operatorIntent: string;
  guestIntent: string;
  whenToPick: string;
};

export type BeautyExperienceProfile = {
  cssPreset: BeautyShippedCssPreset;
  label: string;
  ambience: BeautyAmbienceTokens;
  motion: BeautyMotionBeats;
  surface: BeautySurfaceErgonomics;
  ritualCopy: {
    inboxTriage: string;
    patchTestReminder: string;
    treatmentComplete: string;
    walkInWelcome: string;
  };
  picker: BeautyPickerMeta;
};

const BASE_SURFACE: BeautySurfaceErgonomics = {
  touchMinPx: 44,
  splitInboxDesktop: true,
  treatmentMenuProminent: true,
};

export const BEAUTY_PLATFORM_DEFAULT_PICKER: BeautyPickerMeta = {
  presetId: PLATFORM_DEFAULT_PRESET_ID,
  label: "Platform Default",
  colorScheme: "Ink shell · champagne Liv accents · starfield ambient",
  morph: "constellation",
  morphLabel: "Constellation",
  operatorIntent:
    "Constellation Today — ink night sky, orbital KPI glass, champagne Liv briefing. Classic Livia before you dress the studio.",
  guestIntent:
    "Neutral premium booking page book page — Livia constellation look, not yet dressed as a lash or brow studio.",
  whenToPick: "New signups and owners who want the platform look first, then brand the studio in Appearance.",
};

export const BEAUTY_EXPERIENCE_BY_CSS: Record<BeautyShippedCssPreset, BeautyExperienceProfile> = {
  "noir-dusk": {
    cssPreset: "noir-dusk",
    label: "Noir Dusk",
    ambience: {
      breathPeriodMs: 4800,
      glowPrimary: "hsla(330, 45%, 72%, 0.12)",
      glowSecondary: "hsla(228, 18%, 9%, 0.55)",
      driftTier: 2,
      timeOfDayWash: true,
    },
    motion: {
      pageEnter: "fade-rise",
      listStaggerMs: 36,
      inboxHighlightMs: 520,
      bookingConfirmGlowMs: 640,
      livThinkingPulse: true,
    },
    surface: { ...BASE_SURFACE, splitInboxDesktop: true },
    ritualCopy: {
      inboxTriage: "DM waiting — patch test or fill cycle?",
      patchTestReminder: "48h patch test before tint — confirm in thread",
      treatmentComplete: "Chair clear — next guest in queue",
      walkInWelcome: "Evening walk-in — check lash fill availability",
    },
    picker: {
      presetId: "beauty-noir-dusk",
      label: "Noir Dusk",
      colorScheme: "Charcoal studio · mauve-rose accents · soft dark",
      morph: "split-inbox",
      morphLabel: "Inbox-first Today",
      operatorIntent:
        "Inbox hero on Today — lash DMs, patch-test threads, and Instagram enquiries before the floor queue.",
      guestIntent:
        "Moody evening studio booking — confident dark booking page page suited to lashes, nails, and evening appointments.",
      whenToPick: "DM-heavy studios, lash artists, and owners who live in inbox triage after hours.",
    },
  },
  "soft-studio": {
    cssPreset: "soft-studio",
    label: "Soft Studio",
    ambience: {
      breathPeriodMs: 4000,
      glowPrimary: "hsla(330, 81%, 60%, 0.1)",
      glowSecondary: "hsla(330, 40%, 98%, 0.35)",
      driftTier: 1,
      timeOfDayWash: false,
    },
    motion: {
      pageEnter: "fade-rise",
      listStaggerMs: 44,
      inboxHighlightMs: 480,
      bookingConfirmGlowMs: 560,
      livThinkingPulse: true,
    },
    surface: { ...BASE_SURFACE, splitInboxDesktop: false },
    ritualCopy: {
      inboxTriage: "Morning messages — brow lamination or nail art?",
      patchTestReminder: "Patch test booked — remind guest 24h ahead",
      treatmentComplete: "Studio calm — turnover before next brow",
      walkInWelcome: "Walk-in welcome — atrium shows open chairs",
    },
    picker: {
      presetId: "beauty-soft-studio",
      label: "Soft Studio",
      colorScheme: "Blush daylight · rose primary · white cards",
      morph: "atrium",
      morphLabel: "Studio atrium",
      operatorIntent:
        "Atrium Today — gentle swimlanes for chairs and walk-ins; inbox still one tap in the sidebar.",
      guestIntent:
        "Bright, welcoming booking page — best for brow bars, nail studios, and daytime appointment flows.",
      whenToPick: "Daylight studios, brow specialists, and owners who want a calm floor overview first.",
    },
  },
};

export function isBeautyShippedCssPreset(v: string | null | undefined): v is BeautyShippedCssPreset {
  return v === "noir-dusk" || v === "soft-studio";
}

export function resolveBeautyExperience(
  cssPreset: string | null | undefined,
): BeautyExperienceProfile | null {
  if (!isBeautyShippedCssPreset(cssPreset)) return null;
  return BEAUTY_EXPERIENCE_BY_CSS[cssPreset];
}

export function resolveBeautyPickerMeta(
  presetId: string | null | undefined,
): BeautyPickerMeta | null {
  if (!presetId) return null;
  if (presetId === PLATFORM_DEFAULT_PRESET_ID) return BEAUTY_PLATFORM_DEFAULT_PICKER;
  for (const profile of Object.values(BEAUTY_EXPERIENCE_BY_CSS)) {
    if (profile.picker.presetId === presetId) return profile.picker;
  }
  return null;
}

export function beautyLayoutMorphLabel(morph: PresentationLayoutMorph | null): string {
  switch (morph) {
    case "split-inbox":
      return "Inbox-first Today";
    case "atrium":
      return "Studio atrium";
    case "menu-card":
      return "Treatment menu";
    case "cockpit":
      return "Floor cockpit";
    case "constellation":
      return "Constellation";
    default:
      return "Standard";
  }
}

/** Presets hidden from owner picker until a future release unlock. */
export const BEAUTY_LOCKED_PRESET_IDS = ["beauty-editorial", "beauty-premium-dark"] as const;
