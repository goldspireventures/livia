/**
 * Capture real platform crops for G2 product-thread wedges (Bookings → /b → Today).
 *
 *   pnpm capture:vertical-wedge-beats
 *
 * Requires dashboard :5173 + API :3000 with demo world provisioned.
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
const base = process.env.E2E_DASHBOARD_BASE ?? "http://127.0.0.1:5173";

type CapturePack = {
  name: string;
  slug: string;
  folder: string;
  inboxPath?: string;
  inboxSelector?: string;
};

/** Verticals that already have committed wedge assets — skip unless FORCE=1. */
const EXISTING = new Set([
  "beauty/platform-default",
  "wellness/harbour-light",
  "event-vendors/atelier",
]);

const CAPTURE_PACKS: CapturePack[] = [
  { name: "hair", slug: "luxe-salon-spa", folder: "hair/luxe-salon" },
  { name: "body-art", slug: "ink-anchor-galway", folder: "body-art/ink-anchor" },
  { name: "medspa", slug: "clarity-medspa-dublin", folder: "medspa/clarity" },
  { name: "fitness", slug: "peak-fitness-dublin", folder: "fitness/peak" },
  { name: "allied-health", slug: "motion-physio-cork", folder: "allied-health/motion" },
  { name: "pet-grooming", slug: "paws-parlour-dublin", folder: "pet-grooming/paws" },
  {
    name: "automotive-detailing",
    slug: "shine-studio-belfast",
    folder: "automotive-detailing/shine",
  },
];

async function waitForBookingsLoaded(page: import("@playwright/test").Page) {
  await page.locator('[data-testid="bookings-page"]').waitFor({ state: "visible", timeout: 60_000 });
  const skeleton = page.locator('[data-testid="bookings-page"] .animate-pulse').first();
  if (await skeleton.isVisible().catch(() => false)) {
    await skeleton.waitFor({ state: "hidden", timeout: 90_000 });
  }
  await page
    .locator('[data-testid^="bookings-morph-"], [data-testid="button-load-more-bookings"]')
    .first()
    .waitFor({ state: "visible", timeout: 90_000 })
    .catch(() => undefined);
  await page.waitForTimeout(600);
}

async function waitForTodayLoaded(page: import("@playwright/test").Page) {
  await page.locator('[data-testid="owner-home-ritual"]').waitFor({ state: "visible", timeout: 60_000 });
  await page
    .locator('[data-testid="owner-dashboard-greeting"], [data-testid="owner-kpi-row"]')
    .first()
    .waitFor({ state: "visible", timeout: 90_000 });
  const skeleton = page.locator('[data-testid="owner-home-ritual"] .animate-pulse').first();
  if (await skeleton.isVisible().catch(() => false)) {
    await skeleton.waitFor({ state: "hidden", timeout: 90_000 });
  }
  await page.waitForTimeout(600);
}

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

function publish(folder: string, file: string) {
  const pub = resolve(root, "artifacts/livia-dashboard/public/w2-gateway/beats", folder, file);
  const doc = resolve(root, "docs/design/assets/w2-gateway", folder, file);
  mkdirSync(dirname(doc), { recursive: true });
  copyFileSync(pub, doc);
}

test.describe.configure({ mode: "serial", timeout: 600_000 });

test.beforeAll(async ({ request }) => {
  await ensureDemoProvisioned(request);
  await request
    .post(`${apiBase}/api/demo/sync-vertical-showcase`, { timeout: 120_000 })
    .catch(() => undefined);
});

for (const pack of CAPTURE_PACKS) {
  test(`capture wedge beats — ${pack.name}`, async ({ page }) => {
    if (EXISTING.has(pack.folder) && process.env.FORCE !== "1") {
      test.skip();
      return;
    }

    const outPublic = resolve(
      root,
      "artifacts/livia-dashboard/public/w2-gateway/beats",
      pack.folder,
    );

    await signInBusiness(page, pack.slug);
    await dismissPlatformTour(page);

    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(`${base}${pack.inboxPath ?? "/bookings"}`, {
      waitUntil: "domcontentloaded",
      timeout: 60_000,
    });
    if (!pack.inboxPath) {
      await waitForBookingsLoaded(page);
    } else {
      await page.locator(pack.inboxSelector!).first().waitFor({ state: "visible", timeout: 90_000 });
      await page.waitForTimeout(800);
    }
    await clipLocator(
      page,
      pack.inboxSelector ?? '[data-testid="bookings-page"]',
      resolve(outPublic, "inbox.png"),
    );
    publish(pack.folder, "inbox.png");

    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`${base}/b/${pack.slug}?preview=1`, {
      waitUntil: "domcontentloaded",
      timeout: 60_000,
    });
    await page.waitForSelector('[data-testid="text-business-name"]', { timeout: 90_000 });
    await page.waitForTimeout(800);
    const shell = page.getByTestId("public-book-storefront").first();
    await shell.waitFor({ state: "visible", timeout: 30_000 });
    const bookBox = await shell.boundingBox();
    if (!bookBox) throw new Error("public-book-storefront not visible");
    mkdirSync(outPublic, { recursive: true });
    await page.screenshot({
      path: resolve(outPublic, "book-mobile.png"),
      clip: {
        x: Math.max(0, bookBox.x - 8),
        y: Math.max(0, bookBox.y - 8),
        width: Math.min(390, bookBox.width + 16),
        height: Math.min(844, bookBox.height + 16),
      },
    });
    publish(pack.folder, "book-mobile.png");

    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(`${base}/dashboard`, { waitUntil: "domcontentloaded", timeout: 60_000 });
    await waitForTodayLoaded(page);
    await clipLocator(
      page,
      '[data-testid="owner-home-ritual"]',
      resolve(outPublic, "today.png"),
      12,
    );
    publish(pack.folder, "today.png");
  });
}
