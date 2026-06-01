import {
  db,
  conversationsTable,
  conversationMessagesTable,
  customersTable,
  bookingsTable,
  servicesTable,
  staffTable,
  type Conversation,
  type ConversationMessage,
} from "@workspace/db";
import { eq, and, desc, asc, sql } from "drizzle-orm";
import { generateId } from "../lib/id";
import {
  sendAiEmail,
  sendAiInstagram,
  sendAiMessenger,
  sendAiSms,
  sendAiWhatsapp,
} from "./ai-outbound.service";
import { listChannelIdentitiesForCustomer } from "./channel-identities.service";
import { businessesTable } from "@workspace/db";

export type ConversationChannel =
  | "WEB"
  | "SMS"
  | "INSTAGRAM"
  | "WHATSAPP"
  | "MESSENGER"
  | "EMAIL"
  | "VOICE";
export type ConversationStatus = "OPEN" | "HANDED_OFF" | "CLOSED";
export type ConversationMessageRole = "USER" | "ASSISTANT" | "SYSTEM" | "TOOL";

export async function createConversation(input: {
  businessId: string;
  channel?: ConversationChannel;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
}): Promise<Conversation> {
  const id = generateId();
  const [row] = await db
    .insert(conversationsTable)
    .values({
      id,
      businessId: input.businessId,
      channel: input.channel ?? "WEB",
      status: "OPEN",
      customerName: input.customerName ?? null,
      customerEmail: input.customerEmail ?? null,
      customerPhone: input.customerPhone ?? null,
    })
    .returning();
  return row;
}

export async function getConversation(id: string): Promise<Conversation | null> {
  const [row] = await db.select().from(conversationsTable).where(eq(conversationsTable.id, id));
  return row ?? null;
}

export async function listConversationsForBusiness(
  businessId: string,
  opts: { status?: ConversationStatus; limit?: number } = {},
) {
  const conditions = [eq(conversationsTable.businessId, businessId)];
  if (opts.status) conditions.push(eq(conversationsTable.status, opts.status));
  const limit = opts.limit ?? 50;

  const rows = await db
    .select({
      id: conversationsTable.id,
      businessId: conversationsTable.businessId,
      customerId: conversationsTable.customerId,
      channel: conversationsTable.channel,
      status: conversationsTable.status,
      customerName: conversationsTable.customerName,
      customerEmail: conversationsTable.customerEmail,
      customerPhone: conversationsTable.customerPhone,
      aiHandled: conversationsTable.aiHandled,
      summary: conversationsTable.summary,
      linkedBookingId: conversationsTable.linkedBookingId,
      caseIntent: conversationsTable.caseIntent,
      resolution: conversationsTable.resolution,
      lastMessageAt: conversationsTable.lastMessageAt,
      createdAt: conversationsTable.createdAt,
      lastMessage: sql<string | null>`(
        SELECT cm.content FROM conversation_messages cm
        WHERE cm.conversation_id = ${conversationsTable.id}
          AND cm.role IN ('USER','ASSISTANT')
        ORDER BY cm.created_at DESC LIMIT 1
      )`,
      messageCount: sql<number>`(
        SELECT count(*)::int FROM conversation_messages cm
        WHERE cm.conversation_id = ${conversationsTable.id}
      )`,
      bookingCount: sql<number>`(
        SELECT count(*)::int FROM conversation_messages cm
        WHERE cm.conversation_id = ${conversationsTable.id}
          AND cm.booking_id IS NOT NULL
      )`,
    })
    .from(conversationsTable)
    .where(and(...conditions))
    .orderBy(desc(conversationsTable.lastMessageAt))
    .limit(limit);

  return rows;
}

export async function findOpenConversationByChannelAndPhone(
  businessId: string,
  channel: ConversationChannel,
  customerPhone: string,
): Promise<Conversation | null> {
  const [row] = await db
    .select()
    .from(conversationsTable)
    .where(
      and(
        eq(conversationsTable.businessId, businessId),
        eq(conversationsTable.channel, channel),
        eq(conversationsTable.status, "OPEN"),
        eq(conversationsTable.customerPhone, customerPhone),
      ),
    )
    .orderBy(desc(conversationsTable.lastMessageAt))
    .limit(1);
  return row ?? null;
}

export async function listMessagesForConversation(
  conversationId: string,
): Promise<ConversationMessage[]> {
  return db
    .select()
    .from(conversationMessagesTable)
    .where(eq(conversationMessagesTable.conversationId, conversationId))
    .orderBy(asc(conversationMessagesTable.createdAt));
}

export async function appendMessage(input: {
  conversationId: string;
  role: ConversationMessageRole;
  content: string;
  toolName?: string;
  toolInput?: unknown;
  toolResult?: unknown;
  bookingId?: string;
  authorUserId?: string | null;
}): Promise<ConversationMessage> {
  const id = generateId();
  const [row] = await db
    .insert(conversationMessagesTable)
    .values({
      id,
      conversationId: input.conversationId,
      role: input.role,
      content: input.content,
      toolName: input.toolName ?? null,
      toolInput: input.toolInput ?? null,
      toolResult: input.toolResult ?? null,
      bookingId: input.bookingId ?? null,
      authorUserId: input.authorUserId ?? null,
    })
    .returning();

  await db
    .update(conversationsTable)
    .set({ lastMessageAt: new Date(), updatedAt: new Date() })
    .where(eq(conversationsTable.id, input.conversationId));

  return row;
}

export async function updateConversationStatus(
  conversationId: string,
  status: ConversationStatus,
  aiHandled?: boolean,
): Promise<Conversation> {
  const [row] = await db
    .update(conversationsTable)
    .set({
      status,
      ...(aiHandled !== undefined ? { aiHandled } : {}),
      updatedAt: new Date(),
    })
    .where(eq(conversationsTable.id, conversationId))
    .returning();
  return row;
}

export async function updateConversationContact(
  conversationId: string,
  details: { name?: string; email?: string; phone?: string },
) {
  const patch: Record<string, unknown> = { updatedAt: new Date() };
  if (details.name) patch.customerName = details.name;
  if (details.email) patch.customerEmail = details.email;
  if (details.phone) patch.customerPhone = details.phone;
  // Avoid an empty SET — only call when at least one field is present.
  if (Object.keys(patch).length === 1) return;
  await db
    .update(conversationsTable)
    .set(patch)
    .where(eq(conversationsTable.id, conversationId));
}

/** Staff outbound reply from dashboard (HANDED_OFF or OPEN with ai paused). */
export async function sendStaffMessage(input: {
  businessId: string;
  conversationId: string;
  authorUserId: string;
  content: string;
}): Promise<ConversationMessage> {
  const conv = await getConversation(input.conversationId);
  if (!conv || conv.businessId !== input.businessId) {
    throw new Error("CONVERSATION_NOT_FOUND");
  }
  const trimmed = input.content.trim();
  if (!trimmed) throw new Error("EMPTY_MESSAGE");

  const row = await appendMessage({
    conversationId: input.conversationId,
    role: "ASSISTANT",
    content: trimmed,
    authorUserId: input.authorUserId,
  });

  const [biz] = await db.select().from(businessesTable).where(eq(businessesTable.id, input.businessId));

  if (conv.channel === "WHATSAPP" && conv.customerPhone && biz) {
    void sendAiWhatsapp({
      conversationId: conv.id,
      businessId: biz.id,
      businessName: biz.name,
      customerId: conv.customerId ?? undefined,
      customerPhone: conv.customerPhone,
      content: trimmed,
    }).catch(() => undefined);
  } else if (conv.channel === "SMS" && conv.customerPhone && biz) {
    void sendAiSms({
      conversationId: conv.id,
      businessId: biz.id,
      businessName: biz.name,
      customerId: conv.customerId ?? undefined,
      customerPhone: conv.customerPhone,
      content: trimmed,
      fromPhone: biz.twilioPhoneNumber ?? null,
    }).catch(() => undefined);
  } else if ((conv.channel === "INSTAGRAM" || conv.channel === "MESSENGER") && biz) {
    let recipientId: string | undefined;
    if (conv.customerId) {
      const identities = await listChannelIdentitiesForCustomer(biz.id, conv.customerId);
      recipientId = identities.find((i) => i.channelType === "INSTAGRAM")?.externalId;
    }
    if (!recipientId && conv.customerPhone?.startsWith("meta:")) {
      recipientId = conv.customerPhone.slice("meta:".length);
    }
    if (recipientId) {
      const send =
        conv.channel === "INSTAGRAM" ? sendAiInstagram : sendAiMessenger;
      void send({
        conversationId: conv.id,
        businessId: biz.id,
        businessName: biz.name,
        customerId: conv.customerId ?? undefined,
        recipientId,
        content: trimmed,
      }).catch(() => undefined);
    }
  } else if (conv.customerEmail && biz) {
    void sendAiEmail({
      businessId: biz.id,
      businessName: biz.name,
      customerId: conv.customerId ?? undefined,
      bookingId: undefined,
      to: conv.customerEmail,
      subject: `Message from ${biz.name}`,
      body: trimmed,
      signature: `— ${biz.name}`,
      templateKey: "staff-inbox-reply",
    }).catch(() => undefined);
  }

  return row;
}

export async function attachCustomer(
  conversationId: string,
  customerId: string,
  details?: { name?: string; email?: string; phone?: string },
) {
  await db
    .update(conversationsTable)
    .set({
      customerId,
      customerName: details?.name ?? undefined,
      customerEmail: details?.email ?? undefined,
      customerPhone: details?.phone ?? undefined,
      updatedAt: new Date(),
    })
    .where(eq(conversationsTable.id, conversationId));
}
