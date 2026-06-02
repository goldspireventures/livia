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

/** W1 concierge gate — marketing-hosted demo entry before app handoff. */
export const marketingDemoPath = "/demo";

/** W2 demo stories with shipped wedge — link to card-stage (G2). */
export function dashboardWedgeUrl(verticalSlug: string): string {
  const slug = verticalSlug.replace(/^\/+/, "") as BusinessVertical;
  if (isMarketingDemoWedgeUnlocked(slug)) {
    return `${dashboardDemoUrl}/wedge/${slug}`;
  }
  return `${dashboardDemoUrl}?vertical=${encodeURIComponent(slug)}`;
}

export const dashboardSignInUrl =
  (import.meta.env.VITE_DASHBOARD_SIGN_IN_URL as string | undefined)?.replace(/\/+$/, "") ??
  `${dashboardOrigin}/sign-in`;

export const dashboardSignUpUrl =
  (import.meta.env.VITE_DASHBOARD_SIGN_UP_URL as string | undefined)?.replace(/\/+$/, "") ??
  `${dashboardOrigin}/sign-up`;

export const apiBaseUrl =
  (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/+$/, "") ??
  "http://127.0.0.1:3001";

const marketingOrigin =
  (import.meta.env.VITE_MARKETING_URL as string | undefined)?.replace(/\/+$/, "") ??
  "https://livia-hq.com";

/** Production legal pages — local marketing shows draft notice until Gate 3. */
export const legalBase =
  (import.meta.env.VITE_LEGAL_BASE_URL as string | undefined)?.replace(/\/+$/, "") ??
  `${marketingOrigin}/legal`;

export { marketingOrigin };
