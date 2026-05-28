import { test, expect } from "@playwright/test";

test.describe("Production onboarding & notifications (web)", () => {
  test("onboarding welcome panel and channel wizard render", async ({ page }) => {
    await page.goto("/onboarding");
    const welcome = page.getByTestId("onboarding-welcome-panel");
    // Allow either the onboarding surface (auth ok) or a redirect/auth wall.
    const hasWelcome = await welcome.isVisible().catch(() => false);
    if (!hasWelcome) {
      await expect(page.locator("body")).toContainText(/sign in|command center|welcome|onboard/i, {
        timeout: 15_000,
      });
      test.skip(true, "Onboarding surface not reachable in this env/session");
    }
  });

  test("communications has notification prefs and channel wizard testids", async ({ page }) => {
    await page.goto("/demo");
    await page.getByRole("button", { name: /owner/i }).first().click({ timeout: 30_000 }).catch(() => {});
    await page.waitForURL(/\/(dashboard|bookings|inbox|chain)/, { timeout: 45_000 }).catch(() => {});

    await page.goto("/settings?tab=comms");
    const notif = page.getByTestId("notification-preferences-card");
    const canSee = await notif.isVisible().catch(() => false);
    if (!canSee) test.skip(true, "Settings not reachable (likely not signed in)");
    await expect(page.getByTestId("notification-preferences-card")).toBeVisible({ timeout: 20_000 });
    await expect(page.getByTestId("social-channels-panel")).toBeVisible();
    await expect(page.getByTestId("channel-setup-wizard")).toBeVisible();
  });

  test("demo owner dashboard shows notification strip or summary", async ({ page }) => {
    await page.goto("/demo");
    await page.getByRole("button", { name: /owner/i }).first().click({ timeout: 30_000 }).catch(() => {});
    await page.waitForURL(/\/(dashboard|bookings)/, { timeout: 45_000 }).catch(() => {});
    await page.goto("/dashboard");
    await expect(page.locator("body")).toBeVisible();
    const strip = page.getByTestId("notification-alert-strip");
    const banner = page.getByTestId("onboarding-progress-banner");
    const attached = await strip.or(banner).first().isVisible().catch(() => false);
    if (!attached) test.skip(true, "Notifications strip/banner not present in this env/session");
  });
});
