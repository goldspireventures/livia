/**
 * Platform gating — business POV (what's included, what's add-on, how to unlock).
 * Engineering gates: @workspace/entitlements PLAN_CATALOGUE + ADDON_CATALOGUE,
 * commerce-entitlements-program (FeatureUnlockGate), API entitlement middleware.
 */
import type { EntitlementKey } from "@workspace/entitlements";
import type { CommerceFeatureId } from "./commerce-entitlements-program";

export type GatingSurface = "page" | "element" | "api" | "onboarding_optional";

export type PlatformCapabilityId =
  | "core_bookings"
  | "core_clients"
  | "core_services_team"
  | "public_booking_page"
  | "guest_my_hub"
  | "liv_assist"
  | "liv_booking_page_chat"
  | "sms_messaging"
  | "voice_receptionist"
  | "email_transactional"
  | "deposits_stripe"
  | "csv_migration"
  | "take_home_retail"
  | "event_operator_stack"
  | "peer_insights"
  | "multi_brand_chain";

export type CapabilityGateDef = {
  id: PlatformCapabilityId;
  /** Owner-facing name */
  label: string;
  /** One line — why it matters vs incumbents */
  valueLine: string;
  /** solo | studio | chain | addon | trial_limited | platform_config */
  includedIn: Array<"solo" | "studio" | "trial" | "chain" | "addon" | "all_paid">;
  addonId?: "event_operator_pack" | "retail_pack" | "peer_set_insights";
  entitlementKey?: EntitlementKey;
  surface: GatingSurface;
  /** When the owner typically turns this on */
  unlockMoment: "signup" | "onboarding" | "after_onboarding" | "checkout_addon" | "settings";
  unlockPath: string;
};

/** Standard Solo/Studio — sacred metric: first booking on Livia link. */
export const CORE_CAPABILITIES: PlatformCapabilityId[] = [
  "core_bookings",
  "core_clients",
  "core_services_team",
  "public_booking_page",
  "guest_my_hub",
  "liv_assist",
  "liv_booking_page_chat",
  "deposits_stripe",
  "csv_migration",
];

export const PLATFORM_CAPABILITY_GATES: Record<PlatformCapabilityId, CapabilityGateDef> = {
  core_bookings: {
    id: "core_bookings",
    label: "Bookings & calendar",
    valueLine: "One diary for chair, room, or floor — not a spreadsheet beside Phorest.",
    includedIn: ["solo", "studio", "trial", "chain", "all_paid"],
    surface: "page",
    unlockMoment: "signup",
    unlockPath: "/bookings",
  },
  core_clients: {
    id: "core_clients",
    label: "Client records",
    valueLine: "Every guest in one place — visit history follows them to /my.",
    includedIn: ["solo", "studio", "trial", "chain", "all_paid"],
    surface: "page",
    unlockMoment: "signup",
    unlockPath: "/customers",
  },
  core_services_team: {
    id: "core_services_team",
    label: "Services & team",
    valueLine: "Vertical-aware menu and roster — not salon-generic defaults.",
    includedIn: ["solo", "studio", "trial", "chain", "all_paid"],
    surface: "page",
    unlockMoment: "onboarding",
    unlockPath: "/services",
  },
  public_booking_page: {
    id: "public_booking_page",
    label: "Public booking page",
    valueLine: "Your link or subdomain — guests book without an app download.",
    includedIn: ["solo", "studio", "trial", "chain", "all_paid"],
    surface: "page",
    unlockMoment: "onboarding",
    unlockPath: "Settings → Shop → Public link",
  },
  guest_my_hub: {
    id: "guest_my_hub",
    label: "Guest hub (/my)",
    valueLine: "Returning guests see visits, pay links, and continuity — not one-off SMS threads.",
    includedIn: ["solo", "studio", "chain", "all_paid"],
    surface: "page",
    unlockMoment: "signup",
    unlockPath: "/my/{slug}",
  },
  liv_assist: {
    id: "liv_assist",
    label: "Liv on Today & Inbox",
    valueLine: "Policy-driven briefings — not a generic chatbot sidebar.",
    includedIn: ["solo", "studio", "trial", "chain", "all_paid"],
    surface: "element",
    unlockMoment: "onboarding",
    unlockPath: "/dashboard",
  },
  liv_booking_page_chat: {
    id: "liv_booking_page_chat",
    label: "Liv on booking page",
    valueLine: "Guests ask questions and book when you allow — vertical copy, not salon jargon.",
    includedIn: ["solo", "studio", "chain", "all_paid"],
    surface: "element",
    unlockMoment: "settings",
    unlockPath: "Settings → Liv",
  },
  sms_messaging: {
    id: "sms_messaging",
    label: "SMS for guests",
    valueLine: "Reminders, running-late, pay links — on your shop number.",
    includedIn: ["solo", "studio", "chain", "all_paid"],
    entitlementKey: "sms_outbound",
    surface: "element",
    unlockMoment: "after_onboarding",
    unlockPath: "Settings → Communications → Get a shop SMS number",
  },
  voice_receptionist: {
    id: "voice_receptionist",
    label: "Phone receptionist (Liv answers)",
    valueLine: "Missed calls become bookings — outcome share on Solo/Studio, not a separate SaaS bill.",
    includedIn: ["solo", "studio", "chain", "all_paid"],
    entitlementKey: "voice_receptionist",
    surface: "element",
    unlockMoment: "after_onboarding",
    unlockPath:
      "Included on Solo & Studio — provision your shop number under Settings → Communications (same number as SMS). Not required during onboarding.",
  },
  email_transactional: {
    id: "email_transactional",
    label: "Transactional email",
    valueLine: "Confirmations and receipts from your sender name.",
    includedIn: ["solo", "studio", "chain", "all_paid"],
    surface: "element",
    unlockMoment: "after_onboarding",
    unlockPath: "Settings → Communications → Email sender",
  },
  deposits_stripe: {
    id: "deposits_stripe",
    label: "Deposits & card pay",
    valueLine: "Stripe Connect — guests pay on your booking page.",
    includedIn: ["solo", "studio", "chain", "all_paid"],
    entitlementKey: "deposits",
    surface: "element",
    unlockMoment: "after_onboarding",
    unlockPath: "Settings → Billing → Payments",
  },
  csv_migration: {
    id: "csv_migration",
    label: "Import from previous tool",
    valueLine: "Paste exports — Liv maps clients, menu, and forward bookings.",
    includedIn: ["solo", "studio", "trial", "chain", "all_paid"],
    entitlementKey: "csv_importer",
    surface: "element",
    unlockMoment: "onboarding",
    unlockPath: "Onboarding → Bring your shop, or Settings → Integrations",
  },
  take_home_retail: {
    id: "take_home_retail",
    label: "Take-home retail",
    valueLine: "Mini store on your booking page + post-visit pay links.",
    includedIn: ["addon"],
    addonId: "retail_pack",
    entitlementKey: "retail_pack",
    surface: "page",
    unlockMoment: "checkout_addon",
    unlockPath: "/store — unlock Take-Home Retail add-on",
  },
  event_operator_stack: {
    id: "event_operator_stack",
    label: "Event Operator (quotes & deposits)",
    valueLine: "Consult-first inbox, itemised quotes, milestone deposits — for event vendors.",
    includedIn: ["addon"],
    addonId: "event_operator_pack",
    entitlementKey: "event_operator_pack",
    surface: "page",
    unlockMoment: "checkout_addon",
    unlockPath: "/enquiries — unlock Event Operator add-on",
  },
  peer_insights: {
    id: "peer_insights",
    label: "Peer insights",
    valueLine: "Anonymised benchmarks when your segment has enough shops.",
    includedIn: ["addon"],
    addonId: "peer_set_insights",
    entitlementKey: "peer_set_insights",
    surface: "element",
    unlockMoment: "checkout_addon",
    unlockPath: "Settings → Billing → Peer insights",
  },
  multi_brand_chain: {
    id: "multi_brand_chain",
    label: "Multi-location & brands",
    valueLine: "Chain HQ, franchise rollup, cross-site reporting.",
    includedIn: ["chain"],
    entitlementKey: "multi_brand",
    surface: "page",
    unlockMoment: "checkout_addon",
    unlockPath: "Chain plan or /brands",
  },
};

/** Full-page gates (FeatureUnlockGate) — rest of app stays usable. */
export const PAGE_GATED_COMMERCE_FEATURES: CommerceFeatureId[] = [
  "consult_first_inbox",
  "quote_generator",
  "event_public_site",
  "take_home_retail",
];

/** Entitlements bundled inside Event Operator — gated at page level, not separate SKUs. */
export const EVENT_OPERATOR_BUNDLED_FEATURES = [
  "milestone_deposits",
  "event_prep_lifecycle",
] as const;

export function voiceReceptionistOwnerGuide(): {
  headline: string;
  steps: string[];
  notRequiredDuringOnboarding: boolean;
} {
  return {
    headline: "Phone receptionist is on your plan — turn it on when you're ready",
    notRequiredDuringOnboarding: true,
    steps: [
      "Finish shop setup and publish your booking link (onboarding acts a2, a8).",
      "Open Settings → Communications.",
      "Search and provision a shop SMS number — the same number handles SMS and inbound calls.",
      "Forward your shop line to that number, or share it on Google and Instagram.",
      "Liv answers with the required disclosure; bookings land in your calendar.",
    ],
  };
}

export function standardVsPremiumSummary(): {
  standard: string[];
  premiumAddons: string[];
  afterOnboarding: string[];
} {
  return {
    standard: [
      "Bookings, clients, services, team, and your public booking page",
      "Liv briefings on Today and Inbox",
      "Guest hub at /my for returning clients",
      "CSV import when switching from another tool",
      "Deposits when Stripe is connected",
    ],
    premiumAddons: [
      "Take-Home Retail — mini store on your booking page (€29/mo)",
      "Event Operator — enquiries, quotes, milestone deposits (€49/mo)",
      "Peer insights — anonymised benchmarks (€49/mo)",
    ],
    afterOnboarding: [
      "Shop SMS number + Liv phone receptionist (included on Solo/Studio — provision in Settings)",
      "WhatsApp / social channels when Meta is connected",
      "Custom email sender domain",
    ],
  };
}
