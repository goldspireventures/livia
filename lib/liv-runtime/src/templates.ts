import type { ResolvedBusinessPolicies } from "@workspace/policy";
import type { VerticalPackManifest } from "./packs/loader";
import type { LivBusinessContext, LivServiceRow, LivStaffRow } from "./prompt";

export type LivPromptContext = {
  business: LivBusinessContext;
  policies: ResolvedBusinessPolicies;
  services: LivServiceRow[];
  staff: LivStaffRow[];
  pack: VerticalPackManifest;
  knownCustomer?: { name?: string | null; email?: string | null; phone?: string | null };
  today: string;
};

export function buildLivPromptFromTemplate(ctx: LivPromptContext): string {
  const { business, policies, services, staff, pack, knownCustomer, today } = ctx;
  const greeting =
    business.aiGreeting ?? `Hi! I'm Liv, the AI assistant for ${business.name}. I can help you book an appointment.`;
  const knowledgeSection = business.aiKnowledge?.trim()
    ? `\n\nIMPORTANT BUSINESS NOTES (always honor these):\n${business.aiKnowledge.trim()}\n`
    : "";
  const canBookDirectly = (business.aiCanBookDirectly ?? "true") === "true";
  const customerSection =
    knownCustomer && (knownCustomer.name || knownCustomer.email || knownCustomer.phone)
      ? `\n\nThe customer has provided: ${[
          knownCustomer.name && `name=${knownCustomer.name}`,
          knownCustomer.email && `email=${knownCustomer.email}`,
          knownCustomer.phone && `phone=${knownCustomer.phone}`,
        ]
          .filter(Boolean)
          .join(", ")}. Don't ask for these again unless missing.`
      : "";

  const servicesList = services.length
    ? services
        .map(
          (s) =>
            `- id="${s.id}" · ${s.name} · ${s.durationMinutes} min · ${(s.priceMinor / 100).toFixed(2)} ${s.currency}${s.description ? ` — ${s.description}` : ""}`,
        )
        .join("\n")
    : "(no services configured yet)";

  const staffList = staff.length
    ? staff.map((s) => `- id="${s.id}" · ${s.displayName}`).join("\n")
    : "(any available staff)";

  const bookingRules = canBookDirectly
    ? "You may use create_booking once the customer confirms service, date/time, and contact details."
    : "You must NOT use create_booking. Collect preferences and tell them a team member will confirm shortly.";

  return `You are Liv, the AI booking assistant for ${business.name}${business.city ? ` (${business.city})` : ""}.
Today is ${today} in timezone ${business.timezone}.

VERTICAL CONTEXT:
${pack.promptModule}

TONE:
${tonePhrase(business.aiTone ?? "FRIENDLY")}

GREETING (use or adapt on first message):
${greeting}
${knowledgeSection}
${customerSection}

POLICIES (must follow):
- Booking terms: ${policies.bookingTermsBlock}
- Deposits: ${policies.depositPolicySummary}
- ${bookingRules}

SERVICES (use exact ids in tools):
${servicesList}

STAFF (optional in find_slots):
${staffList}

RULES:
- Never invent service or staff ids.
- If no slots, suggest another date or service.
- Be honest that you are an AI assistant when asked.
- Do not give medical or legal advice.`;
}

function tonePhrase(tone: string): string {
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
