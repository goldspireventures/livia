/**
 * Guest medical intake token — medspa demo walkthrough.
 *
 *   pnpm --filter @workspace/e2e exec playwright test --project=demo-intake-token
 */
import { test, expect } from "@playwright/test";
import { ensureDemoProvisioned, apiBase } from "../helpers/demo-auth";

const SLUG = "clarity-medspa-dublin";

test.describe("Demo guest intake token", () => {
  test.describe.configure({ mode: "serial", timeout: 180_000 });

  test.beforeAll(async ({ request }) => {
    await ensureDemoProvisioned(request);
  });

  test("demo API exposes draft intake token", async ({ request }) => {
    let res = await request.get(`${apiBase}/api/demo/guest-surfaces/${SLUG}/intake`);
    if (res.status() === 404) {
      await request.post(`${apiBase}/api/demo/sync-vertical-showcase`, { timeout: 120_000 });
      res = await request.get(`${apiBase}/api/demo/guest-surfaces/${SLUG}/intake`);
    }
    expect(res.ok(), await res.text()).toBeTruthy();
    const body = (await res.json()) as { token?: string; path?: string };
    expect(body.token?.length).toBeGreaterThan(8);
    expect(body.path).toMatch(new RegExp(`/b/${SLUG}/intake/`));
  });

  test("guest intake page renders form", async ({ page, request }) => {
    let res = await request.get(`${apiBase}/api/demo/guest-surfaces/${SLUG}/intake`);
    if (!res.ok()) {
      await request.post(`${apiBase}/api/demo/sync-vertical-showcase`, { timeout: 120_000 });
      res = await request.get(`${apiBase}/api/demo/guest-surfaces/${SLUG}/intake`);
    }
    expect(res.ok()).toBeTruthy();
    const { path } = (await res.json()) as { path: string };

    await page.goto(path, { waitUntil: "domcontentloaded", timeout: 45_000 });
    await expect(page.getByTestId("guest-intake-page")).toBeVisible({ timeout: 20_000 });
    await expect(page.getByTestId("guest-intake-consent-block")).toBeVisible();
    await expect(page.getByTestId("intake-submit")).toBeVisible();
    await expect(page.getByTestId("intake-checkbox-over18")).toBeVisible();
  });
});
