import { getAnthropic } from "@workspace/integrations-anthropic-ai";
import type Anthropic from "@anthropic-ai/sdk";
import {
  buildLivSystemPrompt,
  loadVerticalPack,
  STAFF_LIV_INBOX_SUGGESTIONS,
  STAFF_LIV_ACTION_SUGGESTIONS,
} from "@workspace/liv-runtime";
import { appendHumanAudit } from "../lib/audit";
import { buildLivToolDeps } from "../lib/liv-runtime-deps";
import { executeMandateGatedTool } from "./mandate-gated-tool.service";
import { getCachedTenantRuntime } from "../lib/tenant-runtime-pool";
import { getBusinessById } from "./businesses.service";
import { policiesFromBusiness } from "./policies.service";
import { getActivePromptOverrides } from "./prompt-store.service";
import { listServices } from "./services.service";
import { listStaff } from "./staff.service";
import {
  appendMessage,
  getConversation,
  listMessagesForConversation,
  type ConversationMessageRole,
} from "./conversations.service";
import { getMorningBriefing } from "./morning-briefing.service";
import { buildLivMemoryBlockForCustomer } from "./liv-memory.service";
import { resolveLivToolsForBusiness } from "./liv-tool-catalog.service";
import { recordEvalTraceForTool } from "../lib/eval-traces";

const MODEL = "claude-sonnet-4-6";
const MAX_TOOL_HOPS = 6;

type ToolUseBlock = Extract<Anthropic.ContentBlock, { type: "tool_use" }>;
type TextBlock = Extract<Anthropic.ContentBlock, { type: "text" }>;

function dbRoleToAnthropic(role: ConversationMessageRole): "user" | "assistant" | null {
  if (role === "USER") return "user";
  if (role === "ASSISTANT") return "assistant";
  return null;
}

export async function handleStaffLivAssist(args: {
  businessId: string;
  conversationId: string;
  message: string;
  staffUserId: string;
}): Promise<{ reply: string; bookingId?: string; suggestions: string[]; toolsUsed: string[] }> {
  const business = await getBusinessById(args.businessId);
  if (!business) throw new Error("BUSINESS_NOT_FOUND");

  const conversation = await getConversation(args.conversationId);
  if (!conversation || conversation.businessId !== args.businessId) {
    throw new Error("CONVERSATION_NOT_FOUND");
  }

  const cached = await getCachedTenantRuntime(args.businessId);
  const policies = policiesFromBusiness(cached.business);
  const promptOverrides = await getActivePromptOverrides(args.businessId);
  const pack = loadVerticalPack(cached.business.vertical, cached.packConfig);

  const [services, staff, history, briefing, memoryBlock] = await Promise.all([
    listServices(args.businessId, true),
    listStaff(args.businessId, { isActive: true }),
    listMessagesForConversation(args.conversationId),
    getMorningBriefing(args.businessId),
    conversation.customerId
      ? buildLivMemoryBlockForCustomer(args.businessId, conversation.customerId)
      : Promise.resolve(""),
  ]);

  const canBookDirectly = (cached.business.aiCanBookDirectly ?? "true") === "true";
  const tools = await resolveLivToolsForBusiness(args.businessId, {
    profile: "tenant_staff",
    canBookDirectly,
    extraToolIds: pack.extraToolIds,
  });

  const briefingBlock = briefing?.content
    ? `\n\nMORNING BRIEFING (${briefing.briefingDate}):\n${(briefing.content as { summary?: string }).summary ?? ""}\n`
    : "";

  const systemPrompt =
    buildLivSystemPrompt({
      business: {
        id: cached.business.id,
        name: cached.business.name,
        city: cached.business.city,
        timezone: cached.business.timezone,
        aiTone: cached.business.aiTone,
        aiGreeting: cached.business.aiGreeting,
        aiKnowledge: cached.business.aiKnowledge,
        aiCanBookDirectly: cached.business.aiCanBookDirectly,
      },
      policies,
      packConfig: cached.packConfig ?? undefined,
      promptOverrides,
      verticalId: cached.business.vertical,
      services: services.map((s) => ({
        id: s.id,
        name: s.name,
        durationMinutes: s.durationMinutes,
        priceMinor: s.priceMinor,
        currency: s.currency,
        description: s.description,
      })),
      staff: staff.map((s) => ({ id: s.id, displayName: s.displayName })),
    }) +
    `\n\nSTAFF ASSIST MODE: You are helping a team member manage this thread. Use tools to confirm/cancel/reschedule bookings or look up customers when asked.${briefingBlock}${memoryBlock}`;

  const anthropicTools: Anthropic.Tool[] = tools.map((t) => ({
    name: t.name,
    description: t.description,
    input_schema: t.input_schema as Anthropic.Tool["input_schema"],
  }));

  const anthropicMessages: Anthropic.MessageParam[] = [];
  for (const m of history) {
    const r = dbRoleToAnthropic(m.role as ConversationMessageRole);
    if (!r) continue;
    anthropicMessages.push({ role: r, content: m.content });
  }
  anthropicMessages.push({ role: "user", content: args.message });

  const channelType =
    conversation.channel === "SMS"
      ? "SMS"
      : conversation.channel === "WHATSAPP"
        ? "WHATSAPP"
        : conversation.channel === "INSTAGRAM"
          ? "INSTAGRAM"
          : conversation.channel === "MESSENGER"
            ? "MESSENGER"
            : conversation.channel === "VOICE"
              ? "VOICE"
              : "WEB";

  const toolDeps = buildLivToolDeps({
    business: cached.business,
    conversationId: args.conversationId,
    channelType,
    staffAuthorUserId: args.staffUserId,
  });

  let lastBookingId: string | undefined;
  let finalText = "";
  const toolsUsed: string[] = [];

  for (let hop = 0; hop < MAX_TOOL_HOPS; hop++) {
    const response = await getAnthropic().messages.create({
      model: MODEL,
      max_tokens: 4096,
      system: systemPrompt,
      tools: anthropicTools,
      messages: anthropicMessages,
    });

    const toolUses = response.content.filter((b): b is ToolUseBlock => b.type === "tool_use");
    const textBlocks = response.content.filter((b): b is TextBlock => b.type === "text");
    finalText = textBlocks.map((b) => b.text).join("\n").trim();

    if (response.stop_reason !== "tool_use" || toolUses.length === 0) break;

    anthropicMessages.push({ role: "assistant", content: response.content });
    const toolResults: Anthropic.ToolResultBlockParam[] = [];
    for (const tu of toolUses) {
      if (!toolsUsed.includes(tu.name)) toolsUsed.push(tu.name);
      const exec = await executeMandateGatedTool({
        businessId: args.businessId,
        toolName: tu.name,
        toolInput: tu.input as Record<string, unknown>,
        deps: toolDeps,
        conversationId: args.conversationId,
        channelType,
      });
      if (exec.bookingId) lastBookingId = exec.bookingId;
      void recordEvalTraceForTool({
        businessId: args.businessId,
        suite: "liv.staff_assist",
        scenario: tu.name,
        toolName: tu.name,
        toolInput: tu.input as Record<string, unknown>,
        toolResult: exec.result,
      }).catch(() => undefined);
      toolResults.push({
        type: "tool_result",
        tool_use_id: tu.id,
        content: JSON.stringify(exec.result),
      });
    }
    anthropicMessages.push({ role: "user", content: toolResults });
  }

  if (!finalText) finalText = "Done — let me know if you need anything else on this thread.";

  await appendMessage({
    conversationId: args.conversationId,
    role: "USER",
    content: args.message,
    authorUserId: args.staffUserId,
  });
  await appendMessage({
    conversationId: args.conversationId,
    role: "ASSISTANT",
    content: finalText,
    bookingId: lastBookingId,
  });

  await appendHumanAudit(
    args.businessId,
    args.staffUserId,
    "human.liv.staff_assist",
    "conversation",
    args.conversationId,
    { toolsUsed, bookingId: lastBookingId ?? null },
  ).catch(() => undefined);

  const suggestions = [
    ...STAFF_LIV_INBOX_SUGGESTIONS.slice(0, 2),
    ...STAFF_LIV_ACTION_SUGGESTIONS.slice(0, 2),
  ];

  return { reply: finalText, bookingId: lastBookingId, suggestions, toolsUsed };
}
