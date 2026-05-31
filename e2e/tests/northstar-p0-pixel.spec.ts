/**
 * P0 tenant screens — pixel diff vs northstar PNG anchors.
 * Baselines: artifacts/livia-dashboard/public/livia-evolution/northstar/
 *
 *   pnpm --filter @workspace/e2e run test:northstar-p0
 *
 * Requires demo + Clerk sign-in. Skips when unavailable (CI api-only job).
 */
import { test, expect } from "@playwright/test";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { TENANT_NORTHSTAR_P0 } from "@workspace/policy";
import {
  demoCanSignIn,
  demoHasBusiness,
  dismissPlatformTour,
  ensureDemoProvisioned,
  signInBusiness,
} from "../helpers/demo-auth";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DEFAULT_SLUG = process.env.E2E_DEMO_SLUG ?? "luxe-salon-spa";

/** Mask clocks, briefing text, and scroll positions that differ run-to-run. */
function dynamicMasks(page: import("@playwright/test").Page) {
  return [
    page.locator("time"),
    page.getByTestId("owner-dashboard-briefing"),
    page.locator("[data-liv-briefing]"),
  ];
}

test.describe("Northstar P0 pixel diff", () => {
  test.describe.configure({ mode: "serial", timeout: 120_000 });

  test.beforeAll(async ({ request }) => {
    await ensureDemoProvisioned(request);
  });

  for (const entry of TENANT_NORTHSTAR_P0) {
    test(`${entry.screenId} ~ ${entry.northstarFile}`, async ({ page, request }) => {
      const slug = entry.demoSlug ?? DEFAULT_SLUG;
      if (!(await demoHasBusiness(request, slug))) {
        test.skip(true, `${slug} missing`);
      }
      if (!(await demoCanSignIn(request, slug))) {
        test.skip(true, "Clerk sign-in unavailable");
      }

      await signInBusiness(page, slug);
      await page.setViewportSize(entry.viewport);
      await page.goto(entry.route, { waitUntil: "domcontentloaded", timeout: 45_000 });
      await dismissPlatformTour(page);
      await page.waitForTimeout(800);

      const signedOut = await page
        .locator("body")
        .innerText()
        .then((t) => /sign in|log in/i.test(t));
      if (signedOut) {
        test.skip(true, "not signed in");
      }

      await expect(page).toHaveScreenshot(entry.northstarFile, {
        maxDiffPixelRatio: entry.maxDiffPixelRatio,
        mask: dynamicMasks(page),
        animations: "disabled",
        timeout: 20_000,
      });
    });
  }
});
