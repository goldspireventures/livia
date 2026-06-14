/**
 * Platform delivery lanes — every outbound path (notifications, SMS, email, channel replies).
 * Ring 1: persist thread/state in DB first. Ring 3: deliver via queue with retries.
 */
import type { SideEffectSubsystem } from "./platform-resilience-program";

/** Customer-facing channel delivery (SMS, email, WhatsApp, etc.). */
export type PlatformDeliveryChannel = "SMS" | "EMAIL" | "WHATSAPP" | "INSTAGRAM" | "MESSENGER";

export type OutboundDeliveryJob = {
  channel: PlatformDeliveryChannel;
  /** Null for premises-menu / system direct sends without a tenant row. */
  businessId: string | null;
  notifLogId: string;
  conversationId?: string | null;
  to: string;
  body: string;
  subject?: string;
  html?: string;
  from?: string | null;
  replyTo?: string;
  /** Meta WhatsApp phone number id or page id for IG/Messenger */
  senderId?: string | null;
  recipientId?: string | null;
};

/** Async Liv reply after inbound message persisted (SMS / Meta webhooks). */
export type InboundReplyJob = {
  businessId: string;
  businessSlug: string;
  businessName: string;
  conversationId: string;
  channel: "SMS" | "WHATSAPP" | "INSTAGRAM" | "MESSENGER";
  message: string;
  customerName?: string | null;
  customerPhone?: string | null;
  customerId?: string | null;
  /** Meta participant id (IG/Messenger) or E.164 for WhatsApp */
  recipientId?: string | null;
  fromPhone?: string | null;
};

export const OUTBOUND_DELIVERY_DEFAULTS = {
  /** Re-queue FAILED/PENDING logs older than this (ms). */
  retryAfterMs: 5 * 60 * 1000,
  /** Max age before giving up on a stuck outbound row. */
  abandonAfterMs: 72 * 60 * 60 * 1000,
  maxRetryAttempts: 5,
} as const;

/** Map delivery lane → circuit breaker subsystem. */
export function subsystemForOutboundChannel(channel: PlatformDeliveryChannel): SideEffectSubsystem {
  return "messaging_outbound";
}

/**
 * Delivery taxonomy (platform-wide):
 * - operator_notification — bell/push (resource-transition hub)
 * - conversational_persist — appendMessage / guest visit message (always sync, never dropped)
 * - conversational_outbound — channel transport (queued, retried)
 * - conversational_inbound — webhooks → thread (persist first, then Liv reply async)
 */
export const PLATFORM_DELIVERY_LANES = {
  operatorNotification: "resource-transition + Inngest",
  conversationalPersist: "conversation_messages (source of truth)",
  conversationalOutbound: "notification_logs outbox + Inngest",
  conversationalInbound: "message_logs + meta/sms webhooks",
} as const;
