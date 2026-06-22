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
import { logEvent } from "./events.service";
import { shouldCloseConsultDm } from "@workspace/policy";
import {
  sendAiEmail,
  sendAiInstagram,
  sendAiMessenger,
  sendAiSms,
  sendAiWhatsapp,
} from "./ai-outbound.service";
import { listChannelIdentitiesForCustomer } from "./channel-identities.service";
import {
  recordCustomerInboundTouch,
  recordCustomerOutboundTouch,
} from "./customer-channel-touch.service";
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

export type UnifiedGuestMessage = {
  id: string;
  conversationId: string;
  role: ConversationMessage["role"];
  content: string;
  toolName: string | null;
  bookingId: string | null;
  authorUserId: string | null;
  createdAt: Date;
  channel: ConversationChannel;
};

/** Active guest threads (OPEN + HANDED_OFF) with messages for merged inbox timeline. */
export async function listUnifiedMessagesForGuest(
  businessId: string,
  customerId: string,
): Promise<UnifiedGuestMessage[]> {
  const rows = await db
    .select({
      id: conversationMessagesTable.id,
      conversationId: conversationMessagesTable.conversationId,
      role: conversationMessagesTable.role,
      content: conversationMessagesTable.content,
      toolName: conversationMessagesTable.toolName,
      bookingId: conversationMessagesTable.bookingId,
      authorUserId: conversationMessagesTable.authorUserId,
      createdAt: conversationMessagesTable.createdAt,
      channel: conversationsTable.channel,
    })
    .from(conversationMessagesTable)
    .innerJoin(
      conversationsTable,
      eq(conversationMessagesTable.conversationId, conversationsTable.id),
    )
    .where(
      and(
        eq(conversationsTable.businessId, businessId),
        eq(conversationsTable.customerId, customerId),
        sql`${conversationsTable.status} IN ('OPEN', 'HANDED_OFF')`,
      ),
    )
    .orderBy(asc(conversationMessagesTable.createdAt));

  return rows.map((row) => ({
    id: row.id,
    conversationId: row.conversationId,
    role: row.role as ConversationMessage["role"],
    content: row.content,
    toolName: row.toolName,
    bookingId: row.bookingId,
    authorUserId: row.authorUserId,
    createdAt: row.createdAt,
    channel: row.channel as ConversationChannel,
  }));
}

export async function countGuestActiveThreads(
  businessId: string,
  customerId: string,
): Promise<number> {
  const rows = await db
    .select({ id: conversationsTable.id })
    .from(conversationsTable)
    .where(
      and(
        eq(conversationsTable.businessId, businessId),
        eq(conversationsTable.customerId, customerId),
        sql`${conversationsTable.status} IN ('OPEN', 'HANDED_OFF')`,
      ),
    );
  return rows.length;
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

  if (input.role === "ASSISTANT" && !input.authorUserId) {
    const [meta] = await db
      .select({
        channel: conversationsTable.channel,
        status: conversationsTable.status,
        vertical: businessesTable.vertical,
      })
      .from(conversationsTable)
      .innerJoin(businessesTable, eq(businessesTable.id, conversationsTable.businessId))
      .where(eq(conversationsTable.id, input.conversationId))
      .limit(1);
    if (
      meta &&
      shouldCloseConsultDm({
        vertical: meta.vertical,
        channel: meta.channel,
        status: meta.status,
      })
    ) {
      await updateConversationStatus(input.conversationId, "CLOSED", true);
    }
  }

  void (async () => {
    const [conv] = await db
      .select({
        businessId: conversationsTable.businessId,
        customerId: conversationsTable.customerId,
        channel: conversationsTable.channel,
      })
      .from(conversationsTable)
      .where(eq(conversationsTable.id, input.conversationId))
      .limit(1);
    if (!conv?.businessId || input.role === "SYSTEM") return;
    if (conv.customerId && input.role === "USER") {
      await recordCustomerInboundTouch({
        customerId: conv.customerId,
        channel: conv.channel,
      }).catch(() => undefined);
    }
    if (conv.customerId && input.role === "ASSISTANT") {
      await recordCustomerOutboundTouch({
        customerId: conv.customerId,
        channel: conv.channel,
      }).catch(() => undefined);
    }
    if (input.role === "USER") {
      await logEvent({
        type: "MESSAGE_RECEIVED",
        businessId: conv.businessId,
        userId: input.authorUserId ?? undefined,
        entityType: "conversation",
        entityId: input.conversationId,
      });
    } else if (input.role === "ASSISTANT") {
      await logEvent({
        type: "MESSAGE_SENT",
        businessId: conv.businessId,
        userId: input.authorUserId ?? undefined,
        entityType: "conversation",
        entityId: input.conversationId,
      });
    }
  })().catch(() => undefined);

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

/** Operator opened a handed-off thread — clears consult-first nav attention. */
export async function acknowledgeConversationView(
  businessId: string,
  conversationId: string,
): Promise<Conversation | null> {
  const [row] = await db
    .select()
    .from(conversationsTable)
    .where(
      and(
        eq(conversationsTable.id, conversationId),
        eq(conversationsTable.businessId, businessId),
      ),
    )
    .limit(1);
  if (!row || row.status !== "HANDED_OFF") return row ?? null;

  const prior = (row.resolution ?? {}) as Record<string, unknown>;
  if (typeof prior.operatorViewedAt === "string") return row;

  const [updated] = await db
    .update(conversationsTable)
    .set({
      resolution: { ...prior, operatorViewedAt: new Date().toISOString() },
      updatedAt: new Date(),
    })
    .where(eq(conversationsTable.id, conversationId))
    .returning();
  return updated ?? null;
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

export type ConversationSiblingThread = {
  id: string;
  channel: ConversationChannel;
  status: ConversationStatus;
  lastMessage: string | null;
  lastMessageAt: Date;
};

/** Other open threads for the same guest on a different channel. */
export async function listSiblingOpenThreads(
  businessId: string,
  conversationId: string,
  customerId: string,
): Promise<ConversationSiblingThread[]> {
  const rows = await db
    .select({
      id: conversationsTable.id,
      channel: conversationsTable.channel,
      status: conversationsTable.status,
      lastMessageAt: conversationsTable.lastMessageAt,
      lastMessage: sql<string | null>`(
        SELECT cm.content FROM conversation_messages cm
        WHERE cm.conversation_id = ${conversationsTable.id}
          AND cm.role IN ('USER','ASSISTANT')
        ORDER BY cm.created_at DESC LIMIT 1
      )`,
    })
    .from(conversationsTable)
    .where(
      and(
        eq(conversationsTable.businessId, businessId),
        eq(conversationsTable.customerId, customerId),
        sql`${conversationsTable.id} <> ${conversationId}`,
        sql`${conversationsTable.status} IN ('OPEN', 'HANDED_OFF')`,
      ),
    )
    .orderBy(desc(conversationsTable.lastMessageAt));

  return rows.map((row) => ({
    id: row.id,
    channel: row.channel as ConversationChannel,
    status: row.status as ConversationStatus,
    lastMessage: row.lastMessage,
    lastMessageAt: row.lastMessageAt,
  }));
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
