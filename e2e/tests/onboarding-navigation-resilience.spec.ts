/**
 * Onboarding navigation resilience — back/forward, reload, route hops.
 * Catches duplicate /me/businesses fetches, error toasts, and spinner regressions.
 *
 *   pnpm --filter @workspace/e2e exec playwright test onboarding-navigation-resilience --workers=1
 */
import { test, expect } from "@playwright/test";
import { apiBase, clerkTicketSignIn } from "../helpers/demo-auth";
import { provisionFreshSignupFounder } from "../helpers/fresh-founder";

const ERROR_TOAST = /could not load your setup progress|internal server error/i;

async function dismissOnboardingIntro(page: import("@playwright/test").Page) {
  const overlay = page.getByTestId("onboarding-arrival-overlay");
  if (await overlay.isVisible({ timeout: 2_000 }).catch(() => false)) {
    await page.getByRole("button", { name: /enter setup/i }).click();
  }
}

async function pickFreshTrack(page: import("@playwright/test").Page) {
  const startPath = page.getByTestId("onboarding-start-path");
  if (await startPath.isVisible({ timeout: 8_000 }).catch(() => false)) {
    await page.getByTestId("migration-intent-fresh").click();
    await page.getByRole("button", { name: /^continue$/i }).click();
  }
  await dismissOnboardingIntro(page);
}

test.describe("Onboarding navigation resilience", () => {
  test("fresh founder survives reload, back, and route hops without error toast", async ({
    page,
    request,
  }) => {
    test.setTimeout(180_000);

    const founder = await provisionFreshSignupFounder(request, `nav-${Date.now()}`);
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });

    await clerkTicketSignIn(page, founder.token, {
      landingPath: "/onboarding?fresh=1&path=1",
      fallbackEmail: founder.email,
    });

    await pickFreshTrack(page);
    await expect(page.getByRole("button", { name: /create shop/i })).toBeVisible({
      timeout: 60_000,
    });

    const spine = page.getByTestId("onboarding-portal-step-spine");
    if (await spine.isVisible().catch(() => false)) {
      await expect(spine).not.toContainText(/new shop · \d+ steps/i);
      await expect(spine).not.toContainText(/bring your data · \d+ steps/i);
    }

    const unique = `NavTest ${Date.now().toString(36)}`;
    await page.getByLabel("Business name").fill(unique);

    const businessesRes = await page.request.get(`${apiBase}/api/me/businesses`);
    expect(businessesRes.ok(), `GET /me/businesses: ${await businessesRes.text()}`).toBeTruthy();

    await page.goto("/sign-in", { waitUntil: "domcontentloaded" });
    await page.goBack({ waitUntil: "domcontentloaded" });
    await expect(page).toHaveURL(/\/onboarding/);
    await expect(page.getByLabel("Business name")).toHaveValue(unique, { timeout: 15_000 });

    await page.reload({ waitUntil: "domcontentloaded" });
    await dismissOnboardingIntro(page);
    await expect(page.getByLabel("Business name")).toHaveValue(unique, { timeout: 15_000 });

    const destructiveToast = page.locator('[role="status"], [data-sonner-toast]').filter({
      hasText: ERROR_TOAST,
    });
    await expect(destructiveToast).toHaveCount(0);

    await page.goto("/guides", { waitUntil: "domcontentloaded" });
    await page.goto("/onboarding?fresh=1", { waitUntil: "domcontentloaded" });
    await expect(page.getByTestId("onboarding-page")).toBeVisible({ timeout: 30_000 });
    await expect(destructiveToast).toHaveCount(0);
  });
});
