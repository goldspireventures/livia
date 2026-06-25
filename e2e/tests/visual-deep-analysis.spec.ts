/**
 * Deep visual + UX analysis — every customer/operator surface, axe + error copy.
 * Screenshots optional; findings → visual-deep-findings.json (closeout script updates audit log).
 *
 *   pnpm --filter @workspace/e2e exec playwright test --project=visual-deep-analysis
 */
import { test, expect } from "@playwright/test";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { VERTICAL_DEMO_SHOPS } from "../fixtures/vertical-shops";
import {
  apiBase,
  dismissLegalAcceptance,
  dismissPlatformTour,
  ensureDemoProvisioned,
  resetDemoBrowserSession,
  signInBusiness,
  signInDemoPersona,
} from "../helpers/demo-auth";
import { guestHubMe, guestHubToken } from "../helpers/guest-hub-auth";
import { type UxFinding, scanCurrentPage, scanRoute, writeFindings } from "../helpers/ux-scan";

const GUEST_HUB_TOKEN_KEY = "livia_guest_hub_token";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FINDINGS_PATH = path.join(__dirname, "..", "visual-captures", "visual-deep-findings.json");
const demoSlug = process.env.E2E_DEMO_SLUG ?? "luxe-salon-spa";
const EVENT_SLUG = "atelier-decor-dublin";

const PUBLIC_BOOK_SLUGS = [
  "luxe-salon-spa",
  "bloom-beauty-dublin",
  "motion-physio-cork",
  "clarity-medspa-dublin",
  "ink-anchor-galway",
  "harbour-wellness-cork",
  "paws-parlour-dublin",
  "peak-fitness-dublin",
  "shine-studio-belfast",
  "atelier-decor-dublin",
  "berlin-studio-neun",
  "paris-belle-vue",
];

const GATEWAY_ROUTES = ["/demo", "/demo/founder", "/demo/owner", "/guides", "/onboarding"];

const EVENT_PUBLIC = [
  `/e/${EVENT_SLUG}`,
  `/e/${EVENT_SLUG}/enquire`,
  `/e/${EVENT_SLUG}/services`,
  `/e/${EVENT_SLUG}/about`,
  `/e/${EVENT_SLUG}/gallery`,
];

const GUEST_TOKEN_KINDS = ["pay", "visit", "proof", "intake", "balance", "waitlist", "quote"] as const;

const VERTICAL_EXTRA_ROUTES: Record<string, string[]> = {
  wellness: ["/wellness-reception", "/wellness-reports", "/wellness-chain"],
  beauty: ["/beauty-reception", "/beauty-store"],
  hair: ["/store"],
  medspa: ["/medspa"],
  "allied-health": ["/day-packages"],
  fitness: ["/classes"],
  "body-art": ["/design-proofs"],
  "event-vendors": ["/event-site", "/enquiries", "/quotes"],
  "pet-grooming": [],
  "automotive-detailing": [],
};

const findings: UxFinding[] = [];

async function guestSurfacePath(
  request: import("@playwright/test").APIRequestContext,
  slug: string,
  kind: (typeof GUEST_TOKEN_KINDS)[number],
): Promise<string | null> {
  let res = await request.get(`${apiBase}/api/demo/guest-surfaces/${slug}/${kind}`);
  if (!res.ok()) {
    res = await request.get(`${apiBase}/api/demo/guest-surfaces/${slug}/${kind}`);
  }
  if (!res.ok()) return null;
  const body = (await res.json()) as { path?: string };
  return body.path ?? null;
}

test.describe("Visual deep analysis", () => {
  test.describe.configure({ mode: "serial", timeout: 900_000 });

  test.beforeAll(async ({ request }) => {
    await ensureDemoProvisioned(request);
  });

  test.afterAll(async () => {
    writeFindings(FINDINGS_PATH, findings);
    const hard = findings.filter((f) => f.kind === "error_copy");
    console.log(`\nDeep analysis: ${findings.length} findings (${hard.length} hard) → ${FINDINGS_PATH}\n`);
    expect(hard, `Visible error copy — see ${FINDINGS_PATH}`).toEqual([]);
  });

  test("gateway + auth surfaces", async ({ page }) => {
    for (const route of GATEWAY_ROUTES) {
      await scanRoute(page, route, findings);
    }
    await scanRoute(page, "/sign-in", findings, { axe: false });
    await scanRoute(page, "/sign-up", findings, { axe: false });
  });

  test("public booking — all showcase slugs", async ({ page, request }) => {
    for (const slug of PUBLIC_BOOK_SLUGS) {
      const res = await request.get(`${apiBase}/api/public/b/${slug}`);
      if (!res.ok()) continue;
      await scanRoute(page, `/b/${slug}`, findings);
    }
  });

  test("public booking — wizard steps (hair)", async ({ page, request }) => {
    const res = await request.get(`${apiBase}/api/public/b/${demoSlug}`);
    if (!res.ok()) test.skip(true, "Demo slug missing");
    await page.goto(`/b/${demoSlug}`, { waitUntil: "domcontentloaded" });
    await page.waitForSelector('[data-testid="public-service-catalog"], [data-testid="public-book-loading"]', {
      timeout: 30_000,
    });
    await page.waitForSelector('[data-testid="public-service-catalog"]', { timeout: 45_000 }).catch(() => null);
    await scanCurrentPage(page, `/b/${demoSlug}#services`, findings);

    const service = page.locator('[data-testid^="button-service-"]').first();
    if (await service.isVisible().catch(() => false)) {
      await service.click();
      await page.waitForTimeout(800);
      await scanCurrentPage(page, `/b/${demoSlug}#slots`, findings);
      const slot = page.locator('[data-testid^="button-slot-"]').first();
      if (await slot.isVisible().catch(() => false)) {
        await slot.click();
        await page.waitForTimeout(800);
        await scanCurrentPage(page, `/b/${demoSlug}#details`, findings);
      }
    }
  });

  test("guest hub — signed out + Mary vault", async ({ page, request }) => {
    await scanRoute(page, "/my", findings);
    const token = await guestHubToken(request);
    await page.addInitScript(
      ([key, value]) => {
        localStorage.setItem(key, value);
      },
      [GUEST_HUB_TOKEN_KEY, token] as const,
    );
    await scanRoute(page, "/my", findings, { skipSignInCheck: true });
    const me = await guestHubMe(request, token);
    if (me.shops[0]?.slug) {
      await scanRoute(page, `/my/${me.shops[0].slug}`, findings, { skipSignInCheck: true });
    }
    await scanRoute(page, "/my/account", findings, { skipSignInCheck: true });
    const visit = me.upcomingBookings[0];
    if (visit?.visitUrl) {
      const pathOnly = visit.visitUrl.replace(/^https?:\/\/[^/]+/, "");
      await scanRoute(page, pathOnly, findings, { skipSignInCheck: true });
    }
  });

  test("guest token surfaces (pay, visit, proof, …)", async ({ page, request }) => {
    const slugs = [demoSlug, "clarity-medspa-dublin", "ink-anchor-galway", EVENT_SLUG];
    for (const slug of slugs) {
      for (const kind of GUEST_TOKEN_KINDS) {
        const guestPath = await guestSurfacePath(request, slug, kind);
        if (!guestPath) continue;
        const route = guestPath.startsWith("http") ? new URL(guestPath).pathname : guestPath;
        await scanRoute(page, route, findings, { skipSignInCheck: true });
      }
    }
  });

  test("event vendor public site", async ({ page, request }) => {
    const res = await request.get(`${apiBase}/api/public/e/${EVENT_SLUG}`);
    if (!res.ok()) test.skip(true, "Event vendor slug missing");
    for (const route of EVENT_PUBLIC) {
      await scanRoute(page, route, findings);
    }
  });

  test("owner core wedge (luxe)", async ({ page }) => {
    await signInBusiness(page, demoSlug);
    const routes = [
      "/dashboard",
      "/inbox",
      "/bookings",
      "/bookings?create=1",
      "/customers",
      "/staff",
      "/services",
      "/lifecycle",
      "/audit",
      "/toolkit",
      "/launch-status",
      "/settings",
      "/settings?tab=account",
      "/settings?tab=shop",
      "/settings?tab=appearance",
      "/settings?tab=liv",
      "/settings?tab=comms",
      "/settings?tab=billing",
      "/settings?tab=legal",
      "/settings?tab=policy",
      "/settings?tab=team",
    ];
    for (const route of routes) {
      await page.goto(route, { waitUntil: "domcontentloaded" });
      await dismissLegalAcceptance(page);
      await dismissPlatformTour(page);
      await scanRoute(page, route, findings, { signedIn: true });
    }
  });

  test("personas — manager, staff, receptionist", async ({ page }) => {
    for (const persona of ["manager", "staff-senior", "receptionist"] as const) {
      await resetDemoBrowserSession(page);
      await signInDemoPersona(page, persona);
      const routes =
        persona === "manager"
          ? ["/dashboard", "/inbox", "/bookings", "/customers", "/settings"]
          : persona === "receptionist"
            ? ["/bookings", "/inbox", "/customers", "/settings"]
            : ["/my-day", "/bookings", "/customers", "/settings"];
      for (const route of routes) {
        await page.goto(route, { waitUntil: "domcontentloaded" });
        await dismissPlatformTour(page);
        await scanRoute(page, `${route} (${persona})`, findings, { signedIn: true });
      }
    }
  });

  test("founder org_admin chain", async ({ page }) => {
    await resetDemoBrowserSession(page);
    await signInDemoPersona(page, "org_admin");
    for (const route of ["/chain", "/dashboard", "/audit", "/onboarding?intent=second-shop"]) {
      await page.goto(route, { waitUntil: "domcontentloaded" });
      await dismissPlatformTour(page);
      await scanRoute(page, route, findings, { signedIn: true });
    }
  });

  test("all verticals — core + exclusive routes", async ({ page }) => {
    for (const shop of VERTICAL_DEMO_SHOPS) {
      await signInBusiness(page, shop.slug, { resetSession: true });
      const routes = [
        "/dashboard",
        "/inbox",
        "/bookings",
        "/customers",
        "/staff",
        "/services",
        "/settings?tab=shop",
        ...shop.exclusiveRoutes,
        ...(VERTICAL_EXTRA_ROUTES[shop.vertical] ?? []),
      ];
      for (const route of routes) {
        await page.goto(route, { waitUntil: "domcontentloaded" });
        await dismissPlatformTour(page);
        await scanRoute(page, `${route} [${shop.vertical}]`, findings, { signedIn: true });
      }
    }
  });

  test("inbox queue lenses", async ({ page }) => {
    await signInBusiness(page, demoSlug);
    await page.goto("/inbox", { waitUntil: "domcontentloaded" });
    await dismissPlatformTour(page);
    for (const lens of ["needs_you", "liv_handling", "taken_over", "closed"] as const) {
      const tab = page.getByTestId(`queue-lens-${lens}`);
      if (await tab.isVisible().catch(() => false)) {
        await tab.click({ force: true });
        await page.waitForTimeout(400);
        await scanCurrentPage(page, `/inbox?lens=${lens}`, findings, { signedIn: true });
      }
    }
  });
});
