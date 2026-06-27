/**
 * Mobile API parity — same backend spine as livia-mobile (no emulator).
 *
 *   pnpm pls:mobile-api
 */
import { test, expect } from "@playwright/test";
import {
  ensureDemoProvisioned,
  signInBusiness,
  demoHasBusiness,
  demoCanSignIn,
  apiBase,
} from "../helpers/demo-auth";

const OWNER_SLUG = "bloom-beauty-dublin";
const WELLNESS_SLUG = "harbour-wellness-cork";
const FOUNDER_SLUG = "aurora-studio";

test.describe("Mobile API parity (shared spine)", () => {
  test.describe.configure({ mode: "serial", timeout: 180_000 });

  test.beforeAll(async ({ request }) => {
    await ensureDemoProvisioned(request);
  });

  test("guest hub spine (mobile /my-livia)", async ({ request }) => {
    const otpReq = await request.post(`${apiBase}/api/public/guest-hub/otp/request`, {
      data: { phone: "+353871234567", country: "IE" },
    });
    expect([201, 503]).toContain(otpReq.status());
    if (otpReq.status() === 503) {
      test.skip(true, "OTP delivery not configured locally");
    }
    const body = (await otpReq.json()) as {
      sessionToken?: string;
      devOtp?: string;
      magicOtpCode?: string;
    };
    const verify = await request.post(`${apiBase}/api/public/guest-hub/otp/verify`, {
      data: {
        sessionToken: body.sessionToken,
        code: body.devOtp ?? body.magicOtpCode ?? "000000",
      },
    });
    expect(verify.ok()).toBeTruthy();
    const { hubToken } = (await verify.json()) as { hubToken?: string };
    expect(hubToken).toBeTruthy();

    const me = await request.get(`${apiBase}/api/public/guest-hub/me`, {
      headers: { "X-Guest-Hub-Token": hubToken! },
    });
    expect(me.ok()).toBeTruthy();
  });

  test("owner tenant-experience + notifications + activity (mobile Today/settings)", async ({
    page,
    request,
  }) => {
    if (!(await demoHasBusiness(request, OWNER_SLUG)) || !(await demoCanSignIn(request, OWNER_SLUG))) {
      test.skip(true, "owner unavailable");
    }
    await signInBusiness(page, OWNER_SLUG, { resetSession: true });

    const status = await request.get(`${apiBase}/api/demo/status`);
    const businesses = ((await status.json()) as { businesses?: Array<{ slug: string; id: string }> })
      .businesses ?? [];
    const biz = businesses.find((b) => b.slug === OWNER_SLUG);
    expect(biz?.id).toBeTruthy();

    const te = await page.request.get(
      `/api/me/tenant-experience?businessId=${encodeURIComponent(biz!.id)}`,
    );
    expect(te.ok()).toBeTruthy();
    const vocab = (await te.json()) as { vocabulary?: { locationNoun?: string } };
    expect(vocab.vocabulary?.locationNoun).toBeTruthy();

    const notif = await page.request.get("/api/me/notifications?limit=5");
    expect(notif.status()).toBeLessThan(500);

    const feed = await page.request.get(`/api/businesses/${biz!.id}/activity-feed?limit=5`);
    expect(feed.status()).toBeLessThan(500);
  });

  test("staff my-day spine (mobile my-day tab)", async ({ page, request }) => {
    if (!(await demoHasBusiness(request, OWNER_SLUG)) || !(await demoCanSignIn(request, OWNER_SLUG))) {
      test.skip(true, "demo sign-in unavailable");
    }
    await signInBusiness(page, OWNER_SLUG, { resetSession: true });
    const myDay = await page.request.get("/api/me/my-day");
    expect(myDay.status()).toBeLessThan(500);
  });

  test("founder chain rollup (mobile Glance tab)", async ({ page, request }) => {
    if (!(await demoHasBusiness(request, FOUNDER_SLUG)) || !(await demoCanSignIn(request, FOUNDER_SLUG))) {
      test.skip(true, "founder shop unavailable");
    }
    await signInBusiness(page, FOUNDER_SLUG, { resetSession: true });
    const rollup = await page.request.get("/api/me/chain-rollup");
    expect([200, 403, 404]).toContain(rollup.status());
  });

  test("wellness public + capabilities (mobile skin source)", async ({ request }) => {
    if (!(await demoHasBusiness(request, WELLNESS_SLUG))) test.skip(true, WELLNESS_SLUG);
    const pub = await request.get(`${apiBase}/api/public/b/${WELLNESS_SLUG}`);
    expect(pub.ok()).toBeTruthy();
  });

  test("vertical mobile menu routes exist in codebase", async () => {
    const { readFileSync, existsSync } = await import("node:fs");
    const { join } = await import("node:path");
    const mobileRoot = join(process.cwd(), "..", "artifacts", "livia-mobile");
    const routes = [
      "app/clinical-hub.tsx",
      "app/design-proofs.tsx",
      "app/enquiries.tsx",
      "app/quotes.tsx",
      "app/store.tsx",
    ];
    for (const r of routes) {
      expect(existsSync(join(mobileRoot, r)), r).toBeTruthy();
    }
    const menu = readFileSync(join(mobileRoot, "lib", "mobile-menu.ts"), "utf8");
    expect(menu).toContain("event-vendors");
    expect(menu).toContain("body-art");
    expect(menu).toContain("medspa");
  });
});
