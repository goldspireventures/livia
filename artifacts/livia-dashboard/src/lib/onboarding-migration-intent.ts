import {
  onboardingIntentFromTrack,
  onboardingTrackFromIntent,
  type MigrationIntent,
  type OnboardingTrack,
} from "@workspace/policy";

const STORAGE_KEY = "livia.onboarding.migrationIntent";

export function readOnboardingTrack(): OnboardingTrack | null {
  if (typeof window === "undefined") return null;
  const params = new URLSearchParams(window.location.search);
  const fromUrl = onboardingIntentFromTrack(params.get("track"));
  if (fromUrl) return onboardingTrackFromIntent(fromUrl);
  const stored = readOnboardingMigrationIntent();
  return stored ? onboardingTrackFromIntent(stored) : null;
}

export function readOnboardingMigrationIntent(): MigrationIntent | null {
  if (typeof window === "undefined") return null;
  const params = new URLSearchParams(window.location.search);
  const fromUrl = onboardingIntentFromTrack(params.get("track"));
  if (fromUrl) return fromUrl;
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (raw === "fresh" || raw === "switching") return raw;
  } catch {
    /* ignore */
  }
  return null;
}

export function writeOnboardingMigrationIntent(intent: MigrationIntent): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(STORAGE_KEY, intent);
  } catch {
    /* ignore */
  }
}

export function clearOnboardingMigrationIntent(): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

export function onboardingPathAfterTrackPick(intent: MigrationIntent): string {
  const track = onboardingTrackFromIntent(intent);
  return track ? `/onboarding?fresh=1&track=${track}` : "/onboarding?fresh=1";
}
