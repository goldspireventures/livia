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

  test("G2 thread shows Bookings, guest book, Today then G3 role grid", async ({ page }) => {
    await page.goto(`${dashboardBase}/demo/wedge/beauty`, { waitUntil: "domcontentloaded" });
    await expect(page.getByTestId("gateway-demo-beats-grid")).toBeVisible();
    await expect(page.getByText("Bookings ready to confirm")).toBeVisible();
    await expect(page.getByText("Guest books online")).toBeVisible();
    await expect(page.getByText("Today keeps the floor calm")).toBeVisible();
    await expect(page.getByTestId("gateway-demo-beat-inbox")).toBeVisible();
    await page.getByTestId("gateway-demo-continue").click();
    await expect(page.getByTestId("gateway-demo-enter-roles")).toBeVisible({ timeout: 10_000 });
    await expect(page.getByRole("link", { name: /owner/i }).first()).toBeVisible();
  });

  test("marketing beauty vertical links book-demo with vertical", async ({ page }) => {
    const marketingBase = process.env.E2E_MARKETING_URL ?? "http://127.0.0.1:5174";
    await page.goto(`${marketingBase}/verticals/beauty`, { waitUntil: "domcontentloaded" });
    const link = page.getByTestId("marketing-demo-link").filter({ hasText: /vertical/i });
    await expect(link).toHaveAttribute("href", /\/book-demo\?vertical=beauty/);
  });
});
