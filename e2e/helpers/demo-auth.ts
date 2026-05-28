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

export async function signInBusiness(page: Page, slug: string) {
  await page.addInitScript(() => {
    try {
      window.localStorage.setItem("livia.platformTour.dismissed.v1", "1");
    } catch {
      /* ignore */
    }
  });
  const res = await page.request.post(`${apiBase}/api/demo/sign-in-business`, {
    data: { slug },
  });
  if (!res.ok()) {
    throw new Error(`sign-in-business ${slug}: ${res.status()} ${(await res.text()).slice(0, 200)}`);
  }
  const { token } = (await res.json()) as { token?: string };
  if (!token) throw new Error(`No Clerk ticket for ${slug}`);
  await page.goto(`/sign-in?__clerk_ticket=${encodeURIComponent(token)}`, {
    waitUntil: "domcontentloaded",
    timeout: 60_000,
  });
  await page.waitForURL(/\/(dashboard|inbox|chain|bookings)/, { timeout: 60_000 });
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
  const body = await page.locator("body").innerText();
  for (const pat of ERROR_PATTERNS) {
    expect(body, `${route} should not match ${pat}`).not.toMatch(pat);
  }
  await expect(page.locator("body")).not.toContainText(/sign in to your command center/i);
}
