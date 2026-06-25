/**
 * Resolve handoff targets from the marketing host the visitor is on.
 * Production livia-hq.com must never send founders to app.staging — even if Vite env is wrong.
 */
import {
  classifyMarketingHost,
  LIVIA_MARKETING_SURFACE_URLS,
  type MarketingSurfaceTier,
} from "@workspace/policy";

export type { MarketingSurfaceTier };

export function detectMarketingSurface(): MarketingSurfaceTier {
  if (typeof window !== "undefined") {
    return classifyMarketingHost(window.location.hostname);
  }
  if (import.meta.env.DEV) return "local";
  const marketingHint = String(import.meta.env.VITE_MARKETING_URL ?? "");
  if (marketingHint.includes("staging.livia-hq.com")) return "staging";
  return "production";
}

function tierHosts(tier: MarketingSurfaceTier) {
  if (tier === "production") return LIVIA_MARKETING_SURFACE_URLS.production;
  if (tier === "staging") return LIVIA_MARKETING_SURFACE_URLS.staging;
  return {
    marketing:
      (import.meta.env.VITE_MARKETING_URL as string | undefined)?.replace(/\/+$/, "") ??
      "http://127.0.0.1:5174",
    dashboard:
      (import.meta.env.VITE_DASHBOARD_URL as string | undefined)?.replace(/\/+$/, "") ??
      "http://127.0.0.1:5173",
    api:
      (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/+$/, "") ??
      "http://127.0.0.1:3000",
  };
}

export function resolveMarketingOrigin(): string {
  return tierHosts(detectMarketingSurface()).marketing;
}

export function resolveDashboardOrigin(): string {
  const tier = detectMarketingSurface();
  if (tier === "local") {
    const fromSignIn = (import.meta.env.VITE_DASHBOARD_SIGN_IN_URL as string | undefined)?.replace(
      /\/sign-in\/?$/,
      "",
    );
    if (fromSignIn) return fromSignIn.replace(/\/+$/, "");
  }
  return tierHosts(tier).dashboard;
}

export function resolveDashboardSignInUrl(): string {
  const tier = detectMarketingSurface();
  if (tier === "local") {
    const override = import.meta.env.VITE_DASHBOARD_SIGN_IN_URL as string | undefined;
    if (override) return override.replace(/\/+$/, "");
  }
  return `${resolveDashboardOrigin()}/sign-in`;
}

export function resolveDashboardSignUpUrl(): string {
  const tier = detectMarketingSurface();
  if (tier === "local") {
    const override = import.meta.env.VITE_DASHBOARD_SIGN_UP_URL as string | undefined;
    if (override) return override.replace(/\/+$/, "");
  }
  return `${resolveDashboardOrigin()}/sign-up`;
}

export function resolveDashboardDemoUrl(): string {
  const tier = detectMarketingSurface();
  if (tier === "local") {
    const override = import.meta.env.VITE_DASHBOARD_DEMO_URL as string | undefined;
    if (override) return override.replace(/\/+$/, "");
  }
  return `${resolveDashboardOrigin()}/demo`;
}

export function resolveApiBaseUrl(): string {
  const tier = detectMarketingSurface();
  if (tier === "local") {
    const override = import.meta.env.VITE_API_BASE_URL as string | undefined;
    if (override) return override.replace(/\/+$/, "");
    if (typeof window !== "undefined") return window.location.origin.replace(/\/+$/, "");
  }
  return tierHosts(tier).api;
}

export function resolveLegalBase(): string {
  const tier = detectMarketingSurface();
  if (tier === "local") {
    const override = import.meta.env.VITE_LEGAL_BASE_URL as string | undefined;
    if (override) return override.replace(/\/+$/, "");
  }
  return `${resolveMarketingOrigin()}/legal`;
}
