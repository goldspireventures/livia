import * as WebBrowser from "expo-web-browser";
import { getDashboardBaseUrl } from "@/lib/dashboard-url";

export type StripeCheckoutOutcome = "success" | "cancel" | "dismiss";

/**
 * Open Stripe checkout and wait until the user returns via dashboard success URL.
 * Stripe success/cancel URLs are always on the web dashboard — not in-app routes.
 */
export async function openStripeCheckoutSession(
  checkoutUrl: string,
  options?: {
    returnPath?: string;
  },
): Promise<StripeCheckoutOutcome> {
  const returnPath = options?.returnPath ?? "/settings?tab=billing";
  const base = getDashboardBaseUrl().replace(/\/+$/, "");
  // Prefix match — Stripe appends billing=success, addon_status, etc.
  const redirectUrl = `${base}${returnPath}`;

  const result = await WebBrowser.openAuthSessionAsync(checkoutUrl, redirectUrl);
  if (result.type === "success") return "success";
  if (result.type === "cancel") return "cancel";
  return "dismiss";
}
