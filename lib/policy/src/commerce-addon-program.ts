/**
 * Commerce add-on registry — vertical applicability, API features, onboarding blocks.
 * New vertical depth packs register here; `pnpm vertical:check` validates coverage.
 */
import type { BusinessVertical } from "./types";
import { PUBLIC_RETAIL_VERTICALS, verticalSupportsRetail } from "./tenant-retail-program";
import { RETAIL_PACK_ADDON_EUR_CENTS, EVENT_OPERATOR_ADDON_EUR_CENTS } from "@workspace/entitlements";
import { showPeerInsightsForTenant } from "./wedge-gate";

export type CommerceAddonId = "event_operator_pack" | "retail_pack" | "peer_set_insights";

export type CommerceAddonRegistryEntry = {
  id: CommerceAddonId;
  name: string;
  eurCentsPerMonth: number;
  /** Business verticals where this add-on is relevant (empty = all). */
  verticals: readonly BusinessVertical[];
  /** API wedge feature keys gated by this add-on. */
  apiFeatures: readonly string[];
  /** Dashboard/mobile unlock feature ids (commerce-entitlements-program). */
  commerceFeatureIds: readonly string[];
  /** Owner dashboard paths surfaced when vertical matches. */
  dashboardPaths: readonly string[];
  /** Primary entitlement key checked at API gate. */
  primaryEntitlement: string;
};

/** Data-driven add-on catalogue — mirrors @workspace/entitlements ADDON_CATALOGUE. */
export const COMMERCE_ADDON_REGISTRY: Record<CommerceAddonId, CommerceAddonRegistryEntry> = {
  event_operator_pack: {
    id: "event_operator_pack",
    name: "Event Operator",
    eurCentsPerMonth: EVENT_OPERATOR_ADDON_EUR_CENTS,
    verticals: ["event-vendors"],
    apiFeatures: ["enquiries", "quotes", "event-vendor"],
    commerceFeatureIds: [
      "consult_first_inbox",
      "quote_generator",
      "milestone_deposits",
      "event_prep_lifecycle",
      "event_public_site",
    ],
    dashboardPaths: ["/inbox", "/enquiries", "/quotes", "/event-site"],
    primaryEntitlement: "event_operator_pack",
  },
  retail_pack: {
    id: "retail_pack",
    name: "Take-Home Retail",
    eurCentsPerMonth: RETAIL_PACK_ADDON_EUR_CENTS,
    verticals: PUBLIC_RETAIL_VERTICALS,
    apiFeatures: ["retail"],
    commerceFeatureIds: ["take_home_retail"],
    dashboardPaths: ["/store"],
    primaryEntitlement: "retail_pack",
  },
  peer_set_insights: {
    id: "peer_set_insights",
    name: "Peer insights",
    eurCentsPerMonth: 4900,
    verticals: [],
    apiFeatures: [],
    commerceFeatureIds: [],
    dashboardPaths: [],
    primaryEntitlement: "peer_set_insights",
  },
};

export type OnboardingCommerceBlock = {
  addonId: CommerceAddonId;
  featureId: string | null;
  label: string;
  description: string;
  priceLabel: string;
  includedInBase: false;
};

/** Blocks that snap together after business create — one row per applicable add-on. */
export function onboardingCommerceBlocksForVertical(
  vertical: BusinessVertical | string | null | undefined,
): OnboardingCommerceBlock[] {
  const v = (vertical ?? "hair") as BusinessVertical;
  const blocks: OnboardingCommerceBlock[] = [];

  for (const entry of Object.values(COMMERCE_ADDON_REGISTRY)) {
    if (entry.verticals.length > 0 && !entry.verticals.includes(v)) continue;
    if (entry.id === "peer_set_insights") continue;

    blocks.push({
      addonId: entry.id,
      featureId: entry.commerceFeatureIds[0] ?? null,
      label: entry.name,
      description: addonOnboardingBlurb(entry.id),
      priceLabel: `€${Math.round(entry.eurCentsPerMonth / 100)}/mo`,
      includedInBase: false,
    });
  }

  return blocks;
}

function addonOnboardingBlurb(id: CommerceAddonId): string {
  if (id === "retail_pack") {
    return "Optional — seed product templates now; unlock to publish on your book page and send post-session pay links.";
  }
  if (id === "event_operator_pack") {
    return "Quote-led workflow — enquiries, itemised quotes, milestone deposits, and optional full /e/ website. Public booking page is on your base plan.";
  }
  return "Anonymized benchmarks from similar shops when your peer segment has enough data (k≥10).";
}

/** Add-ons relevant to a vertical (for billing cards, mobile menu hints). */
export function commerceAddonsForVertical(
  vertical: BusinessVertical | string | null | undefined,
): CommerceAddonRegistryEntry[] {
  const v = (vertical ?? "hair") as BusinessVertical;
  return Object.values(COMMERCE_ADDON_REGISTRY).filter(
    (e) => e.verticals.length === 0 || e.verticals.includes(v),
  );
}

export function addonIdForEntitlement(entitlement: string): CommerceAddonId | null {
  for (const entry of Object.values(COMMERCE_ADDON_REGISTRY)) {
    if (entry.primaryEntitlement === entitlement) return entry.id;
    if (entry.id === "event_operator_pack" && entitlement.startsWith("consult_")) {
      return "event_operator_pack";
    }
    if (entitlement === "quote_generator" || entitlement === "milestone_deposits") {
      return "event_operator_pack";
    }
    if (entitlement === "event_prep_lifecycle") return "event_operator_pack";
  }
  if (entitlement === "retail_pack") return "retail_pack";
  return null;
}

export function addonUnlockMessage(addonId: CommerceAddonId): string {
  const entry = COMMERCE_ADDON_REGISTRY[addonId];
  return `Upgrade to ${entry.name} to unlock this feature.`;
}

/** Starter-pack footnote when retail templates are seeded but store is gated. */
export function retailStarterPackFootnote(vertical: BusinessVertical | string | null | undefined): string | undefined {
  if (!verticalSupportsRetail(vertical)) return undefined;
  const price = `€${Math.round(RETAIL_PACK_ADDON_EUR_CENTS / 100)}`;
  return `Product templates seed on setup — unlock Take-Home Retail (${price}/mo) to go live on your book page.`;
}

/** CI: every retail vertical must map to retail_pack in the registry. */
export function validateCommerceAddonVerticalCoverage(): string[] {
  const errors: string[] = [];
  const retailEntry = COMMERCE_ADDON_REGISTRY.retail_pack;
  for (const vertical of PUBLIC_RETAIL_VERTICALS) {
    if (!retailEntry.verticals.includes(vertical)) {
      errors.push(`retail_pack missing vertical ${vertical}`);
    }
  }
  return errors;
}

/** Settings → Billing anchor for the unified add-ons card. */
export const BILLING_ADDONS_SETTINGS_HREF = "/settings?tab=billing#billing-addons";

export type BillingAddonOwnerRow = {
  id: CommerceAddonId;
  name: string;
  description: string;
  priceLabel: string;
  active: boolean;
  unlockHref: string;
};

/** Owner-facing add-on rows — one catalogue for billing UI and Liv coaching. */
export function buildBillingAddonCatalogForOwner(args: {
  vertical?: string | null;
  activeEntitlements: readonly string[];
}): BillingAddonOwnerRow[] {
  const showPeer = showPeerInsightsForTenant(args.vertical);
  return commerceAddonsForVertical(args.vertical)
    .filter((entry) => entry.id !== "peer_set_insights" || showPeer)
    .map((entry) => {
      const active = args.activeEntitlements.includes(entry.primaryEntitlement);
      return {
        id: entry.id,
        name: entry.name,
        description: addonOnboardingBlurb(entry.id),
        priceLabel: `€${Math.round(entry.eurCentsPerMonth / 100)}/mo`,
        active,
        unlockHref: BILLING_ADDONS_SETTINGS_HREF,
      };
    });
}

/** Liv prompts when owner asks about upgrades beyond base plan. */
export function ownerBillingAddonLivPrompts(
  rows: readonly BillingAddonOwnerRow[],
): string[] {
  const locked = rows.filter((r) => !r.active);
  if (!locked.length) {
    return ["Which add-ons do I have on, and what do they do?"];
  }
  const names = locked.map((r) => r.name).join(", ");
  return [
    `Worth unlocking first — ${names}?`,
    "Walk me through turning on an add-on in Billing.",
    "What does each add-on actually change day to day?",
  ];
}
