/**
 * PLS Wave 8 — Pack J: vertical owner matrix (signed-in hub per vertical).
 *
 *   pnpm pls:wave8
 */
import { test, expect } from "@playwright/test";
import { PlsCaptureRun, mergeManifest, plsOutRoot, slugifyRoute } from "../helpers/pls-capture";
import { VERTICAL_OWNER_HUBS } from "../helpers/pls-depth-helpers";
import {
  dismissPlatformTour,
  ensureDemoProvisioned,
  resetDemoBrowserSession,
  signInBusiness,
  demoCanSignIn,
  demoHasBusiness,
} from "../helpers/demo-auth";

const apiBase = process.env.E2E_API_BASE ?? "http://127.0.0.1:3000";
const { date: runDate, dir: OUT_ROOT } = plsOutRoot(8);
let run: PlsCaptureRun;

test.describe("PLS Wave 8 — vertical owner matrix (Pack J)", () => {
  test.describe.configure({ mode: "serial", timeout: 1_800_000 });

  test.beforeAll(async ({ request }) => {
    await ensureDemoProvisioned(request);
    await request.post(`${apiBase}/api/demo/sync-vertical-showcase`, { timeout: 120_000 }).catch(() => undefined);
    run = new PlsCaptureRun(8, OUT_ROOT, runDate);
  });

  test.afterAll(() => {
    run.flush();
    mergeManifest(8, runDate);
  });

  test("J — owner hub routes per vertical", async ({ page, request }) => {
    let verticalsCaptured = 0;
    for (const entry of VERTICAL_OWNER_HUBS) {
      if (!(await demoHasBusiness(request, entry.slug))) continue;
      if (!(await demoCanSignIn(request, entry.slug))) continue;

      await resetDemoBrowserSession(page);
      await signInBusiness(page, entry.slug, { resetSession: true });
      await dismissPlatformTour(page);

      let routesHit = 0;
      for (const route of entry.routes) {
        await page.goto(route, { waitUntil: "domcontentloaded", timeout: 45_000 });
        await run.capture(page, {
          scenarioId: `J-${entry.vertical}-${slugifyRoute(route)}`,
          persona: "owner",
          surface: "dashboard",
          route: `${route} @${entry.slug}`,
        });
        routesHit++;
      }
      if (routesHit > 0) verticalsCaptured++;
    }
    expect(verticalsCaptured, "vertical owner sign-ins").toBeGreaterThanOrEqual(8);
  });

  test("J — franchise + premises (chain tier)", async ({ page, request }) => {
    const slug = "bloom-beauty-dublin";
    if (!(await demoHasBusiness(request, slug)) || !(await demoCanSignIn(request, slug))) {
      test.skip(true, "bloom unavailable");
    }
    await resetDemoBrowserSession(page);
    await signInBusiness(page, slug, { resetSession: true });
    for (const route of ["/franchise", "/premises", "/day-packages"]) {
      await page.goto(route, { waitUntil: "domcontentloaded", timeout: 45_000 });
      await run.capture(page, {
        scenarioId: `J-chain-tier-${slugifyRoute(route)}`,
        persona: "owner",
        surface: "dashboard",
        route: `${route} @${slug}`,
      });
    }
  });

  test("content audit summary", async () => {
    const failed = run.contentFailures();
    if (failed.length > 0) {
      console.log("\nPLS Wave 8 content failures:");
      for (const f of failed) console.log(`  ${f.scenarioId}: ${f.contentHits.join(", ")}`);
    }
    expect(failed, `Leaked copy on ${failed.length} screen(s)`).toHaveLength(0);
  });
});
