/**
 * Functional smoke — every demo vertical as owner + public booking.
 *
 *   pnpm test:e2e:verticals
 *
 * Requires: API :3000 + dashboard :5173 + demo provisioned.
 */
import { test, expect } from "@playwright/test";
import {
  CORE_TENANT_ROUTES,
  GATED_ROUTE_SAMPLES,
  VERTICAL_DEMO_SHOPS,
} from "../fixtures/vertical-shops";
import {
  apiBase,
  assertHealthyPage,
  demoCanSignIn,
  demoHasBusiness,
  dismissLegalAcceptance,
  dismissPlatformTour,
  ensureDemoProvisioned,
  ensurePlatformLegalAccepted,
  signInBusiness,
} from "../helpers/demo-auth";

test.describe("All verticals smoke", () => {
  test.describe.configure({ mode: "serial", timeout: 600_000 });

  test.beforeAll(async ({ request }) => {
    await ensureDemoProvisioned(request);
  });

  for (const shop of VERTICAL_DEMO_SHOPS) {
    test.describe(`${shop.vertical} (${shop.slug})`, () => {
      test("public booking loads", async ({ page, request }) => {
        if (!(await demoHasBusiness(request, shop.slug))) {
          test.skip(true, `${shop.slug} missing — restart API, then pnpm demo:provision or sync-vertical-showcase`);
        }
        const res = await request.get(`${apiBase}/api/public/b/${shop.slug}`);
        if (!res.ok()) {
          test.skip(true, `${shop.slug} not in demo world`);
          return;
        }
        await page.goto(`/b/${shop.slug}`, { waitUntil: "domcontentloaded", timeout: 45_000 });
        await assertHealthyPage(page, `/b/${shop.slug}`);
        await expect(page.locator("body")).toContainText(/book|service|appointment|session|groom|treatment/i);
      });

      test("owner core routes", async ({ page, request }) => {
        if (!(await demoHasBusiness(request, shop.slug))) {
          test.skip(true, `${shop.slug} missing — restart API, then sync vertical showcase`);
        }
        if (!(await demoCanSignIn(request, shop.slug))) {
          test.skip(true, "Clerk sign-in unavailable in this environment (skip authenticated E2E)");
        }
        await signInBusiness(page, shop.slug);
        for (const route of CORE_TENANT_ROUTES) {
          await page.goto(route, { waitUntil: "domcontentloaded", timeout: 45_000 });
          await dismissPlatformTour(page);
          await assertHealthyPage(page, route);
        }
      });

      if (shop.exclusiveRoutes.length > 0) {
        test("vertical-exclusive routes", async ({ page, request }) => {
          if (!(await demoHasBusiness(request, shop.slug))) {
            test.skip(true, `${shop.slug} missing`);
          }
          if (!(await demoCanSignIn(request, shop.slug))) {
            test.skip(true, "Clerk sign-in unavailable in this environment (skip authenticated E2E)");
          }
          await signInBusiness(page, shop.slug);
          for (const route of shop.exclusiveRoutes) {
            await page.goto(route, { waitUntil: "domcontentloaded", timeout: 45_000 });
            await dismissPlatformTour(page);
            await assertHealthyPage(page, route);
            await expect(page).toHaveURL(new RegExp(route.replace(/\//g, "\\/")));
          }
        });
      }

      if (shop.navLabels) {
        test("vertical nav labels", async ({ page, request }) => {
          if (!(await demoHasBusiness(request, shop.slug))) {
            test.skip(true, `${shop.slug} missing`);
          }
          if (!(await demoCanSignIn(request, shop.slug))) {
            test.skip(true, "Clerk sign-in unavailable in this environment (skip authenticated E2E)");
          }
          await signInBusiness(page, shop.slug);
          await page.goto("/dashboard", { waitUntil: "domcontentloaded" });
          await dismissPlatformTour(page);
          for (const [href, label] of Object.entries(shop.navLabels)) {
            const testId = `nav-${href.replace(/\//g, "") || "home"}`;
            const link = page.getByTestId(testId);
            if (await link.isVisible().catch(() => false)) {
              await expect(link).toContainText(label);
            }
          }
        });
      }
    });
  }

  test("hair tenant redirects away from medspa-only route", async ({ page, request }) => {
    if (!(await demoCanSignIn(request, "luxe-salon-spa"))) {
      test.skip(true, "Clerk sign-in unavailable in this environment (skip authenticated E2E)");
    }
    await signInBusiness(page, "luxe-salon-spa");
    await ensurePlatformLegalAccepted(page);
    await page.goto("/medspa", { waitUntil: "domcontentloaded" });
    await page.waitForFunction(
      () => {
        const path = window.location.pathname.replace(/\/+$/, "");
        return path !== "/medspa";
      },
      { timeout: 30_000 },
    );
  });

  test("medspa tenant keeps /medspa", async ({ page, request }) => {
    if (!(await demoCanSignIn(request, "clarity-medspa-dublin"))) {
      test.skip(true, "Clerk sign-in unavailable in this environment (skip authenticated E2E)");
    }
    await signInBusiness(page, "clarity-medspa-dublin");
    await page.goto("/medspa", { waitUntil: "domcontentloaded" });
    await expect(page).toHaveURL(/\/medspa/);
    await assertHealthyPage(page, "/medspa");
  });

  test("vertical route gate matrix", async ({ page }) => {
    for (const { path, allowedVertical } of GATED_ROUTE_SAMPLES) {
      const shop = VERTICAL_DEMO_SHOPS.find((s) => s.vertical === allowedVertical);
      if (!shop) continue;
      // Skip if Clerk down (auth required).
      // eslint-disable-next-line playwright/no-skipped-test
      if (!(await demoCanSignIn(page.request, shop.slug))) {
        test.skip(true, "Clerk sign-in unavailable in this environment (skip authenticated E2E)");
      }
      await signInBusiness(page, shop.slug);
      await page.goto(path, { waitUntil: "domcontentloaded" });
      await expect(page).toHaveURL(new RegExp(path.replace(/\//g, "\\/")));
      await assertHealthyPage(page, path);
    }
  });

  test("luxe owner dashboard shows Liv surface", async ({ page, request }) => {
    const slug = "luxe-salon-spa";
    if (!(await demoHasBusiness(request, slug))) {
      test.skip(true, `${slug} missing — pnpm demo:provision`);
    }
    if (!(await demoCanSignIn(request, slug))) {
      test.skip(true, "Clerk sign-in unavailable in this environment (skip authenticated E2E)");
    }
    await signInBusiness(page, slug);
    await page.goto("/dashboard", { waitUntil: "domcontentloaded", timeout: 45_000 });
    await dismissPlatformTour(page);
    await assertHealthyPage(page, "/dashboard");
    const liv = page.getByTestId("liv-moments-strip").or(page.getByTestId("liv-proposals-panel"));
    if ((await liv.count()) > 0) {
      await expect(liv.first()).toBeVisible({ timeout: 20_000 });
    } else {
      await expect(page.locator("body")).toContainText(/liv/i);
    }
  });

  test("medspa public booking shows consent progress step", async ({ page, request }) => {
    const slug = "clarity-medspa-dublin";
    if (!(await demoHasBusiness(request, slug))) {
      test.skip(true, `${slug} missing`);
    }
    await page.goto(`/b/${slug}`, { waitUntil: "domcontentloaded", timeout: 45_000 });
    await assertHealthyPage(page, `/b/${slug}`);
    await expect(page.getByTestId("ritual-step-consent")).toBeVisible();
  });
});
