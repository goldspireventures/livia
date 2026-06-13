/**
 * Liv operator learning — episodic decisions → deterministic pre-screen (global consult-first pattern).
 * LLM narrates later; scoring stays policy-first so surfaces stay in sync.
 */
import { DEFAULT_ENQUIRY_DECLINE_REPLY } from "./event-vendor-quote-program";

export type OperatorDecisionKind = "decline" | "quote_sent" | "booked";

export type OperatorDecisionRecord = {
  kind: OperatorDecisionKind;
  eventType: string | null;
  guestCount: number | null;
  budgetRange: string | null;
  at: string;
};

const DECISION_PREFIX = "op.decision:";

/** Compact episodic row stored in liv_entity_memory (business scope). */
export function formatOperatorDecisionMemory(args: {
  kind: OperatorDecisionKind;
  eventType?: string | null;
  guestCount?: number | null;
  budgetRange?: string | null;
}): string {
  const parts = [
    `${DECISION_PREFIX}${args.kind}`,
    `event:${(args.eventType ?? "unknown").toLowerCase()}`,
    `guests:${args.guestCount ?? "?"}`,
    `budget:${(args.budgetRange ?? "unknown").slice(0, 48)}`,
  ];
  return parts.join("|");
}

export function parseOperatorDecisionMemory(content: string): OperatorDecisionRecord | null {
  if (!content.startsWith(DECISION_PREFIX)) return null;
  const kind = content.match(/op\.decision:(\w+)/)?.[1] as OperatorDecisionKind | undefined;
  if (!kind || !["decline", "quote_sent", "booked"].includes(kind)) return null;
  const eventType = content.match(/event:([^|]+)/)?.[1] ?? null;
  const guestsRaw = content.match(/guests:([^|]+)/)?.[1];
  const guestCount =
    guestsRaw && guestsRaw !== "?" && !Number.isNaN(Number(guestsRaw)) ? Number(guestsRaw) : null;
  const budgetRange = content.match(/budget:([^|]+)/)?.[1] ?? null;
  return {
    kind,
    eventType: eventType === "unknown" ? null : eventType,
    guestCount,
    budgetRange: budgetRange === "unknown" ? null : budgetRange,
    at: "",
  };
}

export type EnquiryFitInput = {
  eventType?: string | null;
  guestCount?: number | null;
  budgetRange?: string | null;
};

export type EnquiryPrescreenTier = "high" | "medium" | "low";

export type EnquiryPrescreenResult = {
  score: number;
  tier: EnquiryPrescreenTier;
  headline: string;
  guidance: string;
  reasons: string[];
};

function normalizeEventType(v?: string | null): string {
  return (v ?? "").trim().toLowerCase();
}

function guestBucket(count: number | null | undefined): "small" | "medium" | "large" | "unknown" {
  if (count == null || count <= 0) return "unknown";
  if (count < 35) return "small";
  if (count < 80) return "medium";
  return "large";
}

function bucketsMatch(a: number | null, b: number | null): boolean {
  if (a == null || b == null) return false;
  return guestBucket(a) === guestBucket(b);
}

function parseBudgetFloor(budgetRange?: string | null): number | null {
  if (!budgetRange) return null;
  const m = budgetRange.replace(/,/g, "").match(/(\d+)/);
  return m ? Number(m[1]) : null;
}

export function scoreEnquiryRevenueFit(
  enquiry: EnquiryFitInput,
  patterns: OperatorDecisionRecord[],
): EnquiryPrescreenResult {
  const reasons: string[] = [];
  let score = 58;
  const eventKey = normalizeEventType(enquiry.eventType);
  const guestCount = enquiry.guestCount ?? null;

  const declines = patterns.filter((p) => p.kind === "decline");
  const wins = patterns.filter((p) => p.kind === "quote_sent" || p.kind === "booked");

  const similarDeclines = declines.filter(
    (p) =>
      (eventKey && normalizeEventType(p.eventType) === eventKey) ||
      bucketsMatch(guestCount, p.guestCount),
  );
  const similarWins = wins.filter(
    (p) =>
      (eventKey && normalizeEventType(p.eventType) === eventKey) ||
      bucketsMatch(guestCount, p.guestCount),
  );

  if (similarDeclines.length >= 2) {
    score -= Math.min(28, similarDeclines.length * 10);
    reasons.push("You've closed similar enquiries before — Liv flagged this for a quick review.");
  } else if (similarDeclines.length === 1) {
    score -= 8;
    reasons.push("One past decline looked like this — worth a fast qualify.");
  }

  if (similarWins.length >= 1) {
    score += Math.min(32, similarWins.length * 14);
    reasons.push("Matches enquiries you've quoted or booked — good revenue signal.");
  }

  const declineFloors = declines
    .map((p) => parseBudgetFloor(p.budgetRange))
    .filter((n): n is number => n != null);
  const enquiryFloor = parseBudgetFloor(enquiry.budgetRange);
  if (declineFloors.length >= 2 && enquiryFloor != null) {
    const avgDeclineFloor =
      declineFloors.reduce((s, n) => s + n, 0) / Math.max(1, declineFloors.length);
    if (enquiryFloor < avgDeclineFloor * 0.65) {
      score -= 18;
      reasons.push("Budget looks below what you usually accept.");
    }
  }

  if (eventKey && declines.filter((p) => normalizeEventType(p.eventType) === eventKey).length >= 2) {
    const winsForType = wins.filter((p) => normalizeEventType(p.eventType) === eventKey).length;
    if (winsForType === 0) {
      score -= 12;
      reasons.push(`You often pass on ${enquiry.eventType ?? "this event type"}.`);
    }
  }

  score = Math.max(0, Math.min(100, score));

  let tier: EnquiryPrescreenTier = "medium";
  if (score >= 72) tier = "high";
  else if (score < 42) tier = "low";

  const headline =
    tier === "high"
      ? "Liv: strong fit"
      : tier === "low"
        ? "Liv: likely not worth deep time"
        : "Liv: review briefly";

  const guidance =
    tier === "high"
      ? "Prioritise — draft a quote when the brief looks complete."
      : tier === "low"
        ? "Skim the brief. If it's not a fit, let Liv send your decline and close."
        : "Quick qualify: quote if it's real, or close politely if not.";

  if (patterns.length === 0) {
    return {
      score: 58,
      tier: "medium",
      headline: "Liv: learning your style",
      guidance: "As you quote and close enquiries, Liv will pre-screen new ones for revenue potential.",
      reasons: ["No operator history yet — every decision teaches Liv."],
    };
  }

  return { score, tier, headline, guidance, reasons };
}

export {
  LIV_OUTBOUND_TEMPLATES,
  LIV_OUTBOUND_TEMPLATE_VARS,
  resolveLivOutboundCopy,
  livOutboundTemplatesSettingsCopy,
  type LivOutboundCopyKey,
  type LivOutboundTemplateKey,
} from "./liv-platform-program";
