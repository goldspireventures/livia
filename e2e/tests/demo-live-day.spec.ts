/**
 * Demo world — today must feel live after provision/sync.
 *
 *   pnpm --filter @workspace/e2e exec playwright test --project=demo-live-day
 */
import { test, expect } from "@playwright/test";
import { ensureDemoProvisioned, apiBase } from "../helpers/demo-auth";

const SHOWCASE_SLUGS = ["luxe-salon-spa", "ink-anchor-galway", "clarity-medspa-dublin"] as const;

test.describe("Demo live day", () => {
  test.describe.configure({ mode: "serial", timeout: 240_000 });

  test.beforeAll(async ({ request }) => {
    await ensureDemoProvisioned(request);
  });

  for (const slug of SHOWCASE_SLUGS) {
    test(`${slug} — public book page loads with services`, async ({ page, request }) => {
      const status = await request.get(`${apiBase}/api/demo/status`);
      expect(status.ok()).toBeTruthy();
      const body = (await status.json()) as { businesses?: Array<{ slug: string }> };
      if (!body.businesses?.some((b) => b.slug === slug)) {
        test.skip(true, `${slug} missing from demo world`);
      }

      await page.goto(`/b/${slug}`, { waitUntil: "domcontentloaded", timeout: 45_000 });
      await expect(page.locator("[data-testid^='button-service-']").first()).toBeVisible({ timeout: 20_000 });
      const serviceCount = await page.locator("[data-testid^='button-service-']").count();
      expect(serviceCount).toBeGreaterThanOrEqual(3);
    });
  }

  test("sync-vertical-showcase refreshes live depth", async ({ request }) => {
    const sync = await request.post(`${apiBase}/api/demo/sync-vertical-showcase`, { timeout: 120_000 });
    expect(sync.ok()).toBeTruthy();
  });
});
