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

  test("luxe-salon-spa — cart drawer lists items and checkout creates order", async ({
    page,
    request,
  }) => {
    const slug = "luxe-salon-spa";
    if (!(await demoHasBusiness(request, slug))) {
      test.skip(true, `${slug} not in demo world`);
    }

    const profile = await request.get(`${apiBase}/api/public/b/${slug}`);
    expect(profile.ok()).toBeTruthy();
    const biz = (await profile.json()) as {
      retailStore?: { products?: Array<{ id: string; name: string; priceMinor: number }> };
    };
    const products = biz.retailStore?.products ?? [];
    expect(products.length).toBeGreaterThan(0);
    const p1 = products[0]!;
    const p2 = products[1] ?? p1;

    await page.goto(`/b/${slug}`, { waitUntil: "domcontentloaded", timeout: 45_000 });
    await expect(page.getByTestId("public-beauty-shop")).toBeVisible({ timeout: 20_000 });

    await page.locator(`[data-testid='add-retail-${p1.id}']`).click();
    if (p2.id !== p1.id) {
      await page.locator(`[data-testid='add-retail-${p2.id}']`).click();
    }

    await expect(page.getByTestId("public-retail-cart-bar")).toBeVisible({ timeout: 10_000 });
    await page.getByTestId("public-retail-cart-view").click();

    const lines = page.getByTestId("public-retail-cart-lines");
    await expect(lines).toBeVisible();
    await expect(lines.getByText(p1.name, { exact: false })).toBeVisible();
    if (p2.id !== p1.id) {
      await expect(lines.getByText(p2.name, { exact: false })).toBeVisible();
    }

    const firstLine = page.locator(`[data-testid='public-cart-line-${p1.id}']`);
    await expect(firstLine).toBeVisible();
    await expect(firstLine.getByTestId("public-retail-product-thumb")).toHaveCount(1);

    await page.getByTestId("fulfillment-collect_in_store").click();

    await page.getByTestId("public-cart-retail-checkout").click();
    await page.waitForURL(new RegExp(`/shop/[a-f0-9]+`), { timeout: 30_000 });
    await expect(page.getByTestId("public-shop-page")).toBeVisible({ timeout: 20_000 });
    await expect(page.getByTestId("public-shop-lines")).toBeVisible();
    await expect(page.getByTestId("public-shop-sticky-cta").getByRole("button", { name: /^pay /i })).toBeVisible();

    const orderRes = await request.post(`${apiBase}/api/public/b/${slug}/retail/order`, {
      data: {
        items: [
          { productId: p1.id, quantity: 1 },
          ...(p2.id !== p1.id ? [{ productId: p2.id, quantity: 1 }] : []),
        ],
        fulfillmentMode: "collect_in_store",
      },
    });
    expect(orderRes.ok()).toBeTruthy();
    const order = (await orderRes.json()) as { payToken: string; orderId: string };
    expect(order.payToken).toBeTruthy();

    const shopView = await request.get(`${apiBase}/api/public/b/${slug}/shop/${order.payToken}`);
    expect(shopView.ok()).toBeTruthy();
    const shop = (await shopView.json()) as { checkoutAvailable: boolean; status: string };
    expect(shop.checkoutAvailable).toBe(true);

    const checkout = await request.post(
      `${apiBase}/api/public/b/${slug}/shop/${order.payToken}/checkout`,
    );
    expect(checkout.ok()).toBeTruthy();
    const checkoutBody = (await checkout.json()) as { mode?: string; checkoutUrl?: string };
    expect(["stripe", "dev"]).toContain(checkoutBody.mode ?? "");
  });
});
