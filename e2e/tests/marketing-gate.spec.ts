import { test, expect } from "@playwright/test";

const marketingBase = process.env.E2E_MARKETING_URL ?? "http://127.0.0.1:5174";

test.describe("livia.io — marketing gate (v2 Block J)", () => {
  test.beforeAll(async ({ request }) => {
    try {
      const res = await request.get(`${marketingBase}/`, { timeout: 5000 });
      if (!res.ok()) {
        test.skip(true, "Marketing server not running — pnpm dev:marketing");
      }
    } catch {
      test.skip(true, "Marketing server not running — pnpm dev:marketing");
    }
  });

  test("home loads without dental claim", async ({ page }) => {
    await page.goto(`${marketingBase}/`);
    await expect(page.locator("body")).toContainText(/livia/i);
    await expect(page.getByText(/dental/i)).toHaveCount(0);
  });

  test("pricing page loads", async ({ page }) => {
    await page.goto(`${marketingBase}/pricing`);
    await expect(page.getByRole("heading", { name: /pricing/i })).toBeVisible();
    await expect(page.getByText(/€79/)).toBeVisible();
    await expect(page.getByText(/dental/i)).toHaveCount(0);
  });

  test("how-it-works loads", async ({ page }) => {
    await page.goto(`${marketingBase}/how-it-works`);
    await expect(page.getByRole("heading", { name: /how it works/i })).toBeVisible();
  });

  test("vertical hair loads", async ({ page }) => {
    await page.goto(`${marketingBase}/verticals/hair`);
    await expect(page.getByText(/hair/i).first()).toBeVisible();
  });

  test("vertical fitness loads", async ({ page }) => {
    await page.goto(`${marketingBase}/verticals/fitness`);
    await expect(page.getByText(/fitness|class/i).first()).toBeVisible();
  });

  test("chair-rental host page loads", async ({ page }) => {
    await page.goto(`${marketingBase}/for/chair-rental`);
    await expect(page.getByText(/host|chair|rent/i).first()).toBeVisible();
  });

  test("DACH landing /de loads", async ({ page }) => {
    await page.goto(`${marketingBase}/de`);
    await expect(page.locator("body")).toContainText(/Liv|Salon|Beta|Deutsch/i);
  });

  test("vertical pet-grooming loads", async ({ page }) => {
    await page.goto(`${marketingBase}/verticals/pet-grooming`);
    await expect(page.getByText(/pet|groom/i).first()).toBeVisible();
  });

  test("vertical medspa loads", async ({ page }) => {
    await page.goto(`${marketingBase}/verticals/medspa`);
    await expect(page.getByText(/medspa|aesthetic|clinic/i).first()).toBeVisible();
  });
});
