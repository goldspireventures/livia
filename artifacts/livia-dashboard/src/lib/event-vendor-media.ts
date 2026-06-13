/** Bundled hero/gallery assets — never hotlink dead Unsplash IDs. */
export const EVENT_VENDOR_MEDIA = {
  hero: "/event-vendor-media/wedding-reception.jpg",
  gallery: [
    { url: "/event-vendor-media/wedding-reception.jpg", caption: "Wedding reception", eventType: "wedding" },
    { url: "/event-vendor-media/birthday-party.jpg", caption: "Birthday party", eventType: "birthday" },
    { url: "/event-vendor-media/christening.jpg", caption: "Christening", eventType: "christening" },
  ],
} as const;

export function eventVendorMediaUrl(path: string): string {
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  if (path.startsWith("/")) return path;
  return `/${path}`;
}

/** Prefer cover, then gallery — skip known-dead Unsplash hero ID. */
const DEAD_IMAGE_PREFIXES = ["photo-1519167758481-83f29da8f43b"];

function isDeadImageUrl(url: string | null | undefined): boolean {
  if (!url) return true;
  return DEAD_IMAGE_PREFIXES.some((id) => url.includes(id));
}

export function heroImageCandidates(data: {
  business: { coverImageUrl?: string | null };
  site: { gallery: Array<{ url: string }> };
}): string[] {
  const fromData = [
    data.business.coverImageUrl,
    ...data.site.gallery.map((g) => g.url),
  ]
    .filter((u): u is string => Boolean(u?.trim()) && !isDeadImageUrl(u))
    .map(eventVendorMediaUrl);

  return [...fromData, EVENT_VENDOR_MEDIA.hero];
}

export function heroImage(data: Parameters<typeof heroImageCandidates>[0]): string {
  return heroImageCandidates(data)[0] ?? EVENT_VENDOR_MEDIA.hero;
}

/** Map CMS gallery entries — swap dead hotlinks for bundled assets. */
export function resolveGalleryImage(
  item: { url: string; caption?: string; eventType?: string },
  index: number,
): { url: string; caption?: string; eventType?: string } {
  if (!isDeadImageUrl(item.url)) {
    return { ...item, url: eventVendorMediaUrl(item.url) };
  }
  const fallback = EVENT_VENDOR_MEDIA.gallery[index] ?? EVENT_VENDOR_MEDIA.gallery[0];
  return { ...item, url: fallback.url, caption: item.caption ?? fallback.caption };
}
