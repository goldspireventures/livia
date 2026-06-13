import {
  formatOperatorDecisionMemory,
  parseOperatorDecisionMemory,
  scoreEnquiryRevenueFit,
  type EnquiryFitInput,
  type EnquiryPrescreenResult,
  type OperatorDecisionKind,
} from "@workspace/policy";
import { appendLivMemory, listLivMemoryForEntity } from "./liv-memory.service";
import { upsertLivSignal } from "./liv-signals.service";

const MEMORY_KIND = "procedural";
const MEMORY_TTL_DAYS = 400;
const MAX_PATTERNS = 40;

export async function recordOperatorDecision(
  businessId: string,
  kind: OperatorDecisionKind,
  enquiry: EnquiryFitInput,
): Promise<void> {
  const content = formatOperatorDecisionMemory({
    kind,
    eventType: enquiry.eventType,
    guestCount: enquiry.guestCount,
    budgetRange: enquiry.budgetRange,
  });
  await appendLivMemory({
    businessId,
    entityType: "business",
    entityId: businessId,
    kind: MEMORY_KIND,
    content,
    createdBy: "liv",
    ttlDays: MEMORY_TTL_DAYS,
  });
}

export async function getOperatorDecisionPatterns(businessId: string) {
  const rows = await listLivMemoryForEntity({
    businessId,
    entityType: "business",
    entityId: businessId,
    limit: MAX_PATTERNS,
  });
  return rows
    .map((r) => parseOperatorDecisionMemory(r.content))
    .filter((p): p is NonNullable<typeof p> => p != null);
}

export async function prescreenEnquiry(
  businessId: string,
  enquiry: EnquiryFitInput,
): Promise<EnquiryPrescreenResult> {
  const patterns = await getOperatorDecisionPatterns(businessId);
  return scoreEnquiryRevenueFit(enquiry, patterns);
}

/** Injected into Liv system prompts — bounded operator ritual memory. */
export async function buildOperatorLearningPromptBlock(businessId: string): Promise<string> {
  const patterns = await getOperatorDecisionPatterns(businessId);
  if (!patterns.length) return "";

  const declines = patterns.filter((p) => p.kind === "decline").length;
  const quotes = patterns.filter((p) => p.kind === "quote_sent").length;
  const booked = patterns.filter((p) => p.kind === "booked").length;
  const recent = patterns.slice(0, 6).map((p) => {
    const guests = p.guestCount != null ? `${p.guestCount} guests` : "guests unknown";
    return `- ${p.kind}: ${p.eventType ?? "event"} · ${guests}${p.budgetRange ? ` · ${p.budgetRange}` : ""}`;
  });

  return `\n\nOPERATOR LEARNING (from past decisions — suggest, do not override human):\nSummary: ${quotes} quotes sent, ${booked} booked, ${declines} closed as not a fit.\nRecent patterns:\n${recent.join("\n")}\nPre-screen low-fit enquiries; prioritise types and sizes the operator has quoted or booked.\n`;
}

export async function maybeSignalLowFitEnquiry(
  businessId: string,
  enquiryId: string,
  enquiry: EnquiryFitInput & { contactName?: string },
): Promise<void> {
  const prescreen = await prescreenEnquiry(businessId, enquiry);
  if (prescreen.tier !== "low") return;

  await upsertLivSignal({
    businessId,
    kind: "enquiry_prescreen",
    priority: "info",
    title: prescreen.headline,
    body: `${enquiry.contactName ?? "New enquiry"}: ${prescreen.guidance}${prescreen.reasons[0] ? ` ${prescreen.reasons[0]}` : ""}`,
    dedupeKey: `enquiry-prescreen:${enquiryId}`,
    entityType: "enquiry",
    entityId: enquiryId,
    eventName: "enquiry.prescreen.low",
    ttlHours: 96,
  });
}
