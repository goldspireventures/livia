/**
 * Commerce entitlements — upgrade copy, API feature gates, in-app unlock UX.
 * Hub for policy-driven pricing surfaces (dashboard, mobile, marketing).
 * Prices mirror @workspace/entitlements ADDON_CATALOGUE — keep in sync.
 */

/** Event Operator pack — locked €49/mo (2026-06). */
export const EVENT_OPERATOR_PACK_EUR_CENTS = 4900;

export type EntitlementFeatureKey =
  | "event_operator_pack"
  | "consult_first_inbox"
  | "quote_generator"
  | "milestone_deposits"
  | "event_prep_lifecycle"
  | "vertical_pack_event_vendors";

export type CommerceFeatureId =
  | "consult_first_inbox"
  | "quote_generator"
  | "milestone_deposits"
  | "event_prep_lifecycle"
  | "event_public_site";

/** API wedge feature keys → entitlement required (beyond vertical scope). */
export const API_FEATURE_ENTITLEMENTS: Record<string, EntitlementFeatureKey> = {
  enquiries: "consult_first_inbox",
  quotes: "quote_generator",
  "event-vendor": "consult_first_inbox",
};

export function apiFeatureEntitlementKey(featureKey: string): EntitlementFeatureKey | null {
  return API_FEATURE_ENTITLEMENTS[featureKey] ?? null;
}

export function formatEventOperatorPackPrice(): string {
  return `€${Math.round(EVENT_OPERATOR_PACK_EUR_CENTS / 100)}`;
}

export type FeatureUnlockCopy = {
  featureId: CommerceFeatureId;
  title: string;
  description: string;
  addonId: "event_operator_pack";
  priceLabel: string;
  bullets: string[];
  successReturnPath: string;
};

const eventPackPrice = formatEventOperatorPackPrice();

export const FEATURE_UNLOCK_COPY: Record<CommerceFeatureId, FeatureUnlockCopy> = {
  consult_first_inbox: {
    featureId: "consult_first_inbox",
    title: "Unlock consult-first inbox",
    description: "Unified enquiries inbox with Liv handoff, channel routing, and human takeover.",
    addonId: "event_operator_pack",
    priceLabel: `${eventPackPrice}/mo`,
    bullets: [
      "Multi-channel enquiries (web, SMS, WhatsApp)",
      "Liv handles threads until you take over",
      "Links straight into your quote pipeline",
    ],
    successReturnPath: "/inbox",
  },
  quote_generator: {
    featureId: "quote_generator",
    title: "Unlock quote generator",
    description: "Itemised quotes, Liv drafts, brief intelligence, and send-for-review workflow.",
    addonId: "event_operator_pack",
    priceLabel: `${eventPackPrice}/mo`,
    bullets: [
      "Quote templates and line-item editor",
      "Liv draft from enquiry brief",
      "Public quote pages for clients",
    ],
    successReturnPath: "/quotes",
  },
  milestone_deposits: {
    featureId: "milestone_deposits",
    title: "Unlock milestone deposits",
    description: "Collect deposits on accepted quotes — Stripe Connect, booked pipeline automation.",
    addonId: "event_operator_pack",
    priceLabel: `${eventPackPrice}/mo`,
    bullets: [
      "Deposit schedules on quotes",
      "Guest pay link + webhook booking",
      "Engagement notifications on payment",
    ],
    successReturnPath: "/quotes",
  },
  event_prep_lifecycle: {
    featureId: "event_prep_lifecycle",
    title: "Unlock event prep",
    description: "Event-day checklist, prep timeline, and client-withdrew flows after booking.",
    addonId: "event_operator_pack",
    priceLabel: `${eventPackPrice}/mo`,
    bullets: [
      "Event-day sheet on booked quotes",
      "Prep timeline and stale nudges",
      "Client withdrew / mark lost flows",
    ],
    successReturnPath: "/quotes",
  },
  event_public_site: {
    featureId: "event_public_site",
    title: "Unlock public quote site",
    description: "Your /e/ website — enquiry form, deposit terms, and milestone defaults.",
    addonId: "event_operator_pack",
    priceLabel: `${eventPackPrice}/mo`,
    bullets: [
      "Public enquire + gallery",
      "Default deposit % and terms",
      "Powered-by Livia guest experience",
    ],
    successReturnPath: "/event-site",
  },
};

export function featureUnlockCopy(featureId: CommerceFeatureId): FeatureUnlockCopy {
  return FEATURE_UNLOCK_COPY[featureId];
}

/** Map dashboard route prefix → unlock feature for gate UI. */
export function commerceFeatureForPath(pathname: string): CommerceFeatureId | null {
  const path = pathname.split("?")[0] ?? pathname;
  if (path === "/inbox" || path.startsWith("/enquiries")) return "consult_first_inbox";
  if (path === "/quotes" || path.startsWith("/quotes/")) return "quote_generator";
  if (path === "/event-site" || path.startsWith("/event-site/")) return "event_public_site";
  return null;
}

export function eventOperatorPackMarketingBlurb(): string {
  return `Event Operator — ${eventPackPrice}/mo add-on on Solo or Studio. Includes consult-first inbox, quotes, milestone deposits, and event prep.`;
}
