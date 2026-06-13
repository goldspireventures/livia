/** Parse guest book paths — `/book/{slug}` (canonical), legacy `/b/{slug}`, or subdomain token paths. */

export function parsePublicTokenPath(
  pathname: string,
  segment: string,
): { slug: string | null; token: string } | null {
  const p = pathname.split("?")[0] ?? "";
  const prefixed = p.match(
    new RegExp(`^\\/(?:b|book)\\/([^/]+)\\/${segment}\\/([^/]+)\\/?$`),
  );
  if (prefixed?.[1] && prefixed[2]) {
    return {
      slug: decodeURIComponent(prefixed[1]),
      token: decodeURIComponent(prefixed[2]),
    };
  }
  const bare = p.match(new RegExp(`^\\/${segment}\\/([^/]+)\\/?$`));
  if (bare?.[1]) {
    return { slug: null, token: decodeURIComponent(bare[1]) };
  }
  return null;
}

export function parsePublicShopPath(pathname: string): { slug: string; token: string } | null {
  const parsed = parsePublicTokenPath(pathname, "shop");
  if (!parsed?.token) return null;
  return { slug: parsed.slug ?? "", token: parsed.token };
}

export function parsePublicBookingSlug(pathname: string): string | null {
  const p = pathname.split("?")[0] ?? "";
  const m = p.match(/^\/(?:b|book)\/([^/]+)\/?$/);
  if (!m?.[1]) return null;
  return decodeURIComponent(m[1]);
}

export function isPublicShopPath(pathname: string): boolean {
  return parsePublicShopPath(pathname) != null;
}

const EVENT_VENDOR_PAGE_SEGMENTS = new Set(["enquire", "gallery", "services", "about", "q"]);

export function parsePublicEventVendorSlug(pathname: string): string | null {
  const p = pathname.split("?")[0] ?? "";
  const m = p.match(/^\/e\/([^/]+)\/?$/);
  if (!m?.[1]) return null;
  return decodeURIComponent(m[1]);
}

/** Quote token from `/e/{slug}/q/{token}`, legacy `/e/{slug}/{token}`, or subdomain `/q/{token}`. */
export function parsePublicQuotePath(
  pathname: string,
): { slug: string | null; token: string } | null {
  const p = pathname.split("?")[0] ?? "";
  const canonical = p.match(/^\/e\/([^/]+)\/q\/([^/]+)\/?$/);
  if (canonical?.[1] && canonical[2]) {
    return {
      slug: decodeURIComponent(canonical[1]),
      token: decodeURIComponent(canonical[2]),
    };
  }
  const malformed = p.match(/^\/e\/([^/]+)\/\/([^/]+)\/?$/);
  if (malformed?.[1] && malformed[2]) {
    return {
      slug: decodeURIComponent(malformed[1]),
      token: decodeURIComponent(malformed[2]),
    };
  }
  const legacy = p.match(/^\/e\/([^/]+)\/([^/]+)\/?$/);
  if (legacy?.[1] && legacy[2] && !EVENT_VENDOR_PAGE_SEGMENTS.has(legacy[2])) {
    return {
      slug: decodeURIComponent(legacy[1]),
      token: decodeURIComponent(legacy[2]),
    };
  }
  const subdomain = p.match(/^\/q\/([^/]+)\/?$/);
  if (subdomain?.[1]) {
    return { slug: null, token: decodeURIComponent(subdomain[1]) };
  }
  return null;
}

/** Redirect legacy/malformed quote paths to `/e/{slug}/q/{token}` (preserves query). */
export function canonicalizeEventVendorQuotePath(location: string): string | null {
  const qIndex = location.indexOf("?");
  const path = qIndex >= 0 ? location.slice(0, qIndex) : location;
  const search = qIndex >= 0 ? location.slice(qIndex) : "";
  const parsed = parsePublicQuotePath(path);
  if (!parsed?.slug) return null;
  const normalized = path.replace(/\/+$/, "");
  if (/^\/e\/[^/]+\/q\/[^/]+$/.test(normalized)) return null;
  return `/e/${parsed.slug}/q/${parsed.token}${search}`;
}
