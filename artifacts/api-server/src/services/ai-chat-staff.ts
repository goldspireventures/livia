import { getAnthropic } from "@workspace/integrations-anthropic-ai";
import type Anthropic from "@anthropic-ai/sdk";
import {
  buildLivSystemPrompt,
  loadVerticalPack,
  STAFF_LIV_ACTION_SUGGESTIONS,
} from "@workspace/liv-runtime";
import { livOwnerAdvisorModeBlock, ownerLivOpsDynamicSuggestions, staffLivInboxSuggestions } from "@workspace/policy";
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
import { getSetupGuidedFlowForBusiness } from "./setup-guided-flow.service";
import { buildBusinessTwinPromptBlock } from "./business-twin.service";
import { buildLivMemoryBlockForBusiness, buildLivMemoryBlockForCustomer, buildLivLearningPromptBlock } from "./liv-memory.service";
import { buildLivPlatformAwarenessPromptBlock } from "./liv-platform-awareness.service";
import { buildLivObservatoryPromptBlock } from "./liv-observatory.service";
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
  livMode?: "setup" | "ops" | "advisor";
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

  const [services, staff, history, briefing, memoryBlock, businessMemoryBlock, learningBlock, awarenessBlock, observatoryBlock, twinBlock] =
    await Promise.all([
    listServices(args.businessId, true),
    listStaff(args.businessId, { isActive: true }),
    listMessagesForConversation(args.conversationId),
    getMorningBriefing(args.businessId),
    conversation.customerId
      ? buildLivMemoryBlockForCustomer(args.businessId, conversation.customerId)
      : Promise.resolve(""),
    buildLivMemoryBlockForBusiness(args.businessId),
    buildLivLearningPromptBlock(args.businessId),
    buildLivPlatformAwarenessPromptBlock({ businessId: args.businessId, profile: "tenant_staff" }),
    buildLivObservatoryPromptBlock(args.businessId),
    buildBusinessTwinPromptBlock(args.businessId),
  ]);

  const canBookDirectly = (cached.business.aiCanBookDirectly ?? "true") === "true";
  const livMode = args.livMode === "setup" ? "setup" : "ops";
  const tools = await resolveLivToolsForBusiness(args.businessId, {
    profile: "tenant_staff",
    canBookDirectly,
    livMode,
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
    (livMode === "setup"
      ? `\n\nSETUP COPILOT MODE: Help the owner finish shop setup — presets, onboarding acts, activation status. Use read-only setup tools; do not book or message customers unless they switch to ops mode.${briefingBlock}${twinBlock}`
      : `\n\nSTAFF ASSIST MODE: You are helping a team member manage this thread. Use tools to confirm/cancel/reschedule bookings or look up customers when asked. Prefer get_owner_intelligence or get_business_twin when advising strategy; use get_commerce_signals or get_commerce_snapshot for revenue; list_capability_blockers for setup gaps.${briefingBlock}${memoryBlock}${businessMemoryBlock}${learningBlock}${awarenessBlock}${observatoryBlock}${twinBlock}`);

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
    ...staffLivInboxSuggestions(cached.business.vertical, cached.business.category, "open").slice(
      0,
      2,
    ),
    ...STAFF_LIV_ACTION_SUGGESTIONS.slice(0, 2),
  ];

  return { reply: finalText, bookingId: lastBookingId, suggestions, toolsUsed };
}

const SETUP_COPILOT_SUGGESTIONS = [
  "What still needs doing before I'm live?",
  "What should I set up first?",
  "Talk me through publishing my booking link.",
];

/** Owner setup copilot — no customer thread required. */
export async function handleSetupLivCopilot(args: {
  businessId: string;
  message: string;
  staffUserId: string;
  history?: { role: "user" | "assistant"; content: string }[];
}): Promise<{ reply: string; suggestions: string[]; toolsUsed: string[] }> {
  const business = await getBusinessById(args.businessId);
  if (!business) throw new Error("BUSINESS_NOT_FOUND");

  const cached = await getCachedTenantRuntime(args.businessId);
  const policies = policiesFromBusiness(cached.business);
  const promptOverrides = await getActivePromptOverrides(args.businessId);
  const pack = loadVerticalPack(cached.business.vertical, cached.packConfig);

  const [services, staff, briefing, twinBlock, guidedFlow] = await Promise.all([
    listServices(args.businessId, true),
    listStaff(args.businessId, { isActive: true }),
    getMorningBriefing(args.businessId),
    buildBusinessTwinPromptBlock(args.businessId),
    getSetupGuidedFlowForBusiness(args.businessId),
  ]);

  const tools = await resolveLivToolsForBusiness(args.businessId, {
    profile: "tenant_staff",
    canBookDirectly: false,
    livMode: "setup",
    extraToolIds: pack.extraToolIds,
  });

  const briefingBlock = briefing?.content
    ? `\n\nMORNING BRIEFING (${briefing.briefingDate}):\n${(briefing.content as { summary?: string }).summary ?? ""}\n`
    : "";

  const capabilityBlock =
    guidedFlow?.capabilityBlockers.length ?
      `\n\nCAPABILITY READINESS BLOCKERS:\n${guidedFlow.capabilityBlockers.map((b) => `- ${b.capabilityName}: ${b.blocker}`).join("\n")}\n`
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
    `\n\nSETUP COPILOT MODE: Help the owner finish shop setup — presets, onboarding acts, activation status. Guided flow phases: (1) set up shop essentials, (2) publish booking link via confirm_public_link, (3) optional billing, (4) first booking. Current phase: ${guidedFlow?.currentPhaseId ?? "setup"}. Use get_setup_checklist, get_activation_status, get_business_twin, list_capability_blockers, get_commerce_signals, and get_commerce_snapshot to orient. get_owner_intelligence includes billingAddons — coach unlocks via Settings → Billing (#billing-addons) or checkout-addon when owner is ready to pay. Use preview_presentation before apply_presentation_preset; always pass confirm: true only after owner explicitly approves. patch_liv_persona, patch_brand_assets, patch_operational_policy, patch_business_hours, invite_staff, and assign_service require confirm: true. Use propose_policy_patch before patch_operational_policy. start_channel_connect is read-only — hand off to Settings → Communications.${briefingBlock}${capabilityBlock}${twinBlock}\n\n${livOwnerAdvisorModeBlock()}`;

  const anthropicTools: Anthropic.Tool[] = tools.map((t) => ({
    name: t.name,
    description: t.description,
    input_schema: t.input_schema as Anthropic.Tool["input_schema"],
  }));

  const anthropicMessages: Anthropic.MessageParam[] = [];
  for (const m of args.history ?? []) {
    if (m.role === "user" || m.role === "assistant") {
      anthropicMessages.push({ role: m.role, content: m.content });
    }
  }
  anthropicMessages.push({ role: "user", content: args.message });

  const conversationId = `setup-copilot:${args.businessId}`;
  const toolDeps = buildLivToolDeps({
    business: cached.business,
    conversationId,
    channelType: "WEB",
    staffAuthorUserId: args.staffUserId,
  });

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
        conversationId,
        channelType: "WEB",
      });
      void recordEvalTraceForTool({
        businessId: args.businessId,
        suite: "liv.setup_copilot",
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

  if (!finalText) {
    finalText = "Here's what I found — tell me what you'd like to configure next.";
  }

  await appendHumanAudit(
    args.businessId,
    args.staffUserId,
    "human.liv.setup_copilot",
    "business",
    args.businessId,
    { toolsUsed, messagePreview: args.message.slice(0, 120) },
  ).catch(() => undefined);

  const capabilityPrompt = guidedFlow?.capabilityBlockers[0]
    ? `Help me unblock ${guidedFlow.capabilityBlockers[0].capabilityName}: ${guidedFlow.capabilityBlockers[0].blocker}`
    : null;
  const suggestions = guidedFlow
    ? [
        guidedFlow.nextLivPrompt,
        ...(capabilityPrompt && capabilityPrompt !== guidedFlow.nextLivPrompt
          ? [capabilityPrompt]
          : []),
        ...SETUP_COPILOT_SUGGESTIONS.filter((s) => s !== guidedFlow.nextLivPrompt).slice(0, 2),
      ].slice(0, 3)
    : SETUP_COPILOT_SUGGESTIONS;

  return { reply: finalText, suggestions, toolsUsed };
}

/** Owner ops copilot — strategy, commerce, Twin; no customer thread. */
export async function handleOwnerLivOps(args: {
  businessId: string;
  message: string;
  staffUserId: string;
  history?: { role: "user" | "assistant"; content: string }[];
}): Promise<{ reply: string; suggestions: string[]; toolsUsed: string[] }> {
  const business = await getBusinessById(args.businessId);
  if (!business) throw new Error("BUSINESS_NOT_FOUND");

  const cached = await getCachedTenantRuntime(args.businessId);
  const policies = policiesFromBusiness(cached.business);
  const promptOverrides = await getActivePromptOverrides(args.businessId);
  const pack = loadVerticalPack(cached.business.vertical, cached.packConfig);

  const [services, staff, briefing, twinBlock, learningBlock, awarenessBlock, observatoryBlock, twinBundle] =
    await Promise.all([
    listServices(args.businessId, true),
    listStaff(args.businessId, { isActive: true }),
    getMorningBriefing(args.businessId),
    buildBusinessTwinPromptBlock(args.businessId),
    buildLivLearningPromptBlock(args.businessId),
    buildLivPlatformAwarenessPromptBlock({ businessId: args.businessId, profile: "tenant_staff" }),
    buildLivObservatoryPromptBlock(args.businessId),
    import("./business-twin.service").then((m) => m.getBusinessTwinBundle(args.businessId)),
  ]);

  const tools = await resolveLivToolsForBusiness(args.businessId, {
    profile: "tenant_staff",
    canBookDirectly: false,
    livMode: "advisor",
    extraToolIds: pack.extraToolIds,
  });

  const briefingBlock = briefing?.content
    ? `\n\nMORNING BRIEFING (${briefing.briefingDate}):\n${(briefing.content as { summary?: string }).summary ?? ""}\n`
    : "";

  const twinIntelBlock = twinBundle
    ? `\n\nBUSINESS TWIN (advisor facts — cite evidence when recommending):\n${JSON.stringify(
        {
          headline: twinBundle.summary.headline,
          subline: twinBundle.summary.subline,
          healthScore: twinBundle.health?.overallScore,
          topRecommendations: twinBundle.recommendations?.recommendations.slice(0, 4).map((r) => ({
            title: r.title,
            reason: r.reason,
            priority: r.priority,
            confidence: r.confidence,
            expectedOutcome: r.expectedOutcome,
            evidence: r.evidence,
          })),
        },
        null,
        2,
      )}\n`
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
    `\n\nLIV ADVISOR MODE (Era 2): Coach the owner using Business Twin — start with get_business_twin when facts are stale. Recommendations should be actionable and plain-spoken; cite evidence only when useful, not as jargon. Do not message customers. Link to Settings → Billing for deposit/Stripe fixes.${briefingBlock}${twinIntelBlock}${learningBlock}${awarenessBlock}${observatoryBlock}${twinBlock}\n\n${livOwnerAdvisorModeBlock()}`;

  const anthropicTools: Anthropic.Tool[] = tools.map((t) => ({
    name: t.name,
    description: t.description,
    input_schema: t.input_schema as Anthropic.Tool["input_schema"],
  }));

  const anthropicMessages: Anthropic.MessageParam[] = [];
  for (const m of args.history ?? []) {
    if (m.role === "user" || m.role === "assistant") {
      anthropicMessages.push({ role: m.role, content: m.content });
    }
  }
  anthropicMessages.push({ role: "user", content: args.message });

  const conversationId = `owner-ops:${args.businessId}`;
  const toolDeps = buildLivToolDeps({
    business: cached.business,
    conversationId,
    channelType: "WEB",
    staffAuthorUserId: args.staffUserId,
  });

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
        conversationId,
        channelType: "WEB",
      });
      toolResults.push({
        type: "tool_result",
        tool_use_id: tu.id,
        content: JSON.stringify(exec.result),
      });
    }
    anthropicMessages.push({ role: "user", content: toolResults });
  }

  if (!finalText) {
    finalText = "Tell me what's on your mind — calendar, setup, or billing.";
  }

  await appendHumanAudit(
    args.businessId,
    args.staffUserId,
    "human.liv.owner_advisor",
    "business",
    args.businessId,
    { toolsUsed, messagePreview: args.message.slice(0, 120) },
  ).catch(() => undefined);

  const suggestions = ownerLivOpsDynamicSuggestions(
    twinBundle?.recommendations
      ? {
          remediationTasks: twinBundle.recommendations.recommendations
            .filter((r) => r.priority === "high")
            .map((r) => ({
              id: r.id,
              severity: "act" as const,
              title: r.title,
              ownerPrompt: r.reason,
              body: r.reason,
              href: r.href,
            })),
          livPrompts: twinBundle.recommendations.recommendations.slice(0, 3).map((r) => r.title),
        }
      : null,
  ).slice(0, 4);

  return { reply: finalText, suggestions, toolsUsed };
}
