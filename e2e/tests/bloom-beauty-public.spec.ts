/**
 * Bloom beauty — public /b + presentation skin (needs API + dashboard dev servers).
 *
 *   pnpm --filter @workspace/e2e exec playwright test tests/bloom-beauty-public.spec.ts
 */
import { test, expect } from "@playwright/test";

const slug = "bloom-beauty-dublin";

test.describe("Bloom beauty public book", () => {
  test("loads with noir-dusk dark presentation", async ({ page, request }) => {
    const apiBase = process.env.E2E_API_BASE ?? "http://127.0.0.1:3000";
    const pub = await request.get(`${apiBase}/api/public/b/${slug}`);
    if (!pub.ok()) {
      test.skip(true, "Bloom not seeded — run pnpm demo:repair");
    }
    const body = await pub.json();
    expect(body.experienceSkin?.presentation).toBe("noir-dusk");

    await page.goto(`/b/${slug}`);
    await expect(page.locator("body")).toContainText(/lash|manicure|book/i, { timeout: 20_000 });
    await expect(page.getByRole("button", { name: /brow shape/i })).toBeVisible({ timeout: 15_000 });
    await expect(page.getByTestId("public-service-catalog")).toContainText(/5 services/i);

    const theme = await page.evaluate(() => ({
      presentation: document.documentElement.dataset.presentation,
      dark: document.documentElement.classList.contains("dark"),
      background: getComputedStyle(document.documentElement).getPropertyValue("--background").trim(),
    }));

    expect(theme.presentation).toBe("noir-dusk");
    expect(theme.dark).toBe(true);
    const lightness = Number.parseFloat(theme.background.split(/\s+/)[2] ?? "100");
    expect(lightness).toBeLessThan(20);
  });

  test("beauty book flow: select treatment, back clears query", async ({ page, request }) => {
    const apiBase = process.env.E2E_API_BASE ?? "http://127.0.0.1:3000";
    const pub = await request.get(`${apiBase}/api/public/b/${slug}`);
    if (!pub.ok()) {
      test.skip(true, "Bloom not seeded — run pnpm demo:repair");
    }
    const body = await pub.json();
    const gel = body.services?.find((s: { name: string }) => /gel nails/i.test(s.name));
    if (!gel?.id) {
      test.skip(true, "Gel nails service missing");
    }

    await page.goto(`/b/${slug}`);
    await page.getByRole("button", { name: /gel nails/i }).click();
    await expect(page).toHaveURL(new RegExp(`service=${gel.id}`));
    await expect(page.getByTestId("button-book-now-beauty")).toBeEnabled();

    await page.getByTestId("button-book-now-beauty").click();
    await expect(page.getByRole("heading", { name: /gel nails/i })).toBeVisible();

    await page.getByRole("button", { name: /back to services/i }).click();
    await expect(page).toHaveURL(new RegExp(`/b/${slug}$`));
    await expect(page.getByTestId("button-book-now-beauty")).toBeDisabled();
  });

  test("brow shape card loads image (not letter fallback)", async ({ page, request }) => {
    const apiBase = process.env.E2E_API_BASE ?? "http://127.0.0.1:3000";
    const pub = await request.get(`${apiBase}/api/public/b/${slug}`);
    if (!pub.ok()) {
      test.skip(true, "Bloom not seeded — run pnpm demo:repair");
    }
    const body = await pub.json();
    const brow = body.services?.find((s: { name: string }) => /brow shape/i.test(s.name));
    expect(brow?.imageUrl).toMatch(/1583001931096/);

    await page.goto(`/b/${slug}`);
    const card = page.getByTestId(`button-service-${brow.id}`);
    await expect(card.locator("img")).toBeVisible({ timeout: 15_000 });
  });
});
