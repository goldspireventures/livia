/** Local dev defaults — override in `.env` for deploy. */
import { isMarketingDemoWedgeUnlocked, type BusinessVertical } from "@workspace/policy";
const dashboardOrigin =
  (import.meta.env.VITE_DASHBOARD_URL as string | undefined)?.replace(/\/+$/, "") ??
  (import.meta.env.VITE_DASHBOARD_SIGN_IN_URL as string | undefined)?.replace(
    /\/sign-in\/?$/,
    "",
  ) ??
  "http://127.0.0.1:5173";

export const dashboardDemoUrl =
  (import.meta.env.VITE_DASHBOARD_DEMO_URL as string | undefined)?.replace(/\/+$/, "") ??
  `${dashboardOrigin}/demo`;

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
  const base = isMarketingDemoWedgeUnlocked(slug)
    ? `${dashboardDemoUrl}/wedge/${slug}`
    : `${dashboardDemoUrl}?vertical=${encodeURIComponent(slug)}`;
  const key = gateKey?.trim();
  if (!key) return base;
  const sep = base.includes("?") ? "&" : "?";
  return `${base}${sep}key=${encodeURIComponent(key)}`;
}

export const dashboardSignInUrl =
  (import.meta.env.VITE_DASHBOARD_SIGN_IN_URL as string | undefined)?.replace(/\/+$/, "") ??
  `${dashboardOrigin}/sign-in`;

export const dashboardSignUpUrl =
  (import.meta.env.VITE_DASHBOARD_SIGN_UP_URL as string | undefined)?.replace(/\/+$/, "") ??
  `${dashboardOrigin}/sign-up`;

export const apiBaseUrl =
  (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/+$/, "") ??
  (typeof window !== "undefined" ? window.location.origin : "http://127.0.0.1:3000");

const marketingOrigin =
  (import.meta.env.VITE_MARKETING_URL as string | undefined)?.replace(/\/+$/, "") ??
  "https://livia-hq.com";

/** Production legal pages — local marketing shows draft notice until Gate 3. */
export const legalBase =
  (import.meta.env.VITE_LEGAL_BASE_URL as string | undefined)?.replace(/\/+$/, "") ??
  `${marketingOrigin}/legal`;

export { marketingOrigin };
