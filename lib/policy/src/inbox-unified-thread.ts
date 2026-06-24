/**
 * Unified guest inbox — one list row per customer, merged timeline, reply on last channel.
 * Delivery pipes stay per-channel in storage; operators see one Mary thread.
 *
 * Authority: docs/product/INBOX-CHANNEL-ROUTING.md (v3 unified view)
 */
import {
  type InboxQueueConversation,
  type InboxQueueLens,
  inboxThreadNeedsAttention,
  inboxThreadNeedsYou,
  inboxThreadTakenOver,
  matchesInboxQueueLens,
} from "./inbox-queue";
import { inboxChannelLabel } from "./inbox-channel-routing";

export type InboxListThread = InboxQueueConversation & {
  id: string;
  customerId?: string | null;
  customerName?: string | null;
  customerEmail?: string | null;
  customerPhone?: string | null;
  channel: string;
  lastMessageAt: string;
  lastMessage?: string | null;
  summary?: string | null;
  bookingCount?: number;
  linkedBookingId?: string | null;
};

export type UnifiedInboxGuestThread = {
  /** Primary conversation — most recently active channel thread. */
  primaryConversationId: string;
  customerId: string | null;
  customerName: string | null;
  threads: InboxListThread[];
  /** All channels ever used (includes closed threads). */
  channels: string[];
  /** Open / handed-off channels — use for list badges. */
  activeChannels: string[];
  lastMessageAt: string;
  lastMessage: string | null;
  /** Aggregate queue state for lenses and badges. */
  queueState: InboxQueueLens | "mixed";
};

export type UnifiedInboxMessage = {
  id: string;
  conversationId: string;
  channel: string;
  role: string;
  content: string;
  toolName?: string | null;
  bookingId?: string | null;
  authorUserId?: string | null;
  createdAt: string;
};

function threadSortKey(t: InboxListThread): number {
  const ms = Date.parse(t.lastMessageAt ?? "");
  return Number.isFinite(ms) ? ms : 0;
}

/** Group list rows by guest — anonymous threads stay separate. */
export function groupInboxThreadsByCustomer(threads: InboxListThread[]): UnifiedInboxGuestThread[] {
  const groups = new Map<string, InboxListThread[]>();
  const anon: UnifiedInboxGuestThread[] = [];

  for (const t of threads) {
    if (!t.customerId) {
      anon.push({
        primaryConversationId: t.id,
        customerId: null,
        customerName: t.customerName ?? null,
        threads: [t],
        channels: [t.channel],
        activeChannels: t.status !== "CLOSED" ? [t.channel] : [],
        lastMessageAt: t.lastMessageAt,
        lastMessage: t.lastMessage ?? t.summary ?? null,
        queueState: resolveUnifiedQueueState([t]),
      });
      continue;
    }
    const key = t.customerId;
    const bucket = groups.get(key) ?? [];
    bucket.push(t);
    groups.set(key, bucket);
  }

  const unified: UnifiedInboxGuestThread[] = [];
  for (const bucket of groups.values()) {
    const sorted = [...bucket].sort((a, b) => threadSortKey(b) - threadSortKey(a));
    const primary = sorted[0]!;
    const channels = [...new Set(sorted.map((t) => t.channel))];
    const activeChannels = [
      ...new Set(sorted.filter((t) => t.status !== "CLOSED").map((t) => t.channel)),
    ];
    unified.push({
      primaryConversationId: primary.id,
      customerId: primary.customerId ?? null,
      customerName: primary.customerName ?? null,
      threads: sorted,
      channels,
      activeChannels,
      lastMessageAt: primary.lastMessageAt,
      lastMessage: primary.lastMessage ?? primary.summary ?? null,
      queueState: resolveUnifiedQueueState(sorted),
    });
  }

  return [...unified, ...anon].sort(
    (a, b) => threadSortKey({ lastMessageAt: b.lastMessageAt } as InboxListThread) - threadSortKey({ lastMessageAt: a.lastMessageAt } as InboxListThread),
  );
}

/** Guest-level queue bucket — manual on any channel → needs you. */
export function resolveUnifiedQueueState(threads: InboxQueueConversation[]): InboxQueueLens | "mixed" {
  const open = threads.filter((t) => t.status !== "CLOSED");
  if (open.length === 0) return "closed";
  if (open.some(inboxThreadNeedsYou)) return "needs_you";
  if (open.some(inboxThreadTakenOver)) return "taken_over";
  if (open.every((t) => t.status === "OPEN" && t.aiHandled)) return "liv_handling";
  return "mixed";
}

export function matchesUnifiedInboxQueueLens(
  group: UnifiedInboxGuestThread,
  lens: InboxQueueLens,
): boolean {
  if (lens === "all") {
    return group.threads.some((t) => t.status !== "CLOSED");
  }
  if (lens === "closed") {
    return group.threads.every((t) => t.status === "CLOSED");
  }
  const state = resolveUnifiedQueueState(group.threads);
  if (lens === "needs_you") return state === "needs_you";
  if (lens === "liv_handling") return state === "liv_handling";
  if (lens === "taken_over") return state === "taken_over";
  return group.threads.some((t) => matchesInboxQueueLens(t, lens));
}

export function countUnifiedInboxQueueLens(
  groups: UnifiedInboxGuestThread[],
): Record<InboxQueueLens, number> {
  const lenses: InboxQueueLens[] = ["needs_you", "liv_handling", "taken_over", "closed", "all"];
  const out = {} as Record<InboxQueueLens, number>;
  for (const lens of lenses) {
    out[lens] =
      lens === "all"
        ? groups.filter((g) => g.threads.some((t) => t.status !== "CLOSED")).length
        : groups.filter((g) => matchesUnifiedInboxQueueLens(g, lens)).length;
  }
  return out;
}

export function unifiedInboxGuestNeedsAttention(group: UnifiedInboxGuestThread): boolean {
  return group.threads.some(inboxThreadNeedsAttention);
}

/** Merge messages from all guest threads — chronological, channel-labelled. */
export function mergeUnifiedInboxMessages(
  messages: UnifiedInboxMessage[],
): UnifiedInboxMessage[] {
  return [...messages].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  );
}

/** Staff reply routes to the thread for the guest's most recent inbound message. */
export function resolveUnifiedReplyTarget(
  messages: UnifiedInboxMessage[],
): { conversationId: string; channel: string } | null {
  const lastUser = [...messages]
    .filter((m) => m.role === "USER")
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
  if (!lastUser) return null;
  return { conversationId: lastUser.conversationId, channel: lastUser.channel };
}

export function inboxUnifiedReplyHint(channel: string | null | undefined): string {
  const label = inboxChannelLabel(channel);
  return `Your reply sends on ${label} — the channel they last used.`;
}

export function inboxUnifiedGuestChannelsLabel(channels: string[]): string | null {
  if (channels.length < 2) return null;
  const labels = channels.map((c) => inboxChannelLabel(c));
  if (labels.length === 2) return `${labels[0]} · ${labels[1]}`;
  return labels.join(" · ");
}

function resolveUnifiedGuestContact(threads: InboxListThread[]): {
  customerEmail: string | null;
  customerPhone: string | null;
} {
  for (const t of threads) {
    if (t.customerEmail?.trim()) return { customerEmail: t.customerEmail.trim(), customerPhone: t.customerPhone ?? null };
  }
  for (const t of threads) {
    if (t.customerPhone?.trim()) return { customerEmail: null, customerPhone: t.customerPhone.trim() };
  }
  return { customerEmail: null, customerPhone: null };
}

function resolveUnifiedLinkedBookingId(threads: InboxListThread[]): string | null {
  const withLink = threads.find((t) => t.linkedBookingId);
  return withLink?.linkedBookingId ?? null;
}

export function inboxUnifiedListRowToThreadRow(group: UnifiedInboxGuestThread): InboxListThread {
  const primary = group.threads[0]!;
  const open = group.threads.filter((t) => t.status !== "CLOSED");
  const contact = resolveUnifiedGuestContact(group.threads);
  const aggregate: InboxListThread = {
    ...primary,
    id: group.primaryConversationId,
    customerId: group.customerId,
    customerName: group.customerName,
    customerEmail: contact.customerEmail ?? primary.customerEmail ?? null,
    customerPhone: contact.customerPhone ?? primary.customerPhone ?? null,
    linkedBookingId: resolveUnifiedLinkedBookingId(group.threads) ?? primary.linkedBookingId ?? null,
    lastMessageAt: group.lastMessageAt,
    lastMessage: group.lastMessage,
    channel: group.channels[0] ?? primary.channel,
    aiHandled: open.length > 0 && open.every((t) => t.status === "OPEN" && t.aiHandled),
    status: open.some(inboxThreadNeedsYou)
      ? "OPEN"
      : open.some(inboxThreadTakenOver)
        ? "HANDED_OFF"
        : open.length === 0
          ? "CLOSED"
          : primary.status,
    bookingCount: group.threads.reduce((n, t) => n + (t.bookingCount ?? 0), 0),
  };
  return aggregate;
}

/** Open / handed-off delivery pipes for one guest — shared by web + mobile. */
export type InboxGuestChannelContext = {
  channels: string[];
  multi: boolean;
  threadByChannel: ReadonlyMap<string, string>;
};

export function buildInboxGuestChannelContext(
  customerId: string | null | undefined,
  guestGroups: UnifiedInboxGuestThread[],
): InboxGuestChannelContext {
  if (!customerId) {
    return { channels: [], multi: false, threadByChannel: new Map() };
  }
  const group = guestGroups.find((g) => g.customerId === customerId);
  const channels = group?.activeChannels ?? [];
  const threadByChannel = new Map<string, string>();
  for (const t of group?.threads ?? []) {
    if (t.status !== "CLOSED") threadByChannel.set(t.channel, t.id);
  }
  return { channels, multi: channels.length > 1, threadByChannel };
}

export function resolveInboxMessageChannel(
  message: { channel?: string | null; conversationId?: string | null },
  threads: InboxListThread[],
  fallbackChannel?: string | null,
): string | null | undefined {
  return (
    message.channel ??
    (message.conversationId
      ? threads.find((t) => t.id === message.conversationId)?.channel
      : undefined) ??
    fallbackChannel
  );
}

/** Map a timeline message to the conversation + channel staff should reply on. */
export function resolveInboxMessageReplyRoute(
  message: { channel?: string | null; conversationId?: string | null },
  ctx: InboxGuestChannelContext,
  selectedConversationId: string,
  threads: InboxListThread[],
  fallbackChannel?: string | null,
): { conversationId: string; channel: string } | null {
  const channel = resolveInboxMessageChannel(message, threads, fallbackChannel);
  if (!channel) return null;
  const conversationId =
    message.conversationId ??
    ctx.threadByChannel.get(channel) ??
    selectedConversationId;
  if (!conversationId) return null;
  return { conversationId, channel };
}

export function toggleInboxReplyChannelPick(
  current: { conversationId: string; channel: string } | null | undefined,
  next: { conversationId: string; channel: string },
): { conversationId: string; channel: string } | null {
  if (current?.channel === next.channel && current.conversationId === next.conversationId) {
    return null;
  }
  return next;
}

export function isInboxReplyChannelSelected(
  pick: { conversationId: string; channel: string } | null | undefined,
  message: { channel?: string | null; conversationId?: string | null },
  ctx: InboxGuestChannelContext,
  selectedConversationId: string,
  threads: InboxListThread[],
  fallbackChannel?: string | null,
): boolean {
  if (!pick || !ctx.multi) return false;
  const route = resolveInboxMessageReplyRoute(
    message,
    ctx,
    selectedConversationId,
    threads,
    fallbackChannel,
  );
  if (!route) return false;
  return pick.channel === route.channel && pick.conversationId === route.conversationId;
}

export function resolveInboxEffectiveReplyConversationId(
  pick: { conversationId: string } | null | undefined,
  apiDefault: string | null | undefined,
  selectedConversationId: string | null | undefined,
): string | null | undefined {
  return pick?.conversationId ?? apiDefault ?? selectedConversationId ?? undefined;
}
