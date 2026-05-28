/**
 * Mobile viewport capture (dashboard responsive) — fallback when Maestro/simulator unavailable.
 * Native captures: pnpm maestro:visual-capture (requires Java 17+ + Maestro CLI + simulator).
 *
 *   pnpm exec playwright test mobile-viewport-web-capture --project=mobile-viewport
 */
import { test } from "@playwright/test";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.join(__dirname, "..", "visual-captures", "mobile-web");
const apiBase = process.env.E2E_API_BASE ?? "http://127.0.0.1:3000";
const demoSlug = process.env.E2E_DEMO_SLUG ?? "luxe-salon-spa";

const OWNER_ROUTES = [
  "/dashboard",
  "/inbox",
  "/bookings",
  "/customers",
  "/my-day",
  "/settings",
  "/settings?tab=comms",
];

async function signInOwner(page: import("@playwright/test").Page) {
  const res = await page.request.post(`${apiBase}/api/demo/sign-in`, { data: { persona: "owner" } });
  if (!res.ok()) throw new Error(`sign-in failed ${res.status()}`);
  const { token } = (await res.json()) as { token?: string };
  if (!token) throw new Error("no token");
  await page.goto(`/sign-in?__clerk_ticket=${encodeURIComponent(token)}`, {
    waitUntil: "networkidle",
  });
  await page.waitForURL(/\/(dashboard|inbox)/, { timeout: 45_000 });
}

// Chromium mobile emulation (no WebKit install required on Windows).
test.use({
  viewport: { width: 390, height: 844 },
  isMobile: true,
  hasTouch: true,
  deviceScaleFactor: 3,
  userAgent:
    "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
});

test.describe("Mobile viewport (web responsive)", () => {
  test.describe.configure({ mode: "serial", timeout: 180_000 });

  test.beforeAll(async ({ request }) => {
    const st = await request.get(`${apiBase}/api/demo/status`);
    if (st.ok() && (await st.json() as { provisioned?: boolean }).provisioned) return;
    const prov = await request.post(`${apiBase}/api/demo/provision`);
    if (!prov.ok()) {
      const retry = await request.get(`${apiBase}/api/demo/status`);
      if (!retry.ok() || !(await retry.json() as { provisioned?: boolean }).provisioned) {
        throw new Error(`Demo not provisioned (${prov.status()})`);
      }
    }
  });

  for (const { slug, file } of [
    { slug: demoSlug, file: "public-booking-hair.png" },
    { slug: "clarity-medspa-dublin", file: "public-booking-medspa.png" },
    { slug: "paws-parlour-dublin", file: "public-booking-pet.png" },
  ]) {
    test(`public booking mobile (${slug})`, async ({ page, request }) => {
      const res = await request.get(`${apiBase}/api/public/b/${slug}`);
      if (!res.ok()) test.skip(true, `${slug} missing`);
      await page.goto(`/b/${slug}`, { waitUntil: "networkidle" });
      await page.waitForTimeout(800);
      await page.screenshot({ path: path.join(OUT_DIR, file), fullPage: true });
    });
  }

  test("owner tenant mobile routes", async ({ page }) => {
    await signInOwner(page);
    for (const route of OWNER_ROUTES) {
      await page.goto(route, { waitUntil: "networkidle" });
      await page.waitForTimeout(600);
      const safe = route.replace(/[?&=]/g, "-").replace(/\//g, "_").replace(/^_/, "") || "root";
      await page.screenshot({ path: path.join(OUT_DIR, `owner-${safe}.png`), fullPage: true });
    }
  });

  for (const { slug, tag } of [
    { slug: "clarity-medspa-dublin", tag: "medspa" },
    { slug: "motion-physio-cork", tag: "allied-health" },
    { slug: "peak-fitness-dublin", tag: "fitness" },
  ]) {
    test(`vertical ${tag} today mobile`, async ({ page, request }) => {
      const res = await page.request.post(`${apiBase}/api/demo/sign-in-business`, { data: { slug } });
      if (!res.ok()) test.skip(true, `${slug} not seeded`);
      const { token } = (await res.json()) as { token?: string };
      if (!token) test.skip(true, "no token");
      await page.goto(`/sign-in?__clerk_ticket=${encodeURIComponent(token)}`, {
        waitUntil: "networkidle",
      });
      await page.waitForTimeout(2000);
      await page.goto("/dashboard", { waitUntil: "networkidle" });
      await page.screenshot({ path: path.join(OUT_DIR, `${tag}-dashboard.png`), fullPage: true });
      await page.goto("/inbox", { waitUntil: "networkidle" });
      await page.screenshot({ path: path.join(OUT_DIR, `${tag}-inbox.png`), fullPage: true });
    });
  }
});
