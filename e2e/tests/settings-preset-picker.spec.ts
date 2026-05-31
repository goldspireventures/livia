/**
 * E7 — presentation preset picker (staging / dev API gate).
 *
 *   pnpm --filter @workspace/e2e exec playwright test --project=settings-preset-picker
 */
import { test, expect } from "@playwright/test";
import {
  apiBase,
  demoCanSignIn,
  dismissLegalAcceptance,
  dismissPlatformTour,
  ensureDemoProvisioned,
  signInBusiness,
} from "../helpers/demo-auth";

const demoSlug = process.env.E2E_DEMO_SLUG ?? "luxe-salon-spa";
const dashboardBase = (process.env.E2E_DASHBOARD_BASE ?? "http://127.0.0.1:5173").replace(/\/+$/, "");
const isStagingHost = dashboardBase.includes("staging");

test.describe("Settings preset picker (E7)", () => {
  test.beforeAll(async ({ request }) => {
    await ensureDemoProvisioned(request);
    if (!(await demoCanSignIn(request, demoSlug))) {
      test.skip(true, "Clerk demo sign-in unavailable");
    }
  });

  test("owner can view and save appearance preset", async ({ page, request }) => {
    await signInBusiness(page, demoSlug);
    await dismissLegalAcceptance(page);
    await dismissPlatformTour(page);

    await page.goto("/settings?tab=shop", { waitUntil: "domcontentloaded", timeout: 45_000 });

    const panel = page.getByTestId("public-appearance-panel");
    const visible = await panel.isVisible().catch(() => false);

    if (!visible) {
      if (isStagingHost) {
        throw new Error(
          "Preset panel missing on staging — check API LIVIA_DEPLOY_ENV=staging and redeploy api-server",
        );
      }
      test.skip(true, "Preset picker not enabled in this environment");
    }

    const cards = panel.locator('[data-testid^="preset-card-"]');
    const count = await cards.count();
    expect(count).toBeGreaterThan(1);

    const pick = cards.nth(1);
    const presetTestId = await pick.getAttribute("data-testid");
    const presetId = presetTestId?.replace("preset-card-", "") ?? "";
    await pick.click();

    await expect(pick).toHaveClass(/border-primary/, { timeout: 15_000 });

    const status = await request.get(`${apiBase}/api/demo/status`);
    expect(status.ok()).toBeTruthy();
    const biz = ((await status.json()) as { businesses?: Array<{ slug: string; id: string }> }).businesses?.find(
      (b) => b.slug === demoSlug,
    );
    if (biz?.id && presetId) {
      const pres = await page.evaluate(
        async ({ api, businessId }) => {
          const clerk = (window as unknown as { Clerk?: { session?: { getToken: () => Promise<string | null> } } })
            .Clerk;
          const token = await clerk?.session?.getToken?.();
          if (!token) return null;
          const res = await fetch(`${api}/api/businesses/${businessId}/presentation`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          return res.ok ? res.json() : null;
        },
        { api: apiBase, businessId: biz.id },
      );
      expect(pres?.presetsEnabled).toBe(true);
      expect(pres?.presetId).toBe(presetId);
    }
  });
});
