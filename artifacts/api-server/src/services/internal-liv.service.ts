import Anthropic from "@anthropic-ai/sdk";
import { resolveLivTools, type LivToolDeps } from "@workspace/liv-runtime";
import { searchInternalTenants, getInternalTenantDetail } from "./internal-ops.service";
import { executeMandateGatedTool } from "./mandate-gated-tool.service";

const MODEL = process.env.ANTHROPIC_MODEL ?? "claude-sonnet-4-20250514";
const MAX_TOOL_HOPS = 6;

let anthropic: Anthropic | null = null;
function getAnthropic(): Anthropic {
  if (!anthropic) anthropic = new Anthropic();
  return anthropic;
}

function buildInternalDeps(): LivToolDeps {
  return {
    async findSlots() {
      return [];
    },
    async createBooking() {
      throw new Error("NOT_AVAILABLE_INTERNAL");
    },
    async searchTenants(input) {
      const res = await searchInternalTenants({
        q: input.q,
        limit: input.limit ?? 10,
      });
      return {
        total: res.total,
        tenants: res.data.map((t) => ({
          id: t.id,
          name: t.name,
          slug: t.slug,
          lastBookingAt: t.lastBookingAt,
        })),
      };
    },
    async tenantSnapshot(input) {
      const detail = await getInternalTenantDetail(input.businessId);
      if (!detail) return { ok: false, error: "NOT_FOUND" };
      return {
        ok: true,
        id: detail.id,
        name: detail.name,
        slug: detail.slug,
        planId: detail.planId,
        stripeSubscriptionStatus: detail.stripeSubscriptionStatus,
        aiEnabled: detail.aiEnabled,
        bookingCount: detail.bookingCount,
        activeStaffCount: detail.activeStaffCount,
        lastBookingAt: detail.lastBookingAt,
        voiceProvisioned: detail.voiceProvisioned,
        deepLinks: detail.deepLinks,
      };
    },
  };
}

export const INTERNAL_LIV_SUGGESTIONS = [
  "Which tenants have no booking in the last 14 days?",
  "Summarize health for the tenant I'm viewing.",
  "Who has AI disabled but open conversations?",
  "List tenants with voice provisioned and low weekly bookings.",
] as const;

export async function handleInternalLivAssist(args: {
  message: string;
  focusBusinessId?: string;
}): Promise<{ reply: string; suggestions: string[] }> {
  const tools = resolveLivTools({
    profile: "livia_internal",
    canBookDirectly: false,
  });

  const systemPrompt = [
    "You are Liv for Livia Inc internal operators (support, success, engineering).",
    "You help triage tenants: search by name/slug/email/Stripe id, then open a health snapshot.",
    "Never invent tenant ids. Never claim you changed tenant data — read-only in v1.",
    args.focusBusinessId
      ? `Operator is viewing tenant ${args.focusBusinessId} — prefer tenant_snapshot for that id when relevant.`
      : "",
  ]
    .filter(Boolean)
    .join("\n");

  const anthropicTools: Anthropic.Tool[] = tools.map((t) => ({
    name: t.name,
    description: t.description,
    input_schema: t.input_schema as Anthropic.Tool["input_schema"],
  }));

  const messages: Anthropic.MessageParam[] = [
    { role: "user", content: args.message.trim() },
  ];

  const deps = buildInternalDeps();
  let finalText = "";

  for (let hop = 0; hop < MAX_TOOL_HOPS; hop++) {
    const response = await getAnthropic().messages.create({
      model: MODEL,
      max_tokens: 4096,
      system: systemPrompt,
      tools: anthropicTools.length ? anthropicTools : undefined,
      messages,
    });

    const toolUses = response.content.filter((b) => b.type === "tool_use");
    const textBlocks = response.content.filter((b) => b.type === "text");
    finalText = textBlocks.map((b) => (b.type === "text" ? b.text : "")).join("\n");

    if (response.stop_reason !== "tool_use" || toolUses.length === 0) break;

    messages.push({ role: "assistant", content: response.content });

    const toolResults: Anthropic.ToolResultBlockParam[] = [];
    for (const tu of toolUses) {
      if (tu.type !== "tool_use") continue;
      const executed = await executeMandateGatedTool({
        businessId: args.focusBusinessId ?? "internal",
        toolName: tu.name,
        toolInput: tu.input as Record<string, unknown>,
        deps,
        conversationId: "internal",
        channelType: "WEB",
      });
      toolResults.push({
        type: "tool_result",
        tool_use_id: tu.id,
        content: JSON.stringify(executed.result),
      });
    }
    messages.push({ role: "user", content: toolResults });
  }

  const suggestions = args.focusBusinessId
    ? [
        `Health snapshot for ${args.focusBusinessId}`,
        "Why might this tenant's inbox be quiet?",
        "What should success do in the first 7 days?",
      ]
    : [...INTERNAL_LIV_SUGGESTIONS];

  return { reply: finalText.trim() || "Done.", suggestions };
}
