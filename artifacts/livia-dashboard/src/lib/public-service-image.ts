import type { BusinessVertical } from "@workspace/policy";

/** Keep in sync with api-server `experience-skin.ts` SERVICE_IMAGES. */
const SERVICE_IMAGES: Record<string, string> = {
  colour: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=400&h=300&fit=crop",
  color: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=400&h=300&fit=crop",
  cut: "https://images.unsplash.com/photo-1503956546970-5a150ba5a4?w=400&h=300&fit=crop",
  lash: "https://images.unsplash.com/photo-1516975080664-ed2fc6a32937?w=400&h=300&fit=crop",
  nail: "https://images.unsplash.com/photo-1604654894610-df63bc536371?w=400&h=300&fit=crop",
  brow: "https://images.unsplash.com/photo-1487412940907-6530b50e3063?w=400&h=300&fit=crop",
  manicure: "https://images.unsplash.com/photo-1604654894610-df63bc536371?w=400&h=300&fit=crop",
  classic: "https://images.unsplash.com/photo-1604654894610-df63bc536371?w=400&h=300&fit=crop",
  massage: "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=400&h=300&fit=crop",
  tattoo: "https://images.unsplash.com/photo-1568515045052-f9a854d70bfd?w=400&h=300&fit=crop",
  consult: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=400&h=300&fit=crop",
};

const VERTICAL_FALLBACK: Partial<Record<BusinessVertical, string>> = {
  hair: SERVICE_IMAGES.cut,
  beauty: SERVICE_IMAGES.lash,
  "body-art": SERVICE_IMAGES.tattoo,
  wellness: SERVICE_IMAGES.massage,
};

export function resolvePublicServiceImageUrl(
  serviceName: string,
  vertical?: string | null,
  imageUrl?: string | null,
): string | undefined {
  if (imageUrl?.trim()) return imageUrl.trim();
  const n = serviceName.toLowerCase();
  for (const [key, url] of Object.entries(SERVICE_IMAGES)) {
    if (n.includes(key)) return url;
  }
  const v = vertical as BusinessVertical | undefined;
  if (v && VERTICAL_FALLBACK[v]) return VERTICAL_FALLBACK[v];
  return undefined;
}
