/**
 * Exhaustive visual capture for UX audit — all tenant routes × demo verticals.
 *
 *   pnpm e2e:full-visual-audit
 *
 * Output: e2e/visual-captures/full-audit/ (deleted after findings doc written)
 */
import { test } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { VERTICAL_DEMO_SHOPS } from "../fixtures/vertical-shops";
import { dismissPlatformTour, ensureDemoProvisioned, signInBusiness } from "../helpers/demo-auth";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.join(__dirname, "..", "visual-captures", "full-audit");
fs.mkdirSync(OUT_DIR, { recursive: true });
const apiBase = process.env.E2E_API_BASE ?? "http://127.0.0.1:3000";

const PUBLIC = ["/demo", "/sign-in", "/sign-up", "/guides", "/onboarding"];

const PUBLIC_BOOKING_SLUGS = [
  "luxe-salon-spa",
  "motion-physio-cork",
  "clarity-medspa-dublin",
  "ink-anchor-galway",
  "harbour-wellness-cork",
  "paws-parlour-dublin",
  "peak-fitness-dublin",
  "bloom-beauty-dublin",
  "berlin-studio-neun",
  "paris-belle-vue",
];

const TENANT_ROUTES = [
  "/dashboard",
  "/inbox",
  "/bookings",
  "/bookings?create=1",
  "/customers",
  "/staff",
  "/services",
  "/my-day",
  "/rota",
  "/day-packages",
  "/lifecycle",
  "/settings",
  "/settings?tab=shop",
  "/settings?tab=liv",
  "/settings?tab=policy",
  "/settings?tab=comms",
  "/settings?tab=team",
  "/audit",
  "/chain",
  "/host",
  "/brands",
  "/classes",
  "/medspa",
  "/design-proofs",
  "/franchise",
  "/premises",
  "/experience",
  "/portal",
  "/launch-status",
  "/toolkit",
  "/onboarding?intent=second-shop",
];

test.describe("Full platform visual audit", () => {
  test.describe.configure({ mode: "serial", timeout: 600_000 });

  test.beforeAll(async ({ request }) => {
    await ensureDemoProvisioned(request);
  });

  for (const route of PUBLIC) {
    test(`public ${route}`, async ({ page }) => {
      await page.goto(route, { waitUntil: "domcontentloaded" });
      await page.waitForTimeout(800);
      const safe = route.replace(/[?&=]/g, "-").replace(/\//g, "_").replace(/^_/, "") || "root";
      await page.screenshot({ path: path.join(OUT_DIR, `public-${safe}.png`), fullPage: true });
    });
  }

  for (const slug of PUBLIC_BOOKING_SLUGS) {
    test(`public booking /b/${slug}`, async ({ page, request }) => {
      const res = await request.get(`${apiBase}/api/public/b/${slug}`);
      if (!res.ok()) {
        test.skip(true, `${slug} not seeded`);
        return;
      }
      await page.goto(`/b/${slug}`, { waitUntil: "domcontentloaded" });
      await page.waitForTimeout(1000);
      await page.screenshot({ path: path.join(OUT_DIR, `public-b-${slug}.png`), fullPage: true });
    });
  }

  for (const { slug, vertical: tag } of VERTICAL_DEMO_SHOPS) {
    test(`tenant ${tag} — core routes`, async ({ page }) => {
      await signInBusiness(page, slug);
      for (const route of TENANT_ROUTES) {
        await page.goto(route, { waitUntil: "domcontentloaded" });
        await dismissPlatformTour(page);
        await page.waitForTimeout(500);
        const safe = route.replace(/[?&=]/g, "-").replace(/\//g, "_").replace(/^_/, "") || "root";
        await page.screenshot({
          path: path.join(OUT_DIR, `${tag}-${safe}.png`),
          fullPage: true,
        });
      }
    });
  }
});
