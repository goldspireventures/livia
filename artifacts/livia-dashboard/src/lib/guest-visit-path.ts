/** Normalize guest visit links to `/b/{slug}/visit/{token}` (legacy `/my?visit=`). */
export function extractGuestVisitToken(url: string): string | null {
  const fromQuery = url.match(/[?&]visit=([^&]+)/)?.[1];
  if (fromQuery) return decodeURIComponent(fromQuery);
  const fromPath = url.match(/\/visit\/([^/?]+)/)?.[1];
  if (fromPath) return decodeURIComponent(fromPath);
  return null;
}

export function guestVisitPath(slug: string, visitToken: string): string {
  return `/b/${slug}/visit/${encodeURIComponent(visitToken)}`;
}

export function normalizeGuestVisitUrl(url: string, slug: string): string {
  if (url.startsWith("/b/") && url.includes("/visit/")) return url;
  const token = extractGuestVisitToken(url);
  if (token && slug) return guestVisitPath(slug, token);
  return url;
}
