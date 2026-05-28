/**
 * Self-serve onboarding videos — override via dashboard `.env`:
 * VITE_ONBOARDING_VIDEO_WELCOME, VITE_ONBOARDING_VIDEO_CHANNELS, VITE_ONBOARDING_VIDEO_LIV, VITE_ONBOARDING_VIDEO_TOUR
 *
 * Supports YouTube, Vimeo, Loom share URLs, or direct .mp4 paths (react-player).
 */

export type OnboardingVideoKey = "welcome" | "channels" | "liv" | "tour";

const DEFAULTS: Record<OnboardingVideoKey, string> = {
  welcome: "",
  channels: "",
  liv: "",
  tour: "",
};

const ENV_KEYS: Record<OnboardingVideoKey, string> = {
  welcome: "VITE_ONBOARDING_VIDEO_WELCOME",
  channels: "VITE_ONBOARDING_VIDEO_CHANNELS",
  liv: "VITE_ONBOARDING_VIDEO_LIV",
  tour: "VITE_ONBOARDING_VIDEO_TOUR",
};

export function getOnboardingVideoUrl(key: OnboardingVideoKey): string | null {
  const envKey = ENV_KEYS[key];
  const raw = (import.meta.env[envKey] as string | undefined)?.trim() ?? DEFAULTS[key];
  return raw || null;
}

export const ONBOARDING_VIDEO_COPY: Record<
  OnboardingVideoKey,
  { title: string; duration: string; caption: string }
> = {
  welcome: {
    title: "Welcome — your shop in 5 minutes",
    duration: "~5 min",
    caption: "Watch once: create your shop, connect channels, and see Liv book a client.",
  },
  channels: {
    title: "WhatsApp & Instagram setup",
    duration: "~3 min",
    caption: "Connect Meta, paste IDs, and test your first inbox message.",
  },
  liv: {
    title: "Train Liv",
    duration: "~2 min",
    caption: "Tone, greeting, and knowledge — how she sounds like your team.",
  },
  tour: {
    title: "Where everything lives",
    duration: "~2 min",
    caption: "Dashboard, inbox, bookings, and settings in one pass.",
  },
};
