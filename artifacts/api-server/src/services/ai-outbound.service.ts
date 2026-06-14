// AI outbound composer. Applies EU AI Act Art. 50 disclosure to every
// Liv-authored SMS and email before persistence. Transport is pluggable
// via setSmsTransport / setEmailTransport (wired at boot in lib/transports.ts).

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
import { getPoliciesForBusinessId } from "./policies.service";
import { createMetaClient, isMetaConfigured } from "@workspace/integrations-meta";
import { getMessagingChannels } from "./messaging-channels.service";

function metaAccessToken(): string | null {
  return (
    process.env["META_ACCESS_TOKEN"]?.trim() ??
    process.env["WHATSAPP_ACCESS_TOKEN"]?.trim() ??
    null
  );
}

export type SmsTransport = (args: {
  to: string;
  body: string;
  // Optional per-shop sender (Twilio phone number). When omitted the
  // transport falls back to a server-default (TWILIO_DEFAULT_FROM).
  from?: string;
}) => Promise<{ externalMessageId?: string }>;

export type EmailTransport = (args: {
  to: string;
  subject: string;
  body: string; // plaintext fallback (always present)
  // Optional rendered HTML; when omitted the transport may build a simple
  // <pre>-wrapped HTML body from `body`.
  html?: string;
  // Optional per-shop sender (e.g. "Acme <hi@acme.com>"). When omitted the
  // transport falls back to RESEND_DEFAULT_FROM.
  from?: string;
  replyTo?: string;
}) => Promise<{ externalMessageId?: string }>;

// Defaults throw so missing-secret sends land FAILED, never silently SENT.
const TRANSPORT_NOT_CONFIGURED = "TRANSPORT_NOT_CONFIGURED";
let smsTransport: SmsTransport = async () => {
  throw new Error(`${TRANSPORT_NOT_CONFIGURED}: SMS transport not configured (missing TWILIO_ACCOUNT_SID + TWILIO_AUTH_TOKEN)`);
};
let emailTransport: EmailTransport = async () => {
  throw new Error(`${TRANSPORT_NOT_CONFIGURED}: Email transport not configured (missing RESEND_API_KEY)`);
};

export function setSmsTransport(t: SmsTransport): void {
  smsTransport = t;
}
export function setEmailTransport(t: EmailTransport): void {
  emailTransport = t;
}

/** Used by outbound-delivery hub after thread persist. */
export async function runOutboundChannelTransport(
  job: import("@workspace/policy").OutboundDeliveryJob,
): Promise<{ externalMessageId?: string }> {
  switch (job.channel) {
    case "SMS":
      return smsTransport({
        to: job.to,
        body: job.body,
        ...(job.from ? { from: job.from } : {}),
      });
    case "EMAIL":
      return emailTransport({
        to: job.to,
        subject: job.subject ?? "(no subject)",
        body: job.body,
        ...(job.html ? { html: job.html } : {}),
        ...(job.from ? { from: job.from } : {}),
        ...(job.replyTo ? { replyTo: job.replyTo } : {}),
      });
    case "WHATSAPP": {
      const token = metaAccessToken();
      if (!token) {
        if (process.env["META_DEV_SIMULATE"] === "true") return {};
        throw new Error("META_NOT_CONFIGURED");
      }
      if (!job.senderId) throw new Error("MISSING_WHATSAPP_PHONE_NUMBER_ID");
      const meta = createMetaClient({ accessToken: token });
      await meta.sendWhatsAppText({
        phoneNumberId: job.senderId,
        to: job.to,
        body: job.body,
      });
      return {};
    }
    case "INSTAGRAM":
    case "MESSENGER": {
      const token = metaAccessToken();
      if (!token) {
        if (process.env["META_DEV_SIMULATE"] === "true") return {};
        throw new Error("META_NOT_CONFIGURED");
      }
      if (!job.senderId) throw new Error("MISSING_META_PAGE_ID");
      const meta = createMetaClient({ accessToken: token });
      await meta.sendPageMessage({
        pageId: job.senderId,
        recipientId: job.recipientId ?? job.to,
        body: job.body,
      });
      return {};
    }
    default:
      throw new Error(`UNSUPPORTED_OUTBOUND_CHANNEL:${job.channel}`);
  }
}

/** Outbound SMS without a conversation thread (e.g. premises menu, waitlist). */
export async function sendDirectSms(args: {
  to: string;
  body: string;
  from?: string;
  businessId?: string | null;
  templateKey?: string;
}): Promise<{ status: "PENDING" | "SENT" | "FAILED" }> {
  const notifId = generateId();
  await db.insert(notificationLogsTable).values({
    id: notifId,
    businessId: args.businessId ?? null,
    channel: "SMS",
    templateKey: args.templateKey ?? "direct-sms",
    status: "PENDING",
    payload: {
      to: args.to,
      body: args.body,
      ...(args.from ? { from: args.from } : {}),
      direct: true,
    },
  });

  const { scheduleOutboundDelivery } = await import("./outbound-delivery.service");
  const delivery = await scheduleOutboundDelivery({
    channel: "SMS",
    businessId: args.businessId ?? null,
    notifLogId: notifId,
    to: args.to,
    body: args.body,
    from: args.from ?? null,
  });
  return { status: delivery === "QUEUED" ? "PENDING" : delivery };
}

export async function sendDirectWhatsapp(args: {
  phoneNumberId: string;
  to: string;
  body: string;
  businessId?: string | null;
  templateKey?: string;
}): Promise<{ status: "PENDING" | "SENT" | "FAILED" }> {
  if (!metaAccessToken()) {
    if (process.env["META_DEV_SIMULATE"] === "true") {
      return { status: "SENT" };
    }
    return { status: "FAILED" };
  }

  const notifId = generateId();
  await db.insert(notificationLogsTable).values({
    id: notifId,
    businessId: args.businessId ?? null,
    channel: "WHATSAPP",
    templateKey: args.templateKey ?? "direct-whatsapp",
    status: "PENDING",
    payload: {
      to: args.to,
      body: args.body,
      platformChannel: "WHATSAPP",
      senderId: args.phoneNumberId,
      direct: true,
    },
  });

  const { scheduleOutboundDelivery } = await import("./outbound-delivery.service");
  const delivery = await scheduleOutboundDelivery({
    channel: "WHATSAPP",
    businessId: args.businessId ?? null,
    notifLogId: notifId,
    to: args.to,
    body: args.body,
    senderId: args.phoneNumberId,
  });
  return { status: delivery === "QUEUED" ? "PENDING" : delivery };
}

// Pure prefix-once decision. Exposed for unit tests so we can prove the
// "prefix exactly once per thread" semantic without touching the DB.
export function applySmsPrefix(args: {
  isFirstOnThread: boolean;
  businessName: string;
  content: string;
  smsPrefix?: (businessName: string) => string;
}): string {
  const prefix = args.smsPrefix ?? AI_DISCLOSURE.smsPrefix;
  return args.isFirstOnThread
    ? `${prefix(args.businessName)}${args.content}`
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
  // Optional per-shop Twilio sender — passed through to the transport so
  // each shop's SMS shows up from THEIR provisioned number, not a shared
  // default. Falls back to TWILIO_DEFAULT_FROM in the transport.
  fromPhone?: string | null;
}): Promise<{ body: string; status: "PENDING" | "SENT" | "FAILED" }> {
  const isFirstOnThread = await isFirstAssistantSmsOnConversation(args.conversationId);
  const policies = await getPoliciesForBusinessId(args.businessId);
  const body = applySmsPrefix({
    isFirstOnThread,
    businessName: args.businessName,
    content: args.content,
    smsPrefix: policies?.aiDisclosure.smsPrefix,
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
    payload: {
      to: args.customerPhone,
      body,
      conversationId: args.conversationId,
      ...(args.fromPhone ? { from: args.fromPhone } : {}),
    },
  });

  const { scheduleOutboundDelivery } = await import("./outbound-delivery.service");
  const delivery = await scheduleOutboundDelivery({
    channel: "SMS",
    businessId: args.businessId,
    notifLogId: notifId,
    conversationId: args.conversationId,
    to: args.customerPhone,
    body,
    from: args.fromPhone ?? null,
  });
  const status = delivery === "QUEUED" ? "PENDING" : delivery;
  return { body, status };
}

// Pure: wraps body with the Art. 50 disclosure block above the signature.
// Exposed separately so React Email templates (Task #28) can call it from
// inside JSX without going through the full sendAiEmail path.
export function composeAiEmailBody(args: {
  businessName: string;
  body: string;
  signature?: string;
  emailBlock?: (businessName: string) => string;
}): string {
  const disclosure = (args.emailBlock ?? AI_DISCLOSURE.emailBlock)(args.businessName);
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
  // Pre-rendered HTML body (e.g. from a React-Email-equivalent template).
  // When omitted the transport renders a <pre>-wrapped fallback from `body`.
  html?: string;
  // Per-shop sender (e.g. "Acme Salon <hi@acme.salon>"). Falls back to
  // RESEND_DEFAULT_FROM in the transport.
  fromAddress?: string | null;
  replyTo?: string;
}): Promise<{ body: string; status: "PENDING" | "SENT" | "FAILED" }> {
  const policies = await getPoliciesForBusinessId(args.businessId);
  const composed = composeAiEmailBody({
    businessName: args.businessName,
    body: args.body,
    signature: args.signature,
    emailBlock: policies?.aiDisclosure.emailBlock,
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
    payload: {
      to: args.to,
      subject: args.subject,
      body: composed,
      ...(args.html ? { html: args.html } : {}),
      ...(args.fromAddress ? { from: args.fromAddress } : {}),
      ...(args.replyTo ? { replyTo: args.replyTo } : {}),
    },
  });

  const { scheduleOutboundDelivery } = await import("./outbound-delivery.service");
  const delivery = await scheduleOutboundDelivery({
    channel: "EMAIL",
    businessId: args.businessId,
    notifLogId: notifId,
    to: args.to,
    body: composed,
    subject: args.subject,
    html: args.html,
    from: args.fromAddress ?? null,
    replyTo: args.replyTo,
  });
  const status = delivery === "QUEUED" ? "PENDING" : delivery;
  return { body: composed, status };
}

async function appendAssistantChannelMessage(args: {
  conversationId: string;
  businessId: string;
  businessName: string;
  customerId?: string | null;
  channel: "WHATSAPP" | "INSTAGRAM" | "MESSENGER";
  content: string;
  toolName: string;
}) {
  const policies = await getPoliciesForBusinessId(args.businessId);
  const isFirst = await isFirstAssistantSmsOnConversation(args.conversationId);
  const body = applySmsPrefix({
    isFirstOnThread: isFirst,
    businessName: args.businessName,
    content: args.content,
    smsPrefix: policies?.aiDisclosure.smsPrefix,
  });

  await appendMessage({
    conversationId: args.conversationId,
    role: "ASSISTANT",
    content: body,
    toolName: args.toolName,
  });

  await db.insert(messageLogsTable).values({
    id: generateId(),
    businessId: args.businessId,
    customerId: args.customerId ?? null,
    channelType: args.channel,
    direction: "OUTBOUND",
    content: body,
    metadata: { authoredBy: "liv", conversationId: args.conversationId },
  });

  return body;
}

async function scheduleMetaChannelOutbound(args: {
  businessId: string;
  conversationId: string;
  customerId?: string | null;
  body: string;
  platformChannel: "WHATSAPP" | "INSTAGRAM" | "MESSENGER";
  to: string;
  senderId: string | null;
  recipientId?: string | null;
  templateKey: string;
}): Promise<{ body: string; status: "PENDING" | "SENT" | "FAILED" }> {
  if (!args.senderId || !metaAccessToken()) {
    if (process.env["META_DEV_SIMULATE"] === "true") {
      return { body: args.body, status: "SENT" };
    }
    return { body: args.body, status: "FAILED" };
  }

  const notifId = generateId();
  await db.insert(notificationLogsTable).values({
    id: notifId,
    businessId: args.businessId,
    customerId: args.customerId ?? null,
    channel: "WHATSAPP",
    templateKey: args.templateKey,
    status: "PENDING",
    payload: {
      to: args.to,
      body: args.body,
      conversationId: args.conversationId,
      platformChannel: args.platformChannel,
      senderId: args.senderId,
      recipientId: args.recipientId ?? null,
    },
  });

  const { scheduleOutboundDelivery } = await import("./outbound-delivery.service");
  const delivery = await scheduleOutboundDelivery({
    channel: args.platformChannel,
    businessId: args.businessId,
    notifLogId: notifId,
    conversationId: args.conversationId,
    to: args.to,
    body: args.body,
    senderId: args.senderId,
    recipientId: args.recipientId ?? null,
  });
  const status = delivery === "QUEUED" ? "PENDING" : delivery;
  return { body: args.body, status };
}

export async function sendAiWhatsapp(args: {
  conversationId: string;
  businessId: string;
  businessName: string;
  customerId?: string | null;
  customerPhone: string;
  content: string;
}): Promise<{ body: string; status: "PENDING" | "SENT" | "FAILED" }> {
  const body = await appendAssistantChannelMessage({
    conversationId: args.conversationId,
    businessId: args.businessId,
    businessName: args.businessName,
    customerId: args.customerId,
    channel: "WHATSAPP",
    content: args.content,
    toolName: "whatsapp",
  });

  const channels = await getMessagingChannels(args.businessId);
  const phoneNumberId = channels.whatsapp?.phoneNumberId ?? null;

  return scheduleMetaChannelOutbound({
    businessId: args.businessId,
    conversationId: args.conversationId,
    customerId: args.customerId,
    body,
    platformChannel: "WHATSAPP",
    to: args.customerPhone,
    senderId: phoneNumberId,
    templateKey: "liv-whatsapp-reply",
  });
}

export async function sendAiInstagram(args: {
  conversationId: string;
  businessId: string;
  businessName: string;
  customerId?: string | null;
  recipientId: string;
  content: string;
}): Promise<{ body: string; status: "PENDING" | "SENT" | "FAILED" }> {
  const body = await appendAssistantChannelMessage({
    conversationId: args.conversationId,
    businessId: args.businessId,
    businessName: args.businessName,
    customerId: args.customerId,
    channel: "INSTAGRAM",
    content: args.content,
    toolName: "instagram",
  });

  const channels = await getMessagingChannels(args.businessId);
  const pageId = channels.instagram?.pageId ?? null;

  return scheduleMetaChannelOutbound({
    businessId: args.businessId,
    conversationId: args.conversationId,
    customerId: args.customerId,
    body,
    platformChannel: "INSTAGRAM",
    to: args.recipientId,
    senderId: pageId,
    recipientId: args.recipientId,
    templateKey: "liv-instagram-reply",
  });
}

export async function sendAiMessenger(args: {
  conversationId: string;
  businessId: string;
  businessName: string;
  customerId?: string | null;
  recipientId: string;
  content: string;
}): Promise<{ body: string; status: "PENDING" | "SENT" | "FAILED" }> {
  const body = await appendAssistantChannelMessage({
    conversationId: args.conversationId,
    businessId: args.businessId,
    businessName: args.businessName,
    customerId: args.customerId,
    channel: "MESSENGER",
    content: args.content,
    toolName: "messenger",
  });

  const channels = await getMessagingChannels(args.businessId);
  const pageId = channels.messenger?.pageId ?? channels.instagram?.pageId ?? null;

  return scheduleMetaChannelOutbound({
    businessId: args.businessId,
    conversationId: args.conversationId,
    customerId: args.customerId,
    body,
    platformChannel: "MESSENGER",
    to: args.recipientId,
    senderId: pageId,
    recipientId: args.recipientId,
    templateKey: "liv-messenger-reply",
  });
}

export { isMetaConfigured };
