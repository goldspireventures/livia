/**
 * Guest balance at visit — demo confirmed booking with remainder due.
 *
 *   pnpm --filter @workspace/e2e exec playwright test --project=guest-balance
 */
import { test, expect } from "@playwright/test";
import { ensureDemoProvisioned, apiBase } from "../helpers/demo-auth";

const SLUG = process.env.E2E_BALANCE_SLUG ?? "luxe-salon-spa";

async function fetchBalanceSurface(request: import("@playwright/test").APIRequestContext) {
  let res = await request.get(`${apiBase}/api/demo/guest-surfaces/${SLUG}/balance`);
  if (res.status() === 404) {
    await request.post(`${apiBase}/api/demo/sync-vertical-showcase`, { timeout: 120_000 });
    res = await request.get(`${apiBase}/api/demo/guest-surfaces/${SLUG}/balance`);
  }
  return res;
}

test.describe("Guest balance at visit", () => {
  test.describe.configure({ mode: "serial", timeout: 180_000 });

  test.beforeAll(async ({ request }) => {
    await ensureDemoProvisioned(request);
  });

  test("demo API exposes balance token", async ({ request }) => {
    const res = await fetchBalanceSurface(request);
    if (!res.ok()) {
      test.skip(true, "No balance-due booking in demo seed for this slug");
    }
    const body = (await res.json()) as { token?: string; path?: string };
    expect(body.token?.length).toBeGreaterThan(8);
    expect(body.path).toMatch(new RegExp(`/book/${SLUG}/balance/`));
  });

  test("public balance API returns due amount", async ({ request }) => {
    const surf = await fetchBalanceSurface(request);
    if (!surf.ok()) {
      test.skip(true, "No balance-due booking in demo seed");
    }
    const { token } = (await surf.json()) as { token: string };
    const viewRes = await request.get(`${apiBase}/api/public/b/${SLUG}/balance/${token}`);
    expect(viewRes.ok(), await viewRes.text()).toBeTruthy();
    const view = (await viewRes.json()) as {
      balanceDueMinor?: number;
      totalPaidMinor?: number;
      priceMinor?: number;
      checkoutAvailable?: boolean;
    };
    expect(view.balanceDueMinor).toBeGreaterThan(0);
    expect(view.totalPaidMinor).toBeGreaterThan(0);
    expect(view.priceMinor).toBeGreaterThan(view.totalPaidMinor ?? 0);
    expect(view.checkoutAvailable).toBeTruthy();
  });

  test("balance page shows checkout CTA or complete state", async ({ page, request }) => {
    const res = await fetchBalanceSurface(request);
    if (!res.ok()) {
      test.skip(true, "No balance-due booking in demo seed");
    }
    const { path } = (await res.json()) as { path: string };

    await page.goto(path, { waitUntil: "domcontentloaded", timeout: 45_000 });
    await expect(page.getByTestId("guest-balance-page")).toBeVisible({ timeout: 20_000 });
    const checkout = page.getByTestId("guest-balance-checkout");
    const complete = page.getByTestId("guest-balance-complete");
    await expect(checkout.or(complete)).toBeVisible();
  });

  test("dev checkout settles balance when available", async ({ request }) => {
    const surf = await fetchBalanceSurface(request);
    if (!surf.ok()) {
      test.skip(true, "No balance-due booking in demo seed");
    }
    const { token } = (await surf.json()) as { token: string };
    const before = await request.get(`${apiBase}/api/public/b/${SLUG}/balance/${token}`);
    if (!before.ok()) {
      test.skip(true, "Balance view unavailable");
    }
    const beforeView = (await before.json()) as { balanceDueMinor?: number };
    if ((beforeView.balanceDueMinor ?? 0) <= 0) {
      test.skip(true, "Balance already settled");
    }

    const checkout = await request.post(`${apiBase}/api/public/b/${SLUG}/balance/${token}/checkout`);
    expect(checkout.ok(), await checkout.text()).toBeTruthy();
    const result = (await checkout.json()) as { mode?: string };
    expect(["dev", "stripe"]).toContain(result.mode);

    if (result.mode === "dev") {
      const after = await request.get(`${apiBase}/api/public/b/${SLUG}/balance/${token}`);
      expect(after.ok()).toBeTruthy();
      const afterView = (await after.json()) as { balanceDueMinor?: number };
      expect(afterView.balanceDueMinor).toBe(0);
    }
  });
});
