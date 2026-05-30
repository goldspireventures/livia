import { expect, type APIRequestContext, type Page } from "@playwright/test";

export const apiBase = process.env.E2E_API_BASE ?? "http://127.0.0.1:3000";

const ERROR_PATTERNS = [
  /internal server error/i,
  /something went wrong/i,
  /unexpected error/i,
  /failed to load/i,
  /cannot read propert/i,
  /\[object Object\]/,
];

export async function ensureDemoProvisioned(request: APIRequestContext) {
  const status = await request.get(`${apiBase}/api/demo/status`);
  const body = status.ok() ? ((await status.json()) as { provisioned?: boolean }) : null;
  if (!body?.provisioned) {
    const prov = await request.post(`${apiBase}/api/demo/provision`, { timeout: 180_000 });
    if (!prov.ok()) {
      const retry = await request.get(`${apiBase}/api/demo/status`);
      if (!retry.ok() || !(await retry.json() as { provisioned?: boolean }).provisioned) {
        throw new Error(`Demo provision failed (${prov.status()}): ${(await prov.text()).slice(0, 300)}`);
      }
    }
    return;
  }
  const sync = await request.post(`${apiBase}/api/demo/sync-vertical-showcase`, { timeout: 120_000 });
  if (!sync.ok() && sync.status() !== 404) {
    console.warn(`sync-vertical-showcase: ${sync.status()} — restart API if new verticals are missing`);
  }
  await request.post(`${apiBase}/api/demo/sync-clerk`, { timeout: 180_000 }).catch(() => undefined);
}

export async function demoHasBusiness(request: APIRequestContext, slug: string): Promise<boolean> {
  const status = await request.get(`${apiBase}/api/demo/status`);
  if (!status.ok()) return false;
  const body = (await status.json()) as { businesses?: Array<{ slug: string }> };
  return body.businesses?.some((b) => b.slug === slug) ?? false;
}

/**
 * Some local environments cannot reach Clerk (offline / blocked). In that case,
 * skip authenticated E2E that depends on Clerk tickets.
 */
export async function demoCanSignIn(request: APIRequestContext, slug = "conors-cut-co"): Promise<boolean> {
  const res = await request.post(`${apiBase}/api/demo/sign-in-business`, { data: { slug } });
  return res.ok();
}

export async function dismissPlatformTour(page: Page) {
  const skip = page.getByRole("button", { name: /skip tour/i });
  if (await skip.isVisible().catch(() => false)) {
    await skip.click();
    await page.waitForTimeout(300);
  }
}

/** Demo accounts should skip legal gate — dismiss if middleware still routes here. */
export async function dismissLegalAcceptance(page: Page) {
  if (!page.url().includes("/legal-acceptance")) return;
  await ensurePlatformLegalAccepted(page);
  if (!page.url().includes("/legal-acceptance")) return;
  await page.getByText(/I agree to the Livia Terms of Service/i).click();
  const cont = page.getByRole("button", { name: /continue to setup/i });
  await expect(cont).toBeEnabled({ timeout: 10_000 });
  await cont.click();
  await page.waitForURL(/\/(dashboard|inbox|chain|bookings|my-day|onboarding|settings)/, {
    timeout: 30_000,
  });
}

export async function ensurePlatformLegalAccepted(page: Page) {
  await page.waitForFunction(
    () =>
      typeof (window as unknown as { Clerk?: { session?: { getToken?: () => Promise<string | null> } } })
        .Clerk?.session?.getToken === "function",
    { timeout: 30_000 },
  );
  const ok = await page.evaluate(async (api) => {
    const clerk = (window as unknown as { Clerk?: { session?: { getToken: () => Promise<string | null> } } })
      .Clerk;
    const token = await clerk?.session?.getToken?.();
    if (!token) return false;
    const res = await fetch(`${api}/api/me/platform-legal`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ accept: true }),
    });
    return res.ok;
  }, apiBase);
  if (!ok) return;
  await page.goto("/dashboard", { waitUntil: "domcontentloaded" });
  await page.waitForURL(/\/(dashboard|inbox|chain|bookings|my-day|onboarding|settings)/, {
    timeout: 30_000,
  });
}

const DEMO_PASSWORD = process.env.LIVIA_DEMO_PASSWORD ?? "LiviaDemo2026!";

async function signInWithPassword(page: Page, email: string, landingPath = "/dashboard") {
  await page.goto("/sign-in", { waitUntil: "domcontentloaded", timeout: 60_000 });

  const demoEmail = page.locator("#demo-email");
  if (await demoEmail.isVisible().catch(() => false)) {
    await demoEmail.fill(email);
    await page.locator("#demo-password").fill(DEMO_PASSWORD);
    await page.getByRole("button", { name: "Sign in as demo" }).click();
    await page.waitForURL(/\/(dashboard|inbox|chain|bookings|my-day|onboarding|settings)/, {
      timeout: 90_000,
    });
    return;
  }

  const identifier = page.locator('input[name="identifier"], input[type="email"]').first();
  await expect(identifier).toBeVisible({ timeout: 25_000 });
  await identifier.fill(email);
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  const password = page.locator('input[name="password"], input[type="password"]').first();
  await expect(password).toBeVisible({ timeout: 25_000 });
  await password.fill(DEMO_PASSWORD);
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page.waitForURL(/\/(dashboard|inbox|chain|bookings|my-day|onboarding|settings)/, {
    timeout: 60_000,
  });
  if (!page.url().includes(landingPath.replace(/\?.*$/, ""))) {
    await page.goto(landingPath.startsWith("/") ? landingPath : `/${landingPath}`, {
      waitUntil: "domcontentloaded",
    });
  }
}

/** Exchange a Clerk sign-in ticket via the JS SDK (reliable in Playwright vs __clerk_ticket URL). */
export async function clerkTicketSignIn(
  page: Page,
  token: string,
  opts?: { businessId?: string; landingPath?: string; devPersona?: string; fallbackEmail?: string },
) {
  await page.goto("/", { waitUntil: "domcontentloaded", timeout: 60_000 });
  await page.waitForFunction(
    () => (window as unknown as { Clerk?: { loaded?: boolean } }).Clerk?.loaded === true,
    { timeout: 45_000 },
  );

  let signedIn = false;
  try {
    signedIn = await page.evaluate(
      async ({ ticket, businessId, devPersona }) => {
        const clerk = (
          window as unknown as {
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
          }
        ).Clerk;
        if (!clerk?.client?.signIn || !ticket) return false;
        const attempt = await clerk.client.signIn.create({ strategy: "ticket", ticket });
        if (attempt.status !== "complete" || !attempt.createdSessionId) return false;
        await clerk.setActive({ session: attempt.createdSessionId });
        if (businessId) {
          window.localStorage.setItem("livia.currentBusinessId", businessId);
        }
        if (devPersona) {
          window.localStorage.setItem("livia.devPersona", devPersona);
        }
        return true;
      },
      { ticket: token, businessId: opts?.businessId ?? null, devPersona: opts?.devPersona ?? null },
    );
  } catch {
    signedIn = false;
  }

  if (!signedIn) {
    if (!opts?.fallbackEmail) {
      throw new Error("Clerk ticket exchange failed and no fallback email provided");
    }
    await signInWithPassword(page, opts.fallbackEmail, opts.landingPath ?? "/dashboard");
    return;
  }

  const landing = opts?.landingPath ?? "/dashboard";
  await page.goto(landing.startsWith("/") ? landing : `/${landing}`, {
    waitUntil: "domcontentloaded",
    timeout: 60_000,
  });

  await dismissLegalAcceptance(page);

  await page.waitForURL(/\/(dashboard|inbox|chain|bookings|my-day|onboarding|settings)/, {
    timeout: 60_000,
  });
  await ensurePlatformLegalAccepted(page);
}

export async function signInBusiness(page: Page, slug: string) {
  await page.addInitScript(() => {
    try {
      window.localStorage.setItem("livia.platformTour.dismissed.v1", "1");
    } catch {
      /* ignore */
    }
  });

  const metaRes = await page.request.post(`${apiBase}/api/demo/sign-in-business`, { data: { slug } });
  if (!metaRes.ok()) {
    throw new Error(`sign-in-business ${slug}: ${metaRes.status()} ${(await metaRes.text()).slice(0, 200)}`);
  }
  const { email, landingPath = "/dashboard", businessId, token } = (await metaRes.json()) as {
    email?: string;
    landingPath?: string;
    businessId?: string;
    token?: string;
  };
  if (!email) throw new Error(`No demo email for ${slug}`);

  // Prefer server-issued ticket — same path as demo portal one-click sign-in.
  if (token) {
    await clerkTicketSignIn(page, token, {
      businessId,
      landingPath,
      devPersona: "owner",
      fallbackEmail: email,
    });
    await ensurePlatformLegalAccepted(page);
    await dismissPlatformTour(page);
    return;
  }

  // Fallback: fresh ticket from sign-in-email (password verified server-side).
  const emailRes = await page.request.post(`${apiBase}/api/demo/sign-in-email`, {
    data: { email, password: DEMO_PASSWORD },
  });
  if (!emailRes.ok()) {
    throw new Error(`sign-in-email ${email}: ${emailRes.status()} ${(await emailRes.text()).slice(0, 200)}`);
  }
  const { token: emailToken } = (await emailRes.json()) as { token?: string };
  if (!emailToken) throw new Error(`No Clerk ticket for ${email}`);
  await clerkTicketSignIn(page, emailToken, {
    businessId,
    landingPath,
    devPersona: "owner",
    fallbackEmail: email,
  });
  await dismissPlatformTour(page);
}

/** Clerk bearer for API calls when cookie jar on page.request is flaky. */
export async function clerkBearer(page: Page): Promise<string | null> {
  return page.evaluate(async () => {
    const clerk = (
      window as unknown as {
        Clerk?: { session?: { getToken: () => Promise<string | null> } };
      }
    ).Clerk;
    return (await clerk?.session?.getToken?.()) ?? null;
  });
}

export async function authedApiGet(page: Page, path: string) {
  const token = await clerkBearer(page);
  const url = path.startsWith("http") ? path : `${apiBase}${path.startsWith("/") ? path : `/${path}`}`;
  return page.request.get(url, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
}

export async function assertHealthyPage(page: Page, route: string) {
  await dismissLegalAcceptance(page);
  const body = await page.locator("body").innerText();
  for (const pat of ERROR_PATTERNS) {
    expect(body, `${route} should not match ${pat}`).not.toMatch(pat);
  }
  await expect(page.locator("body")).not.toContainText(/sign in to your command center/i);
}
