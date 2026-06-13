import type { ResolvedBusinessPolicies } from "@workspace/policy";
import {
  livBookingRulesCopy,
  livDefaultGreeting,
  livKnownCustomerPromptBlock,
  livSystemPromptRulesBlock,
  livToneInstruction,
  livVoiceCharacterBlock,
  resolveLivChannelModality,
  type LivChannelModality,
} from "@workspace/policy";
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
  channelType?: string | null;
};

function modalityFromContext(ctx: LivPromptContext): LivChannelModality {
  return resolveLivChannelModality(ctx.channelType);
}

export function buildLivPromptFromTemplate(ctx: LivPromptContext): string {
  const { business, policies, services, staff, pack, knownCustomer, today } = ctx;
  const greeting =
    business.aiGreeting?.trim() ||
    livDefaultGreeting(pack.id ?? null, business.name);
  const houseRules =
    policies.houseRulesBlock?.trim() || business.aiKnowledge?.trim() || "";
  const knowledgeSection = houseRules
    ? `\n\nIMPORTANT BUSINESS NOTES (always honor these):\n${houseRules}\n`
    : "";
  const canBookDirectly = (business.aiCanBookDirectly ?? "true") === "true";
  const customerSection = livKnownCustomerPromptBlock(knownCustomer);

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

  const bookingRules = livBookingRulesCopy(canBookDirectly);

  return `You are Liv, the AI booking assistant for ${business.name}${business.city ? ` (${business.city})` : ""}.
Today is ${today} in timezone ${business.timezone}.

VERTICAL CONTEXT:
${pack.promptModule}

TONE:
${livToneInstruction(business.aiTone ?? "FRIENDLY")}

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

${livSystemPromptRulesBlock()}

${livVoiceCharacterBlock(modalityFromContext(ctx))}`;
}
