/**
 * Settings public appearance → `/b` token parity (Phase 1).
 *
 *   pnpm --filter @workspace/e2e exec playwright test preset-public-parity
 */
import { test, expect } from "@playwright/test";
import { ensureDemoProvisioned, signInBusiness } from "../helpers/demo-auth";

const SLUG = "luxe-salon-spa";
const ACCENT = "#1a4d8f";

test.describe("Preset public parity", () => {
  test.describe.configure({ mode: "serial", timeout: 180_000 });

  test.beforeAll(async ({ request }) => {
    await ensureDemoProvisioned(request);
  });

  test("accent change updates --brand-accent on /b", async ({ page, request }) => {
    await signInBusiness(page, SLUG);

    await page.goto("/settings?tab=appearance", { waitUntil: "domcontentloaded" });
    await expect(page.getByTestId("public-appearance-panel")).toBeVisible({ timeout: 30_000 });

    const accentInput = page.getByTestId("presentation-accent-input");
    await accentInput.fill(ACCENT);
    await page.waitForTimeout(500);

    await page.goto(`/b/${SLUG}`, { waitUntil: "domcontentloaded" });
    await expect(page.getByTestId("text-business-name")).toBeVisible({ timeout: 30_000 });

    const accentOnPublic = await page.evaluate(() => {
      const root = document.documentElement;
      return root.style.getPropertyValue("--brand-accent").trim();
    });
    expect(accentOnPublic.toLowerCase()).toBe(ACCENT.toLowerCase());
  });
});
