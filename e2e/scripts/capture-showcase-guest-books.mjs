/** Capture public guest-book mobile shots with showcase presets (no Clerk). */
import { chromium } from "@playwright/test";
import path from "node:path";
import { mkdirSync } from "node:fs";

const dashboard = process.env.DASHBOARD_URL ?? "http://127.0.0.1:5173";
const outRoot = path.resolve(
  import.meta.dirname,
  "..",
  "..",
  "artifacts",
  "livia-marketing",
  "public",
  "showcase",
  "verticals",
);

/** Mirrors DEMO_SHOWCASE_PRESENTATION_PRESET_ID cssPreset values in policy. */
const targets = [
  { folder: "hair", vertical: "hair", slug: "luxe-salon-spa", cssPreset: "warm-chair" },
  { folder: "beauty", vertical: "beauty", slug: "bloom-beauty-dublin", cssPreset: "noir-dusk" },
  { folder: "wellness", vertical: "wellness", slug: "harbour-wellness-cork", cssPreset: "harbour-light" },
  { folder: "body-art", vertical: "body-art", slug: "ink-anchor-galway", cssPreset: "studio-dark" },
  { folder: "fitness", vertical: "fitness", slug: "peak-fitness-dublin", cssPreset: "gym-bold" },
  { folder: "medspa", vertical: "medspa", slug: "clarity-medspa-dublin", cssPreset: "clinical-calm" },
  { folder: "allied-health", vertical: "allied-health", slug: "motion-physio-cork", cssPreset: "clinic-standard" },
  { folder: "pet-grooming", vertical: "pet-grooming", slug: "paws-parlour-dublin", cssPreset: "playful-paw" },
  {
    folder: "automotive-detailing",
    vertical: "automotive-detailing",
    slug: "shine-studio-belfast",
    cssPreset: "bay-industrial",
  },
];

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });

for (const t of targets) {
  const url = `${dashboard}/book/${t.slug}?preview=1&preset=${encodeURIComponent(t.cssPreset)}&vertical=${t.vertical}`;
  mkdirSync(path.join(outRoot, t.folder), { recursive: true });
  const dest = path.join(outRoot, t.folder, "mobile.png");

  await page.goto(url, { waitUntil: "networkidle", timeout: 60_000 });
  await page.waitForFunction(
    (expected) => document.documentElement.getAttribute("data-presentation") === expected,
    t.cssPreset,
    { timeout: 30_000 },
  );
  await page.locator('[data-testid="public-book-storefront"]').waitFor({ state: "visible", timeout: 60_000 });
  await page.locator('[data-testid="public-service-catalog"] button, [data-testid="public-service-catalog"] a')
    .first()
    .waitFor({ state: "visible", timeout: 60_000 })
    .catch(() => undefined);
  await page.waitForTimeout(800);
  await page.screenshot({ path: dest, fullPage: false, animations: "disabled" });
  console.log("mobile", t.folder, t.cssPreset, "→", dest);
}

await browser.close();
