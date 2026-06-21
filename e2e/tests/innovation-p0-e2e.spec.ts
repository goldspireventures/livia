/**
 * GTM Wave 1 — Innovation P0 full E2E (API + guest web + owner surfaces).
 *
 *   pnpm test:e2e:innovation-p0
 *   pnpm smoke:innovation-p0
 */
import { test, expect } from "@playwright/test";
import { VERTICAL_DEMO_SHOPS } from "../fixtures/vertical-shops";
import {
  apiBase,
  assertHealthyPage,
  demoCanSignIn,
  demoHasBusiness,
  dismissPlatformTour,
  ensureDemoProvisioned,
  signInBusiness,
} from "../helpers/demo-auth";
import {
  DEMO_GUEST_PHONE,
  guestHubMe,
  guestHubToken,
  guestShopRelationship,
} from "../helpers/guest-hub-auth";

const SHOWCASE_SLUGS = VERTICAL_DEMO_SHOPS.map((s) => s.slug);

const VERTICAL_ARTIFACT_EXPECT: Record<
  string,
  (artifacts: Record<string, unknown> | undefined) => boolean
> = {
  hair: (a) => Boolean(a?.preferredStylist) || Boolean(a?.carePlan),
  beauty: (a) => Boolean(a?.beautyMemory),
  wellness: (a) => Array.isArray(a?.wellnessPrep) && (a.wellnessPrep as unknown[]).length > 0,
  "body-art": (a) => Array.isArray(a?.proofs) && (a.proofs as unknown[]).length > 0,
  medspa: (a) => Array.isArray(a?.consentItems),
  "allied-health": (a) => Boolean(a?.carePlan),
  fitness: (a) => Boolean(a?.fitnessStatus),
  "pet-grooming": (a) => Array.isArray(a?.pets) && (a.pets as unknown[]).length > 0,
  "automotive-detailing": (a) => typeof a?.vehicleHighlight === "string" && a.vehicleHighlight.length > 3,
  "event-vendors": (a) =>
    Array.isArray(a?.consentItems) ||
    Boolean(a?.carePlan) ||
    Boolean(a?.preferredStylist),
};

test.describe("Innovation P0 — cross-platform", () => {
  test.describe.configure({ mode: "serial", timeout: 300_000 });

  test.beforeAll(async ({ request }) => {
    await ensureDemoProvisioned(request);
  });

  test("Mary vault links all 9 showcase shops", async ({ request }) => {
    const hubToken = await guestHubToken(request);
    const view = await guestHubMe(request, hubToken);
    const slugs = new Set(view.shops.map((s) => s.slug));
    for (const slug of SHOWCASE_SLUGS) {
      expect(slugs.has(slug), `${slug} missing — pnpm demo:provision`).toBeTruthy();
    }
  });

  test("hub bookUrl is not legacy /b/ path", async ({ request }) => {
    const hubToken = await guestHubToken(request);
    const view = await guestHubMe(request, hubToken);
    for (const shop of view.shops) {
      expect(shop.bookUrl, shop.slug).not.toMatch(/^\/b\//);
      expect(shop.shopRelationshipUrl).toMatch(new RegExp(`/my/${shop.slug}`));
    }
  });

  test("upcoming visitUrl uses /my/ relationship shell", async ({ request }) => {
    const hubToken = await guestHubToken(request);
    const view = await guestHubMe(request, hubToken);
    if (view.upcomingBookings.length === 0) {
      test.skip(true, "No upcoming bookings for Mary — re-run demo:provision");
    }
    for (const b of view.upcomingBookings) {
      expect(b.visitUrl).toMatch(new RegExp(`/my/${b.slug}/visit/`));
    }
  });

  test("legacy /b/ book redirects to /book/", async ({ page, request }) => {
    const slug = "bloom-beauty-dublin";
    if (!(await demoHasBusiness(request, slug))) test.skip(true, `${slug} missing`);
    await page.goto(`/b/${slug}`, { waitUntil: "domcontentloaded", timeout: 45_000 });
    await page.waitForFunction(
      () => window.location.pathname.startsWith("/book/"),
      { timeout: 15_000 },
    );
    expect(page.url()).toContain(`/book/${slug}`);
  });
});

test.describe("Innovation P0 — vertical memory on /my", () => {
  test.describe.configure({ mode: "serial", timeout: 300_000 });

  test.beforeAll(async ({ request }) => {
    await ensureDemoProvisioned(request);
  });

  for (const shop of VERTICAL_DEMO_SHOPS) {
    test(`${shop.vertical} (${shop.slug}) — guest shop artifacts`, async ({ request }) => {
      if (!(await demoHasBusiness(request, shop.slug))) {
        test.skip(true, `${shop.slug} missing`);
      }
      const hubToken = await guestHubToken(request);
      const rel = await guestShopRelationship(request, hubToken, shop.slug);
      const check = VERTICAL_ARTIFACT_EXPECT[shop.vertical];
      expect(check, `no artifact rule for ${shop.vertical}`).toBeTruthy();
      const artifacts = rel.verticalArtifacts as Record<string, unknown> | undefined;
      const ok =
        check!(artifacts) ||
        Boolean(rel.relationship?.memoryHighlight) ||
        (rel.packageCredits?.length ?? 0) > 0 ||
        (rel.upcomingBookings?.length ?? 0) > 0;
      expect(ok, `${shop.slug} missing vertical P0 artifact`).toBeTruthy();
    });
  }
});

test.describe("Innovation P0 — guest token surfaces", () => {
  test.describe.configure({ mode: "serial", timeout: 180_000 });

  test.beforeAll(async ({ request }) => {
    await ensureDemoProvisioned(request);
  });

  test("body-art proof token uses /book/ path", async ({ request }) => {
    const slug = "ink-anchor-galway";
    const res = await request.get(`${apiBase}/api/demo/guest-surfaces/${slug}/proof`);
    if (!res.ok()) {
      await request.post(`${apiBase}/api/demo/sync-vertical-showcase`, { timeout: 120_000 });
    }
    const retry = await request.get(`${apiBase}/api/demo/guest-surfaces/${slug}/proof`);
    expect(retry.ok(), await retry.text()).toBeTruthy();
    const body = (await retry.json()) as { path?: string; token?: string };
    expect(body.path).toMatch(new RegExp(`/book/${slug}/proof/`));
    expect(body.token?.length).toBeGreaterThan(8);
  });

  test("medspa intake token", async ({ request }) => {
    const slug = "clarity-medspa-dublin";
    const res = await request.get(`${apiBase}/api/demo/guest-surfaces/${slug}/intake`);
    expect(res.ok(), await res.text()).toBeTruthy();
    const body = (await res.json()) as { path?: string };
    expect(body.path).toMatch(/\/book\/.+\/intake\//);
  });

  test("fitness class catalog API", async ({ request }) => {
    const slug = "peak-fitness-dublin";
    const res = await request.get(`${apiBase}/api/public/b/${slug}/classes`);
    expect(res.ok()).toBeTruthy();
    const body = (await res.json()) as { classes?: unknown[] };
    expect(Array.isArray(body.classes)).toBeTruthy();
    expect(body.classes!.length, "run demo:provision for fitness classes").toBeGreaterThan(0);
  });

  test("fitness waitlist demo token", async ({ request }) => {
    const slug = "peak-fitness-dublin";
    let res = await request.get(`${apiBase}/api/demo/guest-surfaces/${slug}/waitlist`);
    if (!res.ok()) {
      await request.post(`${apiBase}/api/demo/sync-vertical-showcase`, { timeout: 120_000 });
      res = await request.get(`${apiBase}/api/demo/guest-surfaces/${slug}/waitlist`);
    }
    expect(res.ok(), await res.text()).toBeTruthy();
  });

  test("pet guest-context returns saved pets for Mary", async ({ request }) => {
    const slug = "paws-parlour-dublin";
    const phone = encodeURIComponent(DEMO_GUEST_PHONE);
    const res = await request.get(`${apiBase}/api/public/b/${slug}/guest-context?phone=${phone}`);
    expect(res.ok()).toBeTruthy();
    const body = (await res.json()) as { recognized?: boolean; pets?: unknown[] };
    expect(body.recognized).toBe(true);
    expect((body.pets?.length ?? 0) > 0).toBeTruthy();
  });

  test("hair guest-context recognizes Mary", async ({ request }) => {
    const slug = "luxe-salon-spa";
    const phone = encodeURIComponent(DEMO_GUEST_PHONE);
    const res = await request.get(`${apiBase}/api/public/b/${slug}/guest-context?phone=${phone}`);
    expect(res.ok()).toBeTruthy();
    const body = (await res.json()) as { recognized?: boolean };
    expect(body.recognized).toBe(true);
  });
});

test.describe("Innovation P0 — guest web surfaces", () => {
  test.describe.configure({ mode: "serial", timeout: 300_000 });

  test.beforeAll(async ({ request }) => {
    await ensureDemoProvisioned(request);
  });

  test("proof page approve/reject", async ({ page, request }) => {
    const slug = "ink-anchor-galway";
    const res = await request.get(`${apiBase}/api/demo/guest-surfaces/${slug}/proof`);
    expect(res.ok()).toBeTruthy();
    const { path } = (await res.json()) as { path: string };
    await page.goto(path, { waitUntil: "domcontentloaded", timeout: 45_000 });
    await expect(page.getByTestId("guest-proof-page")).toBeVisible({ timeout: 20_000 });
    await expect(page.getByTestId("guest-proof-approve")).toBeVisible();
  });

  test("fitness public book shows class grid", async ({ page, request }) => {
    const slug = "peak-fitness-dublin";
    if (!(await demoHasBusiness(request, slug))) test.skip(true, slug);
    await page.goto(`/book/${slug}`, { waitUntil: "domcontentloaded", timeout: 45_000 });
    await assertHealthyPage(page, `/book/${slug}`);
    await expect(page.getByTestId("public-fitness-classes")).toBeVisible({ timeout: 20_000 });
  });

  test("wellness public book exposes couples booking guard", async ({ request }) => {
    const slug = "harbour-wellness-cork";
    if (!(await demoHasBusiness(request, slug))) test.skip(true, slug);
    const res = await request.get(`${apiBase}/api/public/b/${slug}`);
    expect(res.ok()).toBeTruthy();
    const body = (await res.json()) as { bookingGuards?: Array<{ id: string }> };
    const ids = (body.bookingGuards ?? []).map((g) => g.id);
    expect(ids).toContain("couples_or_shared");
  });

  test("Mary visit manage loads deposit line when present", async ({ page, request }) => {
    const hubToken = await guestHubToken(request);
    const view = await guestHubMe(request, hubToken);
    const upcoming = view.upcomingBookings[0];
    if (!upcoming) test.skip(true, "no upcoming visit");
    await page.goto("/my", { waitUntil: "domcontentloaded" });
    await page.evaluate((t) => localStorage.setItem("livia_guest_hub_token", t), hubToken);
    await page.goto(upcoming.visitUrl, { waitUntil: "domcontentloaded", timeout: 45_000 });
    await expect(page.getByTestId("guest-hub-visit-manage")).toBeVisible({ timeout: 20_000 });
    await expect(page.getByTestId("guest-hub-visit-hero")).toBeVisible();
  });
});

test.describe("Innovation P0 — owner operator surfaces", () => {
  test.describe.configure({ mode: "serial", timeout: 300_000 });

  test.beforeAll(async ({ request }) => {
    await ensureDemoProvisioned(request);
  });

  const ownerCases: Array<{
    slug: string;
    vertical: string;
    testId: string;
    route?: string;
  }> = [
    { slug: "luxe-salon-spa", vertical: "hair", testId: "hair-colour-day-card" },
    { slug: "harbour-wellness-cork", vertical: "wellness", testId: "owner-dashboard-greeting" },
    { slug: "shine-studio-belfast", vertical: "automotive-detailing", testId: "owner-dashboard-greeting" },
    { slug: "ink-anchor-galway", vertical: "body-art", testId: "design-proofs-queue", route: "/design-proofs" },
    { slug: "clarity-medspa-dublin", vertical: "medspa", testId: "medspa-hub-page", route: "/medspa" },
  ];

  for (const c of ownerCases) {
    test(`${c.vertical} — ${c.testId}`, async ({ page, request }) => {
      if (!(await demoHasBusiness(request, c.slug))) test.skip(true, c.slug);
      if (!(await demoCanSignIn(request, c.slug))) {
        test.skip(true, "Clerk sign-in unavailable");
      }
      await signInBusiness(page, c.slug);
      await page.goto(c.route ?? "/dashboard", { waitUntil: "domcontentloaded", timeout: 45_000 });
      await dismissPlatformTour(page);
      await expect(page.getByTestId(c.testId)).toBeVisible({ timeout: 25_000 });
    });
  }
});
