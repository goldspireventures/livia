import { anthropic } from "@workspace/integrations-anthropic-ai";
import type Anthropic from "@anthropic-ai/sdk";
import { type Business } from "@workspace/db";
import { getBusinessBySlug } from "./businesses.service";
import { listServices } from "./services.service";
import { listStaff } from "./staff.service";
import { getAvailableSlots } from "./slots.service";
import { findOrCreateCustomer } from "./customers.service";
import { createBooking } from "./bookings.service";
import { logEvent } from "./events.service";
import { EventType } from "@workspace/db";
import {
  appendMessage,
  getConversation,
  createConversation,
  listMessagesForConversation,
  attachCustomer,
  updateConversationContact,
  type ConversationMessageRole,
} from "./conversations.service";

const MODEL = "claude-sonnet-4-6";
const MAX_TOOL_HOPS = 6;

type ToolUseBlock = Extract<Anthropic.ContentBlock, { type: "tool_use" }>;
type TextBlock = Extract<Anthropic.ContentBlock, { type: "text" }>;

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

function todayInTimezone(timezone: string): string {
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  return fmt.format(new Date());
}

function buildSystemPrompt(args: {
  business: Business;
  services: Array<{ id: string; name: string; durationMinutes: number; priceMinor: number; currency: string; description: string | null }>;
  staff: Array<{ id: string; displayName: string }>;
  knownCustomer?: { name?: string | null; email?: string | null; phone?: string | null };
}): string {
  const { business, services, staff, knownCustomer } = args;
  const today = todayInTimezone(business.timezone);
  const greeting = business.aiGreeting ?? `Hi! I'm the AI assistant for ${business.name}. I can help you book an appointment.`;
  const knowledgeSection = business.aiKnowledge?.trim()
    ? `\n\nIMPORTANT BUSINESS NOTES (always honor these):\n${business.aiKnowledge.trim()}\n`
    : "";
  const canBookDirectly = (business.aiCanBookDirectly ?? "true") === "true";
  const customerSection = knownCustomer && (knownCustomer.name || knownCustomer.email || knownCustomer.phone)
    ? `\n\nThe customer has provided: ${[
        knownCustomer.name && `name=${knownCustomer.name}`,
        knownCustomer.email && `email=${knownCustomer.email}`,
        knownCustomer.phone && `phone=${knownCustomer.phone}`,
      ].filter(Boolean).join(", ")}. Don't ask for these again unless missing.`
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
    : "(no staff configured)";

  return `You are an AI booking assistant for **${business.name}**${business.city ? ` in ${business.city}` : ""}, operating in timezone ${business.timezone}.

Today's date is ${today}.

${tonePhrase(business.aiTone)}

Your job is to help customers book appointments smoothly. You can:
1. Answer questions about services, prices, durations, and staff.
2. Find available time slots using the find_slots tool.
3. ${canBookDirectly ? "Create bookings directly using the create_booking tool once you have everything needed." : "Propose a booking using the create_booking tool, but tell the customer the booking is pending owner confirmation."}

You should always:
- Greet new customers with: "${greeting}" (or a natural variation if the conversation is already warm).
- Ask for any information you don't have: which service, when, who it's for (name + email or phone).
- Confirm the booking details back to the customer in plain language before calling create_booking.
- After booking, summarize what was booked, the date/time, and that the shop will be in touch.
- If something is unavailable, propose 1–2 nearby alternatives.
- Keep replies short (1–4 sentences usually). No markdown unless listing slots.
- If the customer asks for something outside booking (refunds, complaints), say you'll have a human follow up.

Available services:
${servicesList}

Available staff:
${staffList}${customerSection}${knowledgeSection}

Tool usage rules:
- find_slots requires a serviceId (use the exact id strings above) and a date in YYYY-MM-DD form. Optionally a staffId.
- create_booking requires serviceId, startAt (full ISO datetime from find_slots, e.g. "2025-05-06T14:00:00.000Z"), and customer info (firstName + at least one of email/phone). staffId optional.
- Never invent ids. If you don't see what the customer asks for, say so honestly.`;
}

const TOOLS: Anthropic.Tool[] = [
  {
    name: "find_slots",
    description: "Find available appointment time slots for a given service and date. Returns up to ~20 slots.",
    input_schema: {
      type: "object",
      properties: {
        serviceId: { type: "string", description: "The exact id of the service the customer wants." },
        date: { type: "string", description: "Date in YYYY-MM-DD format (in business timezone)." },
        staffId: { type: "string", description: "Optional. Specific staff member id." },
      },
      required: ["serviceId", "date"],
    },
  },
  {
    name: "create_booking",
    description: "Create a new appointment booking once the customer has confirmed the details.",
    input_schema: {
      type: "object",
      properties: {
        serviceId: { type: "string" },
        startAt: { type: "string", description: "ISO datetime returned by find_slots." },
        staffId: { type: "string", description: "Optional staff id. If omitted, any qualified staff is used." },
        customerFirstName: { type: "string" },
        customerLastName: { type: "string" },
        customerEmail: { type: "string" },
        customerPhone: { type: "string" },
        notes: { type: "string", description: "Any special requests from the customer." },
      },
      required: ["serviceId", "startAt", "customerFirstName"],
    },
  },
];

async function executeTool(args: {
  toolName: string;
  toolInput: any;
  business: Business;
  conversationId: string;
}): Promise<{ result: any; bookingId?: string }> {
  const { toolName, toolInput, business, conversationId } = args;

  if (toolName === "find_slots") {
    const slots = await getAvailableSlots({
      businessId: business.id,
      serviceId: toolInput.serviceId,
      date: toolInput.date,
      staffId: toolInput.staffId,
      timezone: business.timezone,
    });
    const available = slots.filter((s: any) => s.available).slice(0, 20);
    return {
      result: {
        date: toolInput.date,
        slots: available.map((s: any) => ({
          startAt: s.startAt,
          endAt: s.endAt,
          staffId: s.staffId ?? null,
          staffName: s.staffName ?? null,
        })),
      },
    };
  }

  if (toolName === "create_booking") {
    const customer = await findOrCreateCustomer(business.id, {
      firstName: toolInput.customerFirstName,
      lastName: toolInput.customerLastName ?? undefined,
      email: toolInput.customerEmail ?? undefined,
      phone: toolInput.customerPhone ?? undefined,
    });

    try {
      const booking = await createBooking(business.id, {
        serviceId: toolInput.serviceId,
        customerId: customer.id,
        staffId: toolInput.staffId ?? undefined,
        startAt: toolInput.startAt,
        channelType: "WEB",
        notes: toolInput.notes ?? undefined,
      });

      await attachCustomer(conversationId, customer.id, {
        name: [toolInput.customerFirstName, toolInput.customerLastName].filter(Boolean).join(" "),
        email: toolInput.customerEmail,
        phone: toolInput.customerPhone,
      });

      await logEvent({
        type: EventType.BOOKING_CREATED,
        businessId: business.id,
        entityType: "booking",
        entityId: booking.id,
        context: { source: "ai-assistant", conversationId },
      });

      return {
        bookingId: booking.id,
        result: {
          ok: true,
          bookingId: booking.id,
          status: booking.status,
          startAt: booking.startAt,
          endAt: booking.endAt,
          serviceName: booking.service?.name ?? null,
          staffName: booking.staff?.displayName ?? null,
        },
      };
    } catch (err: any) {
      if (err?.message === "SLOT_CONFLICT") {
        return { result: { ok: false, error: "SLOT_CONFLICT", message: "That slot was just taken. Try another." } };
      }
      if (err?.message === "SERVICE_NOT_FOUND") {
        return { result: { ok: false, error: "SERVICE_NOT_FOUND", message: "Service not found." } };
      }
      return { result: { ok: false, error: "UNKNOWN", message: err?.message ?? "Booking failed" } };
    }
  }

  return { result: { ok: false, error: "UNKNOWN_TOOL" } };
}

function dbRoleToAnthropic(role: ConversationMessageRole): "user" | "assistant" | null {
  if (role === "USER") return "user";
  if (role === "ASSISTANT") return "assistant";
  return null;
}

export async function handlePublicChat(args: {
  slug: string;
  conversationId?: string;
  message: string;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
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

  // Get or create conversation
  let conversation = args.conversationId ? await getConversation(args.conversationId) : null;
  if (!conversation || conversation.businessId !== business.id) {
    conversation = await createConversation({
      businessId: business.id,
      channel: "WEB",
      customerName: args.customerName,
      customerEmail: args.customerEmail,
      customerPhone: args.customerPhone,
    });
  } else if (args.customerName || args.customerEmail || args.customerPhone) {
    // Backfill conversation contact info from latest message envelope
    await updateConversationContact(conversation.id, {
      name: args.customerName,
      email: args.customerEmail,
      phone: args.customerPhone,
    });
  }

  // Persist the user message
  await appendMessage({
    conversationId: conversation.id,
    role: "USER",
    content: args.message,
  });

  // If a human took over OR the conversation is closed, just store the message and return a no-op reply.
  // The AI does not respond unless aiHandled === true AND status === "OPEN".
  if (conversation.status !== "OPEN" || !conversation.aiHandled) {
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

  // Build context
  const [services, staff, history] = await Promise.all([
    listServices(business.id, true),
    listStaff(business.id, true),
    listMessagesForConversation(conversation.id),
  ]);

  // Server-side enforcement of aiCanBookDirectly: when false, we drop the
  // create_booking tool entirely so the model literally cannot call it.
  const canBookDirectly = (business.aiCanBookDirectly ?? "true") === "true";
  const activeTools: Anthropic.Tool[] = canBookDirectly
    ? TOOLS
    : TOOLS.filter((t) => t.name !== "create_booking");

  const systemPrompt = buildSystemPrompt({
    business,
    services: services.map((s: any) => ({
      id: s.id,
      name: s.name,
      durationMinutes: s.durationMinutes,
      priceMinor: s.priceMinor,
      currency: s.currency,
      description: s.description,
    })),
    staff: staff.map((s: any) => ({ id: s.id, displayName: s.displayName })),
    knownCustomer: {
      name: conversation.customerName ?? args.customerName ?? null,
      email: conversation.customerEmail ?? args.customerEmail ?? null,
      phone: conversation.customerPhone ?? args.customerPhone ?? null,
    },
  });

  // Convert history to Anthropic message format
  const anthropicMessages: Anthropic.MessageParam[] = [];
  for (const m of history) {
    const r = dbRoleToAnthropic(m.role as ConversationMessageRole);
    if (!r) continue;
    anthropicMessages.push({ role: r, content: m.content });
  }

  let lastBookingId: string | undefined;
  let finalText = "";

  // Tool-use loop
  for (let hop = 0; hop < MAX_TOOL_HOPS; hop++) {
    const response = await anthropic.messages.create({
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
      // Push assistant message with tool_use blocks
      anthropicMessages.push({ role: "assistant", content: response.content });

      // Execute each tool, persist as TOOL message, build user message with tool_result
      const toolResults: Anthropic.ToolResultBlockParam[] = [];
      for (const tu of toolUses) {
        const exec = await executeTool({
          toolName: tu.name,
          toolInput: tu.input,
          business,
          conversationId: conversation.id,
        });
        if (exec.bookingId) lastBookingId = exec.bookingId;

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

    // No tool calls — final response
    finalText = partialText || "Sorry, I didn't catch that. Could you rephrase?";
    break;
  }

  if (!finalText) {
    finalText = "Hmm, that took a few tries. Could you tell me again what you'd like to book?";
  }

  await appendMessage({
    conversationId: conversation.id,
    role: "ASSISTANT",
    content: finalText,
    bookingId: lastBookingId,
  });

  return {
    conversationId: conversation.id,
    reply: finalText,
    bookingId: lastBookingId,
    status: conversation.status,
  };
}
