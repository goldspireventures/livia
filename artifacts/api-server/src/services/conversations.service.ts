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

export type ConversationChannel = "WEB" | "SMS" | "INSTAGRAM" | "WHATSAPP" | "EMAIL";
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
