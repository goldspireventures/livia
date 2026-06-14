import type { BusinessVertical } from "./types";
import { resolveVerticalKey } from "./vocabulary";

/** Guest-facing Liv chat on `/b` — chips and placeholders must match tenant vertical. */
export type PublicLivChatCopy = {
  suggestedPrompts: readonly [string, string, string];
  inputPlaceholder: string;
  assistantSubtitle: string;
};

const PUBLIC_LIV_CHAT: Record<BusinessVertical, PublicLivChatCopy> = {
  wellness: {
    suggestedPrompts: [
      "I'd like a 90 min massage this Saturday afternoon",
      "What retail or gift items do you sell?",
      "Do you have gift vouchers or couples sessions?",
    ],
    inputPlaceholder: "Ask about treatments, products, times, or packages…",
    assistantSubtitle: "Liv · spa booking assistant",
  },
  medspa: {
    suggestedPrompts: [
      "I'd like to book a consultation next week",
      "What treatments do you offer?",
      "What should I know before my first visit?",
    ],
    inputPlaceholder: "Ask about treatments, prep, or availability…",
    assistantSubtitle: "Liv · treatment booking assistant",
  },
  hair: {
    suggestedPrompts: [
      "I need a cut tomorrow afternoon",
      "What's in the take-home shop?",
      "Can I book with my usual stylist?",
    ],
    inputPlaceholder: "Ask about services, products, stylists, or availability…",
    assistantSubtitle: "Liv · booking assistant",
  },
  beauty: {
    suggestedPrompts: [
      "I'd like gel nails this Friday",
      "Help me find aftercare products",
      "Do you have availability this weekend?",
    ],
    inputPlaceholder: "Ask about treatments, products, times, or availability…",
    assistantSubtitle: "Liv · booking assistant",
  },
  "body-art": {
    suggestedPrompts: [
      "I'd like a consultation for a medium piece",
      "What is your deposit policy?",
      "Do you have availability next month?",
    ],
    inputPlaceholder: "Ask about sessions, consults, or availability…",
    assistantSubtitle: "Liv · studio assistant",
  },
  fitness: {
    suggestedPrompts: [
      "I'd like a PT session this week",
      "What classes do you have?",
      "Do you offer intro packs?",
    ],
    inputPlaceholder: "Ask about sessions, classes, or membership…",
    assistantSubtitle: "Liv · booking assistant",
  },
  "allied-health": {
    suggestedPrompts: [
      "I'd like to book a follow-up appointment",
      "What appointment types do you offer?",
      "Do you have availability next week?",
    ],
    inputPlaceholder: "Ask about appointments or availability…",
    assistantSubtitle: "Liv · booking assistant",
  },
  "pet-grooming": {
    suggestedPrompts: [
      "I'd like to book a groom for my dog",
      "What services and sizes do you take?",
      "Do you have slots this weekend?",
    ],
    inputPlaceholder: "Ask about groom services or availability…",
    assistantSubtitle: "Liv · booking assistant",
  },
  "automotive-detailing": {
    suggestedPrompts: [
      "I'd like a full detail next week",
      "What packages do you offer?",
      "How long does a ceramic coating take?",
    ],
    inputPlaceholder: "Ask about services, bays, or availability…",
    assistantSubtitle: "Liv · booking assistant",
  },
  "event-vendors": {
    suggestedPrompts: [
      "I'd like a quote for a birthday party",
      "What decor packages do you offer?",
      "Can you style a wedding reception?",
    ],
    inputPlaceholder: "Ask about your event, theme, or get the enquire link…",
    assistantSubtitle: "Liv · enquiry assistant",
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
        "Is there a pending booking in this thread? Confirm if policy allows.",
        "Look up this customer and summarize their history.",
        "What should I prioritize today?",
      ];
  }
}
