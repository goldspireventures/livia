import type { ChannelPack, JurisdictionCode } from "./types";

const BASE: ChannelPack = {
  sms: true,
  webChat: true,
  whatsapp: false,
  instagram: true,
  messenger: true,
  voice: false,
};

/** Per-jurisdiction channel availability (expand WhatsApp where market expects it). */
const JURISDICTION_CHANNELS: Partial<Record<JurisdictionCode, Partial<ChannelPack>>> = {
  IE: { whatsapp: true },
  GB: { whatsapp: true },
  ES: { whatsapp: true, instagram: true, messenger: true },
  IT: { whatsapp: true, instagram: true, messenger: true },
  NL: { whatsapp: true, instagram: true },
  DE: { whatsapp: true, instagram: true, messenger: true },
  FR: { whatsapp: true, instagram: true, messenger: true },
  PL: { whatsapp: true, messenger: true },
};

export function resolveChannelPack(jurisdiction: JurisdictionCode): ChannelPack {
  const overrides = JURISDICTION_CHANNELS[jurisdiction] ?? {};
  return { ...BASE, ...overrides };
}

export type OutboundChannel = "sms" | "email" | "whatsapp" | "web";

export interface ChannelSendRequest {
  businessId: string;
  channel: OutboundChannel;
  to: string;
  body: string;
  metadata?: Record<string, string>;
}

export interface ChannelSendResult {
  ok: boolean;
  channel: OutboundChannel;
  providerMessageId?: string;
  error?: string;
  /** WhatsApp stub returns pending until BSP is wired */
  status?: "sent" | "pending" | "failed";
}

/** Pluggable outbound channel — api-server registers Twilio + stubs. */
export interface ChannelAdapter {
  readonly channel: OutboundChannel;
  isEnabled(pack: ChannelPack): boolean;
  send(req: ChannelSendRequest): Promise<ChannelSendResult>;
}

export type EnvLike = Record<string, string | undefined>;

/** True when a real WhatsApp BSP / Meta credentials are configured. */
export function isWhatsAppProvisioned(env: EnvLike = globalThis.process?.env ?? {}): boolean {
  return Boolean(
    env["WHATSAPP_ACCESS_TOKEN"]?.trim() ||
      (env["WHATSAPP_PHONE_NUMBER_ID"]?.trim() && env["WHATSAPP_BUSINESS_ACCOUNT_ID"]?.trim()),
  );
}

/**
 * In production, WhatsApp must not appear enabled without credentials.
 * Prevents marketing jurisdictions from routing to the dev stub in prod.
 */
export function guardChannelPackForProduction(
  pack: ChannelPack,
  env: EnvLike = globalThis.process?.env ?? {},
): ChannelPack {
  const isProd = env["NODE_ENV"] === "production";
  if (isProd && pack.whatsapp && !isWhatsAppProvisioned(env)) {
    return { ...pack, whatsapp: false };
  }
  return pack;
}

export class WhatsAppChannelStub implements ChannelAdapter {
  readonly channel = "whatsapp" as const;

  isEnabled(pack: ChannelPack): boolean {
    return pack.whatsapp;
  }

  async send(req: ChannelSendRequest): Promise<ChannelSendResult> {
    if ((globalThis.process?.env ?? {})["NODE_ENV"] === "production") {
      return {
        ok: false,
        channel: "whatsapp",
        status: "failed",
        error:
          "WhatsApp is not provisioned in production (set WHATSAPP_ACCESS_TOKEN or phone + business account ids).",
      };
    }
    return {
      ok: false,
      channel: "whatsapp",
      status: "pending",
      error:
        "WhatsApp channel is enabled for this jurisdiction but not yet provisioned. Use SMS or web chat.",
    };
  }
}
