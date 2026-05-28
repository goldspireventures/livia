import { test, expect } from "@playwright/test";

test.describe("In-app notification centre (web)", () => {
  test("demo owner sees notification bell and can open centre", async ({ page }) => {
    await page.goto("/demo");
    await page.getByRole("button", { name: /owner/i }).first().click({ timeout: 30_000 }).catch(() => {});
    await page.waitForURL(/\/(dashboard|bookings|inbox|chain)/, { timeout: 45_000 }).catch(() => {});

    await page.goto("/dashboard");
    const bell = page.getByTestId("notification-bell");
    await expect(bell).toBeVisible({ timeout: 20_000 });
    await bell.click();
    await expect(page.getByRole("heading", { name: /notifications/i })).toBeVisible({
      timeout: 10_000,
    });
  });
});
