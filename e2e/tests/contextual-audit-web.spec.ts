/**
 * Full web contextual audit — capture every persona × route × settings tab.
 *
 *   pnpm e2e:contextual-web
 *
 * Output: e2e/visual-captures/web/<persona>/<slug>.png
 */
import { test, expect } from "@playwright/test";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_ROOT = path.join(__dirname, "..", "visual-captures", "web");
const apiBase = process.env.E2E_API_BASE ?? "http://127.0.0.1:3000";
const demoSlug = process.env.E2E_DEMO_SLUG ?? "luxe-salon-spa";

const CLERK_PERSONAS = [
  "founder",
  "owner",
  "manager",
  "staff-senior",
  "staff-junior",
  "receptionist",
] as const;

/** Paths each persona can see (from persona-rituals PERSONA_NAV_ORDER + common detail routes). */
const ROUTES_BY_PERSONA: Record<(typeof CLERK_PERSONAS)[number], string[]> = {
  founder: [
    "/chain",
    "/dashboard",
    "/inbox",
    "/bookings",
    "/bookings?create=1",
    "/customers",
    "/staff",
    "/services",
    "/lifecycle",
    "/audit",
    "/settings",
    "/onboarding?intent=second-shop",
  ],
  owner: [
    "/dashboard",
    "/inbox",
    "/bookings",
    "/bookings?create=1",
    "/customers",
    "/staff",
    "/services",
    "/lifecycle",
    "/audit",
    "/settings",
  ],
  manager: ["/inbox", "/dashboard", "/bookings", "/customers", "/staff", "/services", "/settings"],
  "staff-senior": ["/my-day", "/bookings", "/customers", "/settings"],
  "staff-junior": ["/my-day", "/bookings", "/customers", "/settings"],
  receptionist: ["/bookings", "/inbox", "/customers", "/settings"],
};

const SETTINGS_TABS_BY_PERSONA: Record<(typeof CLERK_PERSONAS)[number], string[]> = {
  founder: ["shop", "policy", "liv", "comms", "team", "billing", "ownership", "integrations", "legal"],
  owner: ["shop", "policy", "liv", "comms", "team", "billing", "ownership", "integrations", "legal"],
  manager: ["shop", "policy", "liv", "comms", "team", "legal"],
  "staff-senior": ["shop", "legal"],
  "staff-junior": ["shop", "legal"],
  receptionist: ["shop", "comms", "legal"],
};

function slugify(route: string): string {
  return route.replace(/^\//, "").replace(/[?&=]/g, "-") || "root";
}

async function signInAsPersona(
  page: import("@playwright/test").Page,
  persona: (typeof CLERK_PERSONAS)[number],
) {
  const res = await page.request.post(`${apiBase}/api/demo/sign-in`, { data: { persona } });
  if (!res.ok()) {
    throw new Error(`demo sign-in ${persona} failed (${res.status()}): ${(await res.text()).slice(0, 200)}`);
  }
  const { token } = (await res.json()) as { token?: string };
  if (!token) throw new Error(`No Clerk ticket for persona ${persona}`);
  await page.goto(`/sign-in?__clerk_ticket=${encodeURIComponent(token)}`, {
    waitUntil: "networkidle",
  });
  await page.waitForURL(/\/(chain|dashboard|inbox|bookings|my-day|settings|customers|staff|services|audit|lifecycle|onboarding)/, {
    timeout: 45_000,
  });
  const skipTour = page.getByRole("button", { name: /skip tour/i });
  if (await skipTour.isVisible().catch(() => false)) {
    await skipTour.click();
    await page.waitForTimeout(400);
  }
  const body = await page.locator("body").innerText();
  expect(body).not.toMatch(/sign in to your command center/i);
}

async function capture(page: import("@playwright/test").Page, outPath: string) {
  await page.waitForTimeout(600);
  await page.screenshot({ path: outPath, fullPage: true });
}

test.describe("Contextual audit — web (all personas)", () => {
  test.describe.configure({ mode: "serial", timeout: 360_000 });

  test.beforeAll(async ({ request }) => {
    const statusRes = await request.get(`${apiBase}/api/demo/status`);
    if (statusRes.ok()) {
      const status = (await statusRes.json()) as { provisioned?: boolean };
      if (status.provisioned) return;
    }
    const prov = await request.post(`${apiBase}/api/demo/provision`);
    if (prov.ok()) return;
    const body = await prov.text();
    const retryStatus = await request.get(`${apiBase}/api/demo/status`);
    if (retryStatus.ok() && (await retryStatus.json() as { provisioned?: boolean }).provisioned) {
      return;
    }
    throw new Error(`Demo provision failed: ${prov.status()} — ${body.slice(0, 300)}`);
  });

  test("public booking", async ({ page }) => {
    const res = await page.request.get(`${apiBase}/api/public/b/${demoSlug}`);
    if (!res.ok()) test.skip(true, "Demo slug missing");
    await page.goto(`/b/${demoSlug}`, { waitUntil: "networkidle" });
    await capture(page, path.join(OUT_ROOT, "_public", "booking-page.png"));
  });

  for (const persona of CLERK_PERSONAS) {
    test(`persona: ${persona}`, async ({ page }) => {
      const dir = path.join(OUT_ROOT, persona);
      await signInAsPersona(page, persona);

      const gotoOpts = { waitUntil: "domcontentloaded" as const, timeout: 45_000 };

      for (const route of ROUTES_BY_PERSONA[persona]) {
        await page.goto(route, gotoOpts);
        await page.waitForTimeout(800);
        await capture(page, path.join(dir, `${slugify(route)}.png`));
      }

      for (const tab of SETTINGS_TABS_BY_PERSONA[persona]) {
        await page.goto(`/settings?tab=${tab}`, gotoOpts);
        await page.waitForTimeout(800);
        await capture(page, path.join(dir, `settings-${tab}.png`));
      }

      // Detail surfaces (best-effort from list pages)
      if (ROUTES_BY_PERSONA[persona].includes("/bookings")) {
        const row = page.locator('[data-testid^="row-booking-"]').first();
        if (await row.isVisible().catch(() => false)) {
          await row.click();
          await page.waitForURL(/\/bookings\//, { timeout: 10_000 });
          await capture(page, path.join(dir, "booking-detail.png"));
        }
      }
      if (ROUTES_BY_PERSONA[persona].includes("/customers")) {
        await page.goto("/customers", { waitUntil: "networkidle" });
        const link = page.locator('a[href^="/customers/"]').first();
        if (await link.isVisible().catch(() => false)) {
          await link.click();
          await capture(page, path.join(dir, "customer-detail.png"));
        }
      }
      if (["founder", "owner", "manager"].includes(persona)) {
        await page.goto("/staff", { waitUntil: "networkidle" });
        const link = page.locator('a[href^="/staff/"]').first();
        if (await link.isVisible().catch(() => false)) {
          await link.click();
          await capture(page, path.join(dir, "staff-detail.png"));
        }
      }
    });
  }
});
