/**
 * Cross-surface route audit — marketing handoff → dashboard auth shell.
 *
 *   pnpm --filter @workspace/e2e exec playwright test route-audit-cross-surface --workers=1
 */
import { test, expect } from "@playwright/test";

const marketingBase = (process.env.E2E_MARKETING_URL ?? "http://127.0.0.1:5174").replace(
  /\/+$/,
  "",
);
const dashboardBase = (process.env.E2E_DASHBOARD_BASE ?? "http://127.0.0.1:5173").replace(
  /\/+$/,
  "",
);

test.describe("Cross-surface route audit", () => {
  test.beforeAll(async ({ request }) => {
    for (const url of [`${marketingBase}/`, `${dashboardBase}/sign-in`]) {
      try {
        const res = await request.get(url, { timeout: 10_000 });
        if (!res.ok()) {
          test.skip(true, `Surface not running: ${url}`);
        }
      } catch {
        test.skip(true, "Start platform: node scripts/start-platform-for-test.mjs");
      }
    }
  });

  test("marketing get-started sign-in links to dashboard (not staging)", async ({ page }) => {
    await page.goto(`${marketingBase}/get-started`);
    const signIn = page.getByRole("link", { name: /^sign in$/i });
    await expect(signIn).toBeVisible({ timeout: 15_000 });
    const href = await signIn.getAttribute("href");
    expect(href).toBeTruthy();
    expect(href).toMatch(/\/sign-in\/?$/);
    expect(href).not.toMatch(/staging/i);
    if (marketingBase.includes("127.0.0.1") || marketingBase.includes("localhost")) {
      expect(href).toMatch(/127\.0\.0\.1:5173|localhost:5173/);
    } else if (marketingBase.includes("livia-hq.com") && !marketingBase.includes("staging")) {
      expect(href).toMatch(/^https:\/\/app\.livia-hq\.com\/sign-in\/?$/);
    }
  });

  test("marketing sign-in navigates to dashboard auth form", async ({ page }) => {
    await page.goto(`${marketingBase}/get-started`);
    const signIn = page.getByRole("link", { name: /^sign in$/i });
    await signIn.click();
    await page.waitForURL(/\/sign-in/, { timeout: 20_000 });
    await expect(page.getByTestId("livia-sign-in-form")).toBeVisible({ timeout: 20_000 });
    await expect(page.locator("body")).not.toContainText(/internal server error/i);
  });

  test("dashboard app rewrite reaches API health", async ({ request }) => {
    const res = await request.get(`${dashboardBase}/api/healthz`, { timeout: 15_000 });
    expect(res.ok()).toBeTruthy();
    const text = await res.text();
    expect(text).toMatch(/ok|status/i);
    expect(text).not.toMatch(/^<!/);
  });

  test("sign-up and sign-in swap links work", async ({ page }) => {
    await page.goto(`${dashboardBase}/sign-in`);
    await expect(page.getByTestId("livia-sign-in-form")).toBeVisible({ timeout: 20_000 });
    const toSignUp = page.getByRole("link", { name: /sign up|create account/i });
    if (await toSignUp.isVisible().catch(() => false)) {
      await toSignUp.click();
      await page.waitForURL(/\/sign-up/, { timeout: 15_000 });
      await expect(page.getByTestId("livia-sign-up-form")).toBeVisible({ timeout: 15_000 });
    }
  });

  test("unauthenticated onboarding redirects to sign-in or shows wizard", async ({ page }) => {
    await page.goto(`${dashboardBase}/onboarding?fresh=1`, { waitUntil: "domcontentloaded" });
    await expect
      .poll(
        async () => {
          const url = page.url();
          if (/\/sign-in|\/demo/.test(url)) return true;
          return (
            (await page.getByTestId("onboarding-page").isVisible().catch(() => false)) ||
            (await page.getByTestId("livia-sign-in-form").isVisible().catch(() => false)) ||
            (await page.getByTestId("onboarding-start-path").isVisible().catch(() => false))
          );
        },
        { timeout: 25_000 },
      )
      .toBeTruthy();
    await expect(page.locator("body")).not.toContainText(/internal server error/i);
  });
});
