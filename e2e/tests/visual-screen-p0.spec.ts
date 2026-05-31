/**
 * P0 tenant surfaces — functional + layout smoke (screenshot optional).
 * Requires demo provisioned + Clerk sign-in on dashboard project.
 *
 *   pnpm --filter @workspace/e2e run test:p0-visual
 */
import { test, expect } from "@playwright/test";
import {
  assertHealthyPage,
  demoCanSignIn,
  demoHasBusiness,
  dismissPlatformTour,
  ensureDemoProvisioned,
  signInBusiness,
} from "../helpers/demo-auth";

const OWNER_SLUG = process.env.E2E_DEMO_SLUG ?? "luxe-salon-spa";
const MEDSPA_SLUG = "clarity-medspa-dublin";

test.describe("P0 visual / density", () => {
  test.describe.configure({ mode: "serial", timeout: 120_000 });

  test.beforeAll(async ({ request }) => {
    await ensureDemoProvisioned(request);
  });

  test("owner dashboard ritual mounts", async ({ page, request }) => {
    if (!(await demoHasBusiness(request, OWNER_SLUG))) {
      test.skip(true, `${OWNER_SLUG} missing`);
    }
    if (!(await demoCanSignIn(request, OWNER_SLUG))) {
      test.skip(true, "Clerk sign-in unavailable");
    }
    await signInBusiness(page, OWNER_SLUG);
    await page.goto("/dashboard", { waitUntil: "domcontentloaded", timeout: 45_000 });
    await dismissPlatformTour(page);
    await assertHealthyPage(page, "/dashboard");
    await expect(page.getByTestId("owner-home-ritual")).toBeVisible({ timeout: 20_000 });
    await expect(page.getByTestId("owner-dashboard-briefing")).toBeVisible();
    const hub = page.getByTestId("liv-command-hub");
    await expect(hub).toHaveCount(0);
  });

  test("toolkit focused hub without recovery strips", async ({ page, request }) => {
    if (!(await demoCanSignIn(request, OWNER_SLUG))) {
      test.skip(true, "Clerk sign-in unavailable");
    }
    await signInBusiness(page, OWNER_SLUG);
    await page.goto("/toolkit", { waitUntil: "domcontentloaded" });
    await dismissPlatformTour(page);
    await expect(page.getByTestId("toolkit-page")).toBeVisible();
    await expect(page.getByTestId("liv-command-hub")).toBeVisible();
    await expect(page.getByTestId("liv-moments-strip")).toHaveCount(0);
  });

  test("settings shop tab", async ({ page, request }) => {
    if (!(await demoCanSignIn(request, OWNER_SLUG))) {
      test.skip(true, "Clerk sign-in unavailable");
    }
    await signInBusiness(page, OWNER_SLUG);
    await page.goto("/settings?tab=shop", { waitUntil: "domcontentloaded" });
    await dismissPlatformTour(page);
    await expect(page.getByTestId("settings-page")).toBeVisible();
    await expect(page.getByTestId("settings-booking-link-strip")).toBeVisible();
  });

  test("bookings list shell", async ({ page, request }) => {
    if (!(await demoCanSignIn(request, OWNER_SLUG))) {
      test.skip(true, "Clerk sign-in unavailable");
    }
    await signInBusiness(page, OWNER_SLUG);
    await page.goto("/bookings", { waitUntil: "domcontentloaded" });
    await dismissPlatformTour(page);
    await expect(page.getByTestId("bookings-page")).toBeVisible();
  });

  test("inbox three-pane without empty context rail", async ({ page, request }) => {
    if (!(await demoCanSignIn(request, OWNER_SLUG))) {
      test.skip(true, "Clerk sign-in unavailable");
    }
    await signInBusiness(page, OWNER_SLUG);
    await page.goto("/inbox", { waitUntil: "domcontentloaded" });
    await dismissPlatformTour(page);
    await expect(page.getByTestId("inbox-three-pane")).toBeVisible();
    await expect(page.getByTestId("inbox-context-rail")).toHaveCount(0);
  });

  test("medspa hub loads for medspa tenant", async ({ page, request }) => {
    if (!(await demoHasBusiness(request, MEDSPA_SLUG))) {
      test.skip(true, `${MEDSPA_SLUG} missing`);
    }
    if (!(await demoCanSignIn(request, MEDSPA_SLUG))) {
      test.skip(true, "Clerk sign-in unavailable");
    }
    await signInBusiness(page, MEDSPA_SLUG);
    await page.goto("/medspa", { waitUntil: "domcontentloaded" });
    await dismissPlatformTour(page);
    await expect(page.getByTestId("medspa-hub-page")).toBeVisible();
  });

  test("services catalog shell", async ({ page, request }) => {
    if (!(await demoCanSignIn(request, OWNER_SLUG))) {
      test.skip(true, "Clerk sign-in unavailable");
    }
    await signInBusiness(page, OWNER_SLUG);
    await page.goto("/services", { waitUntil: "domcontentloaded" });
    await dismissPlatformTour(page);
    await expect(page.getByTestId("services-page")).toBeVisible();
  });

  test("customers list shell", async ({ page, request }) => {
    if (!(await demoCanSignIn(request, OWNER_SLUG))) {
      test.skip(true, "Clerk sign-in unavailable");
    }
    await signInBusiness(page, OWNER_SLUG);
    await page.goto("/customers", { waitUntil: "domcontentloaded" });
    await dismissPlatformTour(page);
    await expect(page.getByTestId("customers-page")).toBeVisible();
  });

  test("design proofs queue first", async ({ page, request }) => {
    if (!(await demoHasBusiness(request, "ink-anchor-galway"))) {
      test.skip(true, "body-art demo missing");
    }
    if (!(await demoCanSignIn(request, "ink-anchor-galway"))) {
      test.skip(true, "Clerk sign-in unavailable");
    }
    await signInBusiness(page, "ink-anchor-galway");
    await page.goto("/design-proofs", { waitUntil: "domcontentloaded" });
    await dismissPlatformTour(page);
    await expect(page.getByTestId("design-proofs-page")).toBeVisible();
    await expect(page.getByTestId("design-proofs-queue")).toBeVisible();
  });
});
