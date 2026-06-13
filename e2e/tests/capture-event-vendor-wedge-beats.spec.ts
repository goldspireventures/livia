/**
 * Capture real Atelier decor crops for G2 event-vendor wedge (event-atelier preset).
 *
 *   pnpm capture:event-vendor-wedge
 */
import { test } from "@playwright/test";
import { copyFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  apiBase,
  dismissPlatformTour,
  ensureDemoProvisioned,
  signInBusiness,
} from "../helpers/demo-auth";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const SLUG = "atelier-decor-dublin";
const base = process.env.E2E_DASHBOARD_BASE ?? "http://127.0.0.1:5173";

const outPublic = resolve(
  root,
  "artifacts/livia-dashboard/public/w2-gateway/beats/event-vendors/atelier",
);
const outDocs = resolve(root, "docs/design/assets/w2-gateway/event-vendors/atelier");

async function clipLocator(
  page: import("@playwright/test").Page,
  selector: string,
  dest: string,
  pad = 10,
) {
  const el = page.locator(selector).first();
  await el.waitFor({ state: "visible", timeout: 90_000 });
  const box = await el.boundingBox();
  if (!box) throw new Error(`No bounding box for ${selector}`);
  mkdirSync(dirname(dest), { recursive: true });
  await page.screenshot({
    path: dest,
    clip: {
      x: Math.max(0, box.x - pad),
      y: Math.max(0, box.y - pad),
      width: Math.min(1440, box.width + pad * 2),
      height: Math.min(1200, box.height + pad * 2),
    },
  });
}

function publish(file: string) {
  const pub = resolve(outPublic, file);
  const doc = resolve(outDocs, file);
  mkdirSync(dirname(doc), { recursive: true });
  copyFileSync(pub, doc);
}

test.describe.configure({ mode: "serial", timeout: 180_000 });

test.beforeAll(async ({ request }) => {
  await ensureDemoProvisioned(request);
  await request
    .post(`${apiBase}/api/demo/sync-vertical-showcase`, { timeout: 120_000 })
    .catch(() => undefined);
});

test("capture event-vendor wedge beats — atelier", async ({ page, request }) => {
  await signInBusiness(page, SLUG);
  await dismissPlatformTour(page);

  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(`${base}/inbox`, { waitUntil: "domcontentloaded", timeout: 60_000 });
  await clipLocator(page, '[data-testid="event-vendor-unified-inbox"]', resolve(outPublic, "inbox.png"));
  publish("inbox.png");

  await page.goto(`${base}/quotes`, { waitUntil: "domcontentloaded", timeout: 60_000 });
  await page.locator('[data-testid="quotes-page"]').waitFor({ state: "visible", timeout: 60_000 });
  const firstQuote = page.locator('[data-testid="quotes-page"] button[type="button"].rounded-lg').first();
  if (await firstQuote.isVisible().catch(() => false)) {
    await firstQuote.click();
  }
  await page.waitForTimeout(600);
  await clipLocator(
    page,
    '[data-testid="quotes-page"] .grid.gap-4',
    resolve(outPublic, "quote-gen.png"),
    12,
  );
  publish("quote-gen.png");

  await page.goto(`${base}/e/${SLUG}/services`, {
    waitUntil: "domcontentloaded",
    timeout: 60_000,
  });
  await page.locator('[data-testid="event-vendor-site"]').waitFor({ state: "visible", timeout: 60_000 });
  await clipLocator(page, ".ev-services-list", resolve(outPublic, "catalogue.png"), 16);
  publish("catalogue.png");

  const quoteRes = await request.get(`${apiBase}/api/demo/guest-surfaces/${SLUG}/quote`);
  if (!quoteRes.ok()) {
    throw new Error(`No demo quote token (${quoteRes.status()}) — run demo:provision`);
  }
  const { token } = (await quoteRes.json()) as { token: string };

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`${base}/e/${SLUG}/q/${token}`, {
    waitUntil: "domcontentloaded",
    timeout: 60_000,
  });
  await page.locator('[data-testid="event-vendor-site"]').waitFor({ state: "visible", timeout: 60_000 });
  await page.waitForTimeout(800);
  const quoteMain = page.locator("main, .ev-section").first();
  await quoteMain.waitFor({ state: "visible", timeout: 30_000 });
  const box = await quoteMain.boundingBox();
  if (!box) throw new Error("guest quote main not visible");
  mkdirSync(outPublic, { recursive: true });
  await page.screenshot({
    path: resolve(outPublic, "milestone-pay.png"),
    clip: {
      x: Math.max(0, box.x),
      y: Math.max(0, box.y),
      width: Math.min(390, box.width),
      height: Math.min(720, box.height),
    },
  });
  publish("milestone-pay.png");
});
