import type { BusinessVertical } from "./types";

/** Extra go-live / onboarding guidance per vertical (product copy — not separate wizard acts in v1). */
export type VerticalOnboardingExtra = {
  createBusinessHint?: string;
  goLiveExtras: string[];
  postGoLive: string[];
};

export const VERTICAL_ONBOARDING_EXTRAS: Record<BusinessVertical, VerticalOnboardingExtra> = {
  hair: {
    goLiveExtras: ["Deposit policy matches how you take walk-ins vs colour clients."],
    postGoLive: ["Point Instagram bio link to your public booking page."],
  },
  beauty: {
    goLiveExtras: ["Patch test / allergy notes in service descriptions if you do nails or lashes."],
    postGoLive: ["Enable WhatsApp if most bookings come from DMs."],
  },
  "body-art": {
    createBusinessHint: "Design proof workflow is in Bookings after go-live.",
    goLiveExtras: ["Consultation service is seeded — use it before long tattoo sessions."],
    postGoLive: ["Share design proof links from the booking timeline."],
  },
  wellness: {
    goLiveExtras: ["Session length buffers in Settings → Policy if you stack rooms."],
    postGoLive: [],
  },
  fitness: {
    goLiveExtras: ["Class capacity and waitlist: enable in Services if you run group sessions."],
    postGoLive: ["Staff borrow workflow if instructors cover each other's classes."],
  },
  medspa: {
    createBusinessHint: "Medical intake and procedure consent apply on your public booking page.",
    goLiveExtras: [
      "Review procedure catalog and consent copy (Settings → vertical / medspa).",
      "Marketing SMS stays separate from clinical reminders (jurisdiction footer).",
    ],
    postGoLive: ["Slot waitlist offers fire when a cancellation frees a popular procedure."],
  },
  "allied-health": {
    goLiveExtras: ["Longer cancel windows and documentation habits — set in operational policy."],
    postGoLive: [],
  },
  "pet-grooming": {
    goLiveExtras: ["Pet notes on customer profile — use after first booking."],
    postGoLive: ["Continuity SMS thread works well for pickup timing."],
  },
  "automotive-detailing": {
    goLiveExtras: ["Vehicle size / package tiers reflected in service durations."],
    postGoLive: [],
  },
};

export function getVerticalOnboardingExtras(
  vertical: BusinessVertical | string | null | undefined,
): VerticalOnboardingExtra {
  const key = (vertical ?? "hair") as BusinessVertical;
  return VERTICAL_ONBOARDING_EXTRAS[key] ?? VERTICAL_ONBOARDING_EXTRAS.hair;
}
