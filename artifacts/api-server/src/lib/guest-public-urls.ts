import {
  guestBookAbsoluteUrl,
  guestBookPath,
  guestBookTokenPath,
  guestManageVisitPath,
  type GuestBookUrlEnv,
} from "@workspace/policy";

type GuestTokenSurface = "visit" | "proof" | "intake" | "pay" | "shop" | "waitlist";
import { getDashboardUrl } from "./public-urls";

export function guestBookUrlEnv(): GuestBookUrlEnv {
  const bookHostSuffix = process.env.GUEST_BOOK_HOST_SUFFIX ?? process.env.LIVIA_BOOK_HOST_SUFFIX;
  return {
    bookHostSuffix: bookHostSuffix ?? undefined,
    appOrigin: getDashboardUrl(),
    forcePathMode:
      process.env.GUEST_BOOK_FORCE_PATH === "true" ||
      process.env.LIVIA_GUEST_BOOK_PATH_MODE === "1" ||
      !bookHostSuffix,
  };
}

export function resolveGuestBookUrl(slug: string, query = ""): string {
  const env = guestBookUrlEnv();
  const base = guestBookAbsoluteUrl(slug, env);
  if (!query) return base;
  const q = query.startsWith("?") ? query : `?${query}`;
  return `${base}${q}`;
}

/** SMS / email deep link — token visit on book host (not `/my`). */
export function resolveGuestVisitTokenUrl(slug: string, token: string): string {
  const env = guestBookUrlEnv();
  if (env.forcePathMode || !env.bookHostSuffix) {
    const origin = getDashboardUrl().replace(/\/+$/, "");
    return `${origin}${guestBookTokenPath(slug, "visit", token)}`;
  }
  return `https://${slug}.${env.bookHostSuffix}/visit/${encodeURIComponent(token)}`;
}

export function resolveGuestManageVisitUrl(slug: string, bookingId: string): string {
  const origin = getDashboardUrl().replace(/\/+$/, "");
  return `${origin}${guestManageVisitPath(slug, bookingId)}`;
}

export function resolveGuestTokenUrl(
  slug: string,
  surface: GuestTokenSurface,
  token: string,
): string {
  const env = guestBookUrlEnv();
  if (env.forcePathMode || !env.bookHostSuffix) {
    const origin = getDashboardUrl().replace(/\/+$/, "");
    return `${origin}${guestBookTokenPath(slug, surface, token)}`;
  }
  return `https://${slug}.${env.bookHostSuffix}/${surface}/${encodeURIComponent(token)}`;
}

/** Same-origin book path for Liv tools / previews. */
export function resolveGuestBookPath(slug: string): string {
  return guestBookPath(slug);
}
