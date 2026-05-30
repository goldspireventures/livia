/**
 * Public B2C booking — axe + flow smoke (hair, medspa, pet).
 *
 *   pnpm --filter @workspace/e2e exec playwright test --project=public-booking-quality
 */
import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { findAvailablePublicSlot } from "../helpers/public-book";
import { demoHasBusiness, ensureDemoProvisioned } from "../helpers/demo-auth";

const apiBase = process.env.E2E_API_BASE ?? "http://127.0.0.1:3000";

const SLUGS = [
  { slug: "luxe-salon-spa", tag: "hair" },
  { slug: "clarity-medspa-dublin", tag: "medspa" },
  { slug: "paws-parlour-dublin", tag: "pet" },
] as const;

async function gotoDetailsStep(
  page: import("@playwright/test").Page,
  request: import("@playwright/test").APIRequestContext,
  slug: string,
) {
  const slot = await findAvailablePublicSlot(request, slug);
  if (!slot) return false;

  await page.goto(`/b/${slug}`, { waitUntil: "domcontentloaded", timeout: 45_000 });
  await page.locator("[data-testid^='button-service-']").first().click();
  await page.getByTestId("input-date").fill(slot.date);
  // Slot ids may repeat when multiple providers share the same availability.
  const slotBtn = page.locator(`[data-testid='button-slot-${slot.startAt}']`).first();
  await expect(slotBtn).toBeVisible({ timeout: 20_000 });
  await slotBtn.click();
  await expect(page.getByTestId("input-first-name")).toBeVisible();
  return true;
}

test.describe("Public booking quality", () => {
  test.describe.configure({ mode: "serial", timeout: 300_000 });

  test.beforeAll(async ({ request }) => {
    await ensureDemoProvisioned(request);
  });

  for (const { slug, tag } of SLUGS) {
    test(`${tag} — loads without error copy`, async ({ page, request }) => {
      if (!(await demoHasBusiness(request, slug))) {
        test.skip(true, `${slug} not in demo world`);
      }
      await page.goto(`/b/${slug}`, { waitUntil: "domcontentloaded", timeout: 45_000 });
      await expect(page.getByTestId("text-business-name")).toBeVisible();
      const body = await page.locator("body").innerText();
      expect(body).not.toMatch(/internal server error|something went wrong/i);
    });

    test(`${tag} — axe on landing`, async ({ page, request }) => {
      if (!(await demoHasBusiness(request, slug))) test.skip(true, slug);
      await page.goto(`/b/${slug}`, { waitUntil: "domcontentloaded" });
      // Wait for app content to render (otherwise axe sees only the loading shell).
      await expect(page.getByTestId("text-business-name")).toBeVisible({ timeout: 45_000 });
      const results = await new AxeBuilder({ page })
        .disableRules(["color-contrast"])
        .analyze();
      expect(results.violations, JSON.stringify(results.violations, null, 2)).toEqual([]);
    });
  }

  test("medspa — consent step in progress", async ({ page, request }) => {
    const slug = "clarity-medspa-dublin";
    if (!(await demoHasBusiness(request, slug))) test.skip(true, slug);
    await page.goto(`/b/${slug}`, { waitUntil: "domcontentloaded" });
    await expect(page.getByTestId("ritual-step-consent")).toBeVisible();
  });

  test("pet — guard section title", async ({ page, request }) => {
    const slug = "paws-parlour-dublin";
    if (!(await demoHasBusiness(request, slug))) test.skip(true, slug);
    const ok = await gotoDetailsStep(page, request, slug);
    if (!ok) test.skip(true, "no slot in range");
    await expect(page.getByTestId("public-booking-guards")).toContainText(/about your pet/i);
  });

  test.describe("mobile sticky summary", () => {
    test.use({
      viewport: { width: 390, height: 844 },
      isMobile: true,
      hasTouch: true,
    });

    for (const { slug, tag } of SLUGS) {
      test(`${tag} — sticky CTA on details`, async ({ page, request }) => {
        if (!(await demoHasBusiness(request, slug))) test.skip(true, slug);
        const ok = await gotoDetailsStep(page, request, slug);
        if (!ok) test.skip(true, "no slot");
        await expect(page.getByTestId("public-booking-sticky-summary")).toBeVisible();
        await expect(page.getByTestId("button-sticky-continue")).toBeVisible();
        // Desktop-only confirm should stay hidden on mobile when sticky is active.
        await expect(page.getByTestId("button-continue-booking")).toBeHidden();
      });
    }

    test("medspa — sticky CTA on consent step", async ({ page, request }) => {
      const slug = "clarity-medspa-dublin";
      if (!(await demoHasBusiness(request, slug))) test.skip(true, slug);
      const ok = await gotoDetailsStep(page, request, slug);
      if (!ok) test.skip(true, "no slot");
      await page.getByTestId("input-first-name").fill("Jane");
      await page.getByTestId("input-email").fill("jane@example.com");
      await page.getByTestId("button-sticky-continue").click();
      await expect(page.getByTestId("select-medspa-procedure")).toBeVisible({ timeout: 15_000 });
      await expect(page.getByTestId("public-booking-sticky-summary")).toBeVisible();
      await expect(page.getByTestId("button-confirm-booking")).toBeHidden();
    });
  });
});
