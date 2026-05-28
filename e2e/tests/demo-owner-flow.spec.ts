import { test, expect } from "@playwright/test";

const apiBase = process.env.E2E_API_BASE ?? "http://127.0.0.1:3000";
const DEMO_SLUG = process.env.E2E_DEMO_OWNER_SLUG ?? "aurora-galway";

test.describe("Demo owner — open business", () => {
  test.beforeAll(async ({ request }) => {
    const status = await request.get(`${apiBase}/api/demo/status`);
    if (status.ok()) {
      const st = (await status.json()) as { provisioned?: boolean };
      if (st.provisioned) return;
    }
    const prov = await request.post(`${apiBase}/api/demo/provision`, { timeout: 180_000 });
    if (!prov.ok()) {
      test.skip(true, `Demo provision failed (${prov.status()}) — run pnpm demo:provision first`);
    }
  });

  test("ticket sign-in lands on dashboard without legal loop", async ({ page, request }) => {
    const signInRes = await request.post(`${apiBase}/api/demo/sign-in-business`, {
      data: { slug: DEMO_SLUG },
    });
    expect(signInRes.ok()).toBeTruthy();
    const result = (await signInRes.json()) as { token?: string; landingPath: string };
    expect(result.token).toBeTruthy();

    await page.goto("/", { waitUntil: "domcontentloaded" });
    await page.waitForFunction(
      () => (window as unknown as { Clerk?: { loaded?: boolean } }).Clerk?.loaded === true,
      { timeout: 30_000 },
    );

    const signedIn = await page.evaluate(async (token) => {
      const clerk = (window as unknown as {
        Clerk?: {
          client?: {
            signIn: {
              create: (opts: { strategy: string; ticket: string }) => Promise<{
                status: string;
                createdSessionId?: string;
              }>;
            };
          };
          setActive: (opts: { session: string }) => Promise<void>;
        };
      }).Clerk;
      if (!clerk?.client?.signIn || !token) return false;
      const attempt = await clerk.client.signIn.create({ strategy: "ticket", ticket: token });
      if (attempt.status !== "complete" || !attempt.createdSessionId) return false;
      await clerk.setActive({ session: attempt.createdSessionId });
      return true;
    }, result.token!);

    expect(signedIn).toBe(true);

    await page.goto(result.landingPath, { waitUntil: "domcontentloaded" });
    await page.waitForURL(/\/(dashboard|chain)/, { timeout: 30_000 });
    await expect(page.getByText("Page not found")).toHaveCount(0);

    // Should not trap on legal acceptance for provisioned demo owner
    if (page.url().includes("/legal-acceptance")) {
      await page.getByRole("button", { name: /continue to setup/i }).click();
      await page.waitForURL(/\/(dashboard|onboarding)/, { timeout: 15_000 });
    }
    expect(page.url()).not.toContain("/legal-acceptance");
  });
});
