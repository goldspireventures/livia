/**
 * Screen-card PNG baselines — per-screen northstars under docs/design/assets/screen-cards/.
 *
 *   pnpm --filter @workspace/e2e run test:screen-card-p0
 *   pnpm screen-cards:update   # refresh baselines after intentional UI change
 */
import { test, expect } from "@playwright/test";
import { SCREEN_CARD_P0 } from "@workspace/policy";
import {
  demoCanSignIn,
  demoHasBusiness,
  dismissPlatformTour,
  ensureDemoProvisioned,
  signInBusiness,
} from "../helpers/demo-auth";

const DEFAULT_SLUG = process.env.E2E_DEMO_SLUG ?? "luxe-salon-spa";

function dynamicMasks(page: import("@playwright/test").Page) {
  return [
    page.locator("time"),
    page.getByTestId("owner-dashboard-briefing"),
    page.getByTestId("public-b-preview-iframe"),
    page.locator("[data-testid='notification-unread-badge']"),
  ];
}

async function gotoEntry(
  page: import("@playwright/test").Page,
  request: import("@playwright/test").APIRequestContext,
  entry: (typeof SCREEN_CARD_P0)[number],
) {
  const auth = entry.auth ?? "demo";
  if (auth === "public" || auth === "gateway") {
    await page.goto(entry.route, { waitUntil: "domcontentloaded", timeout: 45_000 });
    return;
  }

  const slug = entry.demoSlug ?? DEFAULT_SLUG;
  if (!(await demoHasBusiness(request, slug))) {
    test.skip(true, `${slug} missing`);
  }
  if (!(await demoCanSignIn(request, slug))) {
    test.skip(true, "Clerk sign-in unavailable");
  }
  await signInBusiness(page, slug);
  await page.goto(entry.route, { waitUntil: "domcontentloaded", timeout: 45_000 });
  await dismissPlatformTour(page);
}

test.describe("Screen-card P0 pixel diff", () => {
  test.describe.configure({ mode: "serial", timeout: 120_000 });

  test.beforeAll(async ({ request }) => {
    await ensureDemoProvisioned(request);
  });

  for (const entry of SCREEN_CARD_P0) {
    test(entry.screenId, async ({ page, request }) => {
      await page.setViewportSize(entry.viewport);
      await gotoEntry(page, request, entry);
      await page.waitForTimeout(800);

      await expect(page).toHaveScreenshot(entry.northstarFile, {
        maxDiffPixelRatio: entry.maxDiffPixelRatio,
        mask: dynamicMasks(page),
        animations: "disabled",
        timeout: 20_000,
      });
    });
  }
});
