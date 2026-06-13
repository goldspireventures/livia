/** Event-vendor studio — consult-first pipeline + invoice language (solo operator). */

export { CONSULT_ENQUIRY_PIPELINE_STEPS as ENQUIRY_STATUSES } from "@workspace/policy";

export const QUOTE_STATUSES = [
  { id: "draft", label: "Draft", hint: "Editing — not sent yet" },
  { id: "sent", label: "Sent", hint: "With client — link active" },
  { id: "accepted", label: "Accepted", hint: "Client said yes" },
  { id: "booked", label: "Booked", hint: "Deposit paid · date secured" },
  { id: "declined", label: "Declined", hint: "Client passed" },
  { id: "expired", label: "Expired", hint: "Past valid-until date" },
] as const;

/** Pipeline step — advances to booked once deposit is fully paid. */
export function quotePipelineCurrent(quote: {
  status: string;
  depositPaidMinor: number;
  depositAmountMinor: number;
}): string {
  const depositDue = Math.max(0, quote.depositAmountMinor - quote.depositPaidMinor);
  if (quote.depositAmountMinor > 0 && depositDue <= 0 && quote.status === "accepted") {
    return "booked";
  }
  return quote.status;
}

export type EventDaySheet = {
  eventDate?: string | null;
  eventType?: string | null;
  theme?: string | null;
  guestCount?: number | null;
  venue?: string | null;
  setupChecklist?: string[];
  /** Manual bill-to when quote is not linked to a lead */
  billToName?: string | null;
  billToEmail?: string | null;
  billToPhone?: string | null;
  livLifecycle?: import("@workspace/policy").LivEventLifecycle;
};

/** Resolve display name for invoice preview and send. */
export function quoteBillToName(
  enquiry?: { contactName?: string | null } | null,
  sheet?: EventDaySheet | null,
  customer?: { displayName?: string | null; firstName?: string | null; lastName?: string | null } | null,
): string | null {
  if (enquiry?.contactName) return enquiry.contactName;
  if (sheet?.billToName?.trim()) return sheet.billToName.trim();
  if (customer?.displayName?.trim()) return customer.displayName.trim();
  const parts = [customer?.firstName, customer?.lastName].filter(Boolean);
  return parts.length ? parts.join(" ") : null;
}

export function formatQuoteUnit(unit: string): string {
  switch (unit) {
    case "per_guest":
      return "per guest";
    case "per_table":
      return "per table";
    case "per_item":
      return "per item";
    case "per_metre":
      return "per metre";
    default:
      return "flat rate";
  }
}

export const QUOTE_UNIT_OPTIONS = [
  { value: "flat", label: "Flat rate" },
  { value: "per_guest", label: "Per guest" },
  { value: "per_table", label: "Per table" },
  { value: "per_item", label: "Per item" },
  { value: "per_metre", label: "Per metre" },
] as const;

export function minorToEurInput(minor: number): string {
  return (minor / 100).toFixed(2);
}

export function eurInputToMinor(value: string): number {
  const n = Number.parseFloat(value.replace(/[^\d.-]/g, ""));
  if (!Number.isFinite(n)) return 0;
  return Math.round(n * 100);
}

export function newLocalQuoteLine(
  partial?: Partial<{
    name: string;
    quantity: string;
    unit: string;
    unitPriceMinor: number;
  }>,
) {
  const unitPriceMinor = partial?.unitPriceMinor ?? 0;
  const quantity = partial?.quantity ?? "1";
  const qty = Number(quantity) || 0;
  return {
    id: `local-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    name: partial?.name ?? "Custom item",
    quantity,
    unit: partial?.unit ?? "flat",
    unitPriceMinor,
    lineTotalMinor: Math.round(qty * unitPriceMinor),
  };
}

export function statusMeta<T extends { id: string; label: string }>(
  list: readonly T[],
  id: string,
): T | undefined {
  return list.find((s) => s.id === id);
}

export function eur(minor: number): string {
  return new Intl.NumberFormat("en-IE", { style: "currency", currency: "EUR" }).format(minor / 100);
}

/** One active draft per enquiry — surface duplicates in UI. */
export function groupQuotesByEnquiry<T extends { id: string; enquiryId?: string | null; status: string }>(
  rows: T[],
): { primary: T[]; duplicateEnquiryIds: Set<string> } {
  const byEnquiry = new Map<string, T[]>();
  for (const row of rows) {
    if (!row.enquiryId) continue;
    const list = byEnquiry.get(row.enquiryId) ?? [];
    list.push(row);
    byEnquiry.set(row.enquiryId, list);
  }
  const duplicateEnquiryIds = new Set<string>();
  const hideIds = new Set<string>();
  for (const [eid, list] of byEnquiry) {
    if (list.length <= 1) continue;
    duplicateEnquiryIds.add(eid);
    const drafts = list.filter((q) => q.status === "draft");
    if (drafts.length > 1) {
      const [, ...rest] = drafts.sort((a, b) => b.id.localeCompare(a.id));
      for (const d of rest) hideIds.add(d.id);
    }
  }
  return {
    primary: rows.filter((r) => !hideIds.has(r.id)),
    duplicateEnquiryIds,
  };
}

type QuoteLineLike = {
  quantity: string | number;
  unitPriceMinor: number;
  lineTotalMinor: number;
};

/** Recalculate line totals and subtotal when qty edits in the invoice editor. */
export function recalcQuoteTotals<T extends QuoteLineLike>(
  lines: T[],
  depositPercent: number,
): {
  lines: T[];
  subtotalMinor: number;
  depositAmountMinor: number;
  balanceDueMinor: number;
} {
  const updated = lines.map((line) => {
    const qty = Number(line.quantity) || 0;
    const lineTotalMinor = Math.round(qty * line.unitPriceMinor);
    return { ...line, lineTotalMinor };
  });
  const subtotalMinor = updated.reduce((sum, line) => sum + line.lineTotalMinor, 0);
  const depositAmountMinor = Math.round((subtotalMinor * depositPercent) / 100);
  const balanceDueMinor = subtotalMinor - depositAmountMinor;
  return { lines: updated, subtotalMinor, depositAmountMinor, balanceDueMinor };
}
