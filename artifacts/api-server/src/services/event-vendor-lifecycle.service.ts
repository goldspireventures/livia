import {
  buildEventPrepPlan,
  depositDueReminderCopy,
  milestonePaymentReminderCopy,
  operatorPrepNudgeCopy,
  overduePrepTasks,
  resolveDueLifecycleActions,
  resolveQuoteMilestonePayment,
  upcomingPrepTasks,
  type EventPrepTask,
  type LivEventLifecycle,
} from "@workspace/policy";
import { db, businessesTable, quotesTable } from "@workspace/db";
import { and, eq } from "drizzle-orm";
import { resolveGuestQuoteUrl } from "../lib/guest-public-urls";
import { getQuoteWithLines, getEnquiry, updateEnquiry } from "./consult-first.service";
import {
  emailDepositDueReminder,
  sendPostEventReviewRequest,
} from "./quote-comms.service";
import { notifyBusinessMembersPush } from "./push.service";
import { resolveQuoteRecipient } from "./consult-first-lifecycle.helpers";

type QuoteEventDaySheet = {
  eventDate?: string | null;
  eventType?: string | null;
  venue?: string | null;
  setupChecklist?: string[];
  billToName?: string | null;
  billToEmail?: string | null;
  billToPhone?: string | null;
  livLifecycle?: LivEventLifecycle;
};

function sheetOf(raw: Record<string, unknown> | null | undefined): QuoteEventDaySheet {
  return (raw ?? {}) as QuoteEventDaySheet;
}

function lifecycleOf(sheet: QuoteEventDaySheet): LivEventLifecycle {
  return sheet.livLifecycle ?? { prepTasks: [] };
}

async function persistLifecycle(
  businessId: string,
  quoteId: string,
  sheet: QuoteEventDaySheet,
  lifecycle: LivEventLifecycle,
) {
  const nextSheet = { ...sheet, livLifecycle: lifecycle };
  await db
    .update(quotesTable)
    .set({ eventDaySheet: nextSheet, updatedAt: new Date() })
    .where(and(eq(quotesTable.id, quoteId), eq(quotesTable.businessId, businessId)));
}

export async function getEventPrepView(businessId: string, quoteId: string) {
  const quote = await getQuoteWithLines(businessId, quoteId);
  if (!quote) return null;

  const sheet = sheetOf(quote.eventDaySheet as Record<string, unknown> | null);
  const lifecycle = lifecycleOf(sheet);
  const today = new Date().toISOString().slice(0, 10);

  return {
    quoteId: quote.id,
    quoteStatus: quote.status,
    enquiryStatus: quote.enquiry?.status ?? null,
    eventDate: sheet.eventDate ?? quote.enquiry?.eventDate ?? null,
    lifecycle,
    upcoming: upcomingPrepTasks(lifecycle, 14, today),
    overdue: overduePrepTasks(lifecycle, today),
    depositReminderSentAt: lifecycle.depositReminderSentAt ?? null,
    prepInitializedAt: lifecycle.prepInitializedAt ?? null,
  };
}

/** Client accepted quote — send deposit reminder with pay link. */
export async function onQuoteAccepted(
  businessId: string,
  quoteId: string,
  opts?: { force?: boolean },
) {
  const quote = await getQuoteWithLines(businessId, quoteId);
  if (!quote || quote.status !== "accepted") return null;

  const sheet = sheetOf(quote.eventDaySheet as Record<string, unknown> | null);
  let lifecycle = lifecycleOf(sheet);

  const enquiry = quote.enquiryId ? await getEnquiry(businessId, quote.enquiryId) : null;
  const customer = quote.customer ?? null;
  const { contactName, contactEmail } = resolveQuoteRecipient(quote, enquiry, customer);

  const [biz] = await db
    .select({ name: businessesTable.name, slug: businessesTable.slug, currency: businessesTable.currency })
    .from(businessesTable)
    .where(eq(businessesTable.id, businessId))
    .limit(1);
  if (!biz?.slug) return null;

  const payUrl = resolveGuestQuoteUrl(biz.slug, quote.publicToken);
  const copy = depositDueReminderCopy({
    contactName,
    businessName: biz.name,
    payUrl,
    depositAmountMinor: quote.depositAmountMinor,
    currency: biz.currency,
  });

  if (lifecycle.depositReminderSentAt && !opts?.force) {
    return { skipped: true as const, reason: "already_sent", whatsappText: copy.whatsappText };
  }

  const firstSend = !lifecycle.depositReminderSentAt;

  let emailStatus: "sent" | "skipped" | "failed" = "skipped";
  if (contactEmail && (firstSend || opts?.force)) {
    emailStatus = await emailDepositDueReminder({
      businessId,
      to: contactEmail,
      subject: copy.subject,
      body: copy.body,
    });
  }

  if (firstSend || opts?.force) {
    lifecycle = {
      ...lifecycle,
      depositReminderSentAt: new Date().toISOString(),
    };
    await persistLifecycle(businessId, quoteId, sheet, lifecycle);
  }

  if (firstSend) {
    await notifyBusinessMembersPush({
      businessId,
      title: "Quote accepted — deposit due",
      body: `${contactName} accepted their quote. Liv sent the deposit link.`,
      data: { quoteId, type: "event_vendor_deposit_due" },
    });
  }

  return { emailStatus, whatsappText: copy.whatsappText, skipped: !firstSend && !opts?.force };
}

/** Deposit paid / enquiry booked — seed event prep timeline. */
export async function onBookingSecured(businessId: string, quoteId: string) {
  const quote = await getQuoteWithLines(businessId, quoteId);
  if (!quote) return null;

  const sheet = sheetOf(quote.eventDaySheet as Record<string, unknown> | null);
  let lifecycle = lifecycleOf(sheet);
  if (lifecycle.prepInitializedAt && lifecycle.prepTasks.length > 0) {
    return { skipped: true as const, reason: "already_initialized" };
  }

  const enquiry = quote.enquiryId ? await getEnquiry(businessId, quote.enquiryId) : null;
  const eventDate = sheet.eventDate ?? enquiry?.eventDate ?? null;
  const eventType = sheet.eventType ?? enquiry?.eventType ?? null;
  const venue = sheet.venue ?? enquiry?.venue ?? null;

  const prepTasks = buildEventPrepPlan({
    eventDate,
    eventType,
    venue,
    lineItems: quote.lines.map((l) => ({ name: l.name })),
  });

  lifecycle = {
    ...lifecycle,
    prepTasks,
    prepInitializedAt: new Date().toISOString(),
  };

  const setupChecklist = prepTasks.find((t) => t.phase === "day_of_setup")?.checklist;
  const nextSheet: QuoteEventDaySheet = {
    ...sheet,
    eventDate,
    eventType,
    venue,
    setupChecklist: setupChecklist ?? sheet.setupChecklist,
    livLifecycle: lifecycle,
  };

  await db
    .update(quotesTable)
    .set({ eventDaySheet: nextSheet, updatedAt: new Date() })
    .where(and(eq(quotesTable.id, quoteId), eq(quotesTable.businessId, businessId)));

  if (quote.enquiryId) {
    await updateEnquiry(businessId, quote.enquiryId, {
      status: "booked",
      eventDateHoldStatus: "confirmed",
    });
  }

  const contactName =
    enquiry?.contactName ?? sheet.billToName ?? quote.customer?.displayName ?? "Client";

  await notifyBusinessMembersPush({
    businessId,
    title: "Booking secured",
    body: eventDate
      ? `${contactName} · ${eventDate}. Liv scheduled event prep reminders.`
      : `${contactName} booked. Add event date in inbox for prep timing.`,
    data: {
      quoteId,
      ...(quote.enquiryId ? { enquiryId: quote.enquiryId } : {}),
      type: "event_vendor_booked",
    },
  });

  return { prepTasks: prepTasks.length, eventDate };
}

export async function completePrepTask(businessId: string, quoteId: string, taskId: string) {
  const quote = await getQuoteWithLines(businessId, quoteId);
  if (!quote) return null;

  const sheet = sheetOf(quote.eventDaySheet as Record<string, unknown> | null);
  const lifecycle = lifecycleOf(sheet);
  const idx = lifecycle.prepTasks.findIndex((t) => t.id === taskId);
  if (idx < 0) return null;

  const tasks = [...lifecycle.prepTasks];
  tasks[idx] = { ...tasks[idx]!, completedAt: new Date().toISOString() };
  await persistLifecycle(businessId, quoteId, sheet, { ...lifecycle, prepTasks: tasks });
  return getEventPrepView(businessId, quoteId);
}

export async function getOperatorPrepNudgeDraft(businessId: string, quoteId: string, taskId: string) {
  const quote = await getQuoteWithLines(businessId, quoteId);
  if (!quote) return null;

  const sheet = sheetOf(quote.eventDaySheet as Record<string, unknown> | null);
  const task = lifecycleOf(sheet).prepTasks.find((t) => t.id === taskId);
  if (!task) return null;

  const enquiry = quote.enquiryId ? await getEnquiry(businessId, quote.enquiryId) : null;
  const [biz] = await db
    .select({ name: businessesTable.name })
    .from(businessesTable)
    .where(eq(businessesTable.id, businessId))
    .limit(1);

  const contactName =
    enquiry?.contactName ?? sheet.billToName ?? quote.customer?.displayName ?? "Client";

  return {
    whatsappText: operatorPrepNudgeCopy({
      contactName,
      eventDate: sheet.eventDate ?? enquiry?.eventDate,
      task,
      businessName: biz?.name ?? "Your studio",
    }),
  };
}

async function markTaskNotified(
  businessId: string,
  quoteId: string,
  sheet: QuoteEventDaySheet,
  lifecycle: LivEventLifecycle,
  taskId: string,
  field: "operatorNotifiedAt" | "clientNotifiedAt",
) {
  const tasks = lifecycle.prepTasks.map((t) =>
    t.id === taskId ? { ...t, [field]: new Date().toISOString() } : t,
  );
  await persistLifecycle(businessId, quoteId, sheet, { ...lifecycle, prepTasks: tasks });
}

async function processQuoteLifecycle(businessId: string, quoteId: string, today: string) {
  const quote = await getQuoteWithLines(businessId, quoteId);
  if (!quote) return { actions: 0 };

  const sheet = sheetOf(quote.eventDaySheet as Record<string, unknown> | null);
  const lifecycle = lifecycleOf(sheet);
  if (!lifecycle.prepTasks.length) return { actions: 0 };

  const due = resolveDueLifecycleActions(lifecycle, today);
  if (!due.length) return { actions: 0 };

  const enquiry = quote.enquiryId ? await getEnquiry(businessId, quote.enquiryId) : null;
  const [biz] = await db
    .select({ name: businessesTable.name })
    .from(businessesTable)
    .where(eq(businessesTable.id, businessId))
    .limit(1);

  const contactName =
    enquiry?.contactName ?? sheet.billToName ?? quote.customer?.displayName ?? "Client";
  let actions = 0;

  for (const action of due) {
    const fresh = await getQuoteWithLines(businessId, quoteId);
    if (!fresh) break;
    const freshSheet = sheetOf(fresh.eventDaySheet as Record<string, unknown> | null);
    const freshLifecycle = lifecycleOf(freshSheet);
    const task = freshLifecycle.prepTasks.find((t) => t.id === action.taskId);
    if (!task) continue;

    if (action.kind === "operator_prep_nudge") {
      await notifyBusinessMembersPush({
        businessId,
        title: "Liv event prep",
        body: task.label,
        data: { quoteId, taskId: task.id, type: "event_vendor_prep" },
      });
      await markTaskNotified(businessId, quoteId, freshSheet, freshLifecycle, task.id, "operatorNotifiedAt");
      actions++;
      continue;
    }

    if (action.kind === "client_review_request" && enquiry?.contactEmail) {
      await sendPostEventReviewRequest({
        businessId,
        businessName: biz?.name ?? "Your vendor",
        to: enquiry.contactEmail,
        contactName,
      });
      await markTaskNotified(businessId, quoteId, freshSheet, freshLifecycle, task.id, "clientNotifiedAt");
      actions++;
    }
  }

  return { actions };
}

/** Daily cron — prep nudges + post-event review emails. */
export async function runEventVendorLifecycleSweep(opts?: { businessId?: string }) {
  const today = new Date().toISOString().slice(0, 10);
  const conditions = [eq(businessesTable.vertical, "event-vendors" as const)];
  if (opts?.businessId) conditions.push(eq(businessesTable.id, opts.businessId));

  const businesses = await db
    .select({ id: businessesTable.id })
    .from(businessesTable)
    .where(and(...conditions));

  let quotesChecked = 0;
  let actionsTaken = 0;

  for (const biz of businesses) {
    const allQuotes = await db
      .select()
      .from(quotesTable)
      .where(eq(quotesTable.businessId, biz.id));

    for (const q of allQuotes) {
      const sheet = sheetOf(q.eventDaySheet as Record<string, unknown> | null);
      if (!sheet.livLifecycle?.prepInitializedAt) continue;
      quotesChecked++;
      const result = await processQuoteLifecycle(biz.id, q.id, today);
      actionsTaken += result.actions;
    }
  }

  return { businesses: businesses.length, quotesChecked, actionsTaken, today };
}

/** Cron — email guests when a milestone payment becomes due. */
export async function runMilestoneDueReminders(opts?: { businessId?: string }) {
  const today = new Date().toISOString().slice(0, 10);
  const conditions = [eq(businessesTable.vertical, "event-vendors" as const)];
  if (opts?.businessId) conditions.push(eq(businessesTable.id, opts.businessId));

  const businesses = await db
    .select({ id: businessesTable.id, name: businessesTable.name, slug: businessesTable.slug, currency: businessesTable.currency })
    .from(businessesTable)
    .where(and(...conditions));

  let reminders = 0;

  for (const biz of businesses) {
    const quotes = await db
      .select()
      .from(quotesTable)
      .where(and(eq(quotesTable.businessId, biz.id), eq(quotesTable.status, "accepted")));

    for (const q of quotes) {
      const payment = resolveQuoteMilestonePayment(q);
      const dueMilestone = payment.milestones.find((m) => m.status === "due");
      if (!dueMilestone || payment.nextDueMinor <= 0) continue;

      const sheet = sheetOf(q.eventDaySheet as Record<string, unknown> | null);
      const lifecycle = lifecycleOf(sheet);
      const sentKey = dueMilestone.label;
      if (lifecycle.milestoneRemindersSent?.[sentKey]) continue;

      const enquiry = q.enquiryId ? await getEnquiry(biz.id, q.enquiryId) : null;
      const quoteFull = await getQuoteWithLines(biz.id, q.id);
      if (!quoteFull) continue;
      const { contactName, contactEmail } = resolveQuoteRecipient(
        quoteFull,
        enquiry,
        quoteFull.customer ?? null,
      );
      if (!contactEmail) continue;

      const payUrl = resolveGuestQuoteUrl(biz.slug, q.publicToken);
      const copy = milestonePaymentReminderCopy({
        contactName,
        businessName: biz.name,
        payUrl,
        milestoneLabel: dueMilestone.label,
        amountMinor: payment.nextDueMinor,
        currency: biz.currency,
      });

      await emailDepositDueReminder({
        businessId: biz.id,
        to: contactEmail,
        subject: copy.subject,
        body: copy.body,
      });

      const nextLifecycle: LivEventLifecycle = {
        ...lifecycle,
        milestoneRemindersSent: {
          ...(lifecycle.milestoneRemindersSent ?? {}),
          [sentKey]: new Date().toISOString(),
        },
      };
      await persistLifecycle(biz.id, q.id, sheet, nextLifecycle);
      reminders++;
    }
  }

  return { reminders, today };
}

export type { EventPrepTask, LivEventLifecycle };
