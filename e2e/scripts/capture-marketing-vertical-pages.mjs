import { chromium } from "@playwright/test";
import path from "node:path";
import { mkdirSync } from "node:fs";

const base = process.env.MARKETING_URL ?? "http://127.0.0.1:5174";
const slugs = ["", "hair", "beauty", "wellness", "fitness", "medspa", "body-art"];
const out = path.resolve(import.meta.dirname, "..", "visual-captures", "marketing-verticals");
mkdirSync(out, { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });

for (const slug of slugs) {
  const url = slug ? `${base}/verticals/${slug}` : `${base}/`;
  await page.goto(url, { waitUntil: "networkidle", timeout: 60_000 });
  await page.waitForTimeout(1200);
  const name = slug || "home";
  await page.screenshot({ path: path.join(out, `${name}-full.png`), fullPage: true });
  const showcase = page.locator('[data-testid="marketing-product-showcase"], .cst-vertical-showcase').first();
  if (await showcase.count()) {
    await showcase.scrollIntoViewIfNeeded();
    await page.waitForTimeout(400);
    await showcase.screenshot({ path: path.join(out, `${name}-showcase.png`) });
  }
}

await browser.close();
console.log(`Captured ${slugs.length} pages → ${out}`);
