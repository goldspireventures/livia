/**
 * Consult-first verticals — one inbox for structured leads + message threads.
 */
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
  return "Website leads and DMs — Liv pre-screens new ones so you focus on revenue.";
}

export type ConsultInboxLens = "all" | "leads" | "messages";

export const CONSULT_INBOX_LENS_LABELS: Record<
  ConsultInboxLens,
  { short: string; description: string }
> = {
  all: { short: "All", description: "Every lead and DM thread." },
  leads: { short: "Leads", description: "Structured enquires from your website and forms." },
  messages: { short: "DMs", description: "WhatsApp, SMS, and web chat threads." },
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
  headline: string;
  guidance: string;
  primary: { action: ConsultLeadActionId; label: string };
  secondary?: { action: ConsultLeadActionId; label: string; destructive?: boolean };
};

/** Stage-specific decision panel — two clear paths from inbox (quote vs close). */
export function resolveConsultLeadDecision(
  status: string,
  opts?: { hasLinkedQuote?: boolean },
): ConsultLeadDecision | null {
  const hasQuote = opts?.hasLinkedQuote ?? false;

  switch (status) {
    case "new":
      return {
        headline: "New enquiry",
        guidance:
          "Review the brief. If it's a fit, Liv drafts a quote from your catalogue. If not, close the case — it won't clutter your pipeline.",
        primary: { action: "draft_quote", label: "Draft quote with Liv" },
        secondary: { action: "decline", label: "Not a fit — close case", destructive: true },
      };
    case "quoted":
      return {
        headline: "Quote with client",
        guidance:
          "Waiting on their reply. Open the quote to tweak or send a follow-up. Mark lost if they've gone elsewhere.",
        primary: {
          action: hasQuote ? "open_quote" : "draft_quote",
          label: hasQuote ? "Open quote" : "Draft quote",
        },
        secondary: { action: "decline", label: "Mark lost", destructive: true },
      };
    case "accepted":
      return {
        headline: "Quote accepted",
        guidance: "Collect deposit and secure the date. Liv can nudge prep tasks once booked.",
        primary: { action: "open_quote", label: "Open quote & deposit" },
        secondary: { action: "mark_booked", label: "Mark booked" },
      };
    case "booked":
      return {
        headline: "Booked",
        guidance: "Event secured — prep checklist and event-day sheet live on the quote.",
        primary: { action: "open_quote", label: "Event prep & quote" },
      };
    case "lost":
      return null;
    default:
      return null;
  }
}
