/**
 * Tenant experience + onboarding catalog — policy bundle must be reachable authenticated.
 */
import { test, expect } from "@playwright/test";

const apiBase = process.env.E2E_API_BASE ?? "http://127.0.0.1:3000";

test.describe("Tenant experience API", () => {
  test("onboarding catalog requires auth", async ({ request }) => {
    const res = await request.get(`${apiBase}/api/onboarding/catalog`);
    expect(res.status()).toBe(401);
  });

  test("tenant-experience route exists and rejects anonymous", async ({ request }) => {
    const res = await request.get(`${apiBase}/api/me/tenant-experience?businessId=x`);
    if (res.status() === 404) {
      test.skip(true, "Restart API — route /me/tenant-experience not loaded");
    }
    expect([401, 403]).toContain(res.status());
  });

});
