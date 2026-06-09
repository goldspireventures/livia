/**
 * Inbox vs floor — walk-ins and front-desk arrivals are calendar operations,
 * not async inbox threads. Async channels (SMS, web, email, missed calls) live here.
 *
 * @see docs/product/LIV-OPERATING-SYSTEM.md §6.2 Reception
 */

export type InboxFloorPersona =
  | "org_admin"
  | "owner"
  | "manager"
  | "staff"
  | "receptionist"
  | string;

export type InboxFloorGuidance = {
  title: string;
  body: string;
  href: string;
  cta: string;
};

/** Persona-aware banner on the inbox — clarifies walk-ins vs messages. */
export function inboxFloorGuidance(persona: InboxFloorPersona): InboxFloorGuidance | null {
  if (persona === "receptionist") {
    return {
      title: "Walk-ins live on the floor",
      body: "Guests at the door go on the calendar. This inbox is for messages, missed calls, and DMs Liv is handling.",
      href: "/bookings?create=1",
      cta: "Add walk-in",
    };
  }
  if (persona === "manager" || persona === "owner" || persona === "org_admin") {
    return {
      title: "Inbox is for async channels",
      body: "Unknown guests at the door are added from the floor calendar. Threads here are SMS, web chat, email, and missed calls.",
      href: "/bookings",
      cta: "Open floor",
    };
  }
  return null;
}

/** Staff my-day empty-chair copy — walk-ins routed by front desk. */
export function staffWalkInHint(persona: InboxFloorPersona): string | null {
  if (persona === "staff") {
    return "Walk-ins are routed by front desk — your chair updates when they're seated.";
  }
  return null;
}

/** Demo / seed labels — never label an inbox thread as a walk-in. */
export const INBOX_DEMO_MISSED_CALL = {
  name: "Unknown caller",
  summary: "Missed call — Liv texted back with tomorrow 11:00 hold.",
  channel: "VOICE" as const,
} as const;
