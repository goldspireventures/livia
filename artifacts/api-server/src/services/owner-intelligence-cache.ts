import type { OwnerIntelligenceBundle } from "./owner-intelligence.service";

const TTL_MS = 45_000;
const cache = new Map<string, { at: number; value: OwnerIntelligenceBundle }>();

export function invalidateOwnerIntelligenceCache(businessId: string): void {
  cache.delete(businessId);
}

export async function getOwnerIntelligenceBundleCached(
  businessId: string,
): Promise<OwnerIntelligenceBundle | null> {
  const hit = cache.get(businessId);
  const now = Date.now();
  if (hit && now - hit.at < TTL_MS) {
    return hit.value;
  }
  const { getOwnerIntelligenceBundle } = await import("./owner-intelligence.service");
  const value = await getOwnerIntelligenceBundle(businessId);
  if (value) {
    cache.set(businessId, { at: now, value });
  } else {
    cache.delete(businessId);
  }
  return value;
}
