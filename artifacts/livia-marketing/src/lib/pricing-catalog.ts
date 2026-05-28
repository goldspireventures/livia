/**
 * Single source for livia.io pricing copy — mirrors @workspace/entitlements PLAN_CATALOGUE.
 */
import { PEER_INSIGHTS_ADDON_EUR_CENTS, PLAN_CATALOGUE } from "@workspace/entitlements";

export function formatEur(cents: number): string {
  return `€${Math.round(cents / 100)}`;
}

export const CORE_PLANS = ["solo", "studio", "chain", "chair-host"] as const;

export function planMarketingCard(id: (typeof CORE_PLANS)[number]) {
  const p = PLAN_CATALOGUE[id];
  const seat =
    p.seatEurCentsPerMonth != null ? ` + ${formatEur(p.seatEurCentsPerMonth)}/seat` : "";
  const voice =
    p.voiceOutcomeShare > 0
      ? `Voice receptionist: ${Math.round(p.voiceOutcomeShare * 100)}% on recovered missed-call bookings${
          p.voiceOutcomeCapEurCents ? ` (cap ${formatEur(p.voiceOutcomeCapEurCents)}/mo)` : ""
        }`
      : "";
  return {
    id: p.id,
    name: p.name,
    priceLabel: `${formatEur(p.baseEurCentsPerMonth)}/mo${seat}`,
    voiceNote: voice,
  };
}

export const EXPANSION_PLANS = [
  { id: "mid-chain", name: "Mid-chain", price: "From €249/shop", desc: "Regional groups — policy templates + rollup between franchise and single-shop." },
  { id: "franchise", name: "Franchise", price: "From €199/shop", desc: "Franchisors — performance rollup without exporting downstream customer PII." },
  { id: "white-label", name: "Multi-brand", price: "€99/mo base", desc: "Agencies and landlords running multiple consumer-facing brands." },
] as const;

/** How Livia earns — advertise every stream on pricing. */
export const REVENUE_STREAMS = [
  {
    id: "subscriptions",
    title: "Platform subscription",
    body: "Solo, Studio, Chain, and Host plans — EUR list prices, VAT ex. where applicable. Billed via Stripe Billing.",
  },
  {
    id: "seats",
    title: "Per-seat fees",
    body: "Studio and chain tiers add per active staff seat (€15/mo) so pricing scales with team size, not arbitrary user caps.",
  },
  {
    id: "voice",
    title: "Voice outcome share",
    body: "4% on bookings Liv recovers from missed calls — capped monthly so you keep upside without surprise bills.",
  },
  {
    id: "addons",
    title: "Add-ons",
    body: `Peer insights (${formatEur(PEER_INSIGHTS_ADDON_EUR_CENTS)}/mo), Nordic locale pack, vertical packs, enterprise SSO & audit export — unlock in-app when your plan allows.`,
  },
  {
    id: "migration",
    title: "Concierge migration",
    body: "Optional Phorest / Booksy / CSV import help — quoted €500–€2,500 depending on client count (human-led, not self-serve).",
  },
  {
    id: "connect",
    title: "Stripe Connect (pass-through)",
    body: "Card deposits go to your connected account. Livia subscription is separate — we do not take marketplace commission on appointments.",
  },
] as const;

export const ADD_ONS = [
  { name: "Peer insights", price: formatEur(PEER_INSIGHTS_ADDON_EUR_CENTS), desc: "Anonymized benchmarks when your segment has k≥10 shops." },
  { name: "Nordic locale pack", price: "Custom", desc: "Extended Liv + SMS templates for SE, DK, NO, FI." },
  { name: "Enterprise SSO", price: "Chain+", desc: "SAML/OIDC for multi-location operators." },
  { name: "Audit export", price: "Chain+", desc: "Tamper-evident audit chain export for compliance reviews." },
] as const;

export const EU_MARKETS = [
  { code: "IE", label: "Ireland", currency: "EUR", language: "English (en-IE)" },
  { code: "GB", label: "United Kingdom", currency: "GBP", language: "English (en-GB)" },
  { code: "DE", label: "Germany", currency: "EUR", language: "Deutsch + Liv DE templates" },
  { code: "FR", label: "France", currency: "EUR", language: "Français + Liv FR templates" },
  { code: "ES", label: "Spain", currency: "EUR", language: "Español packs" },
  { code: "IT", label: "Italy", currency: "EUR", language: "English UI · IT jurisdiction pack" },
  { code: "NL", label: "Netherlands", currency: "EUR", language: "English UI · NL pack" },
  { code: "PL", label: "Poland", currency: "EUR", language: "English UI · PL pack" },
] as const;
