import { CHECKOUT_PLAN_IDS } from "@workspace/entitlements";

export type ComplimentaryPromoDef = {
  code: string;
  planId: string;
  /** null = long complimentary window (10y) */
  durationDays: number | null;
};

/** Parse `LIVIA_COMPLIMENTARY_PROMO_CODES` — `CODE=solo` or `CODE=studio:90` (comma-separated). */
export function parseComplimentaryPromoCodes(
  raw: string | undefined | null,
): Map<string, ComplimentaryPromoDef> {
  const map = new Map<string, ComplimentaryPromoDef>();
  if (!raw?.trim()) return map;

  for (const segment of raw.split(/[,;\n]+/)) {
    const trimmed = segment.trim();
    if (!trimmed) continue;
    const eq = trimmed.indexOf("=");
    if (eq <= 0) continue;
    const code = trimmed.slice(0, eq).trim().toUpperCase();
    const value = trimmed.slice(eq + 1).trim();
    const colon = value.indexOf(":");
    const planId = (colon >= 0 ? value.slice(0, colon) : value).trim();
    const daysRaw = colon >= 0 ? value.slice(colon + 1).trim() : "";
    if (!code || !planId) continue;
    if (!CHECKOUT_PLAN_IDS.includes(planId as (typeof CHECKOUT_PLAN_IDS)[number])) continue;

    let durationDays: number | null = null;
    if (daysRaw) {
      const n = Number.parseInt(daysRaw, 10);
      if (Number.isFinite(n) && n > 0) durationDays = n;
    }

    map.set(code, { code, planId, durationDays });
  }

  return map;
}

export function lookupComplimentaryPromo(
  raw: string | undefined | null,
  code: string | undefined | null,
): ComplimentaryPromoDef | null {
  const normalized = code?.trim().toUpperCase();
  if (!normalized) return null;
  return parseComplimentaryPromoCodes(raw).get(normalized) ?? null;
}
