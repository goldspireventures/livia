/** Customer-facing production domains (override via Vite env for previews). */

const marketingOrigin =
  (import.meta.env.VITE_MARKETING_URL as string | undefined)?.replace(/\/+$/, "") ??
  "https://livia-hq.com";

export const LEGAL_ENTITY_NAME = "Goldspire Ventures Ltd";

export function getMarketingOrigin(): string {
  return marketingOrigin;
}

export function legalUrl(path: "privacy" | "tos" | "dpa" | "cookies"): string {
  return `${marketingOrigin}/legal/${path}`;
}

export function publicBookingUrl(slug: string): string {
  return `${marketingOrigin}/b/${slug}`;
}

export function marketingPricingUrl(): string {
  return `${marketingOrigin}/pricing`;
}

/** Slug field prefix in onboarding (e.g. `livia-hq.com/b/`). */
export function publicBookingSlugPrefix(): string {
  return `${marketingOrigin.replace(/^https?:\/\//, "")}/b/`;
}
