/**
 * Public booking + branded surfaces — mirrors dashboard `experience-theme` / `market-theme`.
 * Prefer API `experienceSkin` when present; fall back to vertical + category + country.
 */
import {
  resolveJurisdictionCode,
  resolveVerticalKey,
  type BusinessVertical,
  type JurisdictionCode,
} from "@workspace/policy";
import { fonts } from "@/constants/typography";
import { VERTICAL_ACCENT_HEX } from "@/lib/vertical-theme";

export type ExperienceShell = "warm" | "clinical" | "soft" | "bold" | "playful" | "industrial";
export type ExperienceDisplay = "serif" | "sans";

export type PublicExperienceSkin = {
  shell: ExperienceShell;
  display: ExperienceDisplay;
  market: string;
};

export type ResolvedPublicExperience = {
  vertical: BusinessVertical;
  primary: string;
  hero: string;
  shell: ExperienceShell;
  display: ExperienceDisplay;
  marketCode: JurisdictionCode;
  marketRibbon?: string;
  cardRadius: number;
  titleFontFamily: string;
};

const VERTICAL_HERO: Record<BusinessVertical, string> = {
  hair: "#2a2218",
  beauty: "#2a1520",
  "body-art": "#1a1008",
  wellness: "#0f1f1c",
  fitness: "#0f1a12",
  medspa: "#12101a",
  "allied-health": "#0c1418",
  "pet-grooming": "#1a1220",
  "automotive-detailing": "#0f1114",
  "event-vendors": "#1a1408",
};

/** Aligned with dashboard `MARKET_SKINS` ribbons. */
export const MOBILE_MARKET_RIBBON: Record<JurisdictionCode, string> = {
  IE: "Ireland · EUR · GDPR-first",
  GB: "United Kingdom · GBP",
  DE: "Deutschland · EUR · Sie tone",
  ES: "España · EUR",
  IT: "Italia · EUR",
  NL: "Nederland · EUR",
  PL: "Polska · PLN",
  FR: "France · EUR",
  DK: "Danmark · DKK",
  SE: "Sverige · SEK",
  NO: "Norge · NOK",
  FI: "Suomi · EUR",
};

const SHELL_RADIUS: Record<ExperienceShell, number> = {
  warm: 14,
  soft: 16,
  clinical: 10,
  bold: 8,
  playful: 18,
  industrial: 6,
};

function parseShell(raw?: string | null): ExperienceShell {
  const s = raw as ExperienceShell | undefined;
  if (s && s in SHELL_RADIUS) return s;
  return "warm";
}

function parseDisplay(raw?: string | null): ExperienceDisplay {
  return raw === "sans" ? "sans" : "serif";
}

export function resolvePublicExperience(args: {
  vertical?: string | null;
  category?: string | null;
  country?: string | null;
  experienceSkin?: Partial<PublicExperienceSkin> | null;
}): ResolvedPublicExperience {
  const vertical = resolveVerticalKey(args.vertical, args.category);
  const marketCode = args.experienceSkin?.market
    ? (args.experienceSkin.market.toUpperCase() as JurisdictionCode)
    : resolveJurisdictionCode(args.country);
  const shell = parseShell(args.experienceSkin?.shell);
  const display = parseDisplay(args.experienceSkin?.display);

  return {
    vertical,
    primary: VERTICAL_ACCENT_HEX[vertical],
    hero: VERTICAL_HERO[vertical],
    shell,
    display,
    marketCode,
    marketRibbon: MOBILE_MARKET_RIBBON[marketCode],
    cardRadius: SHELL_RADIUS[shell],
    titleFontFamily: display === "serif" ? fonts.serif : fonts.bodySemi,
  };
}

/** @deprecated use resolvePublicExperience */
export function mobileVerticalExperience(vertical?: string | null) {
  const r = resolvePublicExperience({ vertical });
  return { primary: r.primary, shell: r.shell, hero: r.hero };
}

export const MOBILE_VERTICAL_EXPERIENCE = Object.fromEntries(
  (Object.keys(VERTICAL_ACCENT_HEX) as BusinessVertical[]).map((v) => [
    v,
    {
      primary: VERTICAL_ACCENT_HEX[v],
      shell: resolvePublicExperience({ vertical: v }).shell,
      hero: VERTICAL_HERO[v],
    },
  ]),
) as Record<BusinessVertical, { primary: string; shell: string; hero: string }>;
