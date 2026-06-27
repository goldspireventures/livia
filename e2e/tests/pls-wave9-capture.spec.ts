/**
 * PLS Wave 9 — Pack K: marketing complete + remaining gateway wedges + demo showcase.
 *
 *   pnpm pls:wave9
 */
import { test, expect } from "@playwright/test";
import { listWedgeDemoVerticalsForDisplay } from "@workspace/policy";
import { PlsCaptureRun, mergeManifest, plsOutRoot, slugifyRoute } from "../helpers/pls-capture";
import { MARKETING_ROUTES } from "../helpers/pls-depth-helpers";
import { ensureDemoProvisioned } from "../helpers/demo-auth";

const marketingBase = process.env.E2E_MARKETING_BASE ?? process.env.E2E_MARKETING_URL ?? "http://127.0.0.1:5174";
const { date: runDate, dir: OUT_ROOT } = plsOutRoot(9);
let run: PlsCaptureRun;

async function captureGatewayWedge(page: import("@playwright/test").Page, vertical: string) {
  await page.goto(`/demo/wedge/${vertical}`, { waitUntil: "domcontentloaded", timeout: 45_000 });
  await run.capture(page, {
    scenarioId: `K-G2-${vertical}-story`,
    persona: "prospect",
    surface: "gateway",
    route: `/demo/wedge/${vertical}`,
  });
  const cont = page.getByTestId("gateway-demo-continue");
  if (await cont.isVisible().catch(() => false)) {
    await cont.click();
    await page.waitForTimeout(700);
    await run.capture(page, {
      scenarioId: `K-G3-${vertical}-roles`,
      persona: "prospect",
      surface: "gateway",
      route: `/demo/wedge/${vertical}#roles`,
    });
  }
}

test.describe("PLS Wave 9 — marketing + gateway complete (Pack K)", () => {
  test.describe.configure({ mode: "serial", timeout: 900_000 });

  test.beforeAll(async ({ request }) => {
    await ensureDemoProvisioned(request);
    run = new PlsCaptureRun(9, OUT_ROOT, runDate);
  });

  test.afterAll(() => {
    run.flush();
    mergeManifest(9, runDate);
  });

  test("K — all marketing routes", async ({ page }) => {
    let captured = 0;
    for (const route of MARKETING_ROUTES) {
      const res = await page.goto(`${marketingBase}${route}`, {
        waitUntil: "domcontentloaded",
        timeout: 30_000,
      });
      if (!res?.ok()) continue;
      await run.capture(page, {
        scenarioId: `K-marketing-${slugifyRoute(route)}`,
        persona: "prospect",
        surface: "marketing",
        route,
      });
      captured++;
    }
    expect(captured, "marketing pages captured").toBeGreaterThanOrEqual(15);
  });

  test("K — marketing get-started → sign-up handoff", async ({ page }) => {
    await page.goto(`${marketingBase}/get-started?vertical=beauty`, {
      waitUntil: "domcontentloaded",
      timeout: 30_000,
    });
    const cta = page.getByRole("link", { name: /start|sign up|get started/i }).first();
    if (await cta.isVisible().catch(() => false)) {
      await cta.click();
      await page.waitForTimeout(1000);
    }
    await run.capture(page, {
      scenarioId: "K-marketing-handoff-signup",
      persona: "prospect",
      surface: "gateway",
      route: "/get-started → sign-up",
    });
  });

  test("K — all gateway wedge verticals", async ({ page }) => {
    const wedges = listWedgeDemoVerticalsForDisplay();
    expect(wedges.length).toBeGreaterThanOrEqual(8);
    for (const vertical of wedges) {
      await captureGatewayWedge(page, vertical);
    }
  });

  test("K — demo showcase routes", async ({ page }) => {
    await page.goto("/demo/open", { waitUntil: "domcontentloaded", timeout: 45_000 });
    await run.capture(page, {
      scenarioId: "K-demo-open-persona",
      persona: "prospect",
      surface: "gateway",
      route: "/demo/open",
    });
    for (const persona of ["owner", "staff-senior", "receptionist"]) {
      await page.goto(`/demo/${persona}`, { waitUntil: "domcontentloaded", timeout: 45_000 });
      await run.capture(page, {
        scenarioId: `K-demo-showcase-${persona}`,
        persona: "prospect",
        surface: "gateway",
        route: `/demo/${persona}`,
      });
    }
  });

  test("content audit summary", async () => {
    const failed = run.contentFailures();
    if (failed.length > 0) {
      console.log("\nPLS Wave 9 content failures:");
      for (const f of failed) console.log(`  ${f.scenarioId}: ${f.contentHits.join(", ")}`);
    }
    expect(failed, `Leaked copy on ${failed.length} screen(s)`).toHaveLength(0);
  });
});
