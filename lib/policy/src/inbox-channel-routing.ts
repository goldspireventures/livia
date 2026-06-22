/**
 * Inbox reply routing — engineering contract aligned with product "one inbox".
 *
 * Model (v2 — shipped):
 * - Each async channel opens its **own thread** keyed by business + channel + participant.
 * - Instagram DM and WhatsApp from the same person = **two threads** (same customer when linked).
 * - Staff/Liv **reactive** replies always deliver on **that thread's channel**.
 * - **Proactive** outbound (reminders, aftercare) uses preferredModality → lastInboundChannel → defaults.
 * - Cross-channel continuity is via **customer profile + Liv memory + sibling thread links**, not merged threads.
 *
 * Authority: docs/product/INBOX-CHANNEL-ROUTING.md
 */

export type InboxConversationChannel =
  | "WEB"
  | "SMS"
  | "WHATSAPP"
  | "INSTAGRAM"
  | "MESSENGER"
  | "EMAIL"
  | "VOICE";

/** Proactive routing considers last inbound within this window (90 days). */
export const LAST_INBOUND_CHANNEL_MAX_AGE_MS = 90 * 24 * 60 * 60 * 1000;

export type InboxSiblingThread = {
  id: string;
  channel: string;
  status?: string;
  lastMessage?: string | null;
};

export function inboxChannelLabel(channel: string | null | undefined): string {
  switch (channel) {
    case "WHATSAPP":
      return "WhatsApp";
    case "INSTAGRAM":
      return "Instagram";
    case "MESSENGER":
      return "Messenger";
    case "SMS":
      return "SMS";
    case "EMAIL":
      return "Email";
    case "VOICE":
      return "Voice";
    case "WEB":
      return "Web chat";
    default:
      return "Message";
  }
}

/** Shown on thread detail — where this reply will be delivered. */
export function inboxReplyDeliveredOnChannel(channel: string | null | undefined): string {
  const label = inboxChannelLabel(channel);
  return `Replies send on ${label}`;
}

/**
 * Operator education when the same guest uses multiple channels.
 * @deprecated unified inbox — use inboxUnifiedReplyHint when merged timeline is shown.
 */
export function inboxCrossChannelOperatorNote(): string {
  return "Liv handles each channel separately. When you reply, we send on the channel they last used.";
}

/** Compose placeholder tuned to channel. */
export function inboxReplyPlaceholder(channel: string | null | undefined): string {
  const label = inboxChannelLabel(channel);
  return `Reply on ${label}…`;
}

export function isLastInboundChannelFresh(
  lastInboundAt: Date | string | null | undefined,
  nowMs: number = Date.now(),
): boolean {
  if (!lastInboundAt) return false;
  const at = typeof lastInboundAt === "string" ? Date.parse(lastInboundAt) : lastInboundAt.getTime();
  if (!Number.isFinite(at)) return false;
  return nowMs - at <= LAST_INBOUND_CHANNEL_MAX_AGE_MS;
}

/** Map stored conversation channel → guest preferred modality for proactive routing. */
export function modalityFromInboundChannel(
  channel: string | null | undefined,
): "WHATSAPP" | "SMS" | "EMAIL" | "INSTAGRAM" | "WEB" | null {
  switch (channel) {
    case "WHATSAPP":
      return "WHATSAPP";
    case "SMS":
      return "SMS";
    case "EMAIL":
      return "EMAIL";
    case "INSTAGRAM":
    case "MESSENGER":
      return "INSTAGRAM";
    case "WEB":
      return "WEB";
    default:
      return null;
  }
}

/**
 * Resolve effective preferred modality for proactive outbound.
 * ANY + fresh lastInboundChannel honours "where I last messaged you".
 */
export function resolveEffectivePreferredModality(args: {
  preferredModality: string;
  lastInboundChannel?: string | null;
  lastInboundAt?: Date | string | null;
  nowMs?: number;
}): string {
  if (args.preferredModality !== "ANY") return args.preferredModality;
  if (!isLastInboundChannelFresh(args.lastInboundAt, args.nowMs)) return "ANY";
  const fromChannel = modalityFromInboundChannel(args.lastInboundChannel);
  return fromChannel ?? "ANY";
}

/** Banner when the same guest has other open threads on different channels. */
export function inboxSiblingThreadsBanner(siblings: InboxSiblingThread[]): string | null {
  if (!siblings.length) return null;
  const labels = siblings.map((s) => inboxChannelLabel(s.channel));
  if (siblings.length === 1) {
    return `This guest also has an open ${labels[0]} thread — switch below to reply there.`;
  }
  const joined =
    labels.length === 2
      ? `${labels[0]} and ${labels[1]}`
      : `${labels.slice(0, -1).join(", ")}, and ${labels[labels.length - 1]}`;
  return `This guest also has open threads on ${joined} — switch below to reply on the right channel.`;
}

/** Short list-row hint when multiple channels are active for one guest. */
export function inboxMultiChannelListHint(channelCount: number): string | null {
  if (channelCount < 2) return null;
  return `${channelCount} channels`;
}
