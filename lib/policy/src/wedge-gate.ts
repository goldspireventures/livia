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

/** Peer insights is v1.5 — hide for hair wedge tenants. */
export function showPeerInsightsForTenant(vertical: string | null | undefined): boolean {
  return !isWedgeHairTenant(vertical);
}

/** Enterprise audit export — franchise/chain tier or non-wedge vertical only. */
export function showEnterpriseToolkitExports(
  vertical: string | null | undefined,
  tier?: string | null,
): boolean {
  const t = tier ?? "solo";
  if (t === "franchise" || t === "mid-chain" || t === "chain") return true;
  return !isWedgeHairTenant(vertical);
}

/** Payroll export is v1.5 — hide on hair wedge solo/studio. */
export function showPayrollToolkitExport(
  vertical: string | null | undefined,
  tier?: string | null,
): boolean {
  const t = tier ?? "solo";
  if (t === "franchise" || t === "mid-chain" || t === "chain") return true;
  return !isWedgeHairTenant(vertical);
}

const ROUTE_VERTICALS: Record<string, readonly string[]> = {
  "/medspa": ["medspa"],
  "/classes": ["fitness"],
  "/design-proofs": ["body-art"],
  "/day-packages": ["allied-health", "wellness"],
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
};

export function isBusinessApiFeatureAllowed(
  featureKey: string,
  vertical: string | null | undefined,
): boolean {
  const allowed = API_FEATURE_VERTICALS[featureKey];
  if (!allowed) return true;
  return allowed.includes((vertical ?? "hair").toLowerCase());
}
