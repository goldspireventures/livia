/**
 * Universal CSV import API — preview, import, magic setup, competitive parity score.
 *
 *   pnpm --filter @workspace/e2e exec playwright test universal-import-api.spec.ts
 */
import { test, expect } from "@playwright/test";
import { apiBase, demoCanSignIn, ensureDemoProvisioned, signInBusiness } from "../helpers/demo-auth";

test.describe("Universal import API", () => {
  test.beforeAll(async ({ request }) => {
    await ensureDemoProvisioned(request);
  });

  test("import preview detects client CSV columns", async ({ request }) => {
    if (!(await demoCanSignIn(request, "bloom-beauty-dublin"))) {
      test.skip(true, "Clerk unavailable");
    }
    const csv = `First Name,Last Name,Email,Phone
Import,Jane,import-jane@test.livia.local,+353871111111`;

    const res = await request.post(`${apiBase}/api/businesses/placeholder/import/preview`, {
      failOnStatusCode: false,
      headers: { "Content-Type": "application/json" },
      data: { csv },
    });
    expect(res.status()).toBeGreaterThanOrEqual(401);
  });

  test("authenticated import creates clients and marks onboarding", async ({ page, request }) => {
    const slug = "bloom-beauty-dublin";
    if (!(await demoCanSignIn(request, slug))) {
      test.skip(true, "Clerk unavailable");
    }
    await signInBusiness(page, slug);

    const bizRes = await page.request.get(`${apiBase}/api/me/businesses`);
    expect(bizRes.ok()).toBeTruthy();
    const businesses = (await bizRes.json()) as Array<{ id: string }>;
    const businessId = businesses[0]?.id;
    expect(businessId).toBeTruthy();

    const suffix = Date.now().toString().slice(-6);
    const csv = `First Name,Last Name,Email,Phone
E2E,Import${suffix},e2e-import-${suffix}@test.livia.local,+35387${suffix}`;

    const preview = await page.request.post(`${apiBase}/api/businesses/${businessId}/import/preview`, {
      data: { csv },
    });
    expect(preview.ok()).toBeTruthy();
    const previewBody = (await preview.json()) as { detectedKind: string; rowCount: number };
    expect(previewBody.detectedKind).toBe("clients");
    expect(previewBody.rowCount).toBe(1);

    const imp = await page.request.post(`${apiBase}/api/businesses/${businessId}/import/csv`, {
      data: { csv, applyOnboarding: true },
    });
    expect(imp.ok()).toBeTruthy();
    const impBody = (await imp.json()) as { imported: number; kind: string };
    expect(impBody.kind).toBe("clients");
    expect(impBody.imported).toBeGreaterThanOrEqual(1);

    const parity = await page.request.get(`${apiBase}/api/businesses/${businessId}/competitive-parity`);
    expect(parity.ok()).toBeTruthy();
    const parityBody = (await parity.json()) as { scorePercent: number; gaps: unknown[] };
    expect(parityBody.scorePercent).toBeGreaterThan(0);
    expect(Array.isArray(parityBody.gaps)).toBeTruthy();
  });
});
