import { createHmac, timingSafeEqual } from "node:crypto";

const GRAPH = "https://graph.facebook.com/v21.0";

export type MetaClientConfig = {
  accessToken: string;
};

export function createMetaClient(config: MetaClientConfig) {
  const token = config.accessToken;

  async function graphPost(path: string, body: Record<string, unknown>) {
    const res = await fetch(`${GRAPH}${path}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
    const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
    if (!res.ok) {
      const err = data.error as { message?: string } | undefined;
      throw new Error(err?.message ?? `Meta API ${res.status}`);
    }
    return data;
  }

  return {
    async sendWhatsAppText(args: { phoneNumberId: string; to: string; body: string }) {
      const to = args.to.replace(/\D/g, "");
      const data = await graphPost(`/${args.phoneNumberId}/messages`, {
        messaging_product: "whatsapp",
        to,
        type: "text",
        text: { body: args.body },
      });
      const messages = data.messages as { id?: string }[] | undefined;
      return { messageId: messages?.[0]?.id ?? null };
    },

    /** Instagram / Messenger — Page-scoped Send API */
    async sendPageMessage(args: { pageId: string; recipientId: string; body: string }) {
      const data = await graphPost(`/${args.pageId}/messages`, {
        recipient: { id: args.recipientId },
        message: { text: args.body },
        messaging_type: "RESPONSE",
      });
      const mid = data.message_id as string | undefined;
      return { messageId: mid ?? null };
    },
  };
}

export function verifyMetaWebhookSignature(args: {
  appSecret: string;
  signatureHeader: string | undefined;
  rawBody: Buffer | string;
}): boolean {
  if (!args.signatureHeader?.startsWith("sha256=")) return false;
  const expected = createHmac("sha256", args.appSecret)
    .update(typeof args.rawBody === "string" ? args.rawBody : args.rawBody)
    .digest("hex");
  const got = args.signatureHeader.slice("sha256=".length);
  try {
    return timingSafeEqual(Buffer.from(expected, "hex"), Buffer.from(got, "hex"));
  } catch {
    return false;
  }
}

export type InboundMetaMessage = {
  channel: "WHATSAPP" | "INSTAGRAM" | "MESSENGER";
  businessLookup: { whatsappPhoneNumberId?: string; instagramPageId?: string; messengerPageId?: string };
  externalParticipantId: string;
  externalMessageId: string;
  text: string;
  displayName?: string;
};

/** Parse Meta webhook JSON into normalized inbound messages. */
export function parseMetaWebhookPayload(body: unknown): InboundMetaMessage[] {
  if (!body || typeof body !== "object") return [];
  const obj = body as Record<string, unknown>;
  const out: InboundMetaMessage[] = [];

  if (obj.object === "whatsapp_business_account" && Array.isArray(obj.entry)) {
    for (const entry of obj.entry as Record<string, unknown>[]) {
      const changes = entry.changes as Record<string, unknown>[] | undefined;
      if (!changes) continue;
      for (const change of changes) {
        if (change.field !== "messages") continue;
        const value = change.value as Record<string, unknown> | undefined;
        if (!value?.messages) continue;
        const phoneNumberId = (value.metadata as { phone_number_id?: string })?.phone_number_id;
        for (const msg of value.messages as Record<string, unknown>[]) {
          if (msg.type !== "text") continue;
          const text = (msg.text as { body?: string })?.body;
          const from = msg.from as string | undefined;
          if (!text || !from || !phoneNumberId) continue;
          out.push({
            channel: "WHATSAPP",
            businessLookup: { whatsappPhoneNumberId: phoneNumberId },
            externalParticipantId: from,
            externalMessageId: String(msg.id ?? ""),
            text,
          });
        }
      }
    }
  }

  if ((obj.object === "instagram" || obj.object === "page") && Array.isArray(obj.entry)) {
    for (const entry of obj.entry as Record<string, unknown>[]) {
      const pageId = String(entry.id ?? "");
      const messaging = entry.messaging as Record<string, unknown>[] | undefined;
      if (!messaging) continue;
      for (const ev of messaging) {
        const message = ev.message as Record<string, unknown> | undefined;
        if (!message?.text) continue;
        const text = (message.text as { body?: string })?.body;
        const sender = (ev.sender as { id?: string })?.id;
        const recipient = (ev.recipient as { id?: string })?.id;
        if (!text || !sender) continue;
        const isEcho = message.is_echo === true;
        if (isEcho) continue;
        const channel = obj.object === "instagram" ? "INSTAGRAM" : "MESSENGER";
        out.push({
          channel,
          businessLookup:
            channel === "INSTAGRAM"
              ? { instagramPageId: pageId || recipient }
              : { messengerPageId: pageId || recipient },
          externalParticipantId: sender,
          externalMessageId: String(message.mid ?? message.id ?? ""),
          text,
        });
      }
    }
  }

  return out;
}

export function isMetaConfigured(env: Record<string, string | undefined> = process.env): boolean {
  return Boolean(env.META_ACCESS_TOKEN?.trim() || env.WHATSAPP_ACCESS_TOKEN?.trim());
}
