/**
 * Public /b service card images — keyword inference (hub for API + dashboard).
 * Longest match first so "brow shape" does not resolve to short keys like "fill".
 */

export const PUBLIC_SERVICE_IMAGE_KEYWORDS: Record<string, string> = {
  "brow shape": "https://images.unsplash.com/photo-1583001931096-959e9a1a6223?w=400&h=300&fit=crop",
  "brow tint": "https://images.unsplash.com/photo-1583001931096-959e9a1a6223?w=400&h=300&fit=crop",
  "lash fill": "https://images.unsplash.com/photo-1516975080664-ed2fc6a32937?w=400&h=300&fit=crop",
  "lash lift": "https://images.unsplash.com/photo-1516975080664-ed2fc6a32937?w=400&h=300&fit=crop",
  manicure: "https://images.unsplash.com/photo-1604654894610-df63bc536371?w=400&h=300&fit=crop",
  eyebrow: "https://images.unsplash.com/photo-1583001931096-959e9a1a6223?w=400&h=300&fit=crop",
  massage: "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=400&h=300&fit=crop",
  consult: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=400&h=300&fit=crop",
  tattoo: "https://images.unsplash.com/photo-1568515045052-f9a854d70bfd?w=400&h=300&fit=crop",
  classic: "https://images.unsplash.com/photo-1604654894610-df63bc536371?w=400&h=300&fit=crop",
  botox: "https://images.unsplash.com/photo-1616394584738-fc6e612e71b9?w=400&h=300&fit=crop",
  filler: "https://images.unsplash.com/photo-1616394584738-fc6e612e71b9?w=400&h=300&fit=crop",
  fitness: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400&h=300&fit=crop",
  physio: "https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=400&h=300&fit=crop",
  detail: "https://images.unsplash.com/photo-1601362841437-42e164e303e7?w=400&h=300&fit=crop",
  groom: "https://images.unsplash.com/photo-1516734212186-a967f81ad12d?w=400&h=300&fit=crop",
  colour: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=400&h=300&fit=crop",
  color: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=400&h=300&fit=crop",
  fade: "https://images.unsplash.com/photo-1621605815971-fbc98d665033?w=400&h=300&fit=crop",
  beard: "https://images.unsplash.com/photo-1599351431202-1e0f0137892a?w=400&h=300&fit=crop",
  lash: "https://images.unsplash.com/photo-1516975080664-ed2fc6a32937?w=400&h=300&fit=crop",
  lift: "https://images.unsplash.com/photo-1516975080664-ed2fc6a32937?w=400&h=300&fit=crop",
  fill: "https://images.unsplash.com/photo-1516975080664-ed2fc6a32937?w=400&h=300&fit=crop",
  gel: "https://images.unsplash.com/photo-1604654894610-df63bc536371?w=400&h=300&fit=crop",
  nail: "https://images.unsplash.com/photo-1604654894610-df63bc536371?w=400&h=300&fit=crop",
  brow: "https://images.unsplash.com/photo-1583001931096-959e9a1a6223?w=400&h=300&fit=crop",
  shape: "https://images.unsplash.com/photo-1583001931096-959e9a1a6223?w=400&h=300&fit=crop",
  cut: "https://images.unsplash.com/photo-1503956546970-5a150ba5a4?w=400&h=300&fit=crop",
  wax: "https://images.unsplash.com/photo-1516975080664-ed2fc6a32937?w=400&h=300&fit=crop",
  facial: "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=400&h=300&fit=crop",
};

/** Known-bad demo URLs — prefer keyword inference instead. */
export const STALE_PUBLIC_SERVICE_IMAGE =
  /photo-1598371839696|photo-1611501275019|photo-1570172619644-dfd03ed5d881|photo-1487412940907|photo-1595476108013/;

const KEYWORD_KEYS_LONGEST_FIRST = Object.keys(PUBLIC_SERVICE_IMAGE_KEYWORDS).sort(
  (a, b) => b.length - a.length,
);

export function inferPublicServiceImageFromName(serviceName: string): string | undefined {
  const n = serviceName.toLowerCase();
  for (const key of KEYWORD_KEYS_LONGEST_FIRST) {
    if (n.includes(key)) return PUBLIC_SERVICE_IMAGE_KEYWORDS[key];
  }
  return undefined;
}

export function resolvePublicServiceImageUrl(
  serviceName: string,
  verticalFallback: string | undefined,
  imageUrl?: string | null,
): string | undefined {
  const trimmed = imageUrl?.trim();
  if (trimmed && /^https?:\/\//i.test(trimmed) && !STALE_PUBLIC_SERVICE_IMAGE.test(trimmed)) {
    return trimmed;
  }
  return inferPublicServiceImageFromName(serviceName) ?? verticalFallback;
}
