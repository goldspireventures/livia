const DRAFT_PREFIX = "livia.onboarding.draft.";

export function readOnboardingFormDraft<T extends Record<string, unknown>>(
  key: string,
): Partial<T> | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(`${DRAFT_PREFIX}${key}`);
    if (!raw) return null;
    return JSON.parse(raw) as Partial<T>;
  } catch {
    return null;
  }
}

export function writeOnboardingFormDraft(key: string, values: Record<string, unknown>): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(`${DRAFT_PREFIX}${key}`, JSON.stringify(values));
  } catch {
    /* quota / private mode */
  }
}

export function clearOnboardingFormDraft(key: string): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.removeItem(`${DRAFT_PREFIX}${key}`);
  } catch {
    /* ignore */
  }
}
