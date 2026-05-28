/** Plain-language labels for audit action classes — mobile-first, no internal jargon. */

const ACTION_LABELS: Record<string, string> = {
  "human.booking.create": "Booking created",
  "human.booking.update": "Booking updated",
  "human.booking.cancel": "Booking cancelled",
  "human.booking.confirm": "Booking confirmed",
  "human.booking.complete": "Booking marked complete",
  "human.persona.view": "Viewed as another role (demo)",
  "liv.booking.create": "Liv created a booking",
  "liv.booking.update": "Liv updated a booking",
  "liv.inbox.reply": "Liv replied in inbox",
  "demo.portal.sign_in": "Demo sign-in",
  "settings.update": "Settings changed",
  "staff.invite": "Staff invited",
  "policy.update": "Policy updated",
};

const SEARCH_ALIASES: Record<string, string[]> = {
  booking: ["human.booking", "liv.booking"],
  cancel: ["human.booking.cancel", "cancelled"],
  confirm: ["human.booking.confirm", "confirmed"],
  liv: ["liv.", "assistant"],
  staff: ["staff.", "team"],
  settings: ["settings."],
};

export function auditActionLabel(actionClass: string): string {
  if (ACTION_LABELS[actionClass]) return ACTION_LABELS[actionClass];
  const parts = actionClass.split(".");
  if (parts.length >= 3) {
    const [, resource, verb] = parts;
    const resourceLabel =
      resource === "booking"
        ? "Booking"
        : resource === "persona"
          ? "Role"
          : resource.charAt(0).toUpperCase() + resource.slice(1);
    const verbLabel = verb.replace(/_/g, " ");
    return `${resourceLabel} — ${verbLabel}`;
  }
  return actionClass.replace(/\./g, " · ").replace(/_/g, " ");
}

/** Expand a plain-English search into API-friendly tokens. */
export function expandAuditSearchQuery(q: string): string {
  const trimmed = q.trim().toLowerCase();
  if (!trimmed) return "";
  const tokens: string[] = [trimmed];
  for (const [word, aliases] of Object.entries(SEARCH_ALIASES)) {
    if (trimmed.includes(word)) tokens.push(...aliases);
  }
  return tokens.join(" ");
}

export const AUDIT_FILTER_CHIPS = [
  { id: "bookings", label: "Bookings", q: "booking" },
  { id: "liv", label: "Liv actions", q: "liv" },
  { id: "staff", label: "Team", q: "staff" },
  { id: "settings", label: "Settings", q: "settings" },
] as const;
