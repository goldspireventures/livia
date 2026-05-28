/**
 * Capture dashboard + public screenshots for UX audit.
 *
 *   pnpm e2e:visual-capture
 *
 * Output: e2e/visual-captures/*.png
 */
import { test } from "@playwright/test";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.join(__dirname, "..", "visual-captures");
const apiBase = process.env.E2E_API_BASE ?? "http://127.0.0.1:3000";
const demoSlug = process.env.E2E_DEMO_SLUG ?? "luxe-salon-spa";

const PUBLIC_SLUGS = [
  demoSlug,
  "aurora-studio",
  "london-rose-spa",
  "berlin-studio-neun",
  "paris-belle-vue",
  "clarity-medspa-dublin",
];

const PUBLIC_ROUTES = ["/demo", "/sign-in", "/p/dundrum-house"];

const AUTH_ROUTES = [
  "/chain",
  "/dashboard",
  "/inbox",
  "/bookings",
  "/bookings?create=1",
  "/customers",
  "/premises",
  "/day-packages",
  "/onboarding",
  "/settings?tab=liv",
  "/settings?tab=comms",
  "/settings?tab=policy",
  "/audit",
];

test.describe("Visual audit — public", () => {
  test.describe.configure({ mode: "serial" });

  test.beforeAll(async ({ request }) => {
    const status = await request.get(`${apiBase}/api/demo/status`);
    if (status.ok() && (await status.json() as { provisioned?: boolean }).provisioned) return;
    const prov = await request.post(`${apiBase}/api/demo/provision`);
    if (!prov.ok()) {
      const body = await prov.text();
      throw new Error(`Demo provision failed (${prov.status()}): ${body.slice(0, 200)}`);
    }
  });

  for (const route of PUBLIC_ROUTES) {
    test(`capture ${route}`, async ({ page, request }) => {
      if (route.startsWith("/p/")) {
        const slug = route.replace("/p/", "");
        const res = await request.get(`${apiBase}/api/public/p/${slug}`);
        if (!res.ok()) {
          test.skip(true, `Premises ${slug} not seeded — run demo provision`);
        }
      }
      await page.goto(route, { waitUntil: "networkidle" });
      await page.waitForTimeout(1000);
      const safe = route.replace(/[?&=]/g, "-").replace(/\//g, "_").replace(/^_/, "") || "root";
      await page.screenshot({ path: path.join(OUT_DIR, `${safe}.png`), fullPage: true });
    });
  }

  for (const slug of PUBLIC_SLUGS) {
    test(`capture /b/${slug}`, async ({ page, request }) => {
      const res = await request.get(`${apiBase}/api/public/b/${slug}`);
      if (!res.ok()) test.skip(true, `Business ${slug} not seeded — pnpm demo:provision`);
      await page.goto(`/b/${slug}`, { waitUntil: "networkidle" });
      await page.waitForTimeout(1000);
      await page.screenshot({
        path: path.join(OUT_DIR, `b_${slug}.png`),
        fullPage: true,
      });
    });
  }
});

test.describe("Visual audit — authenticated", () => {
  test.describe.configure({ mode: "serial" });
  test.use({ storageState: path.join(__dirname, "..", ".auth", "founder.json") });

  test.beforeAll(async ({ request }) => {
    const statusRes = await request.get(`${apiBase}/api/demo/status`);
    const statusOk =
      statusRes.ok() &&
      (await statusRes.json() as { businesses?: unknown[] }).businesses?.length;
    if (!statusOk) {
      const prov = await request.post(`${apiBase}/api/demo/provision`);
      if (!prov.ok()) {
        const retry = await request.get(`${apiBase}/api/demo/status`);
        if (!retry.ok() || !(await retry.json() as { businesses?: unknown[] }).businesses?.length) {
          throw new Error(`Demo provision failed (${prov.status()})`);
        }
      }
    }
  });

  for (const route of AUTH_ROUTES) {
    test(`capture ${route}`, async ({ page }) => {
      await page.goto(route, { waitUntil: "networkidle" });
      const signedOut = await page
        .locator("body")
        .innerText()
        .then((t) => /sign in to your command center/i.test(t));
      if (signedOut) test.skip(true, "Founder auth missing — run founder-auth-setup");
      await page.waitForTimeout(1200);
      const safe = route.replace(/[?&=]/g, "-").replace(/\//g, "_").replace(/^_/, "") || "root";
      await page.screenshot({ path: path.join(OUT_DIR, `auth-${safe}.png`), fullPage: true });
    });
  }
});
