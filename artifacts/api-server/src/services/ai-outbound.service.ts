// AI outbound message composer — applies EU AI Act Art. 50 disclosure to
// every SMS and email authored by Liv before it is queued or persisted.
// Transport (Twilio / Resend) is pluggable via setSmsTransport /
// setEmailTransport; default is a queued-only no-op so disclosure-correct
// records land in notificationLogs even before Task #28 wires real senders.

import { and, eq } from "drizzle-orm";
import {
  db,
  conversationMessagesTable,
  messageLogsTable,
  notificationLogsTable,
} from "@workspace/db";
import { generateId } from "../lib/id";
import { AI_DISCLOSURE } from "@workspace/ai-disclosure";
import { appendMessage } from "./conversations.service";

export type SmsTransport = (args: { to: string; body: string }) => Promise<{
  externalMessageId?: string;
}>;

export type EmailTransport = (args: {
  to: string;
  subject: string;
  body: string;
}) => Promise<{ externalMessageId?: string }>;

let smsTransport: SmsTransport = async () => ({});
let emailTransport: EmailTransport = async () => ({});

export function setSmsTransport(t: SmsTransport): void {
  smsTransport = t;
}
export function setEmailTransport(t: EmailTransport): void {
  emailTransport = t;
}

// Pure prefix-once decision. Exposed for unit tests so we can prove the
// "prefix exactly once per thread" semantic without touching the DB.
export function applySmsPrefix(args: {
  isFirstOnThread: boolean;
  businessName: string;
  content: string;
}): string {
  return args.isFirstOnThread
    ? `${AI_DISCLOSURE.smsPrefix(args.businessName)}${args.content}`
    : args.content;
}

// Prefix is added on the FIRST AI-authored SMS of a thread only. We mark
// SMS rows with toolName="sms" so we can detect "first SMS" cheaply.
export async function isFirstAssistantSmsOnConversation(conversationId: string): Promise<boolean> {
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

export async function sendAiSms(args: {
  conversationId: string;
  businessId: string;
  businessName: string;
  customerId?: string | null;
  customerPhone: string;
  content: string;
}): Promise<{ body: string; status: "PENDING" | "SENT" | "FAILED" }> {
  const isFirstOnThread = await isFirstAssistantSmsOnConversation(args.conversationId);
  const body = applySmsPrefix({
    isFirstOnThread,
    businessName: args.businessName,
    content: args.content,
  });

  await appendMessage({
    conversationId: args.conversationId,
    role: "ASSISTANT",
    content: body,
    toolName: "sms",
  });

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

// Pure: wraps body with the Art. 50 disclosure block above the signature.
// Exposed separately so React Email templates (Task #28) can call it from
// inside JSX without going through the full sendAiEmail path.
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
