import {
  guestBookAbsoluteUrl,
  guestBookPath,
  guestBookTokenPath,
  guestManageVisitPath,
  guestShopRelationshipPath,
  type GuestBookUrlEnv,
} from "@workspace/policy";

function guestBookEnv(): GuestBookUrlEnv {
  const bookHostSuffix = process.env.EXPO_PUBLIC_GUEST_BOOK_HOST_SUFFIX;
  const appOrigin =
    process.env.EXPO_PUBLIC_DASHBOARD_URL?.replace(/\/+$/, "") ??
    (__DEV__ ? "http://localhost:5173" : "https://app.livia-hq.com");
  return {
    bookHostSuffix: bookHostSuffix ?? undefined,
    appOrigin,
    forcePathMode: !bookHostSuffix,
  };
}

export function getDashboardOrigin(): string {
  return guestBookEnv().appOrigin ?? "https://app.livia-hq.com";
}

export function getMarketingOrigin(): string {
  return (
    process.env.EXPO_PUBLIC_MARKETING_URL?.replace(/\/+$/, "") ??
    (__DEV__ ? "http://127.0.0.1:5174" : "https://livia-hq.com")
  );
}

/** Branded guest book URL — subdomain when `EXPO_PUBLIC_GUEST_BOOK_HOST_SUFFIX` is set. */
export function getPublicBookingUrl(slug: string): string {
  return guestBookAbsoluteUrl(slug, guestBookEnv());
}

export function getPublicBookingLabel(slug: string): string {
  return getPublicBookingUrl(slug).replace(/^https?:\/\//, "");
}

export type GuestSurfaceKind = "visit" | "intake" | "waitlist" | "pay" | "proof" | "shop";

export function getGuestSurfaceUrl(
  kind: GuestSurfaceKind,
  slug: string,
  token: string,
): string {
  const env = guestBookEnv();
  if (!env.forcePathMode && env.bookHostSuffix) {
    return `https://${slug}.${env.bookHostSuffix}/${kind}/${encodeURIComponent(token)}`;
  }
  const origin = getDashboardOrigin();
  return `${origin}${guestBookTokenPath(slug, kind, token)}`;
}

export function getMyLiviaUrl(): string {
  return `${getDashboardOrigin()}/my`;
}

export function getMyShopUrl(slug: string): string {
  return `${getDashboardOrigin()}${guestShopRelationshipPath(slug)}`;
}

export function getMyVisitUrl(slug: string, bookingId: string): string {
  return `${getDashboardOrigin()}${guestManageVisitPath(slug, bookingId)}`;
}

/** Same-origin book path for in-app navigation. */
export function getGuestBookPath(slug: string): string {
  return guestBookPath(slug);
}
