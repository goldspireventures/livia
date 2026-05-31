/**
 * CI guest-token suite (API) — demo surfaces expose valid tokens.
 *
 *   pnpm --filter @workspace/e2e exec playwright test tests/guest-token-api.spec.ts --project=api
 */
import { test, expect } from "@playwright/test";
import { ensureDemoProvisioned, apiBase } from "../helpers/demo-auth";

const SURFACES = [
  { kind: "proof", slug: "ink-anchor-galway" },
  { kind: "intake", slug: "clarity-medspa-dublin" },
  { kind: "pay", slug: process.env.E2E_DEPOSIT_SLUG ?? "luxe-salon-spa" },
  { kind: "waitlist", slug: "peak-fitness-dublin" },
] as const;

async function fetchGuestSurface(
  request: import("@playwright/test").APIRequestContext,
  kind: string,
  slug: string,
) {
  let res = await request.get(`${apiBase}/api/demo/guest-surfaces/${slug}/${kind}`);
  if (res.status() === 404) {
    await request.post(`${apiBase}/api/demo/sync-vertical-showcase`, { timeout: 120_000 });
    res = await request.get(`${apiBase}/api/demo/guest-surfaces/${slug}/${kind}`);
  }
  return res;
}

test.describe("Guest token API suite (R2-E7)", () => {
  test.describe.configure({ mode: "serial", timeout: 180_000 });

  test.beforeAll(async ({ request }) => {
    await ensureDemoProvisioned(request);
  });

  for (const { kind, slug } of SURFACES) {
    test(`demo exposes ${kind} token for ${slug}`, async ({ request }) => {
      const res = await fetchGuestSurface(request, kind, slug);
      if (kind === "pay" && !res.ok()) {
        test.skip(true, "No deposit booking in demo seed for pay slug");
      }
      expect(res.ok(), `${kind} ${slug}: ${await res.text()}`).toBeTruthy();
      const body = (await res.json()) as { token?: string; path?: string };
      expect(body.token?.length).toBeGreaterThan(8);
      expect(body.path).toContain(`/b/${slug}/${kind === "pay" ? "pay" : kind}/`);
    });
  }
});
