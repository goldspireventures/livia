import { guestManageVisitPath, migrateLegacyGuestBookPath } from "@workspace/policy";

/** Extract booking id from `/my/{slug}/visit/{id}` manage URLs. */
export function extractGuestVisitBookingId(url: string): string | null {
  const fromMy = url.match(/\/my\/[^/]+\/visit\/([^/?]+)/)?.[1];
  if (fromMy) return decodeURIComponent(fromMy);
  const fromQuery = url.match(/[?&]visit=([^&]+)/)?.[1];
  if (fromQuery) return decodeURIComponent(fromQuery);
  return null;
}

/** @deprecated Token paths — prefer guestManageVisitPath(slug, bookingId). */
export function extractGuestVisitToken(url: string): string | null {
  const fromPath = url.match(/\/visit\/([^/?]+)/)?.[1];
  if (fromPath) return decodeURIComponent(fromPath);
  return extractGuestVisitBookingId(url);
}

export function normalizeGuestVisitUrl(url: string, slug: string, bookingId?: string): string {
  if (url.startsWith("/my/") && url.includes("/visit/")) return url;
  const id = bookingId ?? extractGuestVisitBookingId(url);
  if (id && slug) return guestManageVisitPath(slug, id);
  return migrateLegacyGuestBookPath(url);
}
