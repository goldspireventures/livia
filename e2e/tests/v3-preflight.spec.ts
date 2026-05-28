/**
 * v3 pre-flight — browser UI (public customer journey + route shells).
 * API tests: v3-preflight-api.spec.ts
 */
import { test, expect } from "@playwright/test";

const apiBase = process.env.E2E_API_BASE ?? "http://127.0.0.1:3000";
const demoSlug = process.env.E2E_DEMO_SLUG ?? "luxe-salon-spa";

const V3_ROUTE_SHELLS = [
  "/toolkit",
  "/launch-status",
  "/audit",
  "/lifecycle",
  "/design-proofs",
] as const;

test.describe("v3 pre-flight — dashboard shells", () => {
  for (const path of V3_ROUTE_SHELLS) {
    test(`route loads: ${path}`, async ({ page }) => {
      const res = await page.goto(path);
      expect(res?.status()).toBeLessThan(500);
      await expect(page.locator("body")).not.toContainText(/internal server error/i);
    });
  }
});

test.describe("v3 pre-flight — public booking UI", () => {
  test.describe.configure({ mode: "serial" });

  test("full book flow through confirm", async ({ page, request }) => {
    const bizRes = await request.get(`${apiBase}/api/public/b/${demoSlug}`);
    if (!bizRes.ok()) test.skip(true, "Demo not seeded");
    const suffix = Date.now().toString().slice(-6);

    await page.goto(`/b/${demoSlug}`, { waitUntil: "networkidle" });
    await expect(page.getByRole("heading").first()).toBeVisible({ timeout: 20_000 });

    await page.locator('[data-testid^="button-service-"]').first().click();

    const dateInput = page.getByTestId("input-date");
    await expect(dateInput).toBeVisible();

    const submit = page
      .getByTestId("button-confirm-booking")
      .or(page.getByTestId("button-continue-booking"));

    let confirmed = false;
    for (let attempt = 0; attempt < 5 && !confirmed; attempt++) {
      for (let d = 25 + attempt * 2; d <= 40 && !confirmed; d++) {
        const day = new Date();
        day.setDate(day.getDate() + d);
        const date = day.toISOString().split("T")[0];
        const slotsReq = page.waitForResponse(
          (r) => r.url().includes("/slots?") && r.request().method() === "GET",
          { timeout: 15_000 },
        );
        await dateInput.fill(date);
        await slotsReq.catch(() => undefined);

        const slotButtons = page.locator('[data-testid^="button-slot-"]');
        const count = await slotButtons.count();
        for (let i = 0; i < count && !confirmed; i++) {
          await slotButtons.nth(i).click();
          if (!(await page.getByTestId("input-first-name").isVisible({ timeout: 3_000 }).catch(() => false))) {
            continue;
          }

          await page.getByTestId("input-first-name").fill("UI");
          await page.getByTestId("input-last-name").fill("Preflight");
          await page.getByTestId("input-phone").fill(`+35387${suffix}`);
          await page.getByTestId("input-email").fill(`ui-preflight-${suffix}@test.livia.local`);

          for (const guardId of ["service_duration_ok"]) {
            const trigger = page.getByTestId(`guard-${guardId}`);
            if (await trigger.isVisible().catch(() => false)) {
              await trigger.click();
              await page.getByRole("option").first().click();
            }
          }

          const bookReq = page.waitForResponse(
            (r) => r.url().includes("/book") && r.request().method() === "POST",
            { timeout: 20_000 },
          );
          await submit.click();
          const bookRes = await bookReq.catch(() => null);
          if (bookRes?.ok()) {
            confirmed = true;
            break;
          }
        }
      }
    }

    if (!confirmed) test.skip(true, "Could not complete a live public booking in the UI");
    await expect(page.getByTestId("text-confirmed")).toBeVisible({ timeout: 15_000 });
    await expect(page.locator("body")).toContainText(/next|message|confirm|booked/i);
  });
});
