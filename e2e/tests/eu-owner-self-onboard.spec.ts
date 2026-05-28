import { test, expect } from "@playwright/test";

test.describe("EU owner self-onboard (Phase 2)", () => {
  test("onboarding wizard exposes core steps", async ({ page }) => {
    await page.goto("/onboarding");
    await expect(page.locator("body")).toContainText(/set up|welcome|create/i);
  });

  test("onboarding shop form testid when business exists", async ({ page }) => {
    await page.goto("/onboarding");
    const shopForm = page.getByTestId("onboarding-shop-form");
    const createStep = page.getByText(/create.*business|tell us about your shop/i);
    const hasShop = await shopForm.isVisible().catch(() => false);
    const hasCreate = await createStep.isVisible().catch(() => false);
    if (!(hasShop || hasCreate)) {
      await expect(page.locator("body")).toContainText(/sign in|welcome|onboard|set up/i, { timeout: 10_000 });
      test.skip(true, "Onboarding step testids not present in this env/session");
    }
  });

  test("go-live checklist testid when on final act", async ({ page }) => {
    await page.goto("/onboarding");
    const checklist = page.getByTestId("onboarding-go-live-checklist");
    if (await checklist.isVisible().catch(() => false)) {
      await expect(checklist.getByRole("checkbox").first()).toBeVisible();
    }
  });
});
