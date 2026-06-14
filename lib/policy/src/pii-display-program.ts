/**
 * PII-safe display rules — studio lists, notifications, and public surfaces.
 * Client names belong in authenticated detail views, not list rows or alert titles.
 */
import { formatEventTypeLabel, quotePaymentReference } from "./event-vendor-lifecycle-program";

export function formatStudioQuoteRef(publicToken: string): string {
  return `Quote #${quotePaymentReference(publicToken)}`;
}

/** Studio quote list row — ref + event meta only (no client name). */
export function studioQuoteListLabel(args: {
  publicToken: string;
  eventType?: string | null;
  eventDate?: string | null;
}): { primary: string; secondary: string } {
  const primary = formatStudioQuoteRef(args.publicToken);
  const parts: string[] = [];
  if (args.eventType?.trim()) parts.push(formatEventTypeLabel(args.eventType));
  if (args.eventDate?.trim()) parts.push(args.eventDate.trim());
  return {
    primary,
    secondary: parts.length ? parts.join(" · ") : "Event details TBC",
  };
}

/** Quote detail page title — ref-first; bill-to shown in dedicated panel only. */
export function studioQuoteDetailTitle(publicToken: string): string {
  return formatStudioQuoteRef(publicToken);
}

/** In-app / push titles — never embed client full name. */
export function notificationQuoteRefLabel(publicToken: string): string {
  return formatStudioQuoteRef(publicToken);
}

/** Public guest quote page — business-first, no client name in document title. */
export function publicQuoteDocumentTitle(businessName: string): string {
  return `Your quote · ${businessName}`;
}

/** Log / audit safe label for quote entities. */
export function auditQuoteLabel(publicToken: string): string {
  return formatStudioQuoteRef(publicToken);
}
