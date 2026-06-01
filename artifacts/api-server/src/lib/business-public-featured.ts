/** Read `public_featured_service_ids` until drizzle infer includes the column everywhere. */
export function readPublicFeaturedServiceIds(biz: unknown): string[] {
  const raw = (biz as { publicFeaturedServiceIds?: unknown }).publicFeaturedServiceIds;
  if (!Array.isArray(raw)) return [];
  return raw.filter((id): id is string => typeof id === "string" && id.length > 0);
}

export function publicFeaturedPatch(ids: string[]): Record<string, string[]> {
  return { publicFeaturedServiceIds: ids };
}
