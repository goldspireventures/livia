import type { BusinessVertical } from "./types";
import { resolveVerticalKey } from "./vocabulary";

/** Guest-facing Liv chat on `/b` — chips sound like real guest messages, not FAQ templates. */
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
      "I'd like to book something relaxing this week — what do you have?",
      "How long are your massage sessions?",
      "Any evening slots coming up?",
    ],
    inputPlaceholder: "Ask about treatments, times, or availability…",
    assistantSubtitle: "Booking assistant",
  },
  medspa: {
    suggestedPrompts: [
      "I'm interested in a consultation — can we book one?",
      "What's involved in a first visit?",
      "Do you have morning slots next week?",
    ],
    inputPlaceholder: "Ask about treatments, prep, or availability…",
    assistantSubtitle: "Booking assistant",
  },
  hair: {
    suggestedPrompts: [
      "I need a cut and colour — when could I come in?",
      "Who's available this Saturday?",
      "Roughly how much is a blow-dry?",
    ],
    inputPlaceholder: "Ask about services, stylists, or availability…",
    assistantSubtitle: "Booking assistant",
  },
  beauty: {
    suggestedPrompts: [
      "I'd like to book nails — what's free this week?",
      "Do I need a patch test before lashes?",
      "What times do you have on Saturday?",
    ],
    inputPlaceholder: "Ask about treatments, times, or availability…",
    assistantSubtitle: "Booking assistant",
  },
  "body-art": {
    suggestedPrompts: [
      "I'd like to book a consult for a new piece",
      "How does your deposit work?",
      "Any consult slots in the next few weeks?",
    ],
    inputPlaceholder: "Ask about sessions, consults, or availability…",
    assistantSubtitle: "Booking assistant",
  },
  fitness: {
    suggestedPrompts: [
      "I'd like to book a PT session",
      "What classes run on weekdays?",
      "Anything free tomorrow morning?",
    ],
    inputPlaceholder: "Ask about sessions, classes, or availability…",
    assistantSubtitle: "Booking assistant",
  },
  "allied-health": {
    suggestedPrompts: [
      "I need an initial assessment — what times do you have?",
      "How long is a follow-up appointment?",
      "Anything early next week?",
    ],
    inputPlaceholder: "Ask about appointments or availability…",
    assistantSubtitle: "Booking assistant",
  },
  "pet-grooming": {
    suggestedPrompts: [
      "I'd like to book a groom for my dog",
      "How long does a full groom take?",
      "Any slots this weekend?",
    ],
    inputPlaceholder: "Ask about services or availability…",
    assistantSubtitle: "Booking assistant",
  },
  "automotive-detailing": {
    suggestedPrompts: [
      "I'd like to book a full detail",
      "What's included in your packages?",
      "Do you have anything mid-week?",
    ],
    inputPlaceholder: "Ask about services or availability…",
    assistantSubtitle: "Booking assistant",
  },
  "event-vendors": {
    suggestedPrompts: [
      "We're planning a wedding — can I get a quote?",
      "What's in your standard package?",
      "How do I send you our date and guest count?",
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
