/**
 * Returning founder with incomplete onboarding resumes at profile — not create-business.
 */
import { test, expect } from "@playwright/test";
import { clerkTicketSignIn, apiBase } from "../helpers/demo-auth";
import { provisionFreshSignupFounder } from "../helpers/fresh-founder";

test.describe("founder onboarding resume", () => {
  test("sign-in resumes incomplete shop instead of slug collision", async ({ page, request }) => {
    test.setTimeout(120_000);
    const founder = await provisionFreshSignupFounder(request, `resume-${Date.now()}`);
    const slug = `resume-shop-${Date.now().toString(36)}`;

    await clerkTicketSignIn(page, founder.token, {
      landingPath: "/onboarding",
      fallbackEmail: founder.email,
    });

    const createRes = await page.request.post(`${apiBase}/api/businesses`, {
      data: {
        name: "Resume Test Clinic",
        slug,
        timezone: "Europe/Dublin",
        jurisdiction: "IE",
        vertical: "allied-health",
        category: "Physiotherapy",
        subverticalProfileId: "allied.physio",
        tier: "solo",
        tenantAttestation: {
          entityKind: "sole_trader",
          tradingName: "Resume Test Clinic",
          attestedAt: new Date().toISOString(),
        },
      },
    });
    expect(createRes.ok(), await createRes.text()).toBeTruthy();

    await page.goto("/onboarding", { waitUntil: "domcontentloaded" });
    await expect(page.getByTestId("onboarding-page")).toBeVisible({ timeout: 30_000 });
    await expect(page.getByLabel("Business name")).toHaveCount(0, { timeout: 20_000 });

    const duplicateRes = await page.request.post(`${apiBase}/api/businesses`, {
      data: {
        name: "Resume Test Clinic",
        slug,
        timezone: "Europe/Dublin",
        jurisdiction: "IE",
        vertical: "allied-health",
        tier: "solo",
        tenantAttestation: {
          entityKind: "sole_trader",
          tradingName: "Resume Test Clinic",
          attestedAt: new Date().toISOString(),
        },
      },
    });
    expect(duplicateRes.ok(), await duplicateRes.text()).toBeTruthy();
    const duplicateBody = await duplicateRes.json();
    expect(duplicateBody.slug).toBe(slug);
  });

  test("fresh import handoff resumes existing shop instead of create form", async ({ page, request }) => {
    test.setTimeout(120_000);
    const founder = await provisionFreshSignupFounder(request, `fresh-resume-${Date.now()}`);
    const slug = `fresh-resume-${Date.now().toString(36)}`;

    await clerkTicketSignIn(page, founder.token, {
      landingPath: "/onboarding",
      fallbackEmail: founder.email,
    });

    const createRes = await page.request.post(`${apiBase}/api/businesses`, {
      data: {
        name: "Fresh Resume Clinic",
        slug,
        timezone: "Europe/Dublin",
        jurisdiction: "IE",
        vertical: "allied-health",
        category: "Physiotherapy",
        subverticalProfileId: "allied.physio",
        tier: "solo",
        tenantAttestation: {
          entityKind: "sole_trader",
          tradingName: "Fresh Resume Clinic",
          attestedAt: new Date().toISOString(),
        },
      },
    });
    expect(createRes.ok(), await createRes.text()).toBeTruthy();

    await page.goto("/onboarding?fresh=1&track=import", { waitUntil: "domcontentloaded" });
    await expect(page.getByTestId("onboarding-page")).toBeVisible({ timeout: 30_000 });
    await expect(page.getByLabel("Business name")).toHaveCount(0, { timeout: 20_000 });
  });
});
