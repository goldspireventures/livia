/**
 * Owner client profile — which panels apply per vertical (booking vs consult-first).
 */
import type { BusinessVertical } from "./types";

/** Enquiry → quote → booked — no repeat-visit relationship model. */
export const CONSULT_FIRST_VERTICALS = new Set<BusinessVertical>(["event-vendors"]);

export function isConsultFirstVertical(vertical: string | null | undefined): boolean {
  return CONSULT_FIRST_VERTICALS.has((vertical ?? "hair") as BusinessVertical);
}

/** Salon-style guest relationship card (visits, rebooks, My Livia visits). */
export function showOwnerGuestRelationshipPanel(vertical: string | null | undefined): boolean {
  return !isConsultFirstVertical(vertical);
}

export function showOwnerConsultPipelinePanel(vertical: string | null | undefined): boolean {
  return isConsultFirstVertical(vertical);
}

export function showOwnerBookingHistoryPanel(vertical: string | null | undefined): boolean {
  return !isConsultFirstVertical(vertical);
}

export function showOwnerBookAppointmentCta(vertical: string | null | undefined): boolean {
  return !isConsultFirstVertical(vertical);
}

export function showGuestVaultOwnerCallout(vertical: string | null | undefined): boolean {
  return !isConsultFirstVertical(vertical);
}

export function ownerClientHistoryCopy(vertical: string | null | undefined): {
  title: string;
  emptyDescription: string;
} {
  if (isConsultFirstVertical(vertical)) {
    return {
      title: "Enquiries & messages",
      emptyDescription: "Enquiries, quotes, and threads appear here after the first lead.",
    };
  }
  return {
    title: "Bookings & activity",
    emptyDescription: "Visits and messages appear here after the first booking or thread",
  };
}

export function ownerClientNotesPlaceholder(vertical: string | null | undefined): string {
  if (vertical === "event-vendors") {
    return "Theme ideas, venue access, partner contacts…";
  }
  return "Preferences, allergies, colour formula…";
}

export function ownerClientProfileSubtitle(vertical: string | null | undefined): string {
  if (isConsultFirstVertical(vertical)) {
    return "Enquiry pipeline, quotes, and contact details";
  }
  return "History and contact details";
}

/** Consult-first operators keep enquirers, not salon-style repeat client rosters. */
export function consultFirstClientsListCopy(vertical: string | null | undefined): {
  title: string;
  subtitle: (total: number, clientNounPlural: string) => string;
  addLabel: string;
} {
  if (!isConsultFirstVertical(vertical)) {
    return {
      title: "Clients",
      subtitle: (total, clientNounPlural) =>
        `${total} ${clientNounPlural} — search, book, and view visit history.`,
      addLabel: "Add client",
    };
  }
  return {
    title: "Enquirers",
    subtitle: (total) =>
      `${total} contact${total === 1 ? "" : "s"} from enquiries and quotes — not a repeat-booking roster.`,
    addLabel: "Add contact",
  };
}

export function showOwnerLivMemoryPanel(vertical: string | null | undefined): boolean {
  return !isConsultFirstVertical(vertical);
}

/** Demo seed cap — solo decor has a handful of real enquirers, not 20+ salon guests. */
export function consultFirstDemoCustomerCap(): number {
  return 6;
}

/** Public `/e/` sites do not ship Liv chat yet — hide owner toggle until wired. */
export function showPublicLivWidgetSetting(vertical: string | null | undefined): boolean {
  return !isConsultFirstVertical(vertical);
}

export function consultFirstBriefingLine(stats: {
  newEnquiries: number;
  quotedEnquiries: number;
  staleQuotes: number;
  handoffs: number;
}): string {
  const parts: string[] = [];
  if (stats.newEnquiries > 0) {
    parts.push(`${stats.newEnquiries} new lead${stats.newEnquiries === 1 ? "" : "s"}`);
  }
  if (stats.quotedEnquiries > 0) {
    parts.push(`${stats.quotedEnquiries} quoted`);
  }
  if (stats.staleQuotes > 0) {
    parts.push(`${stats.staleQuotes} quote${stats.staleQuotes === 1 ? "" : "s"} to follow up`);
  }
  if (stats.handoffs > 0) {
    parts.push(`${stats.handoffs} inbox handoff${stats.handoffs === 1 ? "" : "s"}`);
  }
  if (parts.length === 0) {
    return "Pipeline is quiet — share your enquire link when you're ready.";
  }
  return parts.join("; ") + ".";
}

export function resolveConsultFirstOwnerHomeBriefingCta(stats: {
  newEnquiries: number;
  staleQuotes: number;
  handoffs: number;
}): { href: string; label: string } {
  if (stats.newEnquiries > 0) {
    return {
      href: "/inbox",
      label: `Review ${stats.newEnquiries} new lead${stats.newEnquiries === 1 ? "" : "s"}`,
    };
  }
  if (stats.staleQuotes > 0) {
    return {
      href: "/quotes",
      label: `Follow up ${stats.staleQuotes} quote${stats.staleQuotes === 1 ? "" : "s"}`,
    };
  }
  if (stats.handoffs > 0) {
    return { href: "/inbox", label: "Reply in inbox" };
  }
  return { href: "/event-site", label: "Share enquire link" };
}
