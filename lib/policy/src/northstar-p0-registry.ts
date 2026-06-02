/**
 * P0 visual baselines — evolution northstars + per-screen-card PNGs.
 * Screen-card PNGs *are* the northstar when no separate mock exists.
 * Locked W2/W1 targets may live under `docs/design/assets/w2-gateway/` etc. — use `northstarRealPath`.
 * @see docs/design/G-VISUAL-NORTHSTAR-MAP.md
 * @see docs/design/screen-cards/README.md
 */

export type NorthstarP0Entry = {
  screenId: string;
  route: string;
  /** Filename under SCREEN_CARD_BASELINE_DIR when northstarRealPath is unset. */
  northstarFile: string;
  /** Repo-relative path to the canonical PNG (not under assets/screen-cards/). */
  northstarRealPath?: string;
  viewport: { width: number; height: number };
  /** Demo slug override (default luxe-salon-spa). */
  demoSlug?: string;
  /** Lenient pixel diff vs baseline (live app evolves). */
  maxDiffPixelRatio: number;
  /** How E2E reaches the route. */
  auth?: "demo" | "public" | "gateway" | "marketing";
};

/** Tenant P0 routes compared to `livia-evolution/northstar/*.png` in E2E. */
export const TENANT_NORTHSTAR_P0: NorthstarP0Entry[] = [
  {
    screenId: "w4.owner.dashboard.web",
    route: "/dashboard",
    northstarFile: "tenant-inbox-web.png",
    viewport: { width: 1440, height: 900 },
    maxDiffPixelRatio: 0.72,
  },
  {
    screenId: "w4.ops.inbox.web",
    route: "/inbox",
    northstarFile: "tenant-inbox-web.png",
    viewport: { width: 1440, height: 900 },
    maxDiffPixelRatio: 0.48,
  },
  {
    screenId: "w4.ops.design-proofs.web",
    route: "/design-proofs",
    northstarFile: "tenant-proofs-web.png",
    viewport: { width: 1440, height: 900 },
    demoSlug: "ink-anchor-galway",
    maxDiffPixelRatio: 0.55,
  },
  {
    screenId: "w4.staff.my-day.mobile",
    route: "/my-day",
    northstarFile: "tenant-today-mobile.png",
    viewport: { width: 390, height: 844 },
    maxDiffPixelRatio: 0.58,
  },
];

export const NORTHSTAR_PUBLIC_DIR = "artifacts/livia-dashboard/public/livia-evolution/northstar";
export const NORTHSTAR_DOCS_DIR = "docs/design/assets/livia-evolution/northstar";
export const SCREEN_CARD_BASELINE_DIR = "docs/design/assets/screen-cards";

/** Repo-root join without node:path — safe when policy is pulled into React Native typecheck. */
export function resolveNorthstarRealPath(repoRoot: string, entry: NorthstarP0Entry): string {
  const root = repoRoot.replace(/\\/g, "/").replace(/\/$/, "");
  if (entry.northstarRealPath) {
    const rel = entry.northstarRealPath.replace(/\\/g, "/").replace(/^\//, "");
    return `${root}/${rel}`;
  }
  return `${root}/${SCREEN_CARD_BASELINE_DIR}/${entry.northstarFile}`;
}

/** @deprecated Use resolveNorthstarRealPath */
export const resolveNorthstarBaselinePath = resolveNorthstarRealPath;

/**
 * Per-screen PNG baselines under `docs/design/assets/screen-cards/`.
 * Capture: `pnpm screen-cards:update` (dashboard + API + Clerk).
 */
export const SCREEN_CARD_P0: NorthstarP0Entry[] = [
  {
    screenId: "w4.owner.dashboard.web",
    route: "/dashboard",
    northstarFile: "w4.owner.dashboard.web.png",
    viewport: { width: 1440, height: 900 },
    demoSlug: "bloom-beauty-dublin",
    maxDiffPixelRatio: 0.72,
  },
  {
    screenId: "w4.ops.inbox.web",
    route: "/inbox",
    northstarFile: "w4.ops.inbox.web.png",
    viewport: { width: 1440, height: 900 },
    demoSlug: "bloom-beauty-dublin",
    maxDiffPixelRatio: 0.58,
  },
  {
    screenId: "w4.ops.settings.web",
    route: "/settings",
    northstarFile: "w4.ops.settings.web.png",
    viewport: { width: 1280, height: 800 },
    maxDiffPixelRatio: 0.52,
  },
  {
    screenId: "w4.ops.bookings.list.web",
    route: "/bookings",
    northstarFile: "w4.ops.bookings.list.web.png",
    viewport: { width: 1440, height: 900 },
    maxDiffPixelRatio: 0.55,
  },
  {
    screenId: "w4.ops.bookings.new.web",
    route: "/bookings/new",
    northstarFile: "w4.ops.bookings.new.web.png",
    viewport: { width: 1280, height: 900 },
    maxDiffPixelRatio: 0.62,
  },
  {
    screenId: "w4.ops.medspa.hub.web",
    route: "/medspa",
    northstarFile: "w4.ops.medspa.hub.web.png",
    viewport: { width: 1440, height: 900 },
    demoSlug: "clarity-medspa-dublin",
    maxDiffPixelRatio: 0.58,
  },
  {
    screenId: "w4.ops.design-proofs.web",
    route: "/design-proofs",
    northstarFile: "w4.ops.design-proofs.web.png",
    viewport: { width: 1440, height: 900 },
    demoSlug: "ink-anchor-galway",
    maxDiffPixelRatio: 0.58,
  },
  {
    screenId: "w4.owner.chain.web",
    route: "/chain",
    northstarFile: "w4.owner.chain.web.png",
    viewport: { width: 1440, height: 900 },
    demoSlug: "aurora-studio",
    maxDiffPixelRatio: 0.68,
  },
  {
    screenId: "w4.staff.my-day.mobile",
    route: "/my-day",
    northstarFile: "w4.staff.my-day.mobile.png",
    viewport: { width: 390, height: 844 },
    demoSlug: "luxe-salon-spa",
    maxDiffPixelRatio: 0.62,
  },
  {
    screenId: "w2.gateway.sign-in.web",
    route: "/sign-in",
    northstarFile: "gateway-default.target.png",
    northstarRealPath: "docs/design/assets/w2-gateway/sign-in/gateway-default.target.png",
    viewport: { width: 1280, height: 800 },
    auth: "gateway",
    maxDiffPixelRatio: 0.5,
  },
  {
    screenId: "w2.gateway.demo.launcher.web",
    route: "/demo",
    northstarFile: "g1-wedge-web.target.png",
    northstarRealPath: "docs/design/assets/w2-gateway/demo/g1-wedge-web.target.png",
    viewport: { width: 1440, height: 900 },
    auth: "gateway",
    maxDiffPixelRatio: 0.55,
  },
  {
    screenId: "w2.gateway.demo.wedge.web",
    route: "/demo/wedge/beauty",
    northstarFile: "g2-wedge-story.target.png",
    northstarRealPath: "docs/design/assets/w2-gateway/demo/g2-wedge-story.target.png",
    viewport: { width: 1440, height: 900 },
    auth: "gateway",
    maxDiffPixelRatio: 0.55,
  },
  {
    screenId: "w2.gateway.demo.enter.web",
    route: "/demo/wedge/beauty",
    northstarFile: "g3-demo-enter.target.png",
    northstarRealPath: "docs/design/assets/w2-gateway/demo/g3-demo-enter.target.png",
    viewport: { width: 1440, height: 900 },
    auth: "gateway",
    maxDiffPixelRatio: 0.55,
  },
  {
    screenId: "w5.public.book.mobile",
    route: "/b/bloom-beauty-dublin",
    northstarFile: "w5.public.book.mobile.png",
    viewport: { width: 390, height: 844 },
    auth: "public",
    maxDiffPixelRatio: 0.65,
  },
];

/** W1 marketing M1-R2 — superseded by M3 One Floor (2026-06). Target PNG retained for history only. */
/** W4 tenant routes with YAML spec but no PNG baseline yet — capture next. */
export const SCREEN_CARD_CAPTURE_QUEUE: Array<{
  screenId: string;
  route: string;
  demoSlug?: string;
}> = [
  { screenId: "w4.ops.customers.list.web", route: "/customers" },
  { screenId: "w4.ops.customers.detail.web", route: "/customers", demoSlug: "bloom-beauty-dublin" },
  { screenId: "w4.ops.staff.list.web", route: "/staff" },
  { screenId: "w4.ops.services.web", route: "/services", demoSlug: "bloom-beauty-dublin" },
  { screenId: "w4.ops.toolkit.web", route: "/toolkit" },
  { screenId: "w4.ops.my-day.web", route: "/my-day", demoSlug: "motion-physio-cork" },
  { screenId: "w4.ops.bookings.detail.web", route: "/bookings" },
  { screenId: "w4.ops.audit.web", route: "/audit" },
  { screenId: "w4.ops.rota.web", route: "/rota" },
  { screenId: "w4.ops.classes.web", route: "/classes", demoSlug: "peak-fitness-dublin" },
  { screenId: "w4.ops.franchise.web", route: "/franchise", demoSlug: "bloom-beauty-dublin" },
  { screenId: "w4.ops.lifecycle.web", route: "/lifecycle" },
  { screenId: "w2.gateway.onboarding.web", route: "/onboarding", demoSlug: "conors-cut-co" },
  { screenId: "w2.gateway.legal-accept.web", route: "/legal-acceptance", demoSlug: "conors-cut-co" },
  { screenId: "w5.public.intake.mobile", route: "/b/clarity-medspa-dublin/intake/demo" },
  { screenId: "w5.public.visit.mobile", route: "/b/luxe-salon-spa/visit/demo" },
  { screenId: "w5.public.pay.mobile", route: "/b/luxe-salon-spa/pay/demo" },
  { screenId: "w5.public.proof.mobile", route: "/b/ink-anchor-galway/proof/demo" },
];

export const ALL_VISUAL_P0 = [...TENANT_NORTHSTAR_P0, ...SCREEN_CARD_P0];
