import type { BusinessVertical } from "@workspace/policy";

export type PublicSocialProof = {
  rating: number;
  reviewCount: number;
  highlights: string[];
};

const PROOF_BY_VERTICAL: Record<BusinessVertical, PublicSocialProof> = {
  hair: {
    rating: 4.9,
    reviewCount: 214,
    highlights: [
      "Best colour consult in the city — they actually listen.",
      "Booked online at midnight, confirmation in seconds.",
    ],
  },
  beauty: {
    rating: 4.95,
    reviewCount: 178,
    highlights: [
      "Lash fill always perfect — patch test explained clearly.",
      "Love that I can pick my tech before I book.",
    ],
  },
  "body-art": {
    rating: 5,
    reviewCount: 89,
    highlights: [
      "Consult was thorough — deposit for session made sense.",
      "Design proof before the big day was a game changer.",
    ],
  },
  wellness: {
    rating: 4.8,
    reviewCount: 132,
    highlights: ["Calm booking flow — no phone tag.", "Reminder text was exactly when I needed it."],
  },
  fitness: {
    rating: 4.85,
    reviewCount: 96,
    highlights: ["Intro assessment booked in two taps.", "Coach matched to my goals on first visit."],
  },
  medspa: {
    rating: 4.92,
    reviewCount: 156,
    highlights: [
      "Consent step felt clinical in a good way — very clear.",
      "Consult before injectables — never felt rushed.",
    ],
  },
  "allied-health": {
    rating: 4.88,
    reviewCount: 74,
    highlights: ["Intake questions were relevant, not generic.", "Easy to rebook follow-up from the link."],
  },
  "pet-grooming": {
    rating: 4.97,
    reviewCount: 203,
    highlights: [
      "They asked about temperament upfront — our anxious pup was fine.",
      "Pickup SMS with photo was adorable.",
    ],
  },
  "automotive-detailing": {
    rating: 4.86,
    reviewCount: 61,
    highlights: ["Bay time accurate — car came back gleaming.", "Package picker by vehicle size was clear."],
  },
};

export function socialProofForVertical(vertical?: string | null): PublicSocialProof | null {
  if (!vertical) return PROOF_BY_VERTICAL.hair;
  if (vertical in PROOF_BY_VERTICAL) {
    return PROOF_BY_VERTICAL[vertical as BusinessVertical];
  }
  return null;
}
