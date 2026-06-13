/**
 * Liv system-prompt shell — tone, rules, and conversational path contract.
 * Guest-visible copy resolves via liv-platform-program; this module is LLM scaffolding only.
 */
import { resolveLivRuntimeCopy } from "./liv-platform-program";

export type LivPromptTone = "FRIENDLY" | "PROFESSIONAL" | "PLAYFUL" | string;

/**
 * Liv conversation paths (platform contract):
 * - OPEN + aiHandled + LLM configured → `llm_tools` (Anthropic + tool registry)
 * - OPEN but no API key → `runtime_fallback` (`assistant_unavailable`)
 * - CLOSED / HANDED_OFF → `runtime_fallback` (closed / handoff copy)
 * - Operator-assisted sends (decline, quote, booking confirm) → `outbound_template` (liv-platform-program + tenant overrides)
 */
export type LivConversationPath = "llm_tools" | "runtime_fallback" | "outbound_template";

export function resolveLivConversationPath(args: {
  conversationStatus: string;
  aiHandled: boolean;
  llmConfigured: boolean;
}): LivConversationPath {
  if (args.conversationStatus !== "OPEN" || !args.aiHandled) return "runtime_fallback";
  if (!args.llmConfigured) return "runtime_fallback";
  return "llm_tools";
}

export function livToneInstruction(tone: LivPromptTone): string {
  switch ((tone || "FRIENDLY").toUpperCase()) {
    case "PROFESSIONAL":
      return "Use a polished, professional, slightly formal tone. Be concise and businesslike.";
    case "PLAYFUL":
      return "Use a warm, playful, conversational tone with occasional light humor. Stay tasteful.";
    case "FRIENDLY":
    default:
      return "Use a warm, friendly, conversational tone. Be welcoming and helpful.";
  }
}

/** Non-negotiable tool and safety rules injected into every Liv system prompt. */
export function livSystemPromptRulesBlock(): string {
  return `RULES:
- Never invent service or staff ids.
- If no slots, suggest another date or service.
- When a tool returns ok:false, explain the \`message\` field to the guest in plain language (deposit, policy, mandate, slot conflict, staff assignment) — never a vague "something went wrong".
- If you cannot book directly, say which shop rule applies (deposit, staff confirm, intake thread) and what happens next.
- Be honest that you are an AI assistant when asked.
- Do not give medical or legal advice.`;
}

export function livKnownCustomerPromptBlock(knownCustomer?: {
  name?: string | null;
  email?: string | null;
  phone?: string | null;
}): string {
  if (!knownCustomer || !(knownCustomer.name || knownCustomer.email || knownCustomer.phone)) {
    return "";
  }
  const parts = [
    knownCustomer.name && `name=${knownCustomer.name}`,
    knownCustomer.email && `email=${knownCustomer.email}`,
    knownCustomer.phone && `phone=${knownCustomer.phone}`,
  ].filter(Boolean);
  return `\n\nThe customer has provided: ${parts.join(", ")}. Don't ask for these again unless missing.`;
}

/** Fallback replies when the LLM returns empty text or exhausts tool hops. */
export function livConversationalFallbackCopy(
  key: "unclear_rephrase" | "tool_hop_exhausted",
): string {
  const runtimeKey =
    key === "unclear_rephrase"
      ? "conversational_unclear_rephrase"
      : "conversational_tool_hop_exhausted";
  return resolveLivRuntimeCopy(runtimeKey);
}
