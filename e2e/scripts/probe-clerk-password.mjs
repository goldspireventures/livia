import { chromium } from "@playwright/test";

const b = await chromium.launch();
const p = await b.newPage();
await p.goto("http://127.0.0.1:5173/sign-in", { waitUntil: "networkidle" });
await p.locator('input[name="identifier"], input[type="email"]').first().fill("owner-luxe@demo.livia-hq.com");
await p.getByRole("button", { name: "Continue", exact: true }).click();
await p.waitForTimeout(2000);
const pw = p.locator('input[name="password"], input[type="password"]').first();
console.log("pw visible", await pw.isVisible());
await pw.fill("LiviaDemo2026!");
await p.getByRole("button", { name: "Continue", exact: true }).click();
try {
  await p.waitForURL(/dashboard|inbox/, { timeout: 45_000 });
  console.log("OK", p.url());
} catch {
  const body = await p.locator("body").innerText();
  console.log("fail", p.url(), body.slice(0, 600));
}
await b.close();
