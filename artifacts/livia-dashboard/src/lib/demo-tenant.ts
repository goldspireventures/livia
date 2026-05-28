/**
 * Demo tenant slugs — keep in sync with `artifacts/api-server/src/lib/demo-portal-config.ts`
 * and `e2e/fixtures/vertical-shops.ts` (vertical showcase + E2E hair).
 */
export const DEMO_TENANT_SLUGS = new Set([
  "aurora-studio",
  "aurora-mews",
  "aurora-galway",
  "conors-cut-co",
  "bloom-beauty-dublin",
  "harbour-wellness-cork",
  "ink-anchor-galway",
  "paws-parlour-dublin",
  "clarity-medspa-dublin",
  "motion-physio-cork",
  "peak-fitness-dublin",
  "shine-studio-belfast",
  "luxe-salon-spa",
  "stoneybatter-cuts",
  "dublin-barber-collective",
  "dundrum-hair-studio",
  "dundrum-serenity-spa",
  "london-rose-spa",
  "berlin-studio-neun",
  "paris-belle-vue",
]);

export function isDemoTenantSlug(slug: string | null | undefined): boolean {
  if (!slug) return false;
  return DEMO_TENANT_SLUGS.has(slug);
}
