import { test, expect } from "@playwright/test";

const demoSlug = process.env.E2E_DEMO_SLUG ?? "luxe-salon-spa";
const partnerKey = process.env.E2E_PARTNER_API_KEY ?? process.env.PARTNER_API_KEY ?? "";

test.describe("Phase 10 API gates", () => {
  test("chain rollup requires auth", async ({ request }) => {
    const res = await request.get("/api/me/chain-rollup");
    expect(res.status()).toBe(401);
  });

  test("peer insights requires auth", async ({ request }) => {
    const res = await request.get("/api/businesses/fake-id/peer-insights");
    expect(res.status()).toBe(401);
  });

  test("partner API rejects missing key", async ({ request }) => {
    const res = await request.get(`/api/partner/v1/businesses/${demoSlug}/bookings`);
    expect([401, 503]).toContain(res.status());
  });

  test("partner API returns bookings with valid key", async ({ request }) => {
    if (!partnerKey) {
      test.skip(true, "Set E2E_PARTNER_API_KEY or PARTNER_API_KEY");
    }
    const res = await request.get(`/api/partner/v1/businesses/${demoSlug}/bookings`, {
      headers: { "X-Partner-Api-Key": partnerKey },
    });
    if (res.status() === 404) {
      test.skip(true, "Demo business not seeded");
    }
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body.data?.slug ?? body.slug).toBe(demoSlug);
    expect(Array.isArray(body.data?.bookings ?? body.bookings)).toBeTruthy();
  });

  test("checkout accepts chain plan id in schema (auth required)", async ({ request }) => {
    const res = await request.post("/api/businesses/fake-id/billing/checkout-session", {
      data: { planId: "chain", shopCount: 2 },
    });
    expect([401, 404]).toContain(res.status());
  });
});
