import { getAnthropic } from "@workspace/integrations-anthropic-ai";
import type Anthropic from "@anthropic-ai/sdk";
import { type Business } from "@workspace/db";
import {
  buildLivSystemPrompt,
  LIV_TOOL_CREATE_BOOKING,
  loadVerticalPack,
  shouldLivUseTools,
} from "@workspace/liv-runtime";
import { buildLivToolDeps } from "../lib/liv-runtime-deps";
import { executeMandateGatedTool } from "./mandate-gated-tool.service";
import { getBusinessBySlug } from "./businesses.service";
import { listServices } from "./services.service";
import { listStaff } from "./staff.service";
import {
  appendMessage,
  getConversation,
  createConversation,
  listMessagesForConversation,
  attachCustomer,
  updateConversationContact,
  type ConversationMessageRole,
} from "./conversations.service";
import { sendAiEmail, sendAiSms } from "./ai-outbound.service";
import { logger } from "../lib/logger";
import { policiesFromBusiness } from "./policies.service";
import { getCachedTenantRuntime } from "../lib/tenant-runtime-pool";
import { resolveLivToolsForBusiness } from "./liv-tool-catalog.service";
import { getActivePromptOverrides } from "./prompt-store.service";
const MODEL = "claude-sonnet-4-6";
const MAX_TOOL_HOPS = 6;

type ToolUseBlock = Extract<Anthropic.ContentBlock, { type: "tool_use" }>;
type TextBlock = Extract<Anthropic.ContentBlock, { type: "text" }>;

function dbRoleToAnthropic(role: ConversationMessageRole): "user" | "assistant" | null {
  if (role === "USER") return "user";
  if (role === "ASSISTANT") return "assistant";
  return null;
}

async function afterCreateBookingNotifications(args: {
  business: Business;
  conversationId: string;
  toolInput: Record<string, unknown>;
  bookingId: string;
  customerId: string;
  serviceName: string | null;
  staffName: string | null;
  startAt: string;
  channelType?: "WEB" | "SMS" | "WHATSAPP" | "INSTAGRAM" | "MESSENGER" | "VOICE";
}): Promise<void> {
  const {
    business,
    conversationId,
    toolInput,
    bookingId,
    customerId,
    serviceName,
    staffName,
    startAt,
    channelType,
  } = args;

  const ch = channelType ?? "WEB";
  if (ch === "WHATSAPP" || ch === "INSTAGRAM" || ch === "MESSENGER" || ch === "SMS") {
    const customerName = [toolInput.customerFirstName, toolInput.customerLastName]
      .filter(Boolean)
      .join(" ");
    void import("./notification-orchestrator.service")
      .then(({ notifyLivBookedViaChannel }) =>
        notifyLivBookedViaChannel({
          businessId: business.id,
          bookingId,
          conversationId,
          channel: ch,
          customerName: customerName || null,
          serviceName,
          startAt,
        }),
      )
      .catch(() => undefined);
  }
  const firstName = String(toolInput.customerFirstName ?? "there");

  if (toolInput.customerEmail) {
    const startLocal = new Date(startAt).toLocaleString("en-IE", {
      dateStyle: "full",
      timeStyle: "short",
    });
    const svc = serviceName ?? "your appointment";
    const staffLine = staffName ? ` with ${staffName}` : "";
    sendAiEmail({
      businessId: business.id,
      businessName: business.name,
      customerId,
      bookingId,
      to: String(toolInput.customerEmail),
      subject: `Booking confirmed — ${svc} at ${business.name}`,
      body: `Hi ${firstName},\n\nYour booking is confirmed:\n\n${svc}${staffLine}\n${startLocal}\n\nReply to this email if you need to reschedule.`,
      signature: `— The ${business.name} team`,
      templateKey: "liv-booking-confirmation",
    }).catch((err) => {
      logger.warn({ err }, "[ai-chat] sendAiEmail failed");
    });
  } else if (toolInput.customerPhone) {
    const startLocal = new Date(startAt).toLocaleString("en-IE", {
      dateStyle: "medium",
      timeStyle: "short",
    });
    const svc = serviceName ?? "your appointment";
    sendAiSms({
      conversationId,
      businessId: business.id,
      businessName: business.name,
      customerId,
      customerPhone: String(toolInput.customerPhone),
      content: `${svc} confirmed for ${startLocal} at ${business.name}. Reply to reschedule.`,
      fromPhone: business.twilioPhoneNumber ?? null,
    }).catch((err) => {
      logger.warn({ err }, "[ai-chat] sendAiSms failed");
    });
  }
}

export async function handlePublicChat(args: {
  slug: string;
  conversationId?: string;
  message: string;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  skipPersistence?: boolean;
  channelType?: "WEB" | "SMS" | "WHATSAPP" | "INSTAGRAM" | "MESSENGER" | "VOICE";
}): Promise<{
  conversationId: string;
  reply: string;
  bookingId?: string;
  status: "OPEN" | "HANDED_OFF" | "CLOSED";
}> {
  const business = await getBusinessBySlug(args.slug);
  if (!business) throw new Error("BUSINESS_NOT_FOUND");

  if ((business.aiEnabled ?? "true") !== "true") {
    throw new Error("AI_DISABLED");
  }

  const cached = await getCachedTenantRuntime(business.id);
  const businessRow = cached.business;
  const policies = policiesFromBusiness(businessRow);
  const promptOverrides = await getActivePromptOverrides(business.id);
  const channelType = args.channelType ?? "WEB";

  let conversation = args.conversationId ? await getConversation(args.conversationId) : null;
  if (!conversation || conversation.businessId !== business.id) {
    const channel =
      channelType === "SMS"
        ? "SMS"
        : channelType === "WHATSAPP"
          ? "WHATSAPP"
          : channelType === "INSTAGRAM"
            ? "INSTAGRAM"
            : channelType === "MESSENGER"
              ? "MESSENGER"
              : channelType === "VOICE"
                ? "VOICE"
                : "WEB";
    conversation = await createConversation({
      businessId: business.id,
      channel,
      customerName: args.customerName,
      customerEmail: args.customerEmail,
      customerPhone: args.customerPhone,
    });
    await appendMessage({
      conversationId: conversation.id,
      role: "ASSISTANT",
      content: policies.aiDisclosure.chatFirstMessage(business.name),
    });
  } else if (args.customerName || args.customerEmail || args.customerPhone) {
    await updateConversationContact(conversation.id, {
      name: args.customerName,
      email: args.customerEmail,
      phone: args.customerPhone,
    });
  }

  if (!args.skipPersistence) {
    await appendMessage({
      conversationId: conversation.id,
      role: "USER",
      content: args.message,
    });
  }

  if (!shouldLivUseTools({ status: conversation.status, aiHandled: conversation.aiHandled })) {
    const reply =
      conversation.status === "CLOSED"
        ? "This conversation is closed. Please start a new chat or contact the shop directly."
        : "Thanks — a team member will get back to you shortly.";
    return {
      conversationId: conversation.id,
      reply,
      status: conversation.status,
    };
  }

  const [services, staff, history, memoryBlock] = await Promise.all([
    listServices(business.id, true),
    listStaff(business.id, { isActive: true }),
    listMessagesForConversation(conversation.id),
    conversation.customerId
      ? import("./liv-memory.service").then(({ buildLivMemoryBlockForCustomer }) =>
          buildLivMemoryBlockForCustomer(business.id, conversation!.customerId!),
        )
      : Promise.resolve(""),
  ]);

  const pack = loadVerticalPack(businessRow.vertical, cached.packConfig);
  const canBookDirectly = (businessRow.aiCanBookDirectly ?? "true") === "true";
  const activeToolDefs = await resolveLivToolsForBusiness(business.id, {
    profile: "tenant_public",
    canBookDirectly,
    extraToolIds: pack.extraToolIds,
  });
  const activeTools: Anthropic.Tool[] = activeToolDefs.map((t) => ({
    name: t.name,
    description: t.description,
    input_schema: t.input_schema as Anthropic.Tool["input_schema"],
  }));

  const systemPrompt =
    buildLivSystemPrompt({
      business: {
        id: businessRow.id,
        name: businessRow.name,
        city: businessRow.city,
        timezone: businessRow.timezone,
        aiTone: businessRow.aiTone,
        aiGreeting: businessRow.aiGreeting,
        aiKnowledge: businessRow.aiKnowledge,
        aiCanBookDirectly: businessRow.aiCanBookDirectly,
      },
      policies,
      packConfig: cached.packConfig ?? undefined,
      promptOverrides,
      verticalId: businessRow.vertical,
      services: services.map((s) => ({
        id: s.id,
        name: s.name,
        durationMinutes: s.durationMinutes,
        priceMinor: s.priceMinor,
        currency: s.currency,
        description: s.description,
      })),
      staff: staff.map((s) => ({ id: s.id, displayName: s.displayName })),
      knownCustomer: {
        name: conversation.customerName ?? args.customerName ?? null,
        email: conversation.customerEmail ?? args.customerEmail ?? null,
        phone: conversation.customerPhone ?? args.customerPhone ?? null,
      },
    }) + memoryBlock;

  const anthropicMessages: Anthropic.MessageParam[] = [];
  for (const m of history) {
    const r = dbRoleToAnthropic(m.role as ConversationMessageRole);
    if (!r) continue;
    anthropicMessages.push({ role: r, content: m.content });
  }

  const toolDeps = buildLivToolDeps({
    business: businessRow,
    conversationId: conversation.id,
    channelType,
  });

  let lastBookingId: string | undefined;
  let finalText = "";

  for (let hop = 0; hop < MAX_TOOL_HOPS; hop++) {
    const response = await getAnthropic().messages.create({
      model: MODEL,
      max_tokens: 8192,
      system: systemPrompt,
      tools: activeTools,
      messages: anthropicMessages,
    });

    const toolUses = response.content.filter((b): b is ToolUseBlock => b.type === "tool_use");
    const textBlocks = response.content.filter((b): b is TextBlock => b.type === "text");
    const partialText = textBlocks.map((b) => b.text).join("\n").trim();

    if (response.stop_reason === "tool_use" && toolUses.length > 0) {
      anthropicMessages.push({ role: "assistant", content: response.content });

      const toolResults: Anthropic.ToolResultBlockParam[] = [];
      for (const tu of toolUses) {
        const toolInput = tu.input as Record<string, unknown>;
        const exec = await executeMandateGatedTool({
          businessId: businessRow.id,
          toolName: tu.name,
          toolInput,
          deps: toolDeps,
          conversationId: conversation.id,
          channelType,
        });
        if (exec.bookingId) {
          lastBookingId = exec.bookingId;
          if (tu.name === LIV_TOOL_CREATE_BOOKING && exec.result.ok === true) {
            const customerId =
              typeof exec.result.customerId === "string" ? exec.result.customerId : null;
            if (customerId) {
              await attachCustomer(conversation.id, customerId, {
                name: [toolInput.customerFirstName, toolInput.customerLastName]
                  .filter(Boolean)
                  .join(" "),
                email: toolInput.customerEmail as string | undefined,
                phone: toolInput.customerPhone as string | undefined,
              });
            }
            await afterCreateBookingNotifications({
              business: businessRow,
              conversationId: conversation.id,
              toolInput,
              bookingId: exec.bookingId,
              customerId: customerId ?? "",
              serviceName: (exec.result.serviceName as string | null) ?? null,
              staffName: (exec.result.staffName as string | null) ?? null,
              startAt: String(exec.result.startAt),
              channelType,
            });
          }
        }

        await appendMessage({
          conversationId: conversation.id,
          role: "TOOL",
          content: `${tu.name} → ${JSON.stringify(exec.result).slice(0, 800)}`,
          toolName: tu.name,
          toolInput: tu.input,
          toolResult: exec.result,
          bookingId: exec.bookingId,
        });

        toolResults.push({
          type: "tool_result",
          tool_use_id: tu.id,
          content: JSON.stringify(exec.result),
        });
      }

      anthropicMessages.push({ role: "user", content: toolResults });
      continue;
    }

    finalText = partialText || "Sorry, I didn't catch that. Could you rephrase?";
    break;
  }

  if (!finalText) {
    finalText = "Hmm, that took a few tries. Could you tell me again what you'd like to book?";
  }

  if (!args.skipPersistence) {
    await appendMessage({
      conversationId: conversation.id,
      role: "ASSISTANT",
      content: finalText,
      bookingId: lastBookingId,
    });
  }

  return {
    conversationId: conversation.id,
    reply: finalText,
    bookingId: lastBookingId,
    status: conversation.status,
  };
}
