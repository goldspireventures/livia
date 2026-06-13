/**
 * Gate 2 wedge scope — hide non-hair surfaces until CEO lifts moratorium.
 * @see docs/product/SCOPE-MORATORIUM.md · docs/audits/v1-scope-drift-audit.md
 */

export const WEDGE_VERTICALS = new Set(["hair", "beauty"]);

/** Vertical packs frozen for default Hair GTM (code stays; UI hidden). */
export const FROZEN_VERTICAL_PACKS = new Set([
  "medspa",
  "fitness",
  "allied-health",
  "wellness",
  "body-art",
  "pet-grooming",
  "automotive-detailing",
]);

export function isWedgeHairTenant(vertical: string | null | undefined): boolean {
  const v = (vertical ?? "hair").toLowerCase();
  return WEDGE_VERTICALS.has(v);
}

const ORG_TIERS = new Set(["franchise", "mid-chain", "chain"]);
const PAYROLL_ELIGIBLE_TIERS = new Set(["studio", ...ORG_TIERS]);

/** Consult-first verticals — no rota, payroll, or enterprise audit exports. */
const NO_WORKFORCE_EXPORT_VERTICALS = new Set(["event-vendors"]);

/** Peer insights is v1.5 — hide for hair wedge tenants. */
export function showPeerInsightsForTenant(vertical: string | null | undefined): boolean {
  return !isWedgeHairTenant(vertical);
}

/** Enterprise audit export — org tier only; never on consult-first verticals. */
export function showEnterpriseToolkitExports(
  vertical: string | null | undefined,
  tier?: string | null,
): boolean {
  const v = (vertical ?? "hair").toLowerCase();
  const t = tier ?? "solo";
  if (NO_WORKFORCE_EXPORT_VERTICALS.has(v)) return false;
  return ORG_TIERS.has(t);
}

/** Payroll hours export — Studio+ with rota; never solo or consult-first. @see rfcs/0012-hours-to-payroll-export.md */
export function showPayrollToolkitExport(
  vertical: string | null | undefined,
  tier?: string | null,
): boolean {
  const v = (vertical ?? "hair").toLowerCase();
  const t = tier ?? "solo";
  if (NO_WORKFORCE_EXPORT_VERTICALS.has(v)) return false;
  if (ORG_TIERS.has(t)) return true;
  if (!PAYROLL_ELIGIBLE_TIERS.has(t)) return false;
  return !isWedgeHairTenant(v);
}

const ROUTE_VERTICALS: Record<string, readonly string[]> = {
  "/medspa": ["medspa"],
  "/classes": ["fitness"],
  "/design-proofs": ["body-art"],
  "/day-packages": ["allied-health", "wellness"],
  "/enquiries": ["event-vendors"],
  "/quotes": ["event-vendors"],
  "/event-site": ["event-vendors"],
};

const ROUTE_TIERS: Record<string, readonly string[]> = {
  "/host": ["chair-host"],
  "/franchise": ["franchise", "mid-chain"],
};

/** Whether an authenticated dashboard path is in scope for this tenant. */
export function isDashboardRouteAllowedForTenant(
  pathname: string,
  vertical: string | null | undefined,
  tier?: string | null,
): boolean {
  const path = pathname.split("?")[0] ?? pathname;
  const v = vertical ?? "hair";
  const t = tier ?? "solo";

  for (const [prefix, allowedVerticals] of Object.entries(ROUTE_VERTICALS)) {
    if (path === prefix || path.startsWith(`${prefix}/`)) {
      return allowedVerticals.includes(v);
    }
  }

  for (const [prefix, allowedTiers] of Object.entries(ROUTE_TIERS)) {
    if (path === prefix || path.startsWith(`${prefix}/`)) {
      return allowedTiers.includes(t);
    }
  }

  return true;
}

/** API path feature keys → allowed business verticals (mirrors dashboard ROUTE_VERTICALS). */
export const API_FEATURE_VERTICALS: Record<string, readonly string[]> = {
  medspa: ["medspa"],
  "class-sessions": ["fitness"],
  "design-proofs": ["body-art"],
  enquiries: ["event-vendors"],
  quotes: ["event-vendors"],
  "event-vendor": ["event-vendors"],
};

export function isBusinessApiFeatureAllowed(
  featureKey: string,
  vertical: string | null | undefined,
): boolean {
  const allowed = API_FEATURE_VERTICALS[featureKey];
  if (!allowed) return true;
  return allowed.includes((vertical ?? "hair").toLowerCase());
}

/** Room / equipment capacity — spa, clinic, allied-health only (not chair-based beauty or hair). */
const BOOKING_RESOURCES_VERTICALS = new Set(["wellness", "medspa", "allied-health"]);

export function showBookingResourcesSettings(vertical: string | null | undefined): boolean {
  return BOOKING_RESOURCES_VERTICALS.has((vertical ?? "").toLowerCase());
}
