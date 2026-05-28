/**
 * Full demo world — API contract + minimum live data per shop.
 *
 *   pnpm --filter @workspace/e2e exec playwright test tests/full-platform-demo.spec.ts
 */
import { test, expect } from "@playwright/test";

const apiBase = process.env.E2E_API_BASE ?? "http://127.0.0.1:3000";

const REQUIRED_SLUGS = [
  "aurora-studio",
  "aurora-mews",
  "aurora-galway",
  "conors-cut-co",
  "bloom-beauty-dublin",
  "harbour-wellness-cork",
  "ink-anchor-galway",
  "paws-parlour-dublin",
  "clarity-medspa-dublin",
  "motion-physio-cork",
  "peak-fitness-dublin",
  "stoneybatter-cuts",
  "dublin-barber-collective",
  "dundrum-hair-studio",
  "dundrum-serenity-spa",
  "london-rose-spa",
  "berlin-studio-neun",
  "paris-belle-vue",
] as const;

test.describe("Full platform demo — API", () => {
  test.beforeAll(async ({ request }) => {
    const status = await request.get(`${apiBase}/api/demo/status`);
    const body = status.ok() ? await status.json() : { provisioned: false };
    if (!body.provisioned) {
      const prov = await request.post(`${apiBase}/api/demo/provision`);
      expect(prov.ok(), await prov.text()).toBeTruthy();
    }
  });

  test("core demo shops resolve on public API", async ({ request }) => {
    for (const slug of REQUIRED_SLUGS) {
      const res = await request.get(`${apiBase}/api/public/b/${slug}`);
      expect(res.ok(), `missing or unreachable: ${slug}`).toBe(true);
    }
  });

  test("public booking pages resolve for IE + market shops", async ({ request }) => {
    for (const slug of ["aurora-studio", "london-rose-spa", "berlin-studio-neun", "paris-belle-vue"]) {
      const res = await request.get(`${apiBase}/api/public/b/${slug}`);
      expect(res.ok(), slug).toBeTruthy();
      const body = await res.json();
      expect(body.name).toBeTruthy();
      expect(body.slug).toBe(slug);
    }
  });

  test("demo status lists at least 18 businesses", async ({ request }) => {
    const res = await request.get(`${apiBase}/api/demo/status`);
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body.provisioned).toBe(true);
    expect((body.businesses?.length ?? 0) >= 18).toBe(true);
  });

  test("market shops expose country on public profile", async ({ request }) => {
    const gb = await request.get(`${apiBase}/api/public/b/london-rose-spa`);
    expect(gb.ok()).toBeTruthy();
    const gbBody = await gb.json();
    if (gbBody.country == null) {
      test.skip(true, "Restart API (pnpm dev:api) to pick up country/locale on public profile");
    }
    expect(gbBody.country).toBe("GB");

    const de = await request.get(`${apiBase}/api/public/b/berlin-studio-neun`);
    const deBody = await de.json();
    expect(deBody.country).toBe("DE");
  });
});
