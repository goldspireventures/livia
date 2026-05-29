export type CockpitGrantTier = "restricted" | "full";

let grantsCache: Map<string, CockpitGrantTier> | null = null;
let cacheLoaded = false;

export function invalidateCockpitWorkforceGrantsCache(): void {
  grantsCache = null;
  cacheLoaded = false;
}

export function setCockpitWorkforceGrantsCacheForTest(grants: Map<string, CockpitGrantTier> | null): void {
  grantsCache = grants;
  cacheLoaded = grants !== null;
}

export function getCockpitWorkforceGrantsSync(): ReadonlyMap<string, CockpitGrantTier> {
  return grantsCache ?? new Map();
}

export function isCockpitWorkforceGrantsCacheLoaded(): boolean {
  return cacheLoaded;
}

export function replaceCockpitWorkforceGrantsCache(grants: Map<string, CockpitGrantTier>): void {
  grantsCache = grants;
  cacheLoaded = true;
}
