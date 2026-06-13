/**
 * Event-vendor lifecycle — quote → accept → deposit → booked → event prep → review.
 * Policy hub for Liv automations (solo decor / consult-first operators).
 */
import { setupChecklistForEventType } from "./event-vendor-quote-program";

export const EVENT_PREP_WEEKS_BEFORE = 2;
export const EVENT_PREP_EVE_DAYS = 1;
export const POST_EVENT_REVIEW_DAYS_AFTER = 1;

export type EventPrepPhase =
  | "venue_access"
  | "load_list"
  | "day_of_setup"
  | "post_event_review";

export type EventPrepTask = {
  id: string;
  phase: EventPrepPhase;
  label: string;
  dueDate: string;
  detail?: string[];
  checklist?: string[];
  completedAt?: string | null;
  operatorNotifiedAt?: string | null;
  clientNotifiedAt?: string | null;
};

export type LivEventLifecycle = {
  prepTasks: EventPrepTask[];
  prepInitializedAt?: string | null;
  depositReminderSentAt?: string | null;
  /** Milestone label → ISO sentAt for auto-collect reminders */
  milestoneRemindersSent?: Record<string, string>;
};

export type EventPrepLineInput = { name: string };

function isoToday(now = new Date()): string {
  return now.toISOString().slice(0, 10);
}

function addDays(isoDate: string, days: number): string {
  const d = new Date(`${isoDate}T12:00:00.000Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/** Build timed prep tasks once booking is secured (deposit paid / booked). */
export function buildEventPrepPlan(args: {
  eventDate?: string | null;
  eventType?: string | null;
  venue?: string | null;
  lineItems?: EventPrepLineInput[];
}): EventPrepTask[] {
  if (!args.eventDate) return [];

  const venueLabel = args.venue?.trim() || "venue";
  const lineNames = (args.lineItems ?? []).map((l) => l.name).filter(Boolean);
  const loadDetail =
    lineNames.length > 0 ? lineNames : ["Line items from accepted quote"];

  return [
    {
      id: "venue_access",
      phase: "venue_access",
      label: `Confirm venue access & travel buffer — ${venueLabel}`,
      dueDate: addDays(args.eventDate, -EVENT_PREP_WEEKS_BEFORE * 7),
    },
    {
      id: "load_list",
      phase: "load_list",
      label: "Load van — check inventory against quote",
      dueDate: addDays(args.eventDate, -EVENT_PREP_EVE_DAYS),
      detail: loadDetail,
    },
    {
      id: "day_of_setup",
      phase: "day_of_setup",
      label: "Event day setup checklist",
      dueDate: args.eventDate,
      checklist: setupChecklistForEventType(args.eventType),
    },
    {
      id: "post_event_review",
      phase: "post_event_review",
      label: "Thank client & request review",
      dueDate: addDays(args.eventDate, POST_EVENT_REVIEW_DAYS_AFTER),
    },
  ];
}

export type DueLifecycleAction =
  | { kind: "operator_prep_nudge"; taskId: string; phase: EventPrepPhase }
  | { kind: "client_review_request"; taskId: string };

/** Which automated actions are due today (cron / sweep). */
export function resolveDueLifecycleActions(
  lifecycle: LivEventLifecycle,
  today = isoToday(),
): DueLifecycleAction[] {
  const actions: DueLifecycleAction[] = [];
  for (const task of lifecycle.prepTasks) {
    if (task.dueDate > today) continue;
    if (task.completedAt) continue;

    if (task.phase === "post_event_review") {
      if (!task.clientNotifiedAt) {
        actions.push({ kind: "client_review_request", taskId: task.id });
      }
      continue;
    }

    if (!task.operatorNotifiedAt) {
      actions.push({
        kind: "operator_prep_nudge",
        taskId: task.id,
        phase: task.phase,
      });
    }
  }
  return actions;
}

export function depositDueReminderCopy(args: {
  contactName: string;
  businessName: string;
  payUrl: string;
  depositAmountMinor: number;
  currency?: string;
}): { subject: string; body: string; whatsappText: string } {
  const first = args.contactName.split(" ")[0] ?? "there";
  const amount = formatMinor(args.depositAmountMinor, args.currency);
  const subject = `Secure your date — deposit for ${args.businessName}`;
  const body = `Hi ${first},\n\nThank you for accepting your quote! Pay your ${amount} deposit to secure your event date:\n\n${args.payUrl}\n\n— ${args.businessName}`;
  const whatsappText = `Hi ${first}! Thanks for accepting your quote with ${args.businessName}. Pay your ${amount} deposit here to lock in your date:\n${args.payUrl}`;
  return { subject, body, whatsappText };
}

export function operatorPrepNudgeCopy(args: {
  contactName: string;
  eventDate?: string | null;
  task: EventPrepTask;
  businessName: string;
}): string {
  const lines: string[] = [
    `Liv prep — ${args.task.label}`,
    args.contactName ? `Client: ${args.contactName}` : "",
    args.eventDate ? `Event: ${args.eventDate}` : "",
  ].filter(Boolean);

  if (args.task.phase === "load_list" && args.task.detail?.length) {
    lines.push("", "Load list:", ...args.task.detail.map((d) => `• ${d}`));
  }
  if (args.task.phase === "day_of_setup" && args.task.checklist?.length) {
    lines.push("", "Setup checklist:", ...args.task.checklist.slice(0, 4).map((c) => `• ${c}`));
  }

  lines.push("", `— ${args.businessName} · Liv`);
  return lines.join("\n");
}

export function formatMinor(minor: number, currency = "EUR"): string {
  return new Intl.NumberFormat("en-IE", { style: "currency", currency }).format(minor / 100);
}

/** Tasks due within the next N days for operator home / dashboard. */
export function upcomingPrepTasks(
  lifecycle: LivEventLifecycle | null | undefined,
  withinDays = 14,
  today = isoToday(),
): EventPrepTask[] {
  if (!lifecycle?.prepTasks?.length) return [];
  const horizon = addDays(today, withinDays);
  return lifecycle.prepTasks.filter(
    (t) => !t.completedAt && t.dueDate >= today && t.dueDate <= horizon,
  );
}

export function overduePrepTasks(
  lifecycle: LivEventLifecycle | null | undefined,
  today = isoToday(),
): EventPrepTask[] {
  if (!lifecycle?.prepTasks?.length) return [];
  return lifecycle.prepTasks.filter((t) => !t.completedAt && t.dueDate < today);
}

export type QuoteOperatorFlowStep = {
  id: string;
  label: string;
  state: "done" | "current" | "upcoming";
};

/** Operator-facing steps after a quote is sent — labels only, no UI meta. */
export function quoteOperatorFlowSteps(args: {
  status: string;
  depositPaidMinor: number;
  depositAmountMinor: number;
}): QuoteOperatorFlowStep[] {
  const depositDue = Math.max(0, args.depositAmountMinor - args.depositPaidMinor);
  const depositPaid = args.depositAmountMinor > 0 && depositDue <= 0;
  const accepted = args.status === "accepted" || depositPaid;
  const sent = args.status !== "draft";

  const steps: Array<Omit<QuoteOperatorFlowStep, "state">> = [
    { id: "sent", label: "Quote delivered" },
    { id: "accept", label: "Client accepts online" },
    { id: "deposit", label: "Deposit paid" },
    { id: "booked", label: "Date secured · prep begins" },
    { id: "balance", label: "Balance before event" },
  ];

  let currentIdx = 0;
  if (depositPaid) currentIdx = 3;
  else if (accepted) currentIdx = 2;
  else if (sent) currentIdx = 1;

  return steps.map((step, i) => ({
    ...step,
    state: i < currentIdx ? "done" : i === currentIdx ? "current" : "upcoming",
  }));
}

export function guestQuotePayFlowExplanation(): string {
  return "Open your quote, accept the terms, then pay the deposit by card on our secure checkout.";
}

/** Toggle panel beside sent quotes — outcome labels only. */
export function quoteOperatorFlowPanelLabel(): string {
  return "What happens next";
}

/** Short payment reference shown on PDF / invoice (first 8 of public token). */
export function quotePaymentReference(publicToken: string): string {
  const clean = publicToken.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
  return clean.slice(0, 8) || "QUOTE";
}
