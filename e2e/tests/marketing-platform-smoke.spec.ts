/**
 * livia.io — full marketing smoke (aligned with dashboard verticals).
 *
 *   pnpm --filter @workspace/e2e exec playwright test --project=marketing-platform
 */
import { test, expect } from "@playwright/test";

const marketingBase = process.env.E2E_MARKETING_URL ?? "http://127.0.0.1:5174";
const dashboardDemo =
  process.env.E2E_DASHBOARD_DEMO_URL ?? "http://127.0.0.1:5173/demo";

const ROUTES = [
  "/",
  "/pricing",
  "/how-it-works",
  "/verticals",
  "/verticals/hair",
  "/verticals/beauty",
  "/verticals/allied-health",
  "/verticals/medspa",
  "/verticals/fitness",
  "/verticals/body-art",
  "/verticals/pet-grooming",
  "/verticals/wellness",
  "/verticals/automotive-detailing",
  "/for/chair-rental",
  "/europe",
  "/de",
  "/eu-ai",
  "/contact",
  "/changelog",
  "/status",
];

test.describe("livia.io — platform smoke", () => {
  test.beforeAll(async ({ request }) => {
    try {
      const res = await request.get(`${marketingBase}/`, { timeout: 8000 });
      if (!res.ok()) {
        test.skip(true, "Marketing not running — pnpm dev:marketing");
      }
    } catch {
      test.skip(true, "Marketing not running — pnpm dev:marketing");
    }
  });

  for (const route of ROUTES) {
    test(`loads ${route}`, async ({ page }) => {
      const res = await page.goto(`${marketingBase}${route}`, {
        waitUntil: "domcontentloaded",
        timeout: 30_000,
      });
      expect(res?.ok()).toBeTruthy();
      const body = await page.locator("body").innerText();
      expect(body).not.toMatch(/internal server error/i);
      expect(body).not.toMatch(/something went wrong/i);
    });
  }

  test("no dental positioning on home", async ({ page }) => {
    await page.goto(`${marketingBase}/`);
    await expect(page.getByText(/dental/i)).toHaveCount(0);
  });

  test("demo CTA points at dashboard", async ({ page }) => {
    await page.goto(`${marketingBase}/how-it-works`);
    const demo = page.getByTestId("marketing-demo-link").first();
    await expect(demo).toBeVisible();
    await expect(demo).toHaveAttribute("href", new RegExp("5173/demo"));
  });

  test("pricing shows wedge tiers", async ({ page }) => {
    await page.goto(`${marketingBase}/pricing`);
    await expect(page.getByRole("heading", { name: /pricing/i })).toBeVisible();
    await expect(page.getByText(/€79/)).toBeVisible();
  });

  test("status probes local API when configured", async ({ page }) => {
    await page.goto(`${marketingBase}/status`);
    await expect(page.getByRole("heading", { name: /status/i })).toBeVisible();
    await expect(page.locator("body")).toContainText(/API/i);
  });
});
