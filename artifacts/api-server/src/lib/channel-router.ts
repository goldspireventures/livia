import {
  type ChannelAdapter,
  type ChannelPack,
  type ChannelSendRequest,
  type ChannelSendResult,
  isWhatsAppProvisioned,
} from "@workspace/policy";
import { createMetaClient } from "@workspace/integrations-meta";

import {
  setSmsTransport,
  setEmailTransport,
  type SmsTransport,
  type EmailTransport,
} from "../services/ai-outbound.service";
import { getMessagingChannels } from "../services/messaging-channels.service";
import { recordProviderDlq } from "../services/stripe-events.service";
import { withBoundedProviderRetry } from "./provider-retry";

function metaAccessToken(): string | null {
  return (
    process.env["META_ACCESS_TOKEN"]?.trim() ??
    process.env["WHATSAPP_ACCESS_TOKEN"]?.trim() ??
    null
  );
}

export function createSmsChannelAdapter(transport: SmsTransport): ChannelAdapter {
  return {
    channel: "sms",
    isEnabled: (pack: ChannelPack) => pack.sms,
    async send(req: ChannelSendRequest): Promise<ChannelSendResult> {
      try {
        const result = await withBoundedProviderRetry("twilio", "sms.send", req.businessId, () =>
          transport({
            to: req.to,
            body: req.body,
            from: req.metadata?.from,
          }),
        );
        return {
          ok: true,
          channel: "sms",
          status: "sent",
          providerMessageId: result.externalMessageId,
        };
      } catch (err) {
        const error = err instanceof Error ? err.message : String(err);
        await recordProviderDlq({
          provider: "twilio",
          operation: "sms.send",
          businessId: req.businessId,
          payload: { channel: "sms" },
          error,
        });
        return { ok: false, channel: "sms", status: "failed", error };
      }
    },
  };
}

export function createEmailChannelAdapter(transport: EmailTransport): ChannelAdapter {
  return {
    channel: "email",
    isEnabled: () => true,
    async send(req: ChannelSendRequest): Promise<ChannelSendResult> {
      try {
        const result = await withBoundedProviderRetry(
          "resend",
          "email.send",
          req.businessId,
          () =>
            transport({
              to: req.to,
              subject: req.metadata?.subject ?? "Message from Livia",
              body: req.body,
              html: req.metadata?.html,
              from: req.metadata?.from,
              replyTo: req.metadata?.replyTo,
            }),
        );
        return {
          ok: true,
          channel: "email",
          status: "sent",
          providerMessageId: result.externalMessageId,
        };
      } catch (err) {
        const error = err instanceof Error ? err.message : String(err);
        await recordProviderDlq({
          provider: "resend",
          operation: "email.send",
          businessId: req.businessId,
          payload: { channel: "email" },
          error,
        });
        return { ok: false, channel: "email", status: "failed", error };
      }
    },
  };
}

export function createWhatsAppChannelAdapter(): ChannelAdapter {
  return {
    channel: "whatsapp",
    isEnabled: (pack: ChannelPack) => pack.whatsapp && isWhatsAppProvisioned(process.env),
    async send(req: ChannelSendRequest): Promise<ChannelSendResult> {
      const token = metaAccessToken();
      if (!token) {
        if (process.env["META_DEV_SIMULATE"] === "true") {
          return { ok: true, channel: "whatsapp", status: "sent", providerMessageId: "sim-wa" };
        }
        return {
          ok: false,
          channel: "whatsapp",
          status: "failed",
          error: "WhatsApp/Meta not configured (META_ACCESS_TOKEN or WHATSAPP_ACCESS_TOKEN)",
        };
      }

      const channels = await getMessagingChannels(req.businessId);
      const phoneNumberId = channels.whatsapp?.phoneNumberId;
      if (!phoneNumberId) {
        return {
          ok: false,
          channel: "whatsapp",
          status: "failed",
          error: "Business has no WhatsApp phone_number_id configured",
        };
      }

      try {
        const meta = createMetaClient({ accessToken: token });
        const result = await withBoundedProviderRetry(
          "meta",
          "whatsapp.send",
          req.businessId,
          () =>
            meta.sendWhatsAppText({
              phoneNumberId,
              to: req.to,
              body: req.body,
            }),
        );
        return {
          ok: true,
          channel: "whatsapp",
          status: "sent",
          providerMessageId: result.messageId ?? undefined,
        };
      } catch (err) {
        const error = err instanceof Error ? err.message : String(err);
        await recordProviderDlq({
          provider: "meta",
          operation: "whatsapp.send",
          businessId: req.businessId,
          payload: { phoneNumberId },
          error,
        });
        return { ok: false, channel: "whatsapp", status: "failed", error };
      }
    },
  };
}

let outboundAdapters: ChannelAdapter[] | null = null;

export function getOutboundChannelAdapters(): ChannelAdapter[] {
  if (!outboundAdapters) {
    throw new Error("Outbound channel adapters not initialised — call initOutboundChannels() at boot");
  }
  return outboundAdapters;
}

export function initOutboundChannels(transports: {
  sms: SmsTransport;
  email: EmailTransport;
}): void {
  setSmsTransport(transports.sms);
  setEmailTransport(transports.email);
  outboundAdapters = [
    createSmsChannelAdapter(transports.sms),
    createEmailChannelAdapter(transports.email),
    createWhatsAppChannelAdapter(),
  ];
}

export async function sendViaChannelPack(args: {
  pack: ChannelPack;
  request: ChannelSendRequest;
}): Promise<ChannelSendResult> {
  const adapters = getOutboundChannelAdapters();
  const adapter = adapters.find(
    (a) => a.channel === args.request.channel && a.isEnabled(args.pack),
  );

  if (!adapter) {
    return {
      ok: false,
      channel: args.request.channel,
      status: "failed",
      error: `Channel ${args.request.channel} is not enabled for this business`,
    };
  }

  return adapter.send(args.request);
}

export { setSmsTransport, setEmailTransport };
