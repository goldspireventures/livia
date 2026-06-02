/**
 * W2 beauty gateway — G1 grid → G2/G3 card-stage (no auth).
 *
 *   pnpm --filter @workspace/e2e exec playwright test tests/gateway-beauty-wedge.spec.ts
 */
import { test, expect } from "@playwright/test";

const dashboardBase = process.env.E2E_DASHBOARD_BASE ?? "http://127.0.0.1:5173";

test.describe("Beauty demo gateway", () => {
  test("G1 wedge grid links to beauty story", async ({ page }) => {
    await page.goto(`${dashboardBase}/demo`, { waitUntil: "domcontentloaded" });
    await expect(page.getByTestId("gateway-g1-launcher")).toBeVisible();
    await expect(page.getByTestId("demo-wedge-grid")).toBeVisible();
    await page.getByTestId("demo-wedge-card-beauty").click();
    await page.waitForURL(/\/demo\/wedge\/beauty/, { timeout: 15_000 });
    await expect(page.getByTestId("gateway-demo-card-stage")).toBeVisible();
  });

  test("G2 advances beats until role grid", async ({ page }) => {
    await page.goto(`${dashboardBase}/demo/wedge/beauty`, { waitUntil: "domcontentloaded" });
    await expect(page.getByTestId("gateway-demo-card-stage")).toBeVisible();
    const next = page.getByRole("button", { name: /next beat/i });
    for (let i = 0; i < 4 && (await next.isVisible()); i += 1) {
      if (await page.getByText(/tap a role to enter/i).isVisible()) break;
      await next.click();
    }
    await expect(page.getByText(/tap a role to enter/i)).toBeVisible({ timeout: 10_000 });
    await expect(page.getByRole("button", { name: /owner/i }).first()).toBeVisible();
  });

  test("marketing beauty chip deep-links wedge", async ({ page }) => {
    const marketingBase = process.env.E2E_MARKETING_URL ?? "http://127.0.0.1:5174";
    await page.goto(`${marketingBase}/verticals/beauty`, { waitUntil: "domcontentloaded" });
    const link = page.getByTestId("marketing-demo-link");
    await expect(link).toHaveAttribute("href", /\/demo\/wedge\/beauty/);
  });
});
