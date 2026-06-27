/**
 * PLS Wave 6 — Pack H: guest depth (book wizard, tokens, visit, event vendor, /my OTP).
 *
 *   pnpm pls:wave6
 */
import { test, expect } from "@playwright/test";
import { PlsCaptureRun, mergeManifest, plsOutRoot, slugifyRoute } from "../helpers/pls-capture";
import {
  BOOK_WIZARD_SLUGS,
  GUEST_TOKEN_MATRIX,
  advancePublicBookingToDetails,
  bookVisitTokenPath,
  resolveGuestSurfacePath,
  tryGuestHubOtpSignIn,
} from "../helpers/pls-depth-helpers";
import { ensureDemoProvisioned, demoHasBusiness } from "../helpers/demo-auth";

const apiBase = process.env.E2E_API_BASE ?? "http://127.0.0.1:3000";
const { date: runDate, dir: OUT_ROOT } = plsOutRoot(6);
let run: PlsCaptureRun;

const EVENT_SLUG = "atelier-decor-dublin";
const EVENT_SUBPAGES = ["/enquire", "/gallery", "/services", "/about"] as const;

test.describe("PLS Wave 6 — guest depth (Pack H)", () => {
  test.describe.configure({ mode: "serial", timeout: 1_200_000 });

  test.beforeAll(async ({ request }) => {
    await ensureDemoProvisioned(request);
    run = new PlsCaptureRun(6, OUT_ROOT, runDate);
    await request.post(`${apiBase}/api/demo/sync-vertical-showcase`, { timeout: 120_000 }).catch(() => undefined);
  });

  test.afterAll(() => {
    run.flush();
    mergeManifest(6, runDate);
  });

  test("H — book landings (all wizard slugs)", async ({ page, request }) => {
    let landings = 0;
    for (const slug of BOOK_WIZARD_SLUGS) {
      if (!(await demoHasBusiness(request, slug))) continue;
      await page.goto(`/b/${slug}`, { waitUntil: "domcontentloaded", timeout: 45_000 });
      await run.capture(page, {
        scenarioId: `H-book-landing-${slug}`,
        persona: "guest",
        surface: "public-book",
        route: `/b/${slug}`,
      });
      landings++;
    }
    expect(landings, "book landing captures").toBeGreaterThanOrEqual(4);
  });

  test("H — book wizard depth (details + confirm)", async ({ page, request }) => {
    test.slow();
    const depthSlugs = ["luxe-salon-spa", "bloom-beauty-dublin", "paws-parlour-dublin"] as const;
    let depth = 0;
    for (const slug of depthSlugs) {
      if (!(await demoHasBusiness(request, slug))) continue;

      const detailsOk = await advancePublicBookingToDetails(page, request, slug);
      if (!detailsOk) continue;

      await run.capture(page, {
        scenarioId: `H-book-details-${slug}`,
        persona: "guest",
        surface: "public-book",
        route: `/b/${slug}#details`,
      });
      depth++;

      const suffix = Date.now().toString(36);
      await page.getByTestId("input-first-name").fill("PLS");
      await page.getByTestId("input-last-name").fill("Guest");
      await page.getByTestId("input-email").fill(`pls-book-${suffix}@test.livia.local`);
      const sticky = page.getByTestId("button-sticky-continue");
      const desktop = page.getByTestId("button-continue-booking");
      if (await sticky.isVisible().catch(() => false)) await sticky.click();
      else if (await desktop.isVisible().catch(() => false)) await desktop.click();

      const confirm = page.getByTestId("button-confirm-booking");
      if (await confirm.isVisible().catch(() => false)) {
        await confirm.click();
        await page.waitForTimeout(1200);
        if (await page.getByTestId("public-booking-success").isVisible().catch(() => false)) {
          await run.capture(page, {
            scenarioId: `H-book-confirmed-${slug}`,
            persona: "guest",
            surface: "public-book",
            route: `/b/${slug}#confirmed`,
          });
          depth++;
        }
      }
    }
    if (depth === 0) {
      console.warn("[PLS H] Desktop wizard depth unavailable — mobile sub-test covers sticky flow.");
    }
  });

  test.describe("H — mobile wizard depth", () => {
    test.use({
      viewport: { width: 390, height: 844 },
      isMobile: true,
      hasTouch: true,
    });

    test("sticky flow on luxe", async ({ page, request }) => {
      const slug = "luxe-salon-spa";
      if (!(await demoHasBusiness(request, slug))) test.skip(true, slug);
      const ok = await advancePublicBookingToDetails(page, request, slug);
      if (!ok) test.skip(true, "no slot on mobile");
      await run.capture(page, {
        scenarioId: "H-book-mobile-details-luxe",
        persona: "guest",
        surface: "public-book",
        route: `/b/${slug}#mobile-details`,
      });
    });
  });

  test("H — guest token surfaces", async ({ page, request }) => {
    let captured = 0;
    for (const { kind, slug } of GUEST_TOKEN_MATRIX) {
      const path = await resolveGuestSurfacePath(request, slug, kind);
      if (!path) continue;
      await page.goto(path, { waitUntil: "domcontentloaded", timeout: 45_000 });
      await run.capture(page, {
        scenarioId: `H-token-${kind}-${slug}`,
        persona: "guest",
        surface: `guest-${kind}`,
        route: path,
      });
      captured++;
    }
    expect(captured, "guest token pages").toBeGreaterThanOrEqual(4);
  });

  test("H — visit token pages", async ({ page, request }) => {
    const slugs = ["luxe-salon-spa", "bloom-beauty-dublin", "harbour-wellness-cork"];
    let captured = 0;
    for (let i = 0; i < slugs.length; i++) {
      const slug = slugs[i]!;
      if (!(await demoHasBusiness(request, slug))) continue;
      const visitPath = await bookVisitTokenPath(request, slug, i);
      if (!visitPath) continue;
      await page.goto(visitPath, { waitUntil: "domcontentloaded", timeout: 45_000 });
      await run.capture(page, {
        scenarioId: `H-visit-${slug}`,
        persona: "guest",
        surface: "guest-visit",
        route: visitPath,
      });
      captured++;
    }
    expect(captured).toBeGreaterThanOrEqual(1);
  });

  test("H — event vendor subpages + quote", async ({ page, request }) => {
    if (!(await demoHasBusiness(request, EVENT_SLUG))) {
      test.skip(true, "event vendor demo missing");
    }
    await page.goto(`/e/${EVENT_SLUG}`, { waitUntil: "domcontentloaded", timeout: 45_000 });
    await run.capture(page, {
      scenarioId: "H-event-site-home",
      persona: "guest",
      surface: "public-event-vendor",
      route: `/e/${EVENT_SLUG}`,
    });
    for (const sub of EVENT_SUBPAGES) {
      await page.goto(`/e/${EVENT_SLUG}${sub}`, { waitUntil: "domcontentloaded", timeout: 45_000 });
      await run.capture(page, {
        scenarioId: `H-event-${slugifyRoute(sub)}`,
        persona: "guest",
        surface: "public-event-vendor",
        route: `/e/${EVENT_SLUG}${sub}`,
      });
    }
    const quotePath = await resolveGuestSurfacePath(request, EVENT_SLUG, "quote");
    if (quotePath) {
      await page.goto(quotePath, { waitUntil: "domcontentloaded", timeout: 45_000 });
      await run.capture(page, {
        scenarioId: "H-event-quote-token",
        persona: "guest",
        surface: "guest-quote",
        route: quotePath,
      });
    }
  });

  test("H — guest retail cart on /b", async ({ page, request }) => {
    const slug = "luxe-salon-spa";
    if (!(await demoHasBusiness(request, slug))) test.skip(true, slug);
    await page.goto(`/b/${slug}`, { waitUntil: "domcontentloaded", timeout: 45_000 });
    const shop = page.getByTestId("public-beauty-shop");
    if (await shop.isVisible().catch(() => false)) {
      const addBtn = page.locator("[data-testid^='add-retail-']").first();
      if (await addBtn.isVisible().catch(() => false)) {
        await addBtn.click();
        await page.waitForTimeout(400);
      }
      await run.capture(page, {
        scenarioId: "H-retail-cart-luxe",
        persona: "guest",
        surface: "public-book",
        route: `/b/${slug}#retail-cart`,
      });
    }
  });

  test("H — public premises /p", async ({ page, request }) => {
    const slug = "dundrum-house";
    const res = await request.get(`${apiBase}/api/public/p/${slug}`);
    if (!res.ok()) {
      await page.goto("/p/dundrum-house", { waitUntil: "domcontentloaded" });
    } else {
      await page.goto(`/p/${slug}`, { waitUntil: "domcontentloaded", timeout: 45_000 });
    }
    await run.capture(page, {
      scenarioId: "H-public-premises",
      persona: "guest",
      surface: "public-premises",
      route: `/p/${slug}`,
    });
  });

  test("H — /my OTP success + account", async ({ page }) => {
    const signedIn = await tryGuestHubOtpSignIn(page);
    if (signedIn) {
      await run.capture(page, {
        scenarioId: "H-my-vault-home",
        persona: "guest",
        surface: "guest-hub",
        route: "/my#signed-in",
      });
      await page.goto("/my/account", { waitUntil: "domcontentloaded", timeout: 45_000 });
      await run.capture(page, {
        scenarioId: "H-my-account",
        persona: "guest",
        surface: "guest-hub",
        route: "/my/account",
      });
    } else {
      await page.goto("/my", { waitUntil: "domcontentloaded" });
      await run.capture(page, {
        scenarioId: "H-my-otp-unavailable",
        persona: "guest",
        surface: "guest-hub",
        route: "/my#otp-blocked",
      });
    }
  });

  test("H — Liv chat disclosure on public book", async ({ page, request }) => {
    const slug = "bloom-beauty-dublin";
    if (!(await demoHasBusiness(request, slug))) test.skip(true, slug);
    await page.goto(`/b/${slug}`, { waitUntil: "domcontentloaded", timeout: 45_000 });
    const livFab = page.getByTestId("public-liv-chat-fab").first();
    if (await livFab.isVisible().catch(() => false)) {
      await livFab.click();
      await page.waitForTimeout(800);
      await run.capture(page, {
        scenarioId: "H-public-liv-chat-open",
        persona: "guest",
        surface: "public-book",
        route: `/b/${slug}#liv-chat`,
      });
    }
  });

  test("content audit summary", async () => {
    const failed = run.contentFailures();
    if (failed.length > 0) {
      console.log("\nPLS Wave 6 content failures:");
      for (const f of failed) console.log(`  ${f.scenarioId}: ${f.contentHits.join(", ")}`);
    }
    expect(failed, `Leaked copy on ${failed.length} screen(s)`).toHaveLength(0);
  });
});
