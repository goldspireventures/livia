/**
 * PLS Wave 2 — full vertical matrix, staff/reception, owner slices, unhappy paths.
 *
 *   pnpm pls:wave2
 */
import { test, expect } from "@playwright/test";
import {
  PlsCaptureRun,
  fetchDemoBusinesses,
  mergeManifest,
  plsOutRoot,
  publicBookPath,
  slugifyRoute,
} from "../helpers/pls-capture";
import {
  dismissPlatformTour,
  ensureDemoProvisioned,
  resetDemoBrowserSession,
  signInBusiness,
  signInDemoPersona,
  demoHasBusiness,
  demoCanSignIn,
} from "../helpers/demo-auth";

const apiBase = process.env.E2E_API_BASE ?? "http://127.0.0.1:3000";
const { date: runDate, dir: OUT_ROOT } = plsOutRoot(2);
let run: PlsCaptureRun;

const OWNER_SLICES = [
  { slug: "clarity-medspa-dublin", label: "medspa", routes: ["/dashboard", "/medspa", "/settings?tab=liv"] },
  { slug: "bloom-beauty-dublin", label: "beauty", routes: ["/dashboard", "/beauty-store", "/settings?tab=liv"] },
  { slug: "luxe-salon-spa", label: "salon", routes: ["/dashboard", "/settings?tab=shop"] },
  { slug: "harbour-wellness-cork", label: "wellness", routes: ["/dashboard", "/wellness/reception"] },
  { slug: "peak-fitness-dublin", label: "fitness", routes: ["/dashboard", "/settings?tab=shop"] },
] as const;

const STAFF_PERSONAS = [
  { id: "staff-senior", routes: ["/my-day", "/bookings", "/customers", "/settings"] },
  { id: "staff-junior", routes: ["/my-day", "/bookings", "/settings"] },
  { id: "receptionist", routes: ["/bookings", "/inbox", "/customers", "/settings"] },
  { id: "manager", routes: ["/inbox", "/dashboard", "/bookings", "/settings"] },
] as const;

test.describe("PLS Wave 2 — verticals + staff + unhappy", () => {
  test.describe.configure({ mode: "serial", timeout: 900_000 });

  test.beforeAll(async ({ request }) => {
    await ensureDemoProvisioned(request);
    run = new PlsCaptureRun(2, OUT_ROOT, runDate);
    await request.post(`${apiBase}/api/dev/pls/fast-forward`, {
      data: { slug: "bloom-beauty-dublin", months: 12, triggerLearning: true },
      timeout: 60_000,
    }).catch(() => undefined);
  });

  test.afterAll(() => {
    run.flush();
    mergeManifest(2, runDate);
  });

  test("Pack D — all demo public book surfaces", async ({ page, request }) => {
    const businesses = await fetchDemoBusinesses(request, apiBase);
    let captured = 0;
    for (const biz of businesses) {
      const route = publicBookPath(biz);
      if (!route) continue;
      const probe = route.startsWith("/e/")
        ? await request.get(`${apiBase}/api/public/event-vendor/${biz.slug}`)
        : await request.get(`${apiBase}/api/public/b/${biz.slug}`);
      if (!probe.ok()) continue;
      await page.goto(route, { waitUntil: "domcontentloaded", timeout: 45_000 });
      await run.capture(page, {
        scenarioId: `D-book-${biz.vertical}-${biz.slug}`,
        persona: "guest",
        surface: route.startsWith("/e/") ? "public-event-vendor" : "public-book",
        route,
      });
      captured++;
    }
    expect(captured, "expected at least 10 public book captures").toBeGreaterThanOrEqual(10);
  });

  test("Pack D — unhappy guest paths", async ({ page }) => {
    await page.goto("/b/this-shop-does-not-exist-pls", { waitUntil: "domcontentloaded" });
    await run.capture(page, {
      scenarioId: "D-unhappy-book-404",
      persona: "guest",
      surface: "public-book",
      route: "/b/this-shop-does-not-exist-pls",
    });
    await page.goto("/my", { waitUntil: "domcontentloaded" });
    await run.capture(page, {
      scenarioId: "D-guest-my-signin-recheck",
      persona: "guest",
      surface: "guest-hub",
      route: "/my",
    });
  });

  test("Pack B — owner vertical slices", async ({ page, request }) => {
    for (const slice of OWNER_SLICES) {
      if (!(await demoHasBusiness(request, slice.slug))) continue;
      if (!(await demoCanSignIn(request, slice.slug))) continue;
      await signInBusiness(page, slice.slug, { resetSession: true });
      await dismissPlatformTour(page);
      for (const route of slice.routes) {
        await page.goto(route, { waitUntil: "domcontentloaded", timeout: 45_000 });
        await run.capture(page, {
          scenarioId: `B-${slice.label}-owner-${slugifyRoute(route)}`,
          persona: "owner",
          surface: "dashboard",
          route: `${route} @${slice.slug}`,
        });
      }
    }
  });

  test("Pack C — staff and reception", async ({ page }) => {
    for (const persona of STAFF_PERSONAS) {
      await resetDemoBrowserSession(page);
      await signInDemoPersona(page, persona.id);
      for (const route of persona.routes) {
        await page.goto(route, { waitUntil: "domcontentloaded", timeout: 45_000 });
        await run.capture(page, {
          scenarioId: `C-${persona.id}-${slugifyRoute(route)}`,
          persona: persona.id,
          surface: "dashboard",
          route,
        });
      }
    }
  });

  test("Pack E — founder chain", async ({ page }) => {
    await resetDemoBrowserSession(page);
    await signInDemoPersona(page, "org_admin");
    for (const route of ["/chain", "/dashboard", "/inbox"]) {
      await page.goto(route, { waitUntil: "domcontentloaded", timeout: 45_000 });
      await run.capture(page, {
        scenarioId: `E-founder-${slugifyRoute(route)}`,
        persona: "founder",
        surface: "dashboard",
        route,
      });
    }
  });

  test("content audit summary", async () => {
    const failed = run.contentFailures();
    if (failed.length > 0) {
      console.log("\nPLS Wave 2 content failures:");
      for (const f of failed) {
        console.log(`  ${f.scenarioId}: ${f.contentHits.join(", ")}`);
      }
    }
    expect(failed, `Forbidden copy on ${failed.length} screen(s)`).toHaveLength(0);
  });
});
