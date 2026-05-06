/**
 * AI outbound message composer — applies EU AI Act Art. 50 disclosure to
 * every SMS and email authored by Liv before it is queued or persisted.
 *
 * Transport (actually delivering bytes via Twilio / Resend) is owned by
 * Task #28. This service owns the disclosure-correctness step and the
 * persistence step; Task #28 will plug a transport function in via
 * `setSmsTransport` / `setEmailTransport`. Until then, the transport
 * defaults to a "queued only" stub that records `status=PENDING` on
 * `notificationLogs` and stores the wrapped message body on
 * `conversationMessages` / `messageLogs` so the disclosure copy is
 * already on the wire-equivalent record.
 *
 * Hard rules enforced here, not at the call site:
 *   - SMS: prefix is applied exactly once per conversation thread (the
 *     first time Liv speaks on that conversation, regardless of channel),
 *     never twice.
 *   - Email: disclosure block is always wrapped above the signature,
 *     every send.
 *   - Persisted body == sent body. The Inbox view reads from
 *     conversationMessages / notificationLogs, so the customer and the
 *     owner see the same string.
 */

import { and, eq } from "drizzle-orm";
import {
  db,
  conversationMessagesTable,
  conversationsTable,
  messageLogsTable,
  notificationLogsTable,
} from "@workspace/db";
import { generateId } from "../lib/id";
import { AI_DISCLOSURE } from "../lib/ai-disclosure";
import { appendMessage } from "./conversations.service";

export type SmsTransport = (args: {
  to: string;
  body: string;
}) => Promise<{ externalMessageId?: string }>;

export type EmailTransport = (args: {
  to: string;
  subject: string;
  body: string;
}) => Promise<{ externalMessageId?: string }>;

// Default transports are "queued only" — the message is persisted with
// status=PENDING but no network call is made. Task #28 will replace these
// with real Twilio + Resend transports.
let smsTransport: SmsTransport = async () => ({});
let emailTransport: EmailTransport = async () => ({});

export function setSmsTransport(t: SmsTransport): void {
  smsTransport = t;
}
export function setEmailTransport(t: EmailTransport): void {
  emailTransport = t;
}

/**
 * Returns true if Liv has not yet spoken on this conversation. Used to
 * decide whether the SMS prefix should be added. We check across ALL
 * channels, not just SMS, because the prefix is a per-thread identity
 * disclosure — if Liv already disclosed itself in web chat, repeating the
 * prefix on a later SMS is acceptable but still required because each
 * channel is a separate "first interaction" for the customer's notice.
 *
 * In practice we scope it to SMS-channel ASSISTANT messages only, so the
 * prefix lands on the first SMS Liv sends on a thread regardless of any
 * prior web chat history. That matches the task spec ("prefixed once per
 * conversation thread").
 */
async function isFirstAssistantSmsOnConversation(conversationId: string): Promise<boolean> {
  const [existing] = await db
    .select({ id: conversationMessagesTable.id })
    .from(conversationMessagesTable)
    .where(
      and(
        eq(conversationMessagesTable.conversationId, conversationId),
        eq(conversationMessagesTable.role, "ASSISTANT"),
        eq(conversationMessagesTable.toolName, "sms"),
      ),
    )
    .limit(1);
  return !existing;
}

/**
 * Compose, persist, and dispatch an outbound AI-authored SMS.
 *
 * Caller (e.g. inbound SMS webhook + AI reply path, owned by Task #28)
 * passes the raw model-authored content. This function:
 *   1. Adds the Art. 50 prefix if and only if this is the first ASSISTANT
 *      SMS on the conversation.
 *   2. Persists the EXACT sent body to `conversationMessages` (so the
 *      Inbox view shows the same string the customer received) with a
 *      `toolName: "sms"` marker so we can detect "first SMS" next time.
 *   3. Persists to `messageLogs` (OUTBOUND) for audit.
 *   4. Persists to `notificationLogs` (channel=SMS, status starts PENDING,
 *      flips to SENT on transport success).
 *   5. Calls the configured SMS transport.
 */
export async function sendAiSms(args: {
  conversationId: string;
  businessId: string;
  businessName: string;
  customerId?: string | null;
  customerPhone: string;
  content: string;
}): Promise<{ body: string; status: "PENDING" | "SENT" | "FAILED" }> {
  const isFirst = await isFirstAssistantSmsOnConversation(args.conversationId);
  const body = isFirst
    ? `${AI_DISCLOSURE.smsPrefix(args.businessName)}${args.content}`
    : args.content;

  // Persist to conversationMessages so Inbox parity holds.
  await appendMessage({
    conversationId: args.conversationId,
    role: "ASSISTANT",
    content: body,
    toolName: "sms",
  });

  // Audit trail.
  await db.insert(messageLogsTable).values({
    id: generateId(),
    businessId: args.businessId,
    customerId: args.customerId ?? null,
    bookingId: null,
    channelType: "SMS",
    direction: "OUTBOUND",
    content: body,
    metadata: { authoredBy: "liv", conversationId: args.conversationId },
  });

  const notifId = generateId();
  await db.insert(notificationLogsTable).values({
    id: notifId,
    businessId: args.businessId,
    customerId: args.customerId ?? null,
    channel: "SMS",
    templateKey: "liv-sms-reply",
    status: "PENDING",
    payload: { to: args.customerPhone, body, conversationId: args.conversationId },
  });

  try {
    const transport = await smsTransport({ to: args.customerPhone, body });
    await db
      .update(notificationLogsTable)
      .set({
        status: "SENT",
        sentAt: new Date(),
        payload: {
          to: args.customerPhone,
          body,
          conversationId: args.conversationId,
          externalMessageId: transport.externalMessageId ?? null,
        },
      })
      .where(eq(notificationLogsTable.id, notifId));
    return { body, status: "SENT" };
  } catch (err) {
    await db
      .update(notificationLogsTable)
      .set({
        status: "FAILED",
        payload: {
          to: args.customerPhone,
          body,
          conversationId: args.conversationId,
          error: err instanceof Error ? err.message : String(err),
        },
      })
      .where(eq(notificationLogsTable.id, notifId));
    return { body, status: "FAILED" };
  }
}

/**
 * Wrap an AI-authored email body with the Art. 50 disclosure block.
 * Pure function — no IO. Exposed separately so the React Email template
 * (Task #28) can call it from inside JSX without going through the full
 * `sendAiEmail` path.
 *
 * Layout:
 *   <body content>
 *
 *   ---
 *   <disclosure block>
 *
 *   <signature>
 *
 * The disclosure sits ABOVE the signature, separated by a thematic break,
 * so the customer sees it in the same visual chunk as the message body.
 */
export function composeAiEmailBody(args: {
  businessName: string;
  body: string;
  signature?: string;
}): string {
  const disclosure = AI_DISCLOSURE.emailBlock(args.businessName);
  const sig = args.signature?.trim();
  const parts = [args.body.trim(), "---", disclosure];
  if (sig) parts.push("", sig);
  return parts.join("\n\n");
}

/**
 * Compose, persist, and dispatch an outbound AI-authored email.
 *
 * Caller passes the model-authored body and optional signature; this
 * function wraps with the disclosure block, persists to notificationLogs,
 * and calls the configured email transport.
 */
export async function sendAiEmail(args: {
  businessId: string;
  businessName: string;
  customerId?: string | null;
  bookingId?: string | null;
  to: string;
  subject: string;
  body: string;
  signature?: string;
  templateKey?: string;
}): Promise<{ body: string; status: "PENDING" | "SENT" | "FAILED" }> {
  const composed = composeAiEmailBody({
    businessName: args.businessName,
    body: args.body,
    signature: args.signature,
  });

  const notifId = generateId();
  await db.insert(notificationLogsTable).values({
    id: notifId,
    businessId: args.businessId,
    customerId: args.customerId ?? null,
    bookingId: args.bookingId ?? null,
    channel: "EMAIL",
    templateKey: args.templateKey ?? "liv-email",
    status: "PENDING",
    payload: { to: args.to, subject: args.subject, body: composed },
  });

  try {
    const transport = await emailTransport({
      to: args.to,
      subject: args.subject,
      body: composed,
    });
    await db
      .update(notificationLogsTable)
      .set({
        status: "SENT",
        sentAt: new Date(),
        payload: {
          to: args.to,
          subject: args.subject,
          body: composed,
          externalMessageId: transport.externalMessageId ?? null,
        },
      })
      .where(eq(notificationLogsTable.id, notifId));
    return { body: composed, status: "SENT" };
  } catch (err) {
    await db
      .update(notificationLogsTable)
      .set({
        status: "FAILED",
        payload: {
          to: args.to,
          subject: args.subject,
          body: composed,
          error: err instanceof Error ? err.message : String(err),
        },
      })
      .where(eq(notificationLogsTable.id, notifId));
    return { body: composed, status: "FAILED" };
  }
}
