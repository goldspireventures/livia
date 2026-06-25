/** Marketing routes + dashboard handoff — host-aware (prod vs staging vs local). */
import { isMarketingDemoWedgeUnlocked, type BusinessVertical } from "@workspace/policy";
import {
  resolveApiBaseUrl,
  resolveDashboardDemoUrl,
  resolveDashboardSignInUrl,
  resolveDashboardSignUpUrl,
  resolveLegalBase,
  resolveMarketingOrigin,
} from "@/lib/marketing-surface-urls";

/** Self-serve registration handoff → dashboard Clerk sign-up (primary marketing CTA). */
export const marketingGetStartedPath = "/get-started";

/** Retired URL — App redirects to get-started; do not link in new UI. */
export const marketingLegacyBookDemoPath = "/book-demo";

/** @deprecated Use marketingGetStartedPath — kept for redirect + handoff fallbacks. */
export const marketingBookDemoPath = marketingGetStartedPath;

/** W1 concierge gate — invited guests pick a vertical before app handoff. */
export const marketingDemoConciergePath = "/demo";

/** @deprecated Use marketingGetStartedPath for cold-traffic CTAs. */
export const marketingDemoPath = marketingGetStartedPath;

export function marketingGetStartedUrl(verticalSlug?: string): string {
  const slug = verticalSlug?.replace(/^\/+/, "").trim();
  if (!slug) return marketingGetStartedPath;
  return `${marketingGetStartedPath}?vertical=${encodeURIComponent(slug)}`;
}

/** @deprecated Use marketingGetStartedUrl */
export function marketingBookDemoUrl(verticalSlug?: string): string {
  return marketingGetStartedUrl(verticalSlug);
}

/** W2 demo stories with shipped wedge — link to card-stage (G2). */
export function dashboardWedgeUrl(verticalSlug: string, gateKey?: string | null): string {
  const slug = verticalSlug.replace(/^\/+/, "") as BusinessVertical;
  const demoBase = resolveDashboardDemoUrl();
  const base = isMarketingDemoWedgeUnlocked(slug)
    ? `${demoBase}/wedge/${slug}`
    : `${demoBase}?vertical=${encodeURIComponent(slug)}`;
  const key = gateKey?.trim();
  if (!key) return base;
  const sep = base.includes("?") ? "&" : "?";
  return `${base}${sep}key=${encodeURIComponent(key)}`;
}

export function dashboardDemoUrl(): string {
  return resolveDashboardDemoUrl();
}

export function dashboardSignInUrl(): string {
  return resolveDashboardSignInUrl();
}

export function dashboardSignUpUrl(): string {
  return resolveDashboardSignUpUrl();
}

export function apiBaseUrl(): string {
  return resolveApiBaseUrl();
}

export function marketingOrigin(): string {
  return resolveMarketingOrigin();
}

export function legalBase(): string {
  return resolveLegalBase();
}
