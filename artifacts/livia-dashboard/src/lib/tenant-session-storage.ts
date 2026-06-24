/**
 * Client session storage keys — cleared when Clerk user changes so a new
 * account never inherits the previous tenant selection.
 */
const ONBOARDING_ARRIVAL_DISMISSED_KEY = "livia.onboarding.arrival.dismissed";

export const TENANT_SESSION_STORAGE_KEYS = [
  "livia.currentBusinessId",
  "livia_current_business_id",
  "livia.viewingAsStaffId",
  ONBOARDING_ARRIVAL_DISMISSED_KEY,
] as const;

export function clearTenantSessionStorage(): void {
  if (typeof window === "undefined") return;
  try {
    for (const key of TENANT_SESSION_STORAGE_KEYS) {
      window.localStorage.removeItem(key);
    }
  } catch {
    // private mode / blocked storage
  }
}

export function readPersistedBusinessId(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const current = window.localStorage.getItem("livia.currentBusinessId");
    if (current) return current;
    const legacy = window.localStorage.getItem("livia_current_business_id");
    if (legacy) {
      window.localStorage.setItem("livia.currentBusinessId", legacy);
      window.localStorage.removeItem("livia_current_business_id");
      return legacy;
    }
  } catch {
    return null;
  }
  return null;
}

export function pruneStalePersistedBusinessId(validIds: Set<string>): void {
  if (typeof window === "undefined") return;
  const persisted = readPersistedBusinessId();
  if (persisted && !validIds.has(persisted)) {
    clearTenantSessionStorage();
  }
}
