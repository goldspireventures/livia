import type { BusinessVertical } from "./types";

/** Extra go-live / onboarding guidance per vertical (product copy — not separate wizard acts in v1). */
export type VerticalOnboardingExtra = {
  createBusinessHint?: string;
  goLiveExtras: string[];
  postGoLive: string[];
};

export const VERTICAL_ONBOARDING_EXTRAS: Record<BusinessVertical, VerticalOnboardingExtra> = {
  hair: {
    createBusinessHint:
      "Optional: start with a template service menu, or build your own from scratch.",
    goLiveExtras: ["Deposit policy matches how you take walk-ins vs colour clients."],
    postGoLive: ["Point Instagram bio link to your public booking page."],
  },
  beauty: {
    createBusinessHint:
      "Optional: start with a template treatment menu and mini store, or build your own from scratch.",
    goLiveExtras: ["Patch test / allergy notes in service descriptions if you do nails or lashes."],
    postGoLive: ["Enable WhatsApp if most bookings come from DMs."],
  },
  "body-art": {
    createBusinessHint:
      "Optional: start with a template service menu, or build your own from scratch. Design proof workflow is in Bookings after go-live.",
    goLiveExtras: ["Consultation service is seeded — use it before long tattoo sessions."],
    postGoLive: ["Share design proof links from the booking timeline."],
  },
  wellness: {
    createBusinessHint:
      "Optional: start with a template session menu, or build your own from scratch.",
    goLiveExtras: ["Session length buffers in Settings → Policy if you stack rooms."],
    postGoLive: [],
  },
  fitness: {
    createBusinessHint:
      "Optional: start with a template session menu, or build your own from scratch.",
    goLiveExtras: ["Class capacity and waitlist: enable in Services if you run group sessions."],
    postGoLive: ["Staff borrow workflow if instructors cover each other's classes."],
  },
  medspa: {
    createBusinessHint:
      "Optional template procedure menu on create. Medical intake and procedure consent apply on your public booking page.",
    goLiveExtras: [
      "Review procedure catalog and consent copy (Settings → vertical / medspa).",
      "Marketing SMS stays separate from clinical reminders (jurisdiction footer).",
    ],
    postGoLive: ["Slot waitlist offers fire when a cancellation frees a popular procedure."],
  },
  "allied-health": {
    createBusinessHint:
      "Optional: start with a template session menu, or build your own from scratch.",
    goLiveExtras: ["Longer cancel windows and documentation habits — set in operational policy."],
    postGoLive: [],
  },
  "pet-grooming": {
    createBusinessHint:
      "Optional: start with a template groom menu, or build your own from scratch.",
    goLiveExtras: ["Pet notes on customer profile — use after first booking."],
    postGoLive: ["Continuity SMS thread works well for pickup timing."],
  },
  "automotive-detailing": {
    createBusinessHint:
      "Optional: start with a template service menu, or build your own from scratch.",
    goLiveExtras: ["Vehicle size / package tiers reflected in service durations."],
    postGoLive: [],
  },
  "event-vendors": {
    createBusinessHint: "Add your decor catalogue and share your enquire link from Instagram.",
    goLiveExtras: ["Set deposit % and terms before sending your first quote."],
    postGoLive: ["Add quote templates for your most common event types."],
  },
};

export function getVerticalOnboardingExtras(
  vertical: BusinessVertical | string | null | undefined,
): VerticalOnboardingExtra {
  const key = (vertical ?? "hair") as BusinessVertical;
  return VERTICAL_ONBOARDING_EXTRAS[key] ?? VERTICAL_ONBOARDING_EXTRAS.hair;
}
