import type { EntitlementKey } from "./index";

/** Purchasable add-ons — compositions of entitlement grants (ADR 0018). */
export type AddonDefinition = {
  id: string;
  name: string;
  description: string;
  eurCentsPerMonth: number;
  /** Stripe env var for subscription price id. */
  stripePriceEnv: string;
  /** Entitlement keys granted when add-on is active. */
  grants: readonly EntitlementKey[];
};

/** Event consult-first stack — not included in base Solo/Studio. */
export const EVENT_OPERATOR_PACK_GRANTS = [
  "event_operator_pack",
  "consult_first_inbox",
  "quote_generator",
  "milestone_deposits",
  "event_prep_lifecycle",
  "vertical_pack_event_vendors",
] as const satisfies readonly EntitlementKey[];

export const ADDON_CATALOGUE: Record<string, AddonDefinition> = {
  event_operator_pack: {
    id: "event_operator_pack",
    name: "Event Operator",
    description:
      "Consult-first inbox, quote generator, milestone deposits, event prep lifecycle, and public quote pages.",
    eurCentsPerMonth: 4900,
    stripePriceEnv: "STRIPE_PRICE_EVENT_OPERATOR",
    grants: EVENT_OPERATOR_PACK_GRANTS,
  },
  peer_set_insights: {
    id: "peer_set_insights",
    name: "Peer insights",
    description: "Anonymized benchmarks when your peer segment has k≥10 shops.",
    eurCentsPerMonth: 4900,
    stripePriceEnv: "STRIPE_PRICE_PEER_INSIGHTS",
    grants: ["peer_set_insights"],
  },
} as const;

export type AddonId = keyof typeof ADDON_CATALOGUE;

export const ADDON_IDS = Object.keys(ADDON_CATALOGUE) as AddonId[];

export function lookupAddon(id: string): AddonDefinition | undefined {
  return ADDON_CATALOGUE[id];
}

export function formatAddonPriceEur(cents: number): string {
  return `€${Math.round(cents / 100)}`;
}

/** Sub-features implied by the Event Operator pack bundle. */
export const EVENT_PACK_IMPLIED_ENTITLEMENTS: ReadonlySet<EntitlementKey> = new Set(
  EVENT_OPERATOR_PACK_GRANTS.filter((k) => k !== "event_operator_pack"),
);

export function hasEffectiveEntitlement(
  entitlements: ReadonlySet<EntitlementKey> | readonly EntitlementKey[],
  key: EntitlementKey,
): boolean {
  const set = entitlements instanceof Set ? entitlements : new Set(entitlements);
  if (set.has(key)) return true;
  if (EVENT_PACK_IMPLIED_ENTITLEMENTS.has(key) && set.has("event_operator_pack")) return true;
  return false;
}
