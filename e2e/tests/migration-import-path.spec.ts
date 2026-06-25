/**
 * Migration import path — honest automation UI on onboarding import track.
 *
 * Requires founder auth storage or manual login before import step.
 *   pnpm --filter @workspace/e2e run test -- migration-import-path
 */
import { test, expect } from "@playwright/test";

test.describe("Migration import path", () => {
  test("booksy shows file-only honest limit without connect", async ({ page }) => {
    await page.goto("/onboarding?fresh=1&track=import");
    const panel = page.getByTestId("migration-switch-panel");
    if (!(await panel.isVisible({ timeout: 8_000 }).catch(() => false))) {
      test.skip(true, "Not on import onboarding — sign in as founder with switching track");
      return;
    }
    await page.getByTestId("migration-source-booksy").click();
    await expect(page.getByTestId("migration-honest-limit")).toBeVisible({ timeout: 15_000 });
    const limit = await page.getByTestId("migration-honest-limit").innerText();
    expect(limit.toLowerCase()).toMatch(/no connect|file|export|upload/);
    await expect(page.getByRole("button", { name: /connect/i })).toHaveCount(0);
  });

  test("featured sources and search render", async ({ page }) => {
    await page.goto("/onboarding?fresh=1&track=import");
    const panel = page.getByTestId("migration-switch-panel");
    if (!(await panel.isVisible({ timeout: 8_000 }).catch(() => false))) {
      test.skip(true, "Not on import onboarding");
      return;
    }
    await expect(page.getByTestId("migration-search")).toBeVisible();
    await expect(page.getByTestId("migration-source-fresha")).toBeVisible();
    await page.getByTestId("migration-search").fill("spreadsheet");
    await expect(page.locator("body")).toContainText(/spreadsheet|excel|file/i);
  });
});
