/**
 * Guest token UI suite — proof, intake, pay, waitlist pages render.
 *
 *   pnpm --filter @workspace/e2e run test:guest-tokens
 */
import { test, expect } from "@playwright/test";
import { ensureDemoProvisioned, apiBase } from "../helpers/demo-auth";

type SurfaceCase = {
  kind: string;
  slug: string;
  testId: string;
  assertVisible: string;
};

const CASES: SurfaceCase[] = [
  {
    kind: "proof",
    slug: "ink-anchor-galway",
    testId: "guest-proof-page",
    assertVisible: "guest-proof-approve",
  },
  {
    kind: "intake",
    slug: "clarity-medspa-dublin",
    testId: "guest-intake-page",
    assertVisible: "intake-submit",
  },
  {
    kind: "pay",
    slug: process.env.E2E_DEPOSIT_SLUG ?? "luxe-salon-spa",
    testId: "guest-pay-page",
    assertVisible: "guest-pay-checkout",
  },
  {
    kind: "waitlist",
    slug: "peak-fitness-dublin",
    testId: "guest-waitlist-page",
    assertVisible: "guest-waitlist-accept",
  },
];

async function resolvePath(
  request: import("@playwright/test").APIRequestContext,
  kind: string,
  slug: string,
): Promise<string | null> {
  let res = await request.get(`${apiBase}/api/demo/guest-surfaces/${slug}/${kind}`);
  if (res.status() === 404) {
    await request.post(`${apiBase}/api/demo/sync-vertical-showcase`, { timeout: 120_000 });
    res = await request.get(`${apiBase}/api/demo/guest-surfaces/${slug}/${kind}`);
  }
  if (!res.ok()) return null;
  const body = (await res.json()) as { path: string };
  return body.path;
}

test.describe("Guest token UI suite", () => {
  test.describe.configure({ mode: "serial", timeout: 300_000 });

  test.beforeAll(async ({ request }) => {
    await ensureDemoProvisioned(request);
  });

  for (const c of CASES) {
    test(`${c.kind} page renders for ${c.slug}`, async ({ page, request }) => {
      const path = await resolvePath(request, c.kind, c.slug);
      if (!path) {
        if (c.kind === "pay") test.skip(true, "No pay token in demo seed");
        expect(path, `missing ${c.kind} token`).toBeTruthy();
      }

      await page.goto(path!, { waitUntil: "domcontentloaded", timeout: 45_000 });
      await expect(page.getByTestId(c.testId)).toBeVisible({ timeout: 20_000 });

      if (c.kind === "pay") {
        const checkout = page.getByTestId("guest-pay-checkout");
        const complete = page.getByTestId("guest-pay-complete");
        await expect(checkout.or(complete)).toBeVisible();
      } else {
        await expect(page.getByTestId(c.assertVisible)).toBeVisible();
      }
    });
  }
});
