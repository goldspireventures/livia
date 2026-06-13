/**
 * Event-vendor quote program — templates, brief intelligence, setup checklist, stale nudges.
 * Policy hub for consult-first quoting (solo decor operators).
 */
import { resolveLivOutboundCopy } from "./liv-platform-program";

export type QuotePresetLine = {
  serviceName: string;
  quantity?: number;
  unit?: string;
};

export type QuoteBriefHint = {
  id: string;
  severity: "info" | "warn" | "action";
  message: string;
};

export type QuoteBriefIntelligence = {
  hints: QuoteBriefHint[];
  suggestedMessage: string;
  missingFields: string[];
  scaledLines: Array<{ serviceName: string; quantity: number; reason?: string }>;
};

export const STALE_QUOTE_DAYS = 5;

export const DEFAULT_SETUP_CHECKLIST = [
  "Confirm venue access time with client",
  "Load van — check inventory against line items",
  "Setup decor per mood board",
  "Client walkthrough on arrival",
  "Pack-down / collection arranged",
] as const;

const EVENT_TYPE_CHECKLIST_EXTRAS: Record<string, string[]> = {
  wedding: ["Coordinate with planner / venue coordinator", "Confirm ceremony vs reception timing"],
  birthday: ["Confirm surprise timing with contact person", "Balloon inflation schedule"],
  christening: ["Confirm church / venue restrictions on decor"],
  corporate: ["Load-in badge / parking arranged", "Brand colours confirmed with client"],
};

export function setupChecklistForEventType(eventType?: string | null): string[] {
  const key = (eventType ?? "").toLowerCase();
  const extras = EVENT_TYPE_CHECKLIST_EXTRAS[key] ?? [];
  return [...DEFAULT_SETUP_CHECKLIST, ...extras];
}

export function scalePresetQuantity(args: {
  presetQty: number;
  quoteUnit?: string | null;
  guestCount?: number | null;
  serviceName?: string;
}): { quantity: number; reason?: string } {
  const { presetQty, quoteUnit, guestCount, serviceName } = args;
  const guests = guestCount ?? 0;

  if (quoteUnit === "per_guest" && guests > 0) {
    return { quantity: guests, reason: `${guests} guests` };
  }
  if (quoteUnit === "per_table" && guests > 0) {
    const tables = Math.max(presetQty, Math.ceil(guests / 8));
    return { quantity: tables, reason: `~${tables} tables for ${guests} guests` };
  }
  if (
    guests > 0 &&
    serviceName &&
    /centrepiece|table runner|chair cover|sash/i.test(serviceName)
  ) {
    const tables = Math.max(presetQty, Math.ceil(guests / 8));
    if (tables !== presetQty) {
      return { quantity: tables, reason: `Scaled to ${tables} tables` };
    }
  }
  return { quantity: presetQty };
}

export function personalMessageFromBrief(args: {
  eventType?: string | null;
  theme?: string | null;
  contactName?: string | null;
}): string {
  const who = args.contactName?.split(" ")[0] ?? "there";
  const event = args.eventType ?? "event";
  if (args.theme) {
    return `Hi ${who}! Thank you for your enquiry. Here is your personalised quote for your ${event} — styled around your ${args.theme} theme.`;
  }
  return `Hi ${who}! Thank you for your enquiry. Please find your itemised quote below — let us know if you'd like to adjust anything.`;
}

export function buildQuoteBriefIntelligence(args: {
  contactName?: string | null;
  eventType?: string | null;
  eventDate?: string | null;
  guestCount?: number | null;
  theme?: string | null;
  venue?: string | null;
  budgetRange?: string | null;
  servicesRequested?: string[];
  presetLines?: QuotePresetLine[];
  catalogueNames?: string[];
  subtotalMinor?: number;
}): QuoteBriefIntelligence {
  const hints: QuoteBriefHint[] = [];
  const missingFields: string[] = [];

  if (!args.eventDate) missingFields.push("Event date");
  if (!args.guestCount) missingFields.push("Guest count");
  if (!args.venue) missingFields.push("Venue");
  if (!args.theme) missingFields.push("Theme / colour palette");

  for (const field of missingFields) {
    hints.push({
      id: `missing-${field.toLowerCase().replace(/\s+/g, "-")}`,
      severity: "warn",
      message: `Add ${field.toLowerCase()} — helps pricing and setup planning.`,
    });
  }

  if (args.guestCount && args.guestCount > 80) {
    hints.push({
      id: "large-event",
      severity: "info",
      message: `${args.guestCount} guests — consider setup & delivery line and extra hands on event day.`,
    });
  }

  if (args.budgetRange && args.subtotalMinor != null) {
    hints.push({
      id: "budget-context",
      severity: "info",
      message: `Client budget guide: ${args.budgetRange}. Review line items before sending.`,
    });
  }

  const requested = args.servicesRequested ?? [];
  if (requested.length === 0 && (args.presetLines?.length ?? 0) === 0) {
    hints.push({
      id: "no-services",
      severity: "action",
      message: "No services requested — pick a quote template or add catalogue lines manually.",
    });
  }

  const catalogue = new Set((args.catalogueNames ?? []).map((n) => n.toLowerCase()));
  for (const line of args.presetLines ?? []) {
    if (!catalogue.has(line.serviceName.toLowerCase())) {
      hints.push({
        id: `missing-catalogue-${line.serviceName}`,
        severity: "warn",
        message: `"${line.serviceName}" is in the template but not in your catalogue — add it or swap the line.`,
      });
    }
  }

  const scaledLines = (args.presetLines ?? []).map((p) => {
    const scaled = scalePresetQuantity({
      presetQty: p.quantity ?? 1,
      quoteUnit: p.unit,
      guestCount: args.guestCount,
      serviceName: p.serviceName,
    });
    return { serviceName: p.serviceName, quantity: scaled.quantity, reason: scaled.reason };
  });

  if (args.guestCount && scaledLines.some((l) => l.reason)) {
    hints.push({
      id: "auto-scaled",
      severity: "info",
      message: "Quantities scaled from guest count — review before sending.",
    });
  }

  return {
    hints,
    suggestedMessage: personalMessageFromBrief(args),
    missingFields,
    scaledLines,
  };
}

export function staleQuoteNudgeCopy(
  args: {
    contactName: string;
    businessName: string;
    daysSinceSent: number;
    quoteUrl: string;
  },
  operatorOverride?: string | null,
): string {
  const first = args.contactName.split(" ")[0] ?? "there";
  return resolveLivOutboundCopy(
    "stale_quote_nudge",
    {
      firstName: first,
      businessName: args.businessName,
      daysSinceSent: String(args.daysSinceSent),
      quoteUrl: args.quoteUrl,
    },
    operatorOverride,
  );
}

/** Guest-facing powered-by line on `/e/` public sites and quote documents. */
export function eventVendorPoweredByLine(): string {
  return "Quotes & enquiries powered by Livia";
}

/** Default decline — operator may override via `businesses.liv_outbound_overrides.decline_reply`. */
export const DEFAULT_ENQUIRY_DECLINE_REPLY = `Hi {{firstName}},

Thank you for reaching out to {{businessName}}. After reviewing your event details, we're not able to take this one on — our calendar and styling scope won't be the right fit this time.

We hope your celebration is wonderful, and we'd love to hear from you again for a future event.

Warmly,
{{businessName}}`;

function applyDeclineTemplate(
  template: string,
  args: { firstName: string; businessName: string },
): string {
  return template
    .replaceAll("{{firstName}}", args.firstName)
    .replaceAll("{{businessName}}", args.businessName);
}

export function resolveEnquiryDeclineCopy(args: {
  contactName: string;
  businessName: string;
  operatorTemplate?: string | null;
}): { subject: string; body: string; whatsappText: string } {
  const firstName = args.contactName.trim().split(/\s+/)[0] ?? "there";
  const body = applyDeclineTemplate(
    args.operatorTemplate?.trim() || DEFAULT_ENQUIRY_DECLINE_REPLY,
    { firstName, businessName: args.businessName },
  );
  const subject = `Update on your enquiry — ${args.businessName}`;
  const whatsappText = body.replace(/\n\n/g, "\n").trim();
  return { subject, body, whatsappText };
}

/**
 * Operator UI copy rule: never explain UI mechanics (collapse, hidden until, expand, same as PDF).
 * State outcomes and next actions only — see event-vendor surfaces + SettingsDisclosure titles.
 */

export type EventVendorGalleryItem = {
  url: string;
  caption?: string;
  eventType?: string;
};

/** Guest quote “similar work” — prefer gallery shots tagged for this event type. */
export function matchGallerySimilarWork(
  gallery: EventVendorGalleryItem[],
  eventType?: string | null,
  limit = 3,
): EventVendorGalleryItem[] {
  if (!gallery.length) return [];
  const key = (eventType ?? "").toLowerCase().trim();
  if (!key) return gallery.slice(0, limit);
  const matched = gallery.filter((g) => (g.eventType ?? "").toLowerCase() === key);
  if (matched.length >= limit) return matched.slice(0, limit);
  const rest = gallery.filter((g) => (g.eventType ?? "").toLowerCase() !== key);
  return [...matched, ...rest].slice(0, limit);
}

export function matchTemplateByEventType<
  T extends { id: string; eventTypes?: string[] | null; isActive?: boolean | null; name?: string },
>(templates: T[], eventType?: string | null): T | undefined {
  const key = (eventType ?? "").toLowerCase();
  if (!key) return undefined;
  return templates.find(
    (t) =>
      t.isActive !== false &&
      Array.isArray(t.eventTypes) &&
      t.eventTypes.some((et) => et.toLowerCase() === key),
  );
}
