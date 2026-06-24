/**
 * Guest book + relationship URLs — no user-facing `/b` prefix.
 * Book: `{slug}.livia-hq.com` (prod) or `/book/{slug}` (same-origin dev).
 * Relationship: `/my/{slug}` and `/my/{slug}/visit/{bookingId}`.
 */

/** Owner-facing label — never expose internal `/b` route prefix in UI copy. */
export const GUEST_BOOK_OWNER_LABEL = "public booking page";
export const GUEST_BOOK_OWNER_LABEL_SHORT = "booking page";
export const GUEST_PORTAL_OWNER_LABEL = "guest portal";

const RESERVED_SUBDOMAINS = new Set(["app", "www", "api", "staging", "stg", "demo", "mail"]);

export type GuestBookUrlEnv = {
  /** e.g. `livia-hq.com` — prod book host suffix */
  bookHostSuffix?: string;
  /** e.g. `https://app.livia-hq.com` — same-origin fallback */
  appOrigin?: string;
  /** Force path mode (local dev without wildcard DNS) */
  forcePathMode?: boolean;
};

export function guestBookHostForSlug(slug: string, bookHostSuffix = "livia-hq.com"): string {
  return `${slug}.${bookHostSuffix}`;
}

/** Same-origin book path (dev + fallback). */
export function guestBookPath(slug: string, query = ""): string {
  const q = query ? (query.startsWith("?") ? query : `?${query}`) : "";
  return `/book/${slug}${q}`;
}

/** Same-origin event-vendor public site path (dev + pre-wildcard-DNS fallback). */
export function guestEventVendorPath(slug: string, segment = ""): string {
  const seg = segment ? (segment.startsWith("/") ? segment : `/${segment}`) : "";
  return `/e/${slug}${seg}`;
}

/** Token surfaces on book host (visit, proof, pay, …). */
export function guestBookTokenPath(
  slug: string,
  surface: "visit" | "proof" | "intake" | "pay" | "balance" | "shop" | "waitlist",
  token: string,
): string {
  return `/book/${slug}/${surface}/${encodeURIComponent(token)}`;
}

export function guestShopRelationshipPath(slug: string): string {
  return `/my/${slug}`;
}

export function guestManageVisitPath(slug: string, bookingId: string): string {
  return `/my/${slug}/visit/${bookingId}`;
}

/** Legacy `/b/` → `/book/` for redirects. */
export function migrateLegacyGuestBookPath(path: string): string {
  if (path.startsWith("/b/")) return path.replace(/^\/b\//, "/book/");
  return path;
}

export function guestBookAbsoluteUrl(slug: string, env: GuestBookUrlEnv = {}): string {
  if (env.forcePathMode || !env.bookHostSuffix) {
    const origin = (env.appOrigin ?? "https://app.livia-hq.com").replace(/\/$/, "");
    return `${origin}${guestBookPath(slug)}`;
  }
  return `https://${guestBookHostForSlug(slug, env.bookHostSuffix)}`;
}

/** Verified custom domain overrides slug subdomain when set. */
export function guestBookAbsoluteUrlForBusiness(
  slug: string,
  business: { customBookDomain?: string | null; customBookDomainVerified?: boolean },
  env: GuestBookUrlEnv = {},
): string {
  const raw = business.customBookDomain?.trim();
  if (raw && business.customBookDomainVerified) {
    const host = raw.replace(/^https?:\/\//i, "").replace(/\/.*$/, "");
    return `https://${host}`;
  }
  return guestBookAbsoluteUrl(slug, env);
}

export function guestEventVendorAbsoluteUrl(slug: string, env: GuestBookUrlEnv = {}): string {
  if (env.forcePathMode || !env.bookHostSuffix) {
    const origin = (env.appOrigin ?? "https://app.livia-hq.com").replace(/\/$/, "");
    return `${origin}${guestEventVendorPath(slug)}`;
  }
  return `https://${guestBookHostForSlug(slug, env.bookHostSuffix)}`;
}

/** Parse slug from book subdomain (`bloom.livia-hq.com`). */
export function normalizeBookHost(hostname: string): string {
  const host = hostname.toLowerCase().split(":")[0] ?? hostname;
  return host.replace(/^https?:\/\//i, "").replace(/\/.*$/, "");
}

/** True when hostname is not a reserved Livia app/API host (custom domain candidate). */
export function isCustomBookHostCandidate(hostname: string): boolean {
  const host = normalizeBookHost(hostname);
  if (host === "localhost" || host === "127.0.0.1") return false;
  if (RESERVED_SUBDOMAINS.has(host.split(".")[0] ?? "")) return false;
  const allowedSuffixes = ["livia-hq.com", "localhost", "livia-stg.livia-hq.com"];
  const parts = host.split(".");
  if (parts.length >= 2) {
    const suffix = parts.slice(1).join(".");
    if (allowedSuffixes.some((s) => suffix === s || suffix.endsWith(`.${s}`))) {
      return false;
    }
  }
  return host.includes(".");
}

export function parseGuestBookSlugFromHost(hostname: string): string | null {
  const host = hostname.toLowerCase().split(":")[0] ?? hostname;
  if (host === "localhost" || host === "127.0.0.1") return null;

  const parts = host.split(".");
  if (parts.length < 2) return null;

  const slug = parts[0];
  if (!slug || RESERVED_SUBDOMAINS.has(slug)) return null;

  const suffix = parts.slice(1).join(".");
  const allowedSuffixes = ["livia-hq.com", "localhost", "livia-stg.livia-hq.com"];
  const ok = allowedSuffixes.some((s) => suffix === s || suffix.endsWith(`.${s}`));
  if (!ok) return null;

  return slug;
}
