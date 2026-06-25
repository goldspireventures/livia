import { defineConfig, devices } from "@playwright/test";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const northstarBaselines = path.resolve(
  __dirname,
  "..",
  "artifacts",
  "livia-dashboard",
  "public",
  "livia-evolution",
  "northstar",
);
const screenCardBaselines = path.resolve(__dirname, "..", "docs", "design", "assets", "screen-cards");
const rootEnv = path.resolve(__dirname, "..", ".env");
if (existsSync(rootEnv)) {
  for (const line of readFileSync(rootEnv, "utf8").split("\n")) {
    const m = line.match(/^\s*([^#=]+)=(.*)$/);
    if (m && process.env[m[1].trim()] === undefined) {
      process.env[m[1].trim()] = m[2].trim().replace(/^["']|["']$/g, "");
    }
  }
}
const founderAuth = path.join(__dirname, ".auth", "founder.json");

const apiBase = process.env.E2E_API_BASE ?? "http://127.0.0.1:3000";
const dashboardBase = process.env.E2E_DASHBOARD_BASE ?? "http://127.0.0.1:5173";
const marketingBase = process.env.E2E_MARKETING_URL ?? "http://127.0.0.1:5174";
const demoSlug = process.env.E2E_DEMO_SLUG ?? "luxe-salon-spa";

export default defineConfig({
  testDir: "./tests",
  timeout: 60_000,
  expect: { timeout: 15_000 },
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: process.env.CI ? "github" : "list",
  use: {
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "api",
      testMatch:
        /(api-gate|phase10-gate|integrations-gate|meta-channels|demo-channels-stack|booking-continuity|v3-preflight-api|tenant-experience-api|full-platform-demo|guest-token-api)\.spec\.ts/,
      use: {
        baseURL: apiBase,
      },
    },
    {
      name: "dashboard",
      testMatch:
        /(dashboard-gate|eu-owner-self-onboard|prod-onboarding-notifications|demo-owner-flow|visual-screen-p0|preset-public-parity|bloom-beauty-public|gateway-beauty-wedge|wellness-room-board|wellness-announcement-smoke|migration-import-path|onboarding-fast-track|onboarding-navigation-resilience|route-audit-cross-surface)\.spec\.ts/,
      testIgnore: /v3-preflight\.spec\.ts/,
      use: {
        ...devices["Desktop Chrome"],
        baseURL: dashboardBase,
      },
    },
    {
      name: "northstar-p0",
      testMatch: /northstar-p0-pixel\.spec\.ts/,
      workers: 1,
      timeout: 120_000,
      snapshotDir: northstarBaselines,
      expect: {
        toHaveScreenshot: {
          pathTemplate: "{snapshotDir}/{arg}{ext}",
        },
      },
      use: {
        ...devices["Desktop Chrome"],
        baseURL: dashboardBase,
      },
    },
    {
      name: "screen-card-p0",
      testMatch: /screen-card-p0-pixel\.spec\.ts/,
      workers: 1,
      timeout: 120_000,
      snapshotDir: screenCardBaselines,
      expect: {
        toHaveScreenshot: {
          pathTemplate: "{snapshotDir}/{arg}{ext}",
        },
      },
      use: {
        ...devices["Desktop Chrome"],
        baseURL: dashboardBase,
      },
    },
    {
      name: "founder-uat-p0",
      testMatch: /founder-uat-p0\.spec\.ts/,
      workers: 1,
      timeout: 120_000,
      use: {
        ...devices["Desktop Chrome"],
        baseURL: dashboardBase,
      },
    },
    {
      name: "platform",
      testMatch: /eu-full-platform\.spec\.ts/,
      use: {
        ...devices["Desktop Chrome"],
        baseURL: dashboardBase,
      },
    },
    {
      name: "v3-preflight-ui",
      testMatch: /v3-preflight\.spec\.ts/,
      testIgnore: /v3-preflight-auth\.spec\.ts/,
      workers: 1,
      use: {
        ...devices["Desktop Chrome"],
        baseURL: dashboardBase,
      },
    },
    {
      name: "v3-preflight-auth",
      testMatch: /(v3-preflight-auth|inbox-channel-routing)\.spec\.ts/,
      dependencies: ["founder-auth-setup"],
      timeout: 120_000,
      use: {
        ...devices["Desktop Chrome"],
        baseURL: dashboardBase,
        storageState: founderAuth,
      },
    },
    {
      name: "internal",
      testMatch: /internal-gate\.spec\.ts|internal-monitoring-gate\.spec\.ts/,
      use: {
        baseURL: apiBase,
      },
    },
    {
      name: "marketing",
      testMatch: /marketing-gate\.spec\.ts/,
      use: {
        ...devices["Desktop Chrome"],
        baseURL: marketingBase,
      },
    },
    {
      name: "marketing-platform",
      testMatch: /marketing-platform-smoke\.spec\.ts/,
      timeout: 120_000,
      use: {
        ...devices["Desktop Chrome"],
        baseURL: marketingBase,
      },
    },
    {
      name: "marketing-lifecycle",
      testMatch: /marketing-lifecycle\.spec\.ts/,
      timeout: 180_000,
      workers: 1,
      use: {
        ...devices["Desktop Chrome"],
        baseURL: marketingBase,
      },
    },
    {
      name: "marketing-visual",
      testMatch: /marketing-visual-capture\.spec\.ts/,
      use: {
        ...devices["Desktop Chrome"],
        baseURL: marketingBase,
      },
    },
    {
      name: "asset-capture",
      testMatch: /capture-(platform-default-wedge-book|event-vendor-wedge-beats|vertical-wedge-beats)\.spec\.ts/,
      timeout: 600_000,
      use: {
        ...devices["Desktop Chrome"],
        baseURL: dashboardBase,
      },
    },
    {
      name: "marketing-showcase",
      testMatch: /marketing-showcase-capture\.spec\.ts/,
      timeout: 180_000,
      use: {
        ...devices["Desktop Chrome"],
        baseURL: dashboardBase,
      },
    },
    {
      name: "visual-capture",
      testMatch: /visual-audit-capture\.spec\.ts/,
      dependencies: ["founder-auth-setup"],
      timeout: 180_000,
      use: {
        ...devices["Desktop Chrome"],
        baseURL: dashboardBase,
      },
    },
    {
      name: "founder-auth-setup",
      testMatch: /auth\.setup\.ts/,
      use: {
        ...devices["Desktop Chrome"],
        baseURL: dashboardBase,
      },
    },
    {
      name: "founder-checklist",
      testMatch: /founder-checklist-visual\.spec\.ts/,
      dependencies: ["founder-auth-setup"],
      timeout: 120_000,
      use: {
        ...devices["Desktop Chrome"],
        baseURL: dashboardBase,
        storageState: founderAuth,
      },
    },
    {
      name: "contextual-web",
      testMatch: /contextual-audit-web\.spec\.ts/,
      timeout: 300_000,
      use: {
        ...devices["Desktop Chrome"],
        baseURL: dashboardBase,
      },
    },
    {
      name: "full-visual-audit",
      testMatch: /full-platform-visual-audit\.spec\.ts/,
      timeout: 600_000,
      workers: 1,
      use: {
        ...devices["Desktop Chrome"],
        baseURL: dashboardBase,
      },
    },
    {
      name: "internal-visual",
      testMatch: /internal-visual-capture\.spec\.ts/,
      timeout: 120_000,
      use: {
        ...devices["Desktop Chrome"],
        baseURL: process.env.E2E_INTERNAL_BASE ?? "http://127.0.0.1:5175",
      },
    },
    {
      name: "mobile-viewport",
      testMatch: /mobile-viewport-web-capture\.spec\.ts/,
      timeout: 180_000,
      workers: 1,
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 390, height: 844 },
        isMobile: true,
        hasTouch: true,
        baseURL: dashboardBase,
      },
    },
    {
      name: "ux-quality-gate",
      testMatch: /ux-quality-gate\.spec\.ts/,
      timeout: 300_000,
      workers: 1,
      use: {
        ...devices["Desktop Chrome"],
        baseURL: dashboardBase,
      },
    },
    {
      name: "visual-deep-analysis",
      testMatch: /visual-deep-analysis\.spec\.ts/,
      timeout: 900_000,
      workers: 1,
      use: {
        ...devices["Desktop Chrome"],
        baseURL: dashboardBase,
      },
    },
    {
      name: "sacred-path-signup",
      testMatch: /sacred-path-signup\.spec\.ts/,
      timeout: 300_000,
      workers: 1,
      use: {
        ...devices["Desktop Chrome"],
        baseURL: dashboardBase,
      },
    },
    {
      name: "all-verticals-smoke",
      testMatch: /all-verticals-smoke\.spec\.ts/,
      timeout: 600_000,
      workers: 1,
      use: {
        ...devices["Desktop Chrome"],
        baseURL: dashboardBase,
      },
    },
    {
      name: "public-booking-quality",
      testMatch: /public-booking-quality\.spec\.ts/,
      timeout: 300_000,
      workers: 1,
      use: {
        ...devices["Desktop Chrome"],
        baseURL: dashboardBase,
      },
    },
    {
      name: "guest-retail-cart",
      testMatch: /guest-retail-cart\.spec\.ts/,
      timeout: 300_000,
      workers: 1,
      use: {
        ...devices["Desktop Chrome"],
        baseURL: dashboardBase,
      },
    },
    {
      name: "internal-ops-smoke",
      testMatch: /internal-ops-smoke\.spec\.ts/,
      timeout: 120_000,
      workers: 1,
      use: {
        ...devices["Desktop Chrome"],
        baseURL: process.env.E2E_INTERNAL_BASE ?? "http://127.0.0.1:5175",
      },
    },
    {
      name: "settings-preset-picker",
      testMatch: /settings-preset-picker\.spec\.ts/,
      timeout: 180_000,
      workers: 1,
      use: {
        ...devices["Desktop Chrome"],
        baseURL: dashboardBase,
      },
    },
    {
      name: "demo-live-day",
      testMatch: /demo-live-day\.spec\.ts/,
      timeout: 240_000,
      workers: 1,
      use: {
        ...devices["Desktop Chrome"],
        baseURL: dashboardBase,
      },
    },
    {
      name: "demo-proof-token",
      testMatch: /demo-proof-token\.spec\.ts/,
      timeout: 180_000,
      workers: 1,
      use: {
        ...devices["Desktop Chrome"],
        baseURL: dashboardBase,
      },
    },
    {
      name: "demo-intake-token",
      testMatch: /demo-intake-token\.spec\.ts/,
      timeout: 180_000,
      workers: 1,
      use: {
        ...devices["Desktop Chrome"],
        baseURL: dashboardBase,
      },
    },
    {
      name: "guest-hub",
      testMatch: /guest-hub\.spec\.ts/,
      timeout: 60_000,
      workers: 1,
      use: {
        ...devices["Desktop Chrome"],
        baseURL: dashboardBase,
      },
    },
    {
      name: "guest-pay",
      testMatch: /guest-pay\.spec\.ts/,
      timeout: 180_000,
      workers: 1,
      use: {
        ...devices["Desktop Chrome"],
        baseURL: dashboardBase,
      },
    },
    {
      name: "guest-balance",
      testMatch: /guest-balance\.spec\.ts/,
      timeout: 180_000,
      workers: 1,
      use: {
        ...devices["Desktop Chrome"],
        baseURL: dashboardBase,
      },
    },
    {
      name: "platform-commitment",
      testMatch: /platform-commitment-depth\.spec\.ts/,
      timeout: 240_000,
      workers: 1,
      use: {
        ...devices["Desktop Chrome"],
        baseURL: dashboardBase,
      },
    },
    {
      name: "demo-waitlist-token",
      testMatch: /demo-waitlist-token\.spec\.ts/,
      timeout: 180_000,
      workers: 1,
      use: {
        ...devices["Desktop Chrome"],
        baseURL: dashboardBase,
      },
    },
    {
      name: "guest-token-suite",
      testMatch: /guest-token-suite\.spec\.ts/,
      timeout: 300_000,
      workers: 1,
      use: {
        ...devices["Desktop Chrome"],
        baseURL: dashboardBase,
      },
    },
    {
      name: "guest-care-aftercare",
      testMatch: /guest-care-aftercare\.spec\.ts/,
      timeout: 180_000,
      workers: 1,
      use: {
        ...devices["Desktop Chrome"],
        baseURL: dashboardBase,
      },
    },
    {
      name: "innovation-p0-e2e",
      testMatch: /innovation-p0-e2e\.spec\.ts/,
      timeout: 600_000,
      workers: 1,
      use: {
        ...devices["Desktop Chrome"],
        baseURL: dashboardBase,
      },
    },
    {
      name: "guest-hub-smoke",
      testMatch: /guest-hub-smoke\.spec\.ts/,
      timeout: 300_000,
      workers: 1,
      use: {
        ...devices["Desktop Chrome"],
        baseURL: dashboardBase,
      },
    },
    {
      name: "public-book-perf",
      testMatch: /public-book-perf\.spec\.ts/,
      timeout: 120_000,
      workers: 1,
      use: {
        ...devices["Desktop Chrome"],
        baseURL: dashboardBase,
      },
    },
    {
      name: "dm-booking-flow",
      testMatch: /dm-booking-flow\.spec\.ts/,
      timeout: 300_000,
      workers: 1,
      use: {
        ...devices["Desktop Chrome"],
        baseURL: dashboardBase,
      },
    },
    {
      name: "dual-entry-uat",
      testMatch: /dual-entry-uat\.spec\.ts/,
      timeout: 600_000,
      workers: 1,
      use: {
        ...devices["Desktop Chrome"],
        baseURL: dashboardBase,
      },
    },
  ],
  metadata: {
    demoSlug,
    apiBase,
    dashboardBase,
  },
});
