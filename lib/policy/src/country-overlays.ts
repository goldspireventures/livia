import type { BusinessVertical } from "./types";

export type CountryGroup = "uk_ie" | "eu" | "mena" | "other";

const UK_IE = new Set(["GB", "IE"]);
const EU_CORE = new Set(["DE", "FR", "ES", "IT", "NL", "PL", "SE", "DK", "NO", "FI"]);
// Minimal MENA set for “WhatsApp-first by default” behavior.
const MENA = new Set(["AE", "SA", "QA", "BH", "KW", "OM", "JO", "LB", "EG"]);

export function resolveCountryGroup(countryIso: string | null | undefined): CountryGroup {
  const c = (countryIso ?? "").trim().toUpperCase();
  if (UK_IE.has(c)) return "uk_ie";
  if (EU_CORE.has(c)) return "eu";
  if (MENA.has(c)) return "mena";
  return "other";
}

export type CountryOverlay = {
  group: CountryGroup;
  /** Preferred continuity thread mode (default, can be overridden per tenant). */
  continuityMode: "sms_thread" | "whatsapp_thread" | "email_only" | "instagram_deep_link";
  /** Defaults that are safe and sensible for the region. */
  defaultLateGraceMinutes: number;
  /** Product copy hinting — used for onboarding prompts or founder cockpit guidance. */
  note: string;
};

export function getCountryOverlay(args: {
  countryIso: string | null | undefined;
  vertical: BusinessVertical;
}): CountryOverlay {
  const group = resolveCountryGroup(args.countryIso);

  // WhatsApp-first norms in MENA; otherwise SMS-first for UK/IE + EU.
  const continuityMode = group === "mena" ? "whatsapp_thread" : "sms_thread";

  // Medspa / allied health prefer more conservative defaults.
  const clinical = args.vertical === "medspa" || args.vertical === "allied-health";
  const defaultLateGraceMinutes = clinical ? 5 : group === "mena" ? 15 : 10;

  const note =
    group === "mena"
      ? "WhatsApp-first region: optimize for DM-style continuity and fast confirmations."
      : group === "uk_ie"
        ? "UK/IE defaults: SMS-first continuity with explicit marketing opt-in."
        : group === "eu"
          ? "EU defaults: GDPR-forward language; keep marketing consent separate."
          : "Global defaults: keep channels configurable and disclose AI usage.";

  return { group, continuityMode, defaultLateGraceMinutes, note };
}

