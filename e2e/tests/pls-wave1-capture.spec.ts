/**
 * PLS Wave 1 — founder + guest + billing + marketing capture with content audit.
 *
 *   pnpm pls:wave1
 *
 * Output: artifacts/pls/<date>/*.png + manifest.json
 */
import { test, expect } from "@playwright/test";
import path from "node:path";
import { mkdirSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { ensureDemoProvisioned, signInDemoPersona } from "../helpers/demo-auth";
import { FORBIDDEN_CUSTOMER_PATTERNS, scanText } from "../../scripts/pls-forbidden-copy.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const runDate = process.env.PLS_RUN_DATE ?? new Date().toISOString().slice(0, 10);
const OUT_ROOT = path.join(__dirname, "..", "..", "artifacts", "pls", runDate);
const apiBase = process.env.E2E_API_BASE ?? "http://127.0.0.1:3000";
const marketingBase = process.env.E2E_MARKETING_BASE ?? "http://127.0.0.1:5174";

const PUBLIC_SLUGS = [
  "luxe-salon-spa",
  "clarity-medspa-dublin",
  "bloom-beauty-dublin",
  "evergreen-wellness-dublin",
  "studio-fit-dublin",
] as const;

type StepRecord = {
  scenarioId: string;
  persona: string;
  surface: string;
  route: string;
  screenshot: string;
  contentHits: string[];
  outcome: "pass" | "fail" | "degraded";
};

const manifest: StepRecord[] = [];

function slugify(s: string) {
  const base = s.replace(/^\//, "").replace(/[?&=]/g, "-") || "home";
  return base.replace(/[^\w-]+/g, "-").replace(/^-|-$/g, "");
}

async function auditPageText(page: import("@playwright/test").Page) {
  const text = await page.locator("body").innerText();
  return scanText(text).map((h) => h.id);
}

async function captureStep(
  page: import("@playwright/test").Page,
  meta: Omit<StepRecord, "screenshot" | "contentHits" | "outcome">,
) {
  mkdirSync(OUT_ROOT, { recursive: true });
  await page.waitForTimeout(600);
  const hits = await auditPageText(page);
  const file = `${meta.scenarioId}.png`;
  const outPath = path.join(OUT_ROOT, file);
  await page.screenshot({ path: outPath, fullPage: true });
  const record: StepRecord = {
    ...meta,
    screenshot: `artifacts/pls/${runDate}/${file}`,
    contentHits: hits,
    outcome: hits.length > 0 ? "fail" : "pass",
  };
  manifest.push(record);
  if (hits.length > 0) {
    console.warn(`[PLS content] ${meta.scenarioId}: ${hits.join(", ")}`);
  }
  return record;
}

test.describe("PLS Wave 1 — life simulation capture", () => {
  test.describe.configure({ mode: "serial", timeout: 420_000 });

  test.beforeAll(async ({ request }) => {
    await ensureDemoProvisioned(request);
    mkdirSync(OUT_ROOT, { recursive: true });
  });

  test.afterAll(() => {
    writeFileSync(path.join(OUT_ROOT, "manifest.json"), JSON.stringify(manifest, null, 2));
  });

  test("Pack F — marketing entry", async ({ page }) => {
    for (const route of ["/", "/get-started", "/how-it-works", "/demo"]) {
      await page.goto(`${marketingBase}${route}`, { waitUntil: "domcontentloaded", timeout: 30_000 });
      await captureStep(page, {
        scenarioId: `F-marketing-${slugify(route || "home")}`,
        persona: "prospect",
        surface: "marketing",
        route,
      });
    }
  });

  test("Pack A — gateway sign-in / sign-up", async ({ page }) => {
    for (const route of ["/sign-in", "/sign-up"]) {
      await page.goto(route, { waitUntil: "domcontentloaded" });
      await captureStep(page, {
        scenarioId: `A-gateway-${slugify(route)}`,
        persona: "founder",
        surface: "dashboard",
        route,
      });
    }
  });

  test("Pack D — public book (vertical slugs)", async ({ page, request }) => {
    for (const slug of PUBLIC_SLUGS) {
      const res = await request.get(`${apiBase}/api/public/b/${slug}`);
      if (!res.ok()) continue;
      await page.goto(`/b/${slug}`, { waitUntil: "networkidle", timeout: 45_000 });
      await captureStep(page, {
        scenarioId: `D-guest-book-${slug}`,
        persona: "guest",
        surface: "public-book",
        route: `/b/${slug}`,
      });
    }
  });

  test("Pack D — guest hub sign-in", async ({ page }) => {
    await page.goto("/my", { waitUntil: "domcontentloaded" });
    await captureStep(page, {
      scenarioId: "D-guest-my-signin",
      persona: "guest",
      surface: "guest-hub",
      route: "/my",
    });
  });

  test("Pack B — owner dashboard + billing", async ({ page }) => {
    await signInDemoPersona(page, "owner");
    const body = await page.locator("body").innerText();
    expect(body).not.toMatch(/sign in to your command center/i);

    for (const route of ["/dashboard", "/settings?tab=billing", "/settings?tab=liv"]) {
      await page.goto(route, { waitUntil: "domcontentloaded", timeout: 45_000 });
      await captureStep(page, {
        scenarioId: `B-owner-${slugify(route)}`,
        persona: "owner",
        surface: "dashboard",
        route,
      });
    }
  });

  test("Pack A — founder onboarding resume", async ({ page }) => {
    await signInDemoPersona(page, "org_admin");
    await page.goto("/onboarding?intent=second-shop", { waitUntil: "domcontentloaded", timeout: 45_000 });
    await captureStep(page, {
      scenarioId: "A-founder-onboarding-second-shop",
      persona: "founder",
      surface: "dashboard",
      route: "/onboarding?intent=second-shop",
    });
  });

  test("content audit summary", async () => {
    const failed = manifest.filter((m) => m.contentHits.length > 0);
    if (failed.length > 0) {
      console.log("\nPLS Wave 1 content failures:");
      for (const f of failed) {
        console.log(`  ${f.scenarioId}: ${f.contentHits.join(", ")}`);
      }
    }
    expect(
      failed,
      `Forbidden copy on ${failed.length} screen(s) — see manifest`,
    ).toHaveLength(0);
  });
});
