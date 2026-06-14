/**
 * Guest retail bag on /b — vertical mini-store E2E.
 *
 *   pnpm --filter @workspace/e2e exec playwright test --project=public-booking-quality guest-retail-cart
 */
import { test, expect } from "@playwright/test";
import { demoHasBusiness, ensureDemoProvisioned } from "../helpers/demo-auth";

const apiBase = process.env.E2E_API_BASE ?? "http://127.0.0.1:3000";

const RETAIL_SLUGS = [
  { slug: "luxe-salon-spa", section: "Take home" },
  { slug: "bloom-beauty-dublin", section: "Take home" },
  { slug: "harbour-wellness-cork", section: "Take the ritual home" },
] as const;

test.describe("Guest retail cart", () => {
  test.describe.configure({ mode: "serial", timeout: 180_000 });

  test.beforeAll(async ({ request }) => {
    await ensureDemoProvisioned(request);
  });

  for (const { slug } of RETAIL_SLUGS) {
    test(`${slug} — public profile exposes retail products`, async ({ request }) => {
      if (!(await demoHasBusiness(request, slug))) {
        test.skip(true, `${slug} not in demo world`);
      }

      const res = await request.get(`${apiBase}/api/public/b/${slug}`);
      expect(res.ok()).toBeTruthy();
      const body = (await res.json()) as {
        retailStore?: { settings?: { enabled?: boolean }; products?: Array<{ id: string; name: string }> };
      };
      expect(body.retailStore?.settings?.enabled).toBe(true);
      expect((body.retailStore?.products?.length ?? 0) >= 1).toBe(true);
    });

    test(`${slug} — /b shows retail section`, async ({ page, request }) => {
      if (!(await demoHasBusiness(request, slug))) {
        test.skip(true, `${slug} not in demo world`);
      }

      await page.goto(`/b/${slug}`, { waitUntil: "domcontentloaded", timeout: 45_000 });
      await expect(page.getByTestId("public-beauty-shop")).toBeVisible({ timeout: 20_000 });
      await expect(page.locator("[data-testid^='add-retail-']").first()).toBeVisible({ timeout: 10_000 });
    });
  }
});
