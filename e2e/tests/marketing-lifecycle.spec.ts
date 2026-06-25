/**
 * Marketing → demo wedge → public book (F8 / E11 browser path).
 *
 *   pnpm --filter @workspace/e2e exec playwright test --project=marketing-lifecycle
 */
import { test, expect } from "@playwright/test";

const marketingBase = process.env.E2E_MARKETING_URL ?? "http://127.0.0.1:5174";
const dashboardBase = process.env.E2E_DASHBOARD_BASE ?? "http://127.0.0.1:5173";
const apiBase = process.env.E2E_API_BASE ?? "http://127.0.0.1:3000";
const demoSlug = process.env.E2E_DEMO_SLUG ?? "luxe-salon-spa";

test.describe("Marketing lifecycle", () => {
  test.beforeAll(async ({ request }) => {
    const st = await request.get(`${apiBase}/api/demo/status`);
    if (st.ok() && (await st.json() as { provisioned?: boolean }).provisioned) return;
    const prov = await request.post(`${apiBase}/api/demo/provision`, { timeout: 180_000 });
    if (!prov.ok()) {
      const retry = await request.get(`${apiBase}/api/demo/status`);
      if (!retry.ok() || !(await retry.json() as { provisioned?: boolean }).provisioned) {
        throw new Error(`Demo not provisioned (${prov.status()})`);
      }
    }
  });

  test("home hero get started opens signup path", async ({ page }) => {
    await page.goto(`${marketingBase}/`, { waitUntil: "domcontentloaded" });
    const cta = page.getByTestId("marketing-hero-get-started");
    await expect(cta).toHaveAttribute("href", "/get-started");
    await cta.click();
    await page.waitForURL(/\/get-started/, { timeout: 15_000 });
    await expect(page.getByTestId("marketing-get-started-sign-up")).toBeVisible();
  });

  test("wedge continues to demo launcher", async ({ page }) => {
    await page.goto(`${dashboardBase}/demo/wedge/beauty`, { waitUntil: "domcontentloaded" });
    const enter = page.getByRole("link", { name: /enter demo|open demo|continue/i }).or(
      page.getByRole("button", { name: /enter demo|open demo|continue/i }),
    );
    if ((await enter.count()) > 0) {
      await enter.first().click();
      await page.waitForURL(/\/demo/, { timeout: 30_000 });
    }
    await expect(page.locator("body")).toContainText(/demo/i);
  });

  test("public book surface loads from demo slug", async ({ page, request }) => {
    const res = await request.get(`${apiBase}/api/public/b/${demoSlug}`);
    if (!res.ok()) test.skip(true, `${demoSlug} missing`);
    await page.goto(`${dashboardBase}/b/${demoSlug}`, { waitUntil: "domcontentloaded" });
    await expect(page.getByTestId("text-business-name")).toBeVisible({ timeout: 45_000 });
  });

});
