import { resolveJurisdictionCode, type JurisdictionCode } from "@workspace/policy";

export type MarketSkin = {
  code: JurisdictionCode;
  /** CSS class suffix on public / app shell */
  halo: "emerald" | "slate" | "steel" | "rose" | "nordic" | "amber";
  /** Subtle primary hue shift (degrees) layered on vertical primary */
  hueShift: number;
  /** Customer-facing tone */
  tone: "warm" | "precise" | "luxe" | "nordic";
  /** Short market ribbon on public pages */
  ribbon?: string;
};

export const MARKET_SKINS: Partial<Record<JurisdictionCode, MarketSkin>> = {
  IE: {
    code: "IE",
    halo: "emerald",
    hueShift: 8,
    tone: "warm",
    ribbon: "Ireland · EUR · GDPR-first",
  },
  GB: {
    code: "GB",
    halo: "slate",
    hueShift: -6,
    tone: "precise",
    ribbon: "United Kingdom · GBP",
  },
  DE: {
    code: "DE",
    halo: "steel",
    hueShift: 0,
    tone: "precise",
    ribbon: "Deutschland · EUR · Sie tone",
  },
  ES: {
    code: "ES",
    halo: "amber",
    hueShift: 12,
    tone: "warm",
    ribbon: "España · EUR",
  },
  IT: {
    code: "IT",
    halo: "rose",
    hueShift: 10,
    tone: "luxe",
    ribbon: "Italia · EUR",
  },
  NL: {
    code: "NL",
    halo: "nordic",
    hueShift: -4,
    tone: "precise",
    ribbon: "Nederland · EUR",
  },
  PL: {
    code: "PL",
    halo: "steel",
    hueShift: 4,
    tone: "precise",
    ribbon: "Polska · PLN",
  },
  FR: {
    code: "FR",
    halo: "rose",
    hueShift: 14,
    tone: "luxe",
    ribbon: "France · EUR",
  },
  DK: {
    code: "DK",
    halo: "nordic",
    hueShift: -8,
    tone: "nordic",
    ribbon: "Danmark · DKK",
  },
  SE: {
    code: "SE",
    halo: "nordic",
    hueShift: -6,
    tone: "nordic",
    ribbon: "Sverige · SEK",
  },
  NO: {
    code: "NO",
    halo: "nordic",
    hueShift: -5,
    tone: "nordic",
    ribbon: "Norge · NOK",
  },
  FI: {
    code: "FI",
    halo: "nordic",
    hueShift: -4,
    tone: "nordic",
    ribbon: "Suomi · EUR",
  },
};

export function applyMarketTheme(country?: string | null) {
  const code = resolveJurisdictionCode(country);
  const skin = MARKET_SKINS[code] ?? MARKET_SKINS.IE!;
  const root = document.documentElement;
  root.dataset.country = code.toLowerCase();
  root.dataset.marketTone = skin.tone;
  root.style.setProperty("--market-hue-shift", String(skin.hueShift));
  root.style.setProperty("--market-halo", skin.halo);
}

export function clearMarketTheme() {
  const root = document.documentElement;
  delete root.dataset.country;
  delete root.dataset.marketTone;
  root.style.removeProperty("--market-hue-shift");
  root.style.removeProperty("--market-halo");
}
