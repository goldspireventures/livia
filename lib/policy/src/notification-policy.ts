import { z } from "zod/v4";
import { businessVocabulary, resolveVerticalKey } from "./vocabulary";

/** Per-tenant push + alert toggles (stored under business.operational_policy.notifications). */
export const notificationPrefsSchema = z.object({
  pushBookingCreated: z.boolean().default(true),
  pushBookingCancelled: z.boolean().default(true),
  pushBookingPending: z.boolean().default(true),
  pushInboxInbound: z.boolean().default(true),
  pushInboxHandoff: z.boolean().default(true),
  pushLivBookingViaChannel: z.boolean().default(true),
});

export type NotificationPrefs = z.infer<typeof notificationPrefsSchema>;

export const DEFAULT_NOTIFICATION_PREFS: NotificationPrefs = notificationPrefsSchema.parse({});

export function parseNotificationPrefs(raw: unknown): NotificationPrefs {
  if (!raw || typeof raw !== "object") return { ...DEFAULT_NOTIFICATION_PREFS };
  const nested = (raw as { notifications?: unknown }).notifications ?? raw;
  const parsed = notificationPrefsSchema.safeParse(nested);
  return parsed.success ? parsed.data : { ...DEFAULT_NOTIFICATION_PREFS };
}

export type PushAudience = "operators" | "inbox_team" | "all_active";

/** Who receives staff push for each event class. */
export const PUSH_AUDIENCE: Record<string, PushAudience> = {
  "booking.created": "operators",
  "booking.cancelled": "operators",
  "booking.pending": "operators",
  "inbox.inbound": "inbox_team",
  "inbox.handoff": "inbox_team",
  "inbox.liv_booked": "inbox_team",
};

export type ChannelLabel = "WhatsApp" | "Instagram" | "Messenger" | "SMS" | "Web" | "Voice";

export function channelDisplayLabel(channel: string | null | undefined): ChannelLabel {
  switch ((channel ?? "WEB").toUpperCase()) {
    case "WHATSAPP":
      return "WhatsApp";
    case "INSTAGRAM":
      return "Instagram";
    case "MESSENGER":
      return "Messenger";
    case "SMS":
      return "SMS";
    case "VOICE":
      return "Voice";
    default:
      return "Web";
  }
}

export function buildBookingCreatedPush(args: {
  businessName: string;
  vertical?: string | null;
  category?: string | null;
  customerName?: string | null;
  serviceName?: string | null;
  startLocal: string;
  source?: string | null;
}): { title: string; body: string } {
  const vocab = businessVocabulary(args.vertical, args.category);
  const who = args.customerName?.trim() || `A ${vocab.clientNoun.toLowerCase()}`;
  const svc = args.serviceName?.trim() || vocab.serviceNoun.toLowerCase();
  const via =
    args.source === "whatsapp"
      ? " via WhatsApp"
      : args.source === "instagram"
        ? " via Instagram"
        : args.source === "sms"
          ? " via SMS"
          : args.source === "voice"
            ? " via voice"
            : "";
  return {
    title: args.businessName ? `New ${vocab.serviceNoun.toLowerCase()} · ${args.businessName}` : "New booking",
    body: `${who} booked ${svc} for ${args.startLocal}${via}. Liv logged it in your diary.`,
  };
}

export function buildBookingCancelledPush(args: {
  businessName: string;
  vertical?: string | null;
  category?: string | null;
  customerName?: string | null;
  startLocal: string;
}): { title: string; body: string } {
  const vocab = businessVocabulary(args.vertical, args.category);
  const who = args.customerName?.trim() || `A ${vocab.clientNoun.toLowerCase()}`;
  return {
    title: `Cancelled · ${args.businessName || vocab.locationNoun}`,
    body: `${who}'s ${vocab.serviceNoun.toLowerCase()} on ${args.startLocal} was cancelled.`,
  };
}

export function buildInboxInboundPush(args: {
  businessName: string;
  channel: string;
  customerName?: string | null;
  preview: string;
  livWillReply: boolean;
}): { title: string; body: string } {
  const ch = channelDisplayLabel(args.channel);
  const who = args.customerName?.trim() || "Someone";
  const preview = args.preview.slice(0, 80) + (args.preview.length > 80 ? "…" : "");
  return {
    title: `${ch} · ${args.businessName || "Inbox"}`,
    body: args.livWillReply
      ? `${who}: "${preview}" — Liv is on it.`
      : `${who}: "${preview}" — needs your team.`,
  };
}

export type InAppNotificationKind =
  | "booking.created"
  | "booking.pending"
  | "booking.cancelled"
  | "inbox.inbound"
  | "inbox.handoff"
  | "inbox.liv_booked"
  | "chain.alert"
  | "continuity.stuck"
  | "time_off.pending"
  | "liv.proposal.pending"
  | "morning.briefing.ready"
  | "refund.pending";

export type NotificationPersonaHint =
  | "org_admin"
  | "owner"
  | "manager"
  | "staff"
  | "receptionist";

export function buildNotificationDeepLinks(args: {
  kind: InAppNotificationKind;
  businessId: string;
  bookingId?: string;
  conversationId?: string;
}): { href: string; mobileHref: string } {
  const { kind, businessId, bookingId, conversationId } = args;
  switch (kind) {
    case "booking.created":
    case "booking.pending":
    case "booking.cancelled":
      if (bookingId) {
        return {
          href: `/bookings/${bookingId}`,
          mobileHref: `/booking/${bookingId}`,
        };
      }
      return {
        href: "/bookings?status=PENDING",
        mobileHref: "/(tabs)/approvals",
      };
    case "inbox.inbound":
    case "inbox.handoff":
    case "inbox.liv_booked":
      if (conversationId) {
        return {
          href: `/inbox?conversation=${conversationId}`,
          mobileHref: `/conversation/${conversationId}`,
        };
      }
      return { href: "/inbox", mobileHref: "/(tabs)/inbox" };
    case "chain.alert":
      return { href: "/chain", mobileHref: "/(tabs)/shops" };
    case "continuity.stuck":
      return { href: "/inbox", mobileHref: "/(tabs)/inbox" };
    case "time_off.pending":
      return { href: "/team/time-off", mobileHref: "/time-off" };
    case "refund.pending":
      if (conversationId) {
        return {
          href: `/inbox?conversation=${conversationId}&lens=taken_over`,
          mobileHref: `/conversation/${conversationId}`,
        };
      }
      if (bookingId) {
        return {
          href: `/bookings/${bookingId}`,
          mobileHref: `/booking/${bookingId}`,
        };
      }
      return { href: "/inbox?lens=taken_over", mobileHref: "/(tabs)/inbox" };
    case "liv.proposal.pending":
      return { href: "/dashboard", mobileHref: "/(tabs)/approvals" };
    case "morning.briefing.ready":
      return { href: "/dashboard", mobileHref: "/(tabs)/today" };
    default:
      return { href: "/dashboard", mobileHref: "/(tabs)" };
  }
}

export function buildInboxHandoffPush(args: {
  businessName: string;
  channel: string;
  customerName?: string | null;
}): { title: string; body: string } {
  const ch = channelDisplayLabel(args.channel);
  const who = args.customerName?.trim() || "A customer";
  return {
    title: `Handoff · ${args.businessName || "Inbox"}`,
    body: `${who} on ${ch} needs a human — Liv is paused on that thread.`,
  };
}

/** Screen card w4m.notifications — row icon family. */
export type NotificationFeedIcon = "booking" | "inbox" | "approval" | "chain";

export function notificationFeedIcon(kind: string): NotificationFeedIcon {
  if (kind.startsWith("booking")) return "booking";
  if (kind.startsWith("inbox")) return "inbox";
  if (kind === "chain.alert") return "chain";
  return "approval";
}

export function groupNotificationsByDay<T extends { createdAt: string }>(
  items: T[],
): { today: T[]; earlier: T[] } {
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const today: T[] = [];
  const earlier: T[] = [];
  for (const item of items) {
    if (new Date(item.createdAt) >= startOfToday) today.push(item);
    else earlier.push(item);
  }
  return { today, earlier };
}
