import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const demoSlug = process.env.E2E_DEMO_SLUG ?? "luxe-salon-spa";

/** Public + auth-shell routes every release should load without 500. */
const PUBLIC_ROUTES: { path: string; pattern: RegExp }[] = [
  { path: "/sign-in", pattern: /sign in|livia/i },
  { path: "/sign-up", pattern: /sign up|create|livia/i },
  { path: "/demo", pattern: /demo/i },
  { path: "/guides", pattern: /guide|test|e2e|livia/i },
  { path: "/portal", pattern: /portal|demo|livia/i },
  { path: `/b/${demoSlug}`, pattern: /service|book|appointment|livia/i },
];

const AUTH_SHELL_ROUTES: { path: string; pattern: RegExp }[] = [
  { path: "/onboarding", pattern: /welcome|set up|onboard|livia/i },
  { path: "/dashboard", pattern: /dashboard|today|booking|livia/i },
  { path: "/bookings", pattern: /booking|calendar|livia/i },
  { path: "/customers", pattern: /client|customer|livia/i },
  { path: "/inbox", pattern: /inbox|message|conversation|livia/i },
  { path: "/settings", pattern: /setting|communication|livia/i },
  { path: "/staff", pattern: /staff|team|livia/i },
  { path: "/services", pattern: /service|livia/i },
  { path: "/my-day", pattern: /day|appointment|chair|livia/i },
  { path: "/experience", pattern: /experience|demo|door|livia/i },
  { path: "/host", pattern: /host|chair|rent|livia/i },
  { path: "/brands", pattern: /brand|portfolio|livia/i },
  { path: "/rota", pattern: /rota|shift|team|livia/i },
  { path: "/classes", pattern: /class|roster|capacity|livia/i },
  { path: "/franchise", pattern: /franchise|network|livia/i },
  { path: "/design-proofs", pattern: /design|proof|tattoo|livia/i },
  { path: "/chain", pattern: /shop|glance|chain|livia/i },
  { path: "/toolkit", pattern: /liv command|toolkit|briefing|livia/i },
  { path: "/launch-status", pattern: /launch|status|livia/i },
  { path: "/audit", pattern: /audit|livia/i },
  { path: "/lifecycle", pattern: /lifecycle|livia/i },
];

test.describe("Dashboard Gate 3 smoke", () => {
  test("sign-in has no critical axe violations", async ({ page }) => {
    await page.goto("/sign-in");
    const results = await new AxeBuilder({ page })
      .disableRules(["color-contrast"])
      .analyze();
    const serious = results.violations.filter(
      (v) => v.impact === "critical" || v.impact === "serious",
    );
    expect(serious).toEqual([]);
  });

  for (const r of PUBLIC_ROUTES) {
    test(`public route loads: ${r.path}`, async ({ page }) => {
      const res = await page.goto(r.path);
      if (r.path.startsWith("/b/") && res?.status() === 404) {
        test.skip(true, "Demo business not seeded");
      }
      expect(res?.status()).toBeLessThan(500);
      await expect(page.locator("body")).toContainText(r.pattern, { timeout: 20_000 });
    });
  }

  for (const r of AUTH_SHELL_ROUTES) {
    test(`auth shell loads (may redirect): ${r.path}`, async ({ page }) => {
      await page.goto(r.path);
      await expect(page.locator("body")).toContainText(r.pattern, { timeout: 20_000 });
    });
  }
});
