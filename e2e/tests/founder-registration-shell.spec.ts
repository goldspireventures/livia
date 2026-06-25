/**
 * Founder registration shell — custom auth UI + policy copy (no Clerk email flow).
 *
 *   pnpm --filter @workspace/e2e run test -- founder-registration-shell
 */
import { test, expect } from "@playwright/test";

test.describe("Founder registration shell", () => {
  test("sign-up shows custom form and password guidance", async ({ page }) => {
    await page.goto("/sign-up");
    await expect(page.getByTestId("livia-sign-up-form")).toBeVisible({ timeout: 20_000 });
    await expect(page.getByLabel("Email")).toBeVisible();
    await expect(page.getByLabel("Password")).toBeVisible();
    await expect(page.getByRole("button", { name: /create account/i })).toBeVisible();
    await expect(page.locator("body")).toContainText(/at least 8 characters/i);
    await expect(page.locator("body")).not.toContainText(/set up your shop/i);
  });

  test("sign-in does not show marketing story wall", async ({ page }) => {
    await page.goto("/sign-in");
    await expect(page.getByTestId("livia-sign-in-form")).toBeVisible({ timeout: 20_000 });
    await expect(page.locator("body")).not.toContainText(/book a demo/i);
  });
});
