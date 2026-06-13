import { test as setup, expect } from "@playwright/test";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const FOUNDER_AUTH_FILE = path.join(__dirname, "..", ".auth", "founder.json");
const apiBase = process.env.E2E_API_BASE ?? "http://127.0.0.1:3000";
const DEMO_PASSWORD = process.env.LIVIA_DEMO_PASSWORD ?? "LiviaDemo2026!";
const FOUNDER_EMAIL = "org-admin@livia.io";

setup.setTimeout(120_000);

async function provisionDemo(request: import("@playwright/test").APIRequestContext) {
  const status = await request.get(`${apiBase}/api/demo/status`, { timeout: 30_000 });
  if (status.ok() && (await status.json() as { provisioned?: boolean }).provisioned) {
    await request.post(`${apiBase}/api/demo/sync`, { timeout: 120_000 }).catch(() => undefined);
    return;
  }
  const prov = await request.post(`${apiBase}/api/demo/provision`, { timeout: 180_000 });
  if (!prov.ok()) {
    const retry = await request.get(`${apiBase}/api/demo/status`, { timeout: 30_000 });
    if (!retry.ok() || !(await retry.json() as { provisioned?: boolean }).provisioned) {
      setup.skip(true, `Demo provision failed (${prov.status()})`);
    }
  }
  await request.post(`${apiBase}/api/demo/sync`, { timeout: 120_000 }).catch(() => undefined);
}

async function signInFounderWithTicket(
  page: import("@playwright/test").Page,
  request: import("@playwright/test").APIRequestContext,
) {
  const signInRes = await request.post(`${apiBase}/api/demo/sign-in`, {
    data: { persona: "org_admin" },
  });
  if (!signInRes.ok()) {
    const body = await signInRes.text();
    setup.skip(true, `Demo sign-in API failed (${signInRes.status()}): ${body.slice(0, 200)}`);
  }
  const result = (await signInRes.json()) as {
    token?: string;
    landingPath: string;
    businessId?: string;
  };
  if (!result.token) {
    setup.skip(true, "Demo sign-in returned no Clerk ticket");
  }

  await page.goto("/", { waitUntil: "domcontentloaded" });
  await page.waitForFunction(
    () => {
      const clerk = (window as unknown as { Clerk?: { loaded?: boolean } }).Clerk;
      return clerk?.loaded === true;
    },
    { timeout: 30_000 },
  );

  const signedIn = await page.evaluate(async ({ token, businessId }) => {
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
    if (!clerk?.client?.signIn) return false;
    const attempt = await clerk.client.signIn.create({ strategy: "ticket", ticket: token });
    if (attempt.status !== "complete" || !attempt.createdSessionId) return false;
    await clerk.setActive({ session: attempt.createdSessionId });
    if (businessId) {
      window.localStorage.setItem("livia.currentBusinessId", businessId);
    }
    window.localStorage.setItem("livia.devPersona", "org_admin");
    return true;
  }, { token: result.token, businessId: result.businessId ?? null });

  if (!signedIn) {
    return false;
  }

  await page.goto(result.landingPath, { waitUntil: "domcontentloaded" });
  await page.waitForURL(/\/(chain|dashboard)/, { timeout: 30_000 });
  return true;
}

async function signInFounderWithPassword(page: import("@playwright/test").Page) {
  await page.goto("/sign-in", { waitUntil: "domcontentloaded" });
  const identifier = page.locator('input[name="identifier"], input[type="email"]').first();
  await expect(identifier).toBeVisible({ timeout: 20_000 });
  await identifier.fill(FOUNDER_EMAIL);
  await page.getByRole("button", { name: "Continue", exact: true }).click();

  const password = page.locator('input[name="password"], input[type="password"]').first();
  await expect(password).toBeVisible({ timeout: 20_000 });
  await password.fill(DEMO_PASSWORD);
  await page.getByRole("button", { name: "Continue", exact: true }).click();

  await page.waitForURL(/\/(chain|dashboard)/, { timeout: 45_000 });
  return true;
}

setup("provision demo and sign in as founder", async ({ page, request }) => {
  await provisionDemo(request);

  const ticketOk = await signInFounderWithTicket(page, request).catch(() => false);
  if (!ticketOk) {
    await provisionDemo(request);
    const uiOk = await page
      .goto("/demo/founder", { waitUntil: "domcontentloaded" })
      .then(async () => {
        await expect(page.getByText(/demo world loaded/i)).toBeVisible({ timeout: 20_000 });
        const signInPromise = page.waitForResponse(
          (r) => r.url().includes("/api/demo/sign-in") && r.request().method() === "POST",
          { timeout: 30_000 },
        );
        await page.getByTestId("demo-launcher-card-org_admin").click();
        const signInRes = await signInPromise;
        if (!signInRes.ok()) return false;
        await page.waitForURL(/\/(chain|dashboard)/, { timeout: 45_000 });
        return true;
      })
      .catch(() => false);

    if (!uiOk) {
      await signInFounderWithPassword(page);
    }
  }

  await expect(page.locator("body")).not.toContainText(/sign in to your command center/i);
  await page.context().storageState({ path: FOUNDER_AUTH_FILE });
});
