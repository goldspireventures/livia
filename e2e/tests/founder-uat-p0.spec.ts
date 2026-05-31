/**
 * Founder UAT — signed-in P0 paths for medspa + salon owners.
 *
 *   pnpm --filter @workspace/e2e run test:founder-uat
 */
import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import {
  assertHealthyPage,
  demoCanSignIn,
  demoHasBusiness,
  dismissPlatformTour,
  ensureDemoProvisioned,
  signInBusiness,
} from "../helpers/demo-auth";

const LUXE = process.env.E2E_DEMO_SLUG ?? "luxe-salon-spa";
const MEDSPA = "clarity-medspa-dublin";

async function expectNoSeriousAxe(page: import("@playwright/test").Page, label: string) {
  const results = await new AxeBuilder({ page })
    .disableRules(["color-contrast"])
    .analyze();
  const serious = results.violations.filter(
    (v) => v.impact === "critical" || v.impact === "serious",
  );
  expect(serious, `${label}: ${serious.map((v) => v.id).join(", ")}`).toEqual([]);
}

test.describe("Founder UAT P0", () => {
  test.describe.configure({ mode: "serial", timeout: 120_000 });

  test.beforeAll(async ({ request }) => {
    await ensureDemoProvisioned(request);
  });

  test.describe("Medspa owner (Clarity)", () => {
    test.beforeEach(async ({ page, request }) => {
      if (!(await demoHasBusiness(request, MEDSPA))) {
        test.skip(true, `${MEDSPA} missing`);
      }
      if (!(await demoCanSignIn(request, MEDSPA))) {
        test.skip(true, "Clerk sign-in unavailable");
      }
      await signInBusiness(page, MEDSPA);
      await dismissPlatformTour(page);
    });

    test("dashboard ritual — no full Liv hub on home", async ({ page }) => {
      await page.goto("/dashboard", { waitUntil: "domcontentloaded" });
      await assertHealthyPage(page, "/dashboard");
      await expect(page.getByTestId("owner-home-ritual")).toBeVisible({ timeout: 20_000 });
      await expect(page.getByTestId("liv-command-hub")).toHaveCount(0);
      await expectNoSeriousAxe(page, "medspa dashboard");
    });

    test("clinical hub compact shell", async ({ page }) => {
      await page.goto("/medspa", { waitUntil: "domcontentloaded" });
      await expect(page.getByTestId("medspa-hub-page")).toBeVisible();
      await expectNoSeriousAxe(page, "medspa hub");
    });

    test("customers roster", async ({ page }) => {
      await page.goto("/customers", { waitUntil: "domcontentloaded" });
      await expect(page.getByTestId("customers-page")).toBeVisible();
    });

    test("services catalog", async ({ page }) => {
      await page.goto("/services", { waitUntil: "domcontentloaded" });
      await expect(page.getByTestId("services-page")).toBeVisible();
    });

    test("settings shop tab — booking link strip", async ({ page }) => {
      await page.goto("/settings?tab=shop", { waitUntil: "domcontentloaded" });
      await expect(page.getByTestId("settings-page")).toBeVisible();
      await expect(page.getByTestId("settings-booking-link-strip")).toBeVisible();
      await expect(page.getByTestId("tab-appearance")).toBeVisible();
    });
  });

  test.describe("Salon owner (Luxe)", () => {
    test.beforeEach(async ({ page, request }) => {
      if (!(await demoHasBusiness(request, LUXE))) {
        test.skip(true, `${LUXE} missing`);
      }
      if (!(await demoCanSignIn(request, LUXE))) {
        test.skip(true, "Clerk sign-in unavailable");
      }
      await signInBusiness(page, LUXE);
      await dismissPlatformTour(page);
    });

    test("inbox without empty context rail", async ({ page }) => {
      await page.goto("/inbox", { waitUntil: "domcontentloaded" });
      await expect(page.getByTestId("inbox-three-pane")).toBeVisible();
      await expect(page.getByTestId("inbox-context-rail")).toHaveCount(0);
    });

    test("toolkit focused Liv hub", async ({ page }) => {
      await page.goto("/toolkit", { waitUntil: "domcontentloaded" });
      await expect(page.getByTestId("toolkit-page")).toBeVisible();
      await expect(page.getByTestId("liv-moments-strip")).toHaveCount(0);
    });

    test("staff roster", async ({ page }) => {
      await page.goto("/staff", { waitUntil: "domcontentloaded" });
      await expect(page.getByTestId("staff-page")).toBeVisible();
    });

    test("services catalog", async ({ page }) => {
      await page.goto("/services", { waitUntil: "domcontentloaded" });
      await expect(page.getByTestId("services-page")).toBeVisible();
    });

    test("public appearance preview frame", async ({ page }) => {
      await page.goto("/settings?tab=appearance", { waitUntil: "domcontentloaded" });
      const panel = page.getByTestId("public-appearance-panel");
      if ((await panel.count()) === 0) {
        test.skip(true, "presentation presets not enabled in this environment");
      }
      await expect(panel).toBeVisible();
      await expect(page.getByTestId("public-b-preview-frame")).toBeVisible();
    });
  });
});
