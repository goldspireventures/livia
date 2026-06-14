/**
 * Single source for livia.io pricing copy — mirrors @workspace/entitlements PLAN_CATALOGUE
 * and docs/business/pricing-and-packaging.md (F9 hybrid).
 */
import { PEER_INSIGHTS_ADDON_EUR_CENTS, PLAN_CATALOGUE, voiceOutcomeCapLabel, EVENT_OPERATOR_ADDON_EUR_CENTS, ADDON_CATALOGUE } from "@workspace/entitlements";

export function formatEur(cents: number): string {
  return `€${Math.round(cents / 100)}`;
}

export const CORE_PLANS = ["solo", "studio", "chain", "chair-host"] as const;

export type CorePlanId = (typeof CORE_PLANS)[number];

const EXPANSION_PLAN_IDS = ["mid-chain", "franchise", "white-label"] as const;

const EXPANSION_DESC: Record<(typeof EXPANSION_PLAN_IDS)[number], string> = {
  "mid-chain":
    "Regional groups — policy templates and rollup between franchise and single-shop locations.",
  franchise:
    "Franchisors — performance rollup without exporting downstream customer PII.",
  "white-label":
    "Agencies and landlords running multiple consumer-facing brands under one portfolio.",
};

function seatSuffix(planId: string, seatCents: number): string {
  if (planId === "chair-host") return ` + ${formatEur(seatCents)}/renter`;
  return ` + ${formatEur(seatCents)}/seat`;
}

function baseUnitSuffix(planId: string): string {
  if (planId === "chain" || planId === "mid-chain" || planId === "franchise") return "/shop";
  return "";
}

function voiceNoteForPlan(p: (typeof PLAN_CATALOGUE)[string]): string {
  return voiceOutcomeCapLabel(p) ? `Voice receptionist: ${voiceOutcomeCapLabel(p)}.` : "";
}

export function planMarketingCard(id: CorePlanId) {
  const p = PLAN_CATALOGUE[id];
  const unit = baseUnitSuffix(id);
  const seat =
    p.seatEurCentsPerMonth != null ? seatSuffix(id, p.seatEurCentsPerMonth) : "";
  return {
    id: p.id,
    name: p.name,
    priceLabel: `${formatEur(p.baseEurCentsPerMonth)}${unit}/mo${seat}`,
    voiceNote: voiceNoteForPlan(p),
  };
}

export function expansionPlanMarketingCard(id: (typeof EXPANSION_PLAN_IDS)[number]) {
  const p = PLAN_CATALOGUE[id];
  const unit = baseUnitSuffix(id);
  const seat =
    p.seatEurCentsPerMonth != null ? seatSuffix(id, p.seatEurCentsPerMonth) : "";
  return {
    id: p.id,
    name: p.name,
    price: `From ${formatEur(p.baseEurCentsPerMonth)}${unit}/mo${seat}`,
    desc: EXPANSION_DESC[id],
  };
}

export const EXPANSION_PLANS = EXPANSION_PLAN_IDS.map((id) => expansionPlanMarketingCard(id));

/** FAQ / hero — never hardcode €79 in copy. */
export function marketingSoloFloorPrice(): string {
  return formatEur(PLAN_CATALOGUE.solo.baseEurCentsPerMonth);
}

export const SEAT_ROLE_RATES =
  "Manager €15 · Senior-w-admin €12 · Staff €8 · Receptionist €10 · Apprentice €4 — per active seat/month on team tiers (Stripe v1: flat €15/seat until role-based billing ships).";

/** How Livia earns — advertise every stream on pricing. */
export const REVENUE_STREAMS = [
  {
    id: "subscriptions",
    title: "Platform subscription",
    body: "Solo, Studio, Chain, and Host plans — EUR list prices, VAT ex. where applicable. You are not charged during closed beta; rates lock at public launch.",
  },
  {
    id: "seats",
    title: "Per-seat fees",
    body: SEAT_ROLE_RATES,
  },
  {
    id: "voice",
    title: "Voice outcome share",
    body: "4% on bookings Liv recovers from missed calls — with monthly caps shown in your digest so you keep upside without surprise bills.",
  },
  {
    id: "addons",
    title: "Add-ons",
    body: `Peer insights (${formatEur(PEER_INSIGHTS_ADDON_EUR_CENTS)}/mo), Event Operator (${formatEur(EVENT_OPERATOR_ADDON_EUR_CENTS)}/mo), Nordic locale pack, vertical packs, enterprise SSO & audit export.`,
  },
  {
    id: "migration",
    title: "Concierge migration",
    body: "Optional Phorest / Booksy / CSV import help — quoted €500–€2,500 depending on your client count (human-led, not self-serve).",
  },
  {
    id: "connect",
    title: "Stripe Connect (pass-through)",
    body: "When deposits go live, card payments land in your connected account. Your Livia subscription stays separate — we do not take marketplace commission on appointments.",
  },
] as const;

export const ADD_ONS = [
  {
    name: "Take-Home Retail",
    price: formatEur(ADDON_CATALOGUE.retail_pack.eurCentsPerMonth),
    desc: ADDON_CATALOGUE.retail_pack.description,
  },
  {
    name: "Event Operator",
    price: formatEur(EVENT_OPERATOR_ADDON_EUR_CENTS),
    desc: ADDON_CATALOGUE.event_operator_pack.description,
  },
  {
    name: "Peer insights",
    price: formatEur(PEER_INSIGHTS_ADDON_EUR_CENTS),
    desc: "Anonymized benchmarks when your segment has k≥10 shops.",
  },
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
