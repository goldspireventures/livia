import { guestBookPath, guestBookTokenPath, migrateLegacyGuestBookPath } from "@workspace/policy";
import { publicBookingUrl } from "@/lib/surface-urls";

type GuestTokenSurface = "visit" | "proof" | "intake" | "pay" | "shop" | "waitlist";

/** Client book URL — same origin path (subdomain handled by host). */
export function clientGuestBookHref(slug: string, query = ""): string {
  return guestBookPath(slug, query);
}

export function clientGuestManageVisitHref(slug: string, bookingId: string): string {
  return `/my/${slug}/visit/${bookingId}`;
}

export function clientGuestShopHref(slug: string): string {
  return `/my/${slug}`;
}

export function normalizeClientGuestBookUrl(url: string): string {
  return migrateLegacyGuestBookPath(url);
}

export function clientGuestBookAbsoluteUrl(slug: string): string {
  return publicBookingUrl(slug);
}

/** Token deep link — absolute URL for SMS/copy (dev same-origin, prod subdomain). */
export function clientGuestTokenHref(
  slug: string,
  surface: GuestTokenSurface,
  token: string,
): string {
  if (import.meta.env.DEV) {
    const path = guestBookTokenPath(slug, surface, token);
    const origin =
      typeof window !== "undefined" ? window.location.origin.replace(/\/+$/, "") : "";
    return origin ? `${origin}${path}` : path;
  }
  return `https://${slug}.livia-hq.com/${surface}/${encodeURIComponent(token)}`;
}

const GUEST_TOKEN_SURFACES = [
  "visit",
  "proof",
  "intake",
  "pay",
  "shop",
  "waitlist",
] as const;

/**
 * Normalize API/SMS absolute guest URLs to same-origin `/book/...` paths for in-app navigation.
 * Keeps guests off staff sign-in when clicking from `/my`.
 */
export function clientGuestSurfacePathFromUrl(url: string): string {
  if (!url) return "";
  if (url.startsWith("/")) return migrateLegacyGuestBookPath(url);
  if (url.startsWith("#")) return url;

  try {
    const u = new URL(url);
    const subSlug = u.hostname.split(".")[0];
    const subMatch = u.pathname.match(
      /^\/(visit|proof|intake|pay|shop|waitlist)\/([^/]+)/,
    );
    if (
      subMatch &&
      subSlug &&
      u.hostname.endsWith(".livia-hq.com") &&
      !["app", "www", "api", "staging"].includes(subSlug)
    ) {
      const surface = subMatch[1] as (typeof GUEST_TOKEN_SURFACES)[number];
      return guestBookTokenPath(subSlug, surface, decodeURIComponent(subMatch[2]!));
    }
    return migrateLegacyGuestBookPath(u.pathname);
  } catch {
    return migrateLegacyGuestBookPath(url);
  }
}
