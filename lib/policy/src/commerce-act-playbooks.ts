import type { CommerceSignal, CommerceSignalId } from "./commerce-signals";
import { COMMERCE_BILLING_FIX_HREF, COMMERCE_BILLING_HREF } from "./commerce-signals";
import type { LivMandateAction } from "./liv-mandate";

export type CommerceActPlaybook = {
  signalId: CommerceSignalId;
  taskTitle: string;
  taskBody: string;
  href: string;
  ownerPrompt: string;
  /** When set, Liv may propose this mandate action for owner approval. */
  proposalAction?: LivMandateAction;
  priority: number;
};

const PLAYBOOKS: Record<CommerceSignalId, CommerceActPlaybook> = {
  uncaptured_demand: {
    signalId: "uncaptured_demand",
    taskTitle: "Turn on deposits",
    taskBody: "Bookings are flowing but payments are not captured — enable deposits in booking rules, then complete a test deposit on your booking page.",
    href: COMMERCE_BILLING_FIX_HREF,
    ownerPrompt: "Walk me through turning on deposits and Stripe for this shop.",
    proposalAction: "collect_deposit",
    priority: 1,
  },
  low_capture: {
    signalId: "low_capture",
    taskTitle: "Improve payment capture",
    taskBody: "Capture rate is below target — review failed cards, deposit settings, and checkout flow.",
    href: COMMERCE_BILLING_FIX_HREF,
    ownerPrompt: "Why is payment capture low and what should I change in billing settings?",
    proposalAction: "collect_deposit",
    priority: 2,
  },
  elevated_refunds: {
    signalId: "elevated_refunds",
    taskTitle: "Review refunds",
    taskBody: "Refunds are elevated relative to captured revenue — audit recent cancellations and policies.",
    href: COMMERCE_BILLING_FIX_HREF,
    ownerPrompt: "Summarize refund patterns and what I should tighten in policy.",
    priority: 3,
  },
  strong_revenue: {
    signalId: "strong_revenue",
    taskTitle: "Revenue is healthy",
    taskBody: "Capture and volume look strong — consider packages or upsell on Twin recommendations.",
    href: COMMERCE_BILLING_HREF,
    ownerPrompt: "What's working in commerce and what should I double down on?",
    priority: 10,
  },
};

export function resolveCommerceActPlaybook(signalId: string): CommerceActPlaybook | null {
  return PLAYBOOKS[signalId as CommerceSignalId] ?? null;
}

export type CommerceRemediationTask = {
  signalId: string;
  severity: CommerceSignal["severity"];
  title: string;
  body: string;
  href: string;
  ownerPrompt: string;
  proposalAction?: LivMandateAction;
  priority: number;
};

/** Actionable remediation tasks from commerce signals (act/watch only). */
export function buildCommerceRemediationTasks(signals: CommerceSignal[]): CommerceRemediationTask[] {
  const out: CommerceRemediationTask[] = [];
  for (const signal of signals) {
    if (signal.severity === "info") continue;
    const playbook = resolveCommerceActPlaybook(signal.id);
    out.push({
      signalId: signal.id,
      severity: signal.severity,
      title: signal.title,
      body: signal.body,
      href: signal.href,
      ownerPrompt: playbook?.ownerPrompt ?? `Explain the ${signal.title} signal and next steps.`,
      proposalAction: playbook?.proposalAction,
      priority: playbook?.priority ?? signal.priority,
    });
  }
  return out.sort((a, b) => a.priority - b.priority).slice(0, 6);
}
