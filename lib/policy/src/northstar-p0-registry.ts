/**
 * P0 tenant screens traced to northstar PNG anchors.
 * @see docs/design/G-VISUAL-NORTHSTAR-MAP.md
 * @see docs/testing/TESTING-VISUAL-ACCEPTANCE.md
 */

export type NorthstarP0Entry = {
  screenId: string;
  route: string;
  northstarFile: string;
  viewport: { width: number; height: number };
  /** Demo slug override (default luxe-salon-spa). */
  demoSlug?: string;
  /** Lenient pixel diff vs design northstar (live app ≠ mock). */
  maxDiffPixelRatio: number;
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
