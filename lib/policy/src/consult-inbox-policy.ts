/**
 * Consult-first verticals — one inbox for structured leads + message threads.
 */
import { isConsultFirstVertical } from "./client-profile-policy";
import type { BusinessVertical } from "./types";

export const UNIFIED_CONSULT_INBOX_VERTICALS = new Set<BusinessVertical>(["event-vendors"]);

export function isUnifiedConsultInboxVertical(vertical: string | null | undefined): boolean {
  return UNIFIED_CONSULT_INBOX_VERTICALS.has((vertical ?? "hair") as BusinessVertical);
}

/** Canonical route — leads and DMs live here (not a separate /enquiries nav). */
export function unifiedConsultInboxRoute(): string {
  return "/inbox";
}

export function consultInboxLeadHref(enquiryId: string): string {
  return `${unifiedConsultInboxRoute()}?lead=${encodeURIComponent(enquiryId)}`;
}

export function consultInboxThreadHref(conversationId: string): string {
  return `${unifiedConsultInboxRoute()}?conversation=${encodeURIComponent(conversationId)}`;
}

export function unifiedConsultInboxTitle(): string {
  return "Inbox";
}

export function unifiedConsultInboxSubtitle(): string {
  return "Website leads first — Liv clears DMs after sending your enquire link.";
}

/** Channels that redirect to the public enquire form — not operator-actionable. */
export const CONSULT_DM_CHANNELS = new Set([
  "WHATSAPP",
  "INSTAGRAM",
  "MESSENGER",
  "SMS",
  "VOICE",
]);

export function isConsultDmChannel(channel: string | null | undefined): boolean {
  return CONSULT_DM_CHANNELS.has((channel ?? "").toUpperCase());
}

/** Consult-first DMs auto-close after Liv replies — operators work website leads. */
export function shouldCloseConsultDm(meta: {
  vertical: string | null | undefined;
  channel: string | null | undefined;
  status?: string | null;
}): boolean {
  if (meta.status === "HANDED_OFF" || meta.status === "CLOSED") return false;
  return isConsultFirstVertical(meta.vertical) && isConsultDmChannel(meta.channel);
}

export type ConsultInboxListItem = {
  status: string;
  channel?: string | null;
  updatedAt?: string | null;
  createdAt?: string | null;
  lastMessageAt?: string | null;
};

/** Count open leads + non-closed DM threads for consult inbox lenses. */
export function countConsultInboxLens(
  leads: ConsultInboxListItem[],
  threads: ConsultInboxListItem[],
): Record<ConsultInboxLens, number> {
  const openThreads = threads.filter((t) => t.status !== "CLOSED");
  return {
    all: leads.length + openThreads.length,
    leads: leads.length,
    messages: openThreads.length,
  };
}

/** Nav + list attention — new leads and unviewed handoffs only (not every open thread). */
export function resolveConsultInboxNavAttention(args: {
  newEnquiries: number;
  unviewedHandoffs: number;
}): { count: number; label: string } {
  const count = Math.max(0, args.newEnquiries) + Math.max(0, args.unviewedHandoffs);
  if (count === 0) return { count: 0, label: "" };
  const parts: string[] = [];
  if (args.newEnquiries > 0) {
    parts.push(
      `${args.newEnquiries} new lead${args.newEnquiries === 1 ? "" : "s"}`,
    );
  }
  if (args.unviewedHandoffs > 0) {
    parts.push(
      `${args.unviewedHandoffs} thread${args.unviewedHandoffs === 1 ? "" : "s"} need${args.unviewedHandoffs === 1 ? "s" : ""} reply`,
    );
  }
  return { count, label: parts.join(" · ") };
}

export function consultInboxLeadNeedsAttention(status: string): boolean {
  return status === "new";
}

export function consultInboxThreadNeedsAttention(
  status: string,
  operatorViewedAt?: string | null,
): boolean {
  return status === "HANDED_OFF" && !operatorViewedAt;
}

export function consultQuotesHref(quoteId: string): string {
  return `/quotes?id=${encodeURIComponent(quoteId)}`;
}

export function consultEnquiryStatusLabel(status: string): string {
  const step = CONSULT_ENQUIRY_PIPELINE_STEPS.find((s) => s.id === status);
  return step?.label ?? status;
}

export type ConsultInboxLens = "all" | "leads" | "messages";

export const CONSULT_INBOX_LENS_LABELS: Record<
  ConsultInboxLens,
  { short: string; description: string }
> = {
  all: { short: "All", description: "Every lead and DM thread." },
  leads: { short: "Leads", description: "Structured enquires from your website and forms." },
  messages: { short: "DMs", description: "Auto-cleared after Liv sends your enquire link." },
};

/** Consult-first enquiry pipeline — mirrors real decor operator workflow. */
export const CONSULT_ENQUIRY_PIPELINE_STEPS = [
  { id: "new", label: "New", hint: "Just in — qualify and decide: quote or close." },
  { id: "quoted", label: "Quoted", hint: "Quote with client — follow up if quiet." },
  { id: "accepted", label: "Accepted", hint: "Client said yes — collect deposit." },
  { id: "booked", label: "Booked", hint: "Date secured — event-day prep." },
  { id: "lost", label: "Closed", hint: "Not proceeding — archived." },
] as const;

export type ConsultLeadActionId = "draft_quote" | "open_quote" | "decline" | "mark_booked";

export type ConsultLeadDecision = {
  /** Optional one-line hint — keep empty in inbox; stages live on Quotes. */
  hint?: string;
  primary: { action: ConsultLeadActionId; label: string };
  secondary?: { action: ConsultLeadActionId; label: string; destructive?: boolean };
};

/** Inbox actions only — qualify, issue quote (opens Quotes), or close. */
export function resolveConsultLeadDecision(
  status: string,
  opts?: { hasLinkedQuote?: boolean },
): ConsultLeadDecision | null {
  const hasQuote = opts?.hasLinkedQuote ?? false;

  switch (status) {
    case "new":
      return {
        primary: { action: "draft_quote", label: "Issue quote" },
        secondary: { action: "decline", label: "Decline", destructive: true },
      };
    case "quoted":
      return {
        hint: "Quote work lives on Quotes — follow up or send from there.",
        primary: {
          action: hasQuote ? "open_quote" : "draft_quote",
          label: hasQuote ? "Open quote" : "Issue quote",
        },
        secondary: { action: "decline", label: "Mark lost", destructive: true },
      };
    case "accepted":
      return {
        primary: { action: "open_quote", label: "Open quote" },
        secondary: { action: "mark_booked", label: "Mark booked" },
      };
    case "booked":
      return {
        primary: { action: "open_quote", label: "Open quote" },
      };
    case "lost":
      return null;
    default:
      return null;
  }
}
