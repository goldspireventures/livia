import type { ConversationListItem } from "@workspace/api-client-react";
import type { PresentationLayoutMorph } from "@workspace/policy";

function needsYou(t: ConversationListItem): boolean {
  return t.status === "OPEN" && !t.aiHandled;
}

function updatedMs(t: ConversationListItem): number {
  const ms = Date.parse(t.lastMessageAt ?? "");
  return Number.isFinite(ms) ? ms : 0;
}

/** Morph-specific thread ordering — not palette-only. */
export function sortInboxThreadsForMorph(
  threads: ConversationListItem[],
  morph: PresentationLayoutMorph | null,
): ConversationListItem[] {
  const copy = [...threads];
  switch (morph) {
    case "split-inbox":
    case "cockpit":
      return copy.sort((a, b) => {
        const aN = needsYou(a) ? 1 : 0;
        const bN = needsYou(b) ? 1 : 0;
        if (aN !== bN) return bN - aN;
        return updatedMs(b) - updatedMs(a);
      });
    case "ledger":
      return copy.sort((a, b) => {
        const aHand = a.status === "HANDED_OFF" ? 1 : 0;
        const bHand = b.status === "HANDED_OFF" ? 1 : 0;
        if (aHand !== bHand) return bHand - aHand;
        return updatedMs(b) - updatedMs(a);
      });
    case "timeline-rail":
      return copy.sort((a, b) => updatedMs(b) - updatedMs(a));
    case "menu-card":
      return copy.sort((a, b) => {
        const aOpen = a.status === "OPEN" ? 1 : 0;
        const bOpen = b.status === "OPEN" ? 1 : 0;
        if (aOpen !== bOpen) return bOpen - aOpen;
        return (a.customerName ?? "").localeCompare(b.customerName ?? "");
      });
    default:
      return copy.sort((a, b) => updatedMs(b) - updatedMs(a));
  }
}

export type InboxMorphSection = { id: string; title: string; threads: ConversationListItem[] };

export function groupInboxThreadsForMorph(
  threads: ConversationListItem[],
  morph: PresentationLayoutMorph | null,
): InboxMorphSection[] | null {
  if (morph === "split-inbox" || morph === "cockpit") {
    const needs = threads.filter(needsYou);
    const liv = threads.filter((t) => t.status === "OPEN" && t.aiHandled);
    const rest = threads.filter((t) => !needsYou(t) && !(t.status === "OPEN" && t.aiHandled));
    const sections: InboxMorphSection[] = [];
    if (needs.length) sections.push({ id: "needs", title: "Needs you", threads: needs });
    if (liv.length) sections.push({ id: "liv", title: "Liv handling", threads: liv });
    if (rest.length) sections.push({ id: "rest", title: "Archive & handoffs", threads: rest });
    return sections.length ? sections : null;
  }
  if (morph === "ledger") {
    const hand = threads.filter((t) => t.status === "HANDED_OFF");
    const open = threads.filter((t) => t.status === "OPEN");
    const closed = threads.filter((t) => t.status === "CLOSED");
    const sections: InboxMorphSection[] = [];
    if (hand.length) sections.push({ id: "hand", title: "Settlement & handoffs", threads: hand });
    if (open.length) sections.push({ id: "open", title: "Guest messages", threads: open });
    if (closed.length) sections.push({ id: "closed", title: "Closed", threads: closed });
    return sections.length ? sections : null;
  }
  return null;
}
