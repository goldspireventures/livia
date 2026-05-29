export function getMarketingOrigin(): string {
  return process.env.EXPO_PUBLIC_MARKETING_URL?.replace(/\/+$/, "") ?? "https://livia-hq.com";
}

/** Public booking page on the marketing site (`/b/:slug`). */
export function getPublicBookingUrl(slug: string): string {
  return `${getMarketingOrigin()}/b/${slug}`;
}

/** Host + path for UI labels (e.g. `livia-hq.com/b/my-salon`). */
export function getPublicBookingLabel(slug: string): string {
  const host = getMarketingOrigin().replace(/^https?:\/\//, "");
  return `${host}/b/${slug}`;
}
