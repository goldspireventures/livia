import { test, expect } from "@playwright/test";

const demoSlug = process.env.E2E_DEMO_SLUG ?? "luxe-salon-spa";
const partnerKey = process.env.E2E_PARTNER_API_KEY ?? process.env.PARTNER_API_KEY ?? "";

test.describe("Integrations platform API", () => {
  test("integrations config requires auth", async ({ request }) => {
    const res = await request.get("/api/businesses/fake-id/integrations");
    expect(res.status()).toBe(401);
  });

  test("partner business endpoint requires key", async ({ request }) => {
    const res = await request.get(`/api/partner/v1/businesses/${demoSlug}`);
    expect([401, 503]).toContain(res.status());
  });

  test("partner read plane with key", async ({ request }) => {
    if (!partnerKey) {
      test.skip(true, "Set PARTNER_API_KEY for partner plane tests");
    }

    const headers = { "X-Partner-Api-Key": partnerKey };

    const biz = await request.get(`/api/partner/v1/businesses/${demoSlug}`, { headers });
    if (biz.status() === 404) {
      test.skip(true, "Demo business not seeded");
    }
    expect(biz.ok()).toBeTruthy();
    const bizBody = await biz.json();
    expect(bizBody.data?.slug).toBe(demoSlug);

    const services = await request.get(`/api/partner/v1/businesses/${demoSlug}/services`, {
      headers,
    });
    expect(services.ok()).toBeTruthy();
    const svcBody = await services.json();
    expect(Array.isArray(svcBody.data?.services)).toBeTruthy();

    const bookings = await request.get(
      `/api/partner/v1/businesses/${demoSlug}/bookings?from=2026-01-01&to=2027-01-01`,
      { headers },
    );
    expect(bookings.ok()).toBeTruthy();
    const bookBody = await bookings.json();
    expect(Array.isArray(bookBody.data?.bookings)).toBeTruthy();

    const customers = await request.get(`/api/partner/v1/businesses/${demoSlug}/customers`, {
      headers,
    });
    expect(customers.ok()).toBeTruthy();
    const custBody = await customers.json();
    const first = custBody.data?.customers?.[0];
    if (first) {
      expect(first.email).toBeUndefined();
      expect(first.phone).toBeUndefined();
    }
  });
});
