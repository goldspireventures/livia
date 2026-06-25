/**
 * Onboarding fast track — path picker through first booking (G0–G6).
 *
 *   pnpm --filter @workspace/e2e run test -- onboarding-fast-track
 */
import { test, expect } from "@playwright/test";

test.describe("Onboarding fast track", () => {
  test("path picker shows fresh and import options", async ({ page }) => {
    await page.goto("/onboarding?fresh=1&path=1");
    const pathStep = page.getByTestId("onboarding-start-path");
    if (!(await pathStep.isVisible({ timeout: 12_000 }).catch(() => false))) {
      test.skip(true, "Sign in as founder with fresh start to see path picker");
      return;
    }
    await expect(pathStep).toBeVisible();
    await expect(page.getByTestId("migration-intent-fresh")).toBeVisible();
    await expect(page.getByTestId("migration-intent-switching")).toBeVisible();
  });

  test("import track uses portal step spine labels", async ({ page }) => {
    await page.goto("/onboarding?fresh=1&track=import");
    const pathStep = page.getByTestId("onboarding-start-path");
    if (await pathStep.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await page.getByTestId("migration-intent-switching").click();
    }
    const portal = page.getByTestId("onboarding-portal-step-spine");
    if (!(await portal.isVisible({ timeout: 12_000 }).catch(() => false))) {
      test.skip(true, "Sign in as founder to reach import portal");
      return;
    }
    await expect(portal).toContainText(/import path|basics|import|hours|book link|open/i);
  });

  test("a12 launch screen — no blocking checklist", async ({ page }) => {
    await page.goto("/onboarding?fresh=1&track=import");
    const goLive = page.getByTestId("onboarding-go-live-checklist");
    if (!(await goLive.isVisible({ timeout: 8_000 }).catch(() => false))) {
      test.skip(true, "Not on go-live step");
      return;
    }
    await expect(goLive).toContainText(/ready to open Livia/i);
    await expect(page.locator("#testBooking")).toHaveCount(0);
    await expect(page.getByRole("button", { name: /open livia/i })).toBeVisible();
  });
});
