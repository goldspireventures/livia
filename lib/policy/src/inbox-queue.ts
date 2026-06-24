/**
 * Shared inbox queue lenses — web dashboard + mobile (E-03).
 * Matches manager ritual: what Liv handled vs what needs you.
 */

export type InboxQueueLens =
  | "needs_you"
  | "liv_handling"
  | "taken_over"
  | "closed"
  | "all";

export type InboxQueueConversation = {
  status: string;
  aiHandled: boolean;
};

/** Open threads waiting for a human — Liv paused or not assigned. */
export function inboxThreadNeedsYou(c: InboxQueueConversation): boolean {
  return c.status === "OPEN" && !c.aiHandled;
}

/**
 * Inbox threads that require studio action (reply or explicit handoff).
 * Excludes Liv-on threads and guest-deposit waits where Liv is still handling.
 */
export function inboxThreadStudioActionRequired(c: InboxQueueConversation): boolean {
  return inboxThreadNeedsYou(c) || inboxThreadTakenOver(c);
}

/** Handed off to staff and still needs a reply. */
export function inboxThreadTakenOver(c: InboxQueueConversation): boolean {
  return c.status === "HANDED_OFF";
}

/** Any thread that should pull owner/manager attention in the list. */
export function inboxThreadNeedsAttention(c: InboxQueueConversation): boolean {
  return inboxThreadStudioActionRequired(c);
}

export function sortInboxThreadsByAttention<T extends InboxQueueConversation & { lastMessageAt: string }>(
  threads: T[],
): T[] {
  return [...threads].sort((a, b) => {
    const aAtt = inboxThreadNeedsAttention(a) ? 1 : 0;
    const bAtt = inboxThreadNeedsAttention(b) ? 1 : 0;
    if (aAtt !== bAtt) return bAtt - aAtt;
    return new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime();
  });
}

export function matchesInboxQueueLens(
  c: InboxQueueConversation,
  lens: InboxQueueLens,
): boolean {
  switch (lens) {
    case "needs_you":
      return inboxThreadNeedsYou(c);
    case "liv_handling":
      return c.status === "OPEN" && c.aiHandled;
    case "taken_over":
      return inboxThreadTakenOver(c);
    case "closed":
      return c.status === "CLOSED";
    case "all":
      return true;
    default:
      return true;
  }
}

export function countByInboxQueueLens(
  threads: InboxQueueConversation[],
): Record<InboxQueueLens, number> {
  const lenses: InboxQueueLens[] = [
    "needs_you",
    "liv_handling",
    "taken_over",
    "closed",
    "all",
  ];
  const out = {} as Record<InboxQueueLens, number>;
  for (const lens of lenses) {
    out[lens] =
      lens === "all"
        ? threads.length
        : threads.filter((t) => matchesInboxQueueLens(t, lens)).length;
  }
  return out;
}

export const INBOX_QUEUE_LENS_LABELS: Record<
  InboxQueueLens,
  { short: string; description: string }
> = {
  needs_you: {
    short: "Needs you",
    description: "Open threads waiting for a human — Liv is paused or not assigned.",
  },
  liv_handling: {
    short: "Liv on",
    description: "Open threads Liv is handling — take over anytime.",
  },
  taken_over: {
    short: "Taken over",
    description: "You paused Liv on these threads.",
  },
  closed: {
    short: "Closed",
    description: "Archived conversations.",
  },
  all: {
    short: "All",
    description: "Every thread.",
  },
};

/** Default lens for manager ritual; owners see Liv handling first. */
export function defaultInboxQueueLens(persona: string): InboxQueueLens {
  if (persona === "manager") return "needs_you";
  if (persona === "receptionist") return "needs_you";
  return "liv_handling";
}

export function inboxScreenTitle(persona: string): string {
  if (persona === "manager" || persona === "founder") return "Queue";
  if (persona === "receptionist") return "Messages";
  return "Inbox";
}

/**
 * When the owner reply composer is shown — web + mobile must match.
 * Hidden when Liv is handling (OPEN + aiHandled) or thread is archived.
 */
export function inboxNeedsOwnerReply(conv: InboxQueueConversation | null | undefined): boolean {
  if (!conv || conv.status === "CLOSED") return false;
  return conv.status === "HANDED_OFF" || !conv.aiHandled;
}

/** Liv is actively handling — show "Liv on" chrome, hide compose. */
export function inboxLivHandling(conv: InboxQueueConversation | null | undefined): boolean {
  return !!conv && conv.status === "OPEN" && conv.aiHandled;
}
