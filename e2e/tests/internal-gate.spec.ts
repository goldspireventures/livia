import { test, expect } from "@playwright/test";

const secret = process.env.INTERNAL_OPS_SECRET ?? process.env.INTERNAL_CRON_SECRET ?? "";

test.describe("Livia Internal (v2)", () => {
  test.beforeEach(() => {
    test.skip(!secret, "Set INTERNAL_OPS_SECRET for internal portal tests");
  });

  test("internal shell loads on :5175", async ({ page }) => {
    let res;
    try {
      res = await page.goto("http://127.0.0.1:5175/", { timeout: 8_000 });
    } catch {
      test.skip(true, "Start internal console: pnpm dev:internal (:5175)");
    }
    if (res && !res.ok() && res.status() === 0) {
      test.skip(true, "Start internal console: pnpm dev:internal (:5175)");
    }
    await expect(page.locator("body")).toContainText(/livia internal|service token/i, {
      timeout: 15_000,
    });
  });

  test("platform health via API proxy", async ({ request }) => {
    const res = await request.get("http://127.0.0.1:3000/api/internal/ops/platform-health", {
      headers: { "X-Internal-Ops-Secret": secret },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.tenantCount).toBeGreaterThanOrEqual(0);
    expect(body.service).toBe("livia-api");
    expect(body.v3).toBeTruthy();
  });

  test("continuity traces endpoint", async ({ request }) => {
    const res = await request.get("http://127.0.0.1:3000/api/internal/ops/continuity-traces", {
      headers: { "X-Internal-Ops-Secret": secret },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body.data)).toBe(true);
  });

  test("monitoring overview", async ({ request }) => {
    const res = await request.get("http://127.0.0.1:3000/api/internal/ops/monitoring/overview", {
      headers: {
        "X-Internal-Ops-Secret": secret,
        "X-Internal-Ops-Operator": "e2e@livia.io",
        "X-Internal-Ops-Role": "engineer",
      },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.alerts).toBeTruthy();
  });

  test("tenant search", async ({ request }) => {
    const res = await request.get("http://127.0.0.1:3000/api/internal/ops/tenants?limit=5", {
      headers: { "X-Internal-Ops-Secret": secret },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.total).toBeGreaterThan(0);
  });
});
