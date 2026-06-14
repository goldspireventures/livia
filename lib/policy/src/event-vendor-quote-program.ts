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

/** Pipeline label — deposit paid upgrades accepted → booked for studio UI. */
export function quotePipelineCurrent(quote: {
  status: string;
  depositPaidMinor: number;
  depositAmountMinor: number;
}): string {
  if (quote.status === "booked") return "booked";
  const depositDue = Math.max(0, quote.depositAmountMinor - quote.depositPaidMinor);
  if (quote.depositAmountMinor > 0 && depositDue <= 0 && quote.status === "accepted") {
    return "booked";
  }
  return quote.status;
}

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
  stockCatalogue?: Array<{ id: string; name: string; stockCount?: number | null }>;
  draftLines?: Array<{ name: string; quantity: string; serviceId?: string | null }>;
  setupFeeMinor?: number | null;
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

  const peak = peakDayPricingHint(args.eventDate);
  if (peak) hints.push(peak);

  if (args.draftLines?.length && args.stockCatalogue?.length) {
    hints.push(...inventoryStockWarnings(args.draftLines, args.stockCatalogue));
  }

  const setupFee = resolveSetupFeeMinor({
    venue: args.venue,
    setupFeeMinor: args.setupFeeMinor,
  });
  if (setupFee > 0) {
    hints.push({
      id: "setup-fee",
      severity: "info",
      message: "Venue on file — travel/setup fee will be added to the quote draft.",
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

export { DEFAULT_ENQUIRY_DECLINE_REPLY } from "./liv-platform-program";

export {
  resolveEnquiryDeclineCopy,
  resolveLegacyDeclineCopy,
  ENQUIRY_DECLINE_REASONS,
  type EnquiryDeclineReasonId,
} from "./enquiry-decline-program";

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

/** Peak Saturday / summer season pricing nudge for quote drafts. */
export function peakDayPricingHint(eventDate?: string | null): QuoteBriefHint | null {
  if (!eventDate) return null;
  const d = new Date(`${eventDate}T12:00:00.000Z`);
  const month = d.getUTCMonth();
  const day = d.getUTCDay();
  const isPeakSeason = month >= 5 && month <= 8;
  const isSaturday = day === 6;
  if (!isPeakSeason && !isSaturday) return null;
  const parts: string[] = [];
  if (isSaturday) parts.push("Saturday");
  if (isPeakSeason) parts.push("peak season (Jun–Aug)");
  return {
    id: "peak-pricing",
    severity: "info",
    message: `${parts.join(" · ")} — consider a peak surcharge on your quote.`,
  };
}

/** Flat travel/setup fee when venue address is present and operator configured a fee. */
export function resolveSetupFeeMinor(args: {
  venue?: string | null;
  setupFeeMinor?: number | null;
}): number {
  const venue = args.venue?.trim();
  if (!venue || venue.length < 8) return 0;
  return Math.max(0, args.setupFeeMinor ?? 0);
}

const DEFAULT_OUTDOOR_TERMS =
  "Outdoor / marquee decor is weather-dependent. In case of severe weather, setup may be rescheduled by mutual agreement; indoor alternatives will be discussed where possible.";

/** Append outdoor contingency when venue or notes imply outdoor work. */
export function outdoorContingencyClause(args: {
  eventType?: string | null;
  venue?: string | null;
  notes?: string | null;
  operatorExtra?: string | null;
}): string | null {
  const blob = `${args.venue ?? ""} ${args.notes ?? ""} ${args.eventType ?? ""}`.toLowerCase();
  const outdoor =
    /outdoor|garden|marquee|tent|beach|park|field|terrace|patio|gazebo/i.test(blob) ||
    args.eventType?.toLowerCase() === "wedding";
  if (!outdoor) return null;
  const extra = args.operatorExtra?.trim();
  return extra ? `${DEFAULT_OUTDOOR_TERMS}\n\n${extra}` : DEFAULT_OUTDOOR_TERMS;
}

export type PipelineForecast = {
  quotedMinor: number;
  expectedMinor: number;
  weightLabel: string;
};

const PIPELINE_WEIGHTS: Record<string, number> = {
  sent: 0.4,
  accepted: 0.8,
  booked: 1,
};

/** Weighted pipeline € — quoted at 40%, accepted at 80%. */
export function weightedPipelineForecast(
  quotes: Array<{ status: string; subtotalMinor: number; depositPaidMinor?: number; depositAmountMinor?: number }>,
): PipelineForecast {
  let quotedMinor = 0;
  let expectedMinor = 0;
  for (const q of quotes) {
    if (!["sent", "accepted", "booked"].includes(q.status)) continue;
    const secured =
      (q.depositPaidMinor ?? 0) >= (q.depositAmountMinor ?? 0) && (q.depositAmountMinor ?? 0) > 0;
    const effective = secured && q.status === "accepted" ? "booked" : q.status;
    const w = PIPELINE_WEIGHTS[effective] ?? 0;
    quotedMinor += q.subtotalMinor;
    expectedMinor += Math.round(q.subtotalMinor * w);
  }
  return {
    quotedMinor,
    expectedMinor,
    weightLabel: "Quoted 40% · Accepted 80% · Booked 100%",
  };
}

/** Operator reply-time social proof from first response latency. */
export function replyTimeBenchmark(minutes: number): { label: string; percentile: number } {
  if (minutes <= 5) return { label: "Lightning — top 5% for event vendors", percentile: 95 };
  if (minutes <= 15) return { label: "Fast — top 20%", percentile: 80 };
  if (minutes <= 60) return { label: "Same day — solid", percentile: 55 };
  if (minutes <= 240) return { label: "Within half a day", percentile: 35 };
  return { label: "Slow — guest may have moved on", percentile: 15 };
}

export type QuoteLineDiff = {
  name: string;
  change: "added" | "removed" | "qty" | "price";
  detail: string;
};

export function diffQuoteLineItems(
  prev: Array<{ name: string; quantity: string; lineTotalMinor: number }>,
  next: Array<{ name: string; quantity: string; lineTotalMinor: number }>,
): QuoteLineDiff[] {
  const diffs: QuoteLineDiff[] = [];
  const prevMap = new Map(prev.map((l) => [l.name.toLowerCase(), l]));
  const nextMap = new Map(next.map((l) => [l.name.toLowerCase(), l]));

  for (const [key, n] of nextMap) {
    const p = prevMap.get(key);
    if (!p) {
      diffs.push({ name: n.name, change: "added", detail: `New line × ${n.quantity}` });
      continue;
    }
    if (p.quantity !== n.quantity) {
      diffs.push({
        name: n.name,
        change: "qty",
        detail: `Quantity ${p.quantity} → ${n.quantity}`,
      });
    }
    if (p.lineTotalMinor !== n.lineTotalMinor) {
      diffs.push({
        name: n.name,
        change: "price",
        detail: `Total updated`,
      });
    }
  }
  for (const [key, p] of prevMap) {
    if (!nextMap.has(key)) {
      diffs.push({ name: p.name, change: "removed", detail: "Removed from quote" });
    }
  }
  return diffs;
}

export function inventoryStockWarnings(
  lines: Array<{ name: string; quantity: string; serviceId?: string | null }>,
  catalogue: Array<{ id: string; name: string; stockCount?: number | null }>,
): QuoteBriefHint[] {
  const hints: QuoteBriefHint[] = [];
  for (const line of lines) {
    const svc =
      (line.serviceId ? catalogue.find((c) => c.id === line.serviceId) : undefined) ??
      catalogue.find((c) => c.name.toLowerCase() === line.name.toLowerCase());
    if (!svc?.stockCount || svc.stockCount <= 0) continue;
    const qty = Number(line.quantity);
    if (qty > svc.stockCount) {
      hints.push({
        id: `stock-${svc.id}`,
        severity: "warn",
        message: `"${svc.name}" — only ${svc.stockCount} in stock; quote asks for ${qty}.`,
      });
    }
  }
  return hints;
}

export function milestonePaymentReminderCopy(args: {
  contactName: string;
  businessName: string;
  payUrl: string;
  milestoneLabel: string;
  amountMinor: number;
  currency?: string;
}): { subject: string; body: string; whatsappText: string } {
  const first = args.contactName.split(" ")[0] ?? "there";
  const amount = new Intl.NumberFormat("en-IE", {
    style: "currency",
    currency: args.currency ?? "EUR",
  }).format(args.amountMinor / 100);
  const subject = `${args.milestoneLabel} due — ${args.businessName}`;
  const body = `Hi ${first},\n\nYour ${args.milestoneLabel.toLowerCase()} (${amount}) is now due for your event with ${args.businessName}:\n\n${args.payUrl}\n\n— ${args.businessName}`;
  const whatsappText = `Hi ${first}! Your ${args.milestoneLabel.toLowerCase()} (${amount}) is due:\n${args.payUrl}`;
  return { subject, body, whatsappText };
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
