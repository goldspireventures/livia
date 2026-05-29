import { afterEach, describe, expect, it } from "vitest";
import {
  getApiPublicUrl,
  getCorsAllowedOrigins,
  getDashboardUrl,
  resolveClerkProxyUrl,
} from "../public-urls";

const ENV_KEYS = [
  "DASHBOARD_URL",
  "DASHBOARD_BASE_URL",
  "DASHBOARD_PUBLIC_URL",
  "API_PUBLIC_URL",
  "PUBLIC_BASE_URL",
  "CLERK_PROXY_URL",
  "CORS_ALLOWED_ORIGINS",
  "NODE_ENV",
] as const;

function clearEnv() {
  for (const k of ENV_KEYS) delete process.env[k];
}

describe("public-urls", () => {
  afterEach(clearEnv);

  it("prefers DASHBOARD_URL over legacy names", () => {
    process.env.DASHBOARD_PUBLIC_URL = "http://wrong";
    process.env.DASHBOARD_URL = "https://app.livia-hq.com";
    expect(getDashboardUrl()).toBe("https://app.livia-hq.com");
  });

  it("falls back to legacy DASHBOARD_BASE_URL", () => {
    process.env.DASHBOARD_BASE_URL = "https://app.livia-hq.com";
    expect(getDashboardUrl()).toBe("https://app.livia-hq.com");
  });

  it("derives Clerk proxy from dashboard URL", () => {
    process.env.DASHBOARD_URL = "https://app.livia-hq.com";
    expect(
      resolveClerkProxyUrl({ headers: { host: "api.livia-hq.com" } }),
    ).toBe("https://app.livia-hq.com/api/__clerk");
  });

  it("uses API_PUBLIC_URL with PUBLIC_BASE_URL fallback", () => {
    process.env.PUBLIC_BASE_URL = "https://api.livia-hq.com";
    expect(getApiPublicUrl()).toBe("https://api.livia-hq.com");
  });

  it("merges surface URLs into CORS when listed explicitly", () => {
    process.env.NODE_ENV = "production";
    process.env.CORS_ALLOWED_ORIGINS = "https://livia-hq.com";
    process.env.DASHBOARD_URL = "https://app.livia-hq.com";
    const origins = getCorsAllowedOrigins();
    expect(origins).toContain("https://livia-hq.com");
    expect(origins).toContain("https://app.livia-hq.com");
  });
});
