import type { BusinessVertical } from "./types";
import { resolveVerticalKey } from "./vocabulary";

/** Guest-facing Liv chat on `/b` — chips and placeholders must match tenant vertical. */
export type PublicLivChatCopy = {
  suggestedPrompts: readonly [string, string, string];
  inputPlaceholder: string;
  /** Shown under the Liv header — context for this session, not a second brand. */
  assistantSubtitle: string;
};

/** Unified guest chat chrome — same Liv across every business. */
export const PUBLIC_LIV_CHAT_HEADER_TITLE = "Liv";

const PUBLIC_LIV_CHAT: Record<BusinessVertical, PublicLivChatCopy> = {
  wellness: {
    suggestedPrompts: [
      "I'd like to book a treatment",
      "What services do you offer?",
      "Do you have availability this week?",
    ],
    inputPlaceholder: "Ask about treatments, times, or availability…",
    assistantSubtitle: "Booking assistant",
  },
  medspa: {
    suggestedPrompts: [
      "I'd like to book a consultation",
      "What treatments do you offer?",
      "What should I know before my first visit?",
    ],
    inputPlaceholder: "Ask about treatments, prep, or availability…",
    assistantSubtitle: "Booking assistant",
  },
  hair: {
    suggestedPrompts: [
      "I'd like to book an appointment",
      "What services do you offer?",
      "Do you have availability soon?",
    ],
    inputPlaceholder: "Ask about services, stylists, or availability…",
    assistantSubtitle: "Booking assistant",
  },
  beauty: {
    suggestedPrompts: [
      "I'd like to book an appointment",
      "What services do you offer?",
      "Do you have availability this weekend?",
    ],
    inputPlaceholder: "Ask about treatments, times, or availability…",
    assistantSubtitle: "Booking assistant",
  },
  "body-art": {
    suggestedPrompts: [
      "I'd like to book a consultation",
      "What is your deposit policy?",
      "Do you have availability next month?",
    ],
    inputPlaceholder: "Ask about sessions, consults, or availability…",
    assistantSubtitle: "Booking assistant",
  },
  fitness: {
    suggestedPrompts: [
      "I'd like to book a session",
      "What classes or sessions do you offer?",
      "Do you have availability this week?",
    ],
    inputPlaceholder: "Ask about sessions, classes, or availability…",
    assistantSubtitle: "Booking assistant",
  },
  "allied-health": {
    suggestedPrompts: [
      "I'd like to book an appointment",
      "What appointment types do you offer?",
      "Do you have availability next week?",
    ],
    inputPlaceholder: "Ask about appointments or availability…",
    assistantSubtitle: "Booking assistant",
  },
  "pet-grooming": {
    suggestedPrompts: [
      "I'd like to book a groom",
      "What services do you offer?",
      "Do you have slots this weekend?",
    ],
    inputPlaceholder: "Ask about services or availability…",
    assistantSubtitle: "Booking assistant",
  },
  "automotive-detailing": {
    suggestedPrompts: [
      "I'd like to book a detail",
      "What packages do you offer?",
      "Do you have availability next week?",
    ],
    inputPlaceholder: "Ask about services or availability…",
    assistantSubtitle: "Booking assistant",
  },
  "event-vendors": {
    suggestedPrompts: [
      "I'd like a quote for an event",
      "What packages do you offer?",
      "How do I send an enquiry?",
    ],
    inputPlaceholder: "Ask about your event or how to enquire…",
    assistantSubtitle: "Enquiry assistant",
  },
};

const DEFAULT_PUBLIC = PUBLIC_LIV_CHAT.wellness;

export function publicLivChatCopy(
  vertical?: string | null,
  category?: string | null,
): PublicLivChatCopy {
  const key = resolveVerticalKey(vertical, category);
  return PUBLIC_LIV_CHAT[key] ?? DEFAULT_PUBLIC;
}

/** Staff Liv quick prompts in inbox — vertical-aware where it matters. */
export function staffLivInboxSuggestions(
  vertical?: string | null,
  category?: string | null,
  mode: "open" | "handoff" = "open",
): readonly string[] {
  const key = resolveVerticalKey(vertical, category);
  if (mode === "handoff") {
    return [
      "Draft a reply I can send now — clear and human.",
      key === "wellness" || key === "medspa"
        ? "Summarize what the guest needs — treatment, time, or package."
        : "Summarize what the client needs in one short paragraph.",
    ];
  }
  switch (key) {
    case "wellness":
    case "medspa":
      return [
        "Draft the next reply — calm, concise, on-brand.",
        "Is there a pending session in this thread? Confirm if policy allows.",
        "Look up this guest and summarize visits and package balance.",
        "What should I prioritize on Today?",
      ];
    case "hair":
    case "beauty":
      return [
        "Draft the next reply — warm, concise, on-brand.",
        "Is there a pending booking in this thread? Confirm it if policy allows.",
        "Look up this customer and summarize strikes and last visit.",
        "What does today's briefing say I should prioritize?",
      ];
    default:
      return [
        "Draft the next reply — warm, concise, on-brand.",
        "Is there a pending booking in this thread? Confirm it if policy allows.",
        "Look up this customer and summarize their history.",
        "What should I prioritize today?",
      ];
  }
}
