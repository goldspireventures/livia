import { randomBytes } from "node:crypto";
import {
  db,
  enquiriesTable,
  quotesTable,
  quoteLineItemsTable,
  quoteTemplatesTable,
  eventVendorSiteTable,
  eventMoodBoardItemsTable,
  servicesTable,
  businessesTable,
  conversationsTable,
} from "@workspace/db";
import { and, desc, eq, inArray, isNull, lt, or } from "drizzle-orm";
import { getPublicAppOrigin } from "../lib/public-app-origin";
import { generateId } from "../lib/id";
import { findOrCreateCustomer, getCustomerById } from "./customers.service";
import { resolveQuoteRecipient } from "./consult-first-lifecycle.helpers";
import {
  emailEnquiryDecline,
  emailQuoteToClient,
  notifyOperatorNewEnquiry,
  renderQuoteHtml,
  sendPostEventReviewRequest,
  type QuoteHtmlEventBrief,
} from "./quote-comms.service";
import { appendMessage } from "./conversations.service";
import {
  maybeSignalLowFitEnquiry,
  prescreenEnquiry,
  recordOperatorDecision,
} from "./liv-operator-learning.service";
import {
  extractLegacyOutboundPatch,
  getLivOutboundOverride,
  patchLivOutboundOverrides,
  resolveLivOutboundForBusiness,
} from "./liv-outbound.service";
import {
  STALE_QUOTE_DAYS,
  buildQuoteBriefIntelligence,
  diffQuoteLineItems,
  matchTemplateByEventType,
  matchGallerySimilarWork,
  outdoorContingencyClause,
  personalMessageFromBrief,
  resolveSetupFeeMinor,
  scalePresetQuantity,
  setupChecklistForEventType,
  staleQuoteNudgeCopy,
  upcomingPrepTasks,
  overduePrepTasks,
  resolveEnquiryDeclineCopy,
  weightedPipelineForecast,
  replyTimeBenchmark,
  type EnquiryDeclineReasonId,
  type ClientWithdrawReasonId,
  type LivEventLifecycle,
  resolvePublicServiceImageUrl,
} from "@workspace/policy";
import { inferDemoServiceImageUrl } from "../lib/experience-skin";

function quoteToken(): string {
  return randomBytes(24).toString("base64url");
}

function lineTotal(qty: number, unitMinor: number): number {
  return Math.round(qty * unitMinor);
}

function computeQuoteTotals(
  lines: Array<{ quantity: number; unitPriceMinor: number }>,
  depositPercent: number,
) {
  const subtotalMinor = lines.reduce((s, l) => s + lineTotal(l.quantity, l.unitPriceMinor), 0);
  const depositAmountMinor = Math.round((subtotalMinor * depositPercent) / 100);
  const balanceDueMinor = subtotalMinor - depositAmountMinor;
  return { subtotalMinor, depositAmountMinor, balanceDueMinor };
}

type MilestoneDeposit = {
  label: string;
  percent: number;
  amountMinor: number;
  dueDate?: string;
};

function computeMilestoneDeposits(
  subtotalMinor: number,
  template: Array<{ label: string; percent: number; dueDaysBeforeEvent?: number }>,
  eventDate?: string | null,
): MilestoneDeposit[] {
  if (!template.length) return [];
  return template.map((m) => {
    let dueDate: string | undefined;
    if (eventDate && m.dueDaysBeforeEvent != null) {
      const d = new Date(eventDate);
      d.setDate(d.getDate() - m.dueDaysBeforeEvent);
      dueDate = d.toISOString().slice(0, 10);
    }
    return {
      label: m.label,
      percent: m.percent,
      amountMinor: Math.round((subtotalMinor * m.percent) / 100),
      dueDate,
    };
  });
}

export async function ensureEventVendorSite(businessId: string) {
  const [row] = await db
    .select()
    .from(eventVendorSiteTable)
    .where(eq(eventVendorSiteTable.businessId, businessId))
    .limit(1);
  if (row) return row;
  const [created] = await db
    .insert(eventVendorSiteTable)
    .values({ businessId })
    .returning();
  return created!;
}

export async function getEventVendorSite(businessId: string) {
  return ensureEventVendorSite(businessId);
}

export async function updateEventVendorSite(
  businessId: string,
  patch: Partial<{
    heroTitle: string;
    heroSubtitle: string;
    aboutText: string;
    gallery: Array<{ url: string; caption?: string; eventType?: string }>;
    blockedDates: string[];
    quoteValidityDays: number;
    defaultDepositPercent: number;
    termsText: string;
    /** @deprecated — use PATCH /liv-outbound (`decline_reply`, etc.) */
    declineReplyTemplate: string;
    /** @deprecated — use PATCH /liv-outbound */
    enquiryThanksTemplate: string;
    /** @deprecated — use PATCH /liv-outbound */
    quoteWhatsappTemplate: string;
    milestoneDepositTemplate: Array<{ label: string; percent: number; dueDaysBeforeEvent?: number }>;
    setupFeeMinor: number;
    outdoorTermsExtra: string;
  }>,
) {
  const { sitePatch, outboundPatch } = extractLegacyOutboundPatch(
    patch as Record<string, unknown>,
  );
  if (Object.keys(outboundPatch).length > 0) {
    await patchLivOutboundOverrides(businessId, outboundPatch);
  }
  await ensureEventVendorSite(businessId);
  const [row] = await db
    .update(eventVendorSiteTable)
    .set({ ...sitePatch, updatedAt: new Date() })
    .where(eq(eventVendorSiteTable.businessId, businessId))
    .returning();
  return row!;
}

export async function listEnquiries(
  businessId: string,
  status?: string,
  customerId?: string,
) {
  const conditions = [eq(enquiriesTable.businessId, businessId)];
  if (status) conditions.push(eq(enquiriesTable.status, status));
  if (customerId) conditions.push(eq(enquiriesTable.customerId, customerId));
  return db
    .select()
    .from(enquiriesTable)
    .where(and(...conditions))
    .orderBy(desc(enquiriesTable.updatedAt));
}

export async function getEnquiry(businessId: string, enquiryId: string) {
  const [row] = await db
    .select()
    .from(enquiriesTable)
    .where(and(eq(enquiriesTable.id, enquiryId), eq(enquiriesTable.businessId, businessId)))
    .limit(1);
  return row ?? null;
}

export async function getLivDeclineDraft(
  businessId: string,
  enquiryId: string,
  reasonId?: EnquiryDeclineReasonId | null,
) {
  const enquiry = await getEnquiry(businessId, enquiryId);
  if (!enquiry) return null;

  const [biz] = await db
    .select({ name: businessesTable.name })
    .from(businessesTable)
    .where(eq(businessesTable.id, businessId))
    .limit(1);
  const operatorTemplate = await getLivOutboundOverride(businessId, "decline_reply");
  const copy = resolveEnquiryDeclineCopy({
    contactName: enquiry.contactName,
    businessName: biz?.name ?? "Your team",
    operatorTemplate,
    reasonId: reasonId ?? "other",
  });
  return {
    ...copy,
    contactEmail: enquiry.contactEmail,
    preferredQuoteChannel: enquiry.preferredQuoteChannel,
  };
}

async function appendDeclineToConversation(
  businessId: string,
  enquiry: { customerId: string | null; contactEmail: string; contactPhone: string | null },
  body: string,
) {
  const identity = [
    enquiry.customerId ? eq(conversationsTable.customerId, enquiry.customerId) : null,
    enquiry.contactEmail ? eq(conversationsTable.customerEmail, enquiry.contactEmail) : null,
    enquiry.contactPhone ? eq(conversationsTable.customerPhone, enquiry.contactPhone) : null,
  ].filter((c): c is NonNullable<typeof c> => c != null);
  if (!identity.length) return;
  const [convo] = await db
    .select({ id: conversationsTable.id })
    .from(conversationsTable)
    .where(and(eq(conversationsTable.businessId, businessId), or(...identity)))
    .orderBy(desc(conversationsTable.lastMessageAt))
    .limit(1);
  if (!convo) return;
  await appendMessage({
    conversationId: convo.id,
    role: "ASSISTANT",
    content: body,
    toolName: "liv.enquiry.decline",
  });
}

export type DeclineEnquiryResult =
  | { ok: true; enquiry: NonNullable<Awaited<ReturnType<typeof updateEnquiry>>>; emailStatus: "sent" | "skipped" | "failed"; whatsappText: string }
  | { ok: false; reason: "not_found" | "already_closed" | "send_failed" };

/** Liv sends the operator decline template, then closes the enquiry — client always hears back when email is on file. */
export async function declineEnquiryWithLivReply(
  businessId: string,
  enquiryId: string,
  opts?: { reasonId?: EnquiryDeclineReasonId },
): Promise<DeclineEnquiryResult> {
  const enquiry = await getEnquiry(businessId, enquiryId);
  if (!enquiry) return { ok: false, reason: "not_found" };
  if (enquiry.status === "lost") return { ok: false, reason: "already_closed" };

  const draft = await getLivDeclineDraft(businessId, enquiryId, opts?.reasonId);
  if (!draft) return { ok: false, reason: "not_found" };

  let emailStatus: "sent" | "skipped" | "failed" = "skipped";
  if (enquiry.contactEmail?.trim()) {
    emailStatus = await emailEnquiryDecline({
      businessId,
      to: enquiry.contactEmail.trim(),
      subject: draft.subject,
      body: draft.body,
    });
    if (emailStatus === "failed") {
      return { ok: false, reason: "send_failed" };
    }
  }

  await appendDeclineToConversation(businessId, enquiry, draft.body);
  const row = await updateEnquiry(businessId, enquiryId, { status: "lost" });
  if (!row) return { ok: false, reason: "not_found" };
  void recordOperatorDecision(businessId, "decline", {
    eventType: enquiry.eventType,
    guestCount: enquiry.guestCount,
    budgetRange: enquiry.budgetRange,
  }).catch(() => undefined);
  return { ok: true, enquiry: row, emailStatus, whatsappText: draft.whatsappText };
}

export type RecordClientWithdrewResult =
  | { ok: true }
  | { ok: false; reason: "not_found" | "already_closed" };

/** Operator records client withdrew — any stage after quote sent. */
export async function recordOperatorClientWithdrew(
  businessId: string,
  quoteId: string,
  opts?: { reasonId?: ClientWithdrawReasonId },
): Promise<RecordClientWithdrewResult> {
  const quote = await getQuoteWithLines(businessId, quoteId);
  if (!quote) return { ok: false, reason: "not_found" };
  if (quote.status === "declined" || quote.enquiry?.status === "lost") {
    return { ok: false, reason: "already_closed" };
  }

  await db
    .update(quotesTable)
    .set({ status: "declined", updatedAt: new Date() })
    .where(and(eq(quotesTable.id, quoteId), eq(quotesTable.businessId, businessId)));

  if (quote.enquiryId) {
    await updateEnquiry(businessId, quote.enquiryId, {
      status: "lost",
      eventDateHoldStatus: "released",
    });
  }

  const { notifyClientWithdrew } = await import("./engagement-exit.service");
  notifyClientWithdrew({
    businessId,
    quoteId,
    publicToken: quote.publicToken,
    depositPaidMinor: quote.depositPaidMinor,
    depositAmountMinor: quote.depositAmountMinor,
    initiatedBy: "operator",
  });

  void opts;
  return { ok: true };
}

export async function updateEnquiry(
  businessId: string,
  enquiryId: string,
  patch: Partial<{
    status: string;
    internalNotes: string;
    partnerName: string;
    partnerPhone: string;
    plannerName: string;
    plannerEmail: string;
    plannerPhone: string;
    eventDateHoldStatus: string;
    holdExpiresAt: Date;
    firstOperatorReplyAt: Date;
    plannerAccessToken: string;
    moodBoardApprovalToken: string;
    moodBoardStatus: string;
  }>,
) {
  const [row] = await db
    .update(enquiriesTable)
    .set({ ...patch, updatedAt: new Date() })
    .where(and(eq(enquiriesTable.id, enquiryId), eq(enquiriesTable.businessId, businessId)))
    .returning();
  if (!row) return null;

  if (patch.status === "booked" || patch.status === "lost") {
    await syncQuotesForEnquiryStatus(businessId, enquiryId, patch.status);
  }
  if (patch.status === "booked") {
    void recordOperatorDecision(businessId, "booked", {
      eventType: row.eventType,
      guestCount: row.guestCount,
      budgetRange: row.budgetRange,
    }).catch(() => undefined);
  }
  return row;
}

async function syncQuotesForEnquiryStatus(
  businessId: string,
  enquiryId: string,
  enquiryStatus: string,
) {
  if (enquiryStatus === "booked") {
    await db
      .update(quotesTable)
      .set({ status: "accepted", acceptedAt: new Date(), updatedAt: new Date() })
      .where(
        and(
          eq(quotesTable.businessId, businessId),
          eq(quotesTable.enquiryId, enquiryId),
          eq(quotesTable.status, "sent"),
        ),
      );
    return;
  }
  if (enquiryStatus === "lost") {
    await db
      .update(quotesTable)
      .set({ status: "declined", updatedAt: new Date() })
      .where(
        and(
          eq(quotesTable.businessId, businessId),
          eq(quotesTable.enquiryId, enquiryId),
          eq(quotesTable.status, "sent"),
        ),
      );
  }
}

export type PublicEnquiryInput = {
  contactName: string;
  contactEmail: string;
  contactPhone?: string;
  eventType?: string;
  eventDate?: string;
  eventDateFlexible?: boolean;
  guestCount?: number;
  budgetRange?: string;
  theme?: string;
  notes?: string;
  servicesRequested?: string[];
  inspirationUrls?: string[];
  preferredQuoteChannel?: string;
  venue?: string;
  partnerName?: string;
  partnerPhone?: string;
  plannerName?: string;
  plannerEmail?: string;
  plannerPhone?: string;
  source?: string;
};

export async function submitPublicEnquiry(slug: string, input: PublicEnquiryInput) {
  const [biz] = await db
    .select({ id: businessesTable.id, vertical: businessesTable.vertical })
    .from(businessesTable)
    .where(eq(businessesTable.slug, slug))
    .limit(1);
  if (!biz || biz.vertical !== "event-vendors") return null;

  if (input.eventDate) {
    const site = await ensureEventVendorSite(biz.id);
    const blocked = (site.blockedDates as string[]) ?? [];
    if (blocked.includes(input.eventDate)) return null;
  }

  const customer = await findOrCreateCustomer(biz.id, {
    firstName: input.contactName.split(" ")[0] ?? input.contactName,
    lastName: input.contactName.split(" ").slice(1).join(" ") || undefined,
    email: input.contactEmail,
    phone: input.contactPhone,
  });

  const id = generateId();
  const [row] = await db
    .insert(enquiriesTable)
    .values({
      id,
      businessId: biz.id,
      customerId: customer.id,
      status: "new",
      source: input.source ?? "web",
      eventType: input.eventType,
      eventDate: input.eventDate ?? null,
      eventDateFlexible: input.eventDateFlexible ?? false,
      guestCount: input.guestCount,
      budgetRange: input.budgetRange,
      theme: input.theme,
      notes: input.notes,
      servicesRequested: input.servicesRequested ?? [],
      inspirationUrls: input.inspirationUrls ?? [],
      preferredQuoteChannel: input.preferredQuoteChannel ?? "email",
      venue: input.venue,
      contactName: input.contactName,
      contactEmail: input.contactEmail,
      contactPhone: input.contactPhone,
      partnerName: input.partnerName,
      partnerPhone: input.partnerPhone,
      plannerName: input.plannerName,
      plannerEmail: input.plannerEmail,
      plannerPhone: input.plannerPhone,
      plannerAccessToken: input.plannerEmail ? quoteToken() : null,
    })
    .returning();

  void notifyOperatorNewEnquiry(biz.id, row!.id).catch(() => undefined);
  void maybeSignalLowFitEnquiry(biz.id, row!.id, {
    contactName: row!.contactName,
    eventType: row!.eventType,
    guestCount: row!.guestCount,
    budgetRange: row!.budgetRange,
  }).catch(() => undefined);
  return row!;
}

/** Keep one draft per enquiry (and one blank draft) — delete older duplicates. */
async function purgeDuplicateDraftQuotes(businessId: string) {
  const drafts = await db
    .select()
    .from(quotesTable)
    .where(and(eq(quotesTable.businessId, businessId), eq(quotesTable.status, "draft")))
    .orderBy(desc(quotesTable.createdAt));

  const byKey = new Map<string, typeof drafts>();
  for (const q of drafts) {
    const key = q.enquiryId ?? "__blank__";
    const list = byKey.get(key) ?? [];
    list.push(q);
    byKey.set(key, list);
  }

  for (const list of byKey.values()) {
    if (list.length <= 1) continue;
    const sorted = [...list].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    for (const dup of sorted.slice(1)) {
      await deleteDraftQuote(businessId, dup.id);
    }
  }
}

export async function listQuotes(businessId: string, status?: string) {
  await purgeDuplicateDraftQuotes(businessId);
  await expireOverdueQuotes(businessId);
  if (status === "stale") {
    return listStaleQuotes(businessId);
  }
  const conditions = [eq(quotesTable.businessId, businessId)];
  if (status) conditions.push(eq(quotesTable.status, status));
  return db
    .select()
    .from(quotesTable)
    .where(and(...conditions))
    .orderBy(desc(quotesTable.createdAt));
}

async function expireOverdueQuotes(businessId: string) {
  const today = new Date().toISOString().slice(0, 10);
  await db
    .update(quotesTable)
    .set({ status: "expired", updatedAt: new Date() })
    .where(
      and(
        eq(quotesTable.businessId, businessId),
        eq(quotesTable.status, "sent"),
        lt(quotesTable.validUntil, today),
      ),
    );
}

async function listStaleQuotes(businessId: string) {
  const cutoff = Date.now() - STALE_QUOTE_DAYS * 24 * 60 * 60 * 1000;
  const rows = await db
    .select()
    .from(quotesTable)
    .where(and(eq(quotesTable.businessId, businessId), eq(quotesTable.status, "sent")))
    .orderBy(desc(quotesTable.sentAt));
  return rows.filter((q) => q.sentAt && !q.acceptedAt && q.sentAt.getTime() < cutoff);
}

export async function listQuotesWithEnquiry(businessId: string, status?: string) {
  const quotes = await listQuotes(businessId, status);
  if (!quotes.length) return [];

  const enquiryIds = [...new Set(quotes.map((q) => q.enquiryId).filter(Boolean))] as string[];
  const enquiries =
    enquiryIds.length > 0
      ? await db
          .select({
            id: enquiriesTable.id,
            contactName: enquiriesTable.contactName,
            eventType: enquiriesTable.eventType,
            eventDate: enquiriesTable.eventDate,
            status: enquiriesTable.status,
          })
          .from(enquiriesTable)
          .where(eq(enquiriesTable.businessId, businessId))
      : [];

  const byId = new Map(enquiries.map((e) => [e.id, e]));
  return quotes.map((q) => ({
    ...q,
    enquiry: q.enquiryId ? (byId.get(q.enquiryId) ?? null) : null,
  }));
}

export async function findDraftQuoteForEnquiry(businessId: string, enquiryId: string) {
  const [row] = await db
    .select()
    .from(quotesTable)
    .where(
      and(
        eq(quotesTable.businessId, businessId),
        eq(quotesTable.enquiryId, enquiryId),
        eq(quotesTable.status, "draft"),
      ),
    )
    .orderBy(desc(quotesTable.createdAt))
    .limit(1);
  if (!row) return null;
  return getQuoteWithLines(businessId, row.id);
}

type QuoteEventDaySheet = {
  eventDate?: string | null;
  eventType?: string | null;
  theme?: string | null;
  guestCount?: number | null;
  venue?: string | null;
  setupChecklist?: string[];
  billToName?: string | null;
  billToEmail?: string | null;
  billToPhone?: string | null;
  livLifecycle?: LivEventLifecycle;
};

export async function getQuoteWithLines(businessId: string, quoteId: string) {
  const [quote] = await db
    .select()
    .from(quotesTable)
    .where(and(eq(quotesTable.id, quoteId), eq(quotesTable.businessId, businessId)))
    .limit(1);
  if (!quote) return null;
  const lines = await db
    .select()
    .from(quoteLineItemsTable)
    .where(eq(quoteLineItemsTable.quoteId, quoteId))
    .orderBy(quoteLineItemsTable.sortOrder);
  const enquiry = quote.enquiryId ? await getEnquiry(businessId, quote.enquiryId) : null;
  const customer =
    quote.customerId && !enquiry ? await getCustomerById(businessId, quote.customerId) : null;
  return {
    ...quote,
    lines,
    milestoneDeposits: quote.milestoneDeposits ?? [],
    eventDaySheet: quote.eventDaySheet ?? null,
    enquiry,
    customer,
  };
}

async function matchServicesForEnquiry(businessId: string, enquiry: typeof enquiriesTable.$inferSelect) {
  const services = await db
    .select()
    .from(servicesTable)
    .where(and(eq(servicesTable.businessId, businessId), eq(servicesTable.isActive, true)));
  const requested = new Set((enquiry.servicesRequested as string[]).map((s) => s.toLowerCase()));
  if (requested.size === 0) return services.slice(0, 4);
  return services.filter(
    (s) =>
      requested.has(s.name.toLowerCase()) ||
      requested.has((s.category ?? "").toLowerCase()) ||
      [...requested].some((r) => s.name.toLowerCase().includes(r)),
  );
}

export async function generateQuoteFromEnquiry(
  businessId: string,
  enquiryId: string,
  templateId?: string,
  opts?: { allowDuplicateDraft?: boolean },
) {
  const enquiry = await getEnquiry(businessId, enquiryId);
  if (!enquiry) return null;

  if (!opts?.allowDuplicateDraft) {
    const existingDraft = await findDraftQuoteForEnquiry(businessId, enquiryId);
    if (existingDraft) {
      return { ...existingDraft, reusedExisting: true as const };
    }
  }

  const site = await ensureEventVendorSite(businessId);
  const depositPercent = site.defaultDepositPercent ?? 30;
  const validUntil = new Date();
  validUntil.setDate(validUntil.getDate() + (site.quoteValidityDays ?? 14));

  let presetLines: Array<{ serviceName: string; quantity?: number; unit?: string }> = [];
  let appliedTemplateId: string | undefined = templateId;
  if (!appliedTemplateId) {
    const templates = await listQuoteTemplates(businessId);
    const auto = matchTemplateByEventType(templates, enquiry.eventType);
    appliedTemplateId = auto?.id;
  }
  if (appliedTemplateId) {
    const [tpl] = await db
      .select()
      .from(quoteTemplatesTable)
      .where(and(eq(quoteTemplatesTable.id, appliedTemplateId), eq(quoteTemplatesTable.businessId, businessId)))
      .limit(1);
    if (tpl) presetLines = tpl.presetLines as typeof presetLines;
  }

  const services = await db
    .select()
    .from(servicesTable)
    .where(and(eq(servicesTable.businessId, businessId), eq(servicesTable.isActive, true)));

  const matched =
    presetLines.length > 0
      ? presetLines
          .map((p) => {
            const svc = services.find((s) => s.name.toLowerCase() === p.serviceName.toLowerCase());
            if (!svc) return null;
            const scaled = scalePresetQuantity({
              presetQty: p.quantity ?? 1,
              quoteUnit: p.unit ?? svc.quoteUnit,
              guestCount: enquiry.guestCount,
              serviceName: p.serviceName,
            });
            return { svc, qty: scaled.quantity };
          })
          .filter(Boolean) as Array<{ svc: (typeof services)[0]; qty: number }>
      : (await matchServicesForEnquiry(businessId, enquiry)).map((svc) => {
          const scaled = scalePresetQuantity({
            presetQty: 1,
            quoteUnit: svc.quoteUnit,
            guestCount: enquiry.guestCount,
            serviceName: svc.name,
          });
          return { svc, qty: scaled.quantity };
        });

  const quoteId = generateId();
  const token = quoteToken();
  let lineRows: Array<{
    id: string;
    quoteId: string;
    serviceId: string | null;
    name: string;
    description: string | null;
    quantity: string;
    unit: string;
    unitPriceMinor: number;
    lineTotalMinor: number;
    sortOrder: number;
  }> = matched.map((m, i) => {
    const qty = m.qty;
    const unitMinor = m.svc.priceMinor;
    return {
      id: generateId(),
      quoteId,
      serviceId: m.svc.id,
      name: m.svc.name,
      description: m.svc.description,
      quantity: String(qty),
      unit: m.svc.quoteUnit ?? "flat",
      unitPriceMinor: unitMinor,
      lineTotalMinor: lineTotal(qty, unitMinor),
      sortOrder: i,
    };
  });

  const setupMinor = resolveSetupFeeMinor({
    venue: enquiry.venue,
    setupFeeMinor: site.setupFeeMinor,
  });
  if (setupMinor > 0) {
    lineRows.push({
      id: generateId(),
      quoteId,
      serviceId: null,
      name: "Travel & setup",
      description: enquiry.venue ?? null,
      quantity: "1",
      unit: "flat",
      unitPriceMinor: setupMinor,
      lineTotalMinor: setupMinor,
      sortOrder: lineRows.length,
    });
  }

  const totals = computeQuoteTotals(
    lineRows.map((l) => ({ quantity: Number(l.quantity), unitPriceMinor: l.unitPriceMinor })),
    depositPercent,
  );

  const milestoneTemplate = (site.milestoneDepositTemplate as Array<{
    label: string;
    percent: number;
    dueDaysBeforeEvent?: number;
  }>) ?? [];
  const milestoneDeposits = computeMilestoneDeposits(
    totals.subtotalMinor,
    milestoneTemplate.length ? milestoneTemplate : [{ label: "Deposit", percent: depositPercent }],
    enquiry.eventDate,
  );
  const depositAmountMinor = milestoneDeposits[0]?.amountMinor ?? totals.depositAmountMinor;
  const balanceDueMinor = totals.subtotalMinor - depositAmountMinor;

  const eventDaySheet = {
    eventDate: enquiry.eventDate,
    eventType: enquiry.eventType,
    theme: enquiry.theme,
    guestCount: enquiry.guestCount,
    venue: enquiry.venue,
    setupChecklist: setupChecklistForEventType(enquiry.eventType),
  };

  const personalMessage = personalMessageFromBrief({
    eventType: enquiry.eventType,
    theme: enquiry.theme,
    contactName: enquiry.contactName,
  });

  const [quote] = await db
    .insert(quotesTable)
    .values({
      id: quoteId,
      businessId,
      enquiryId,
      customerId: enquiry.customerId,
      status: "draft",
      depositPercent,
      subtotalMinor: totals.subtotalMinor,
      depositAmountMinor,
      balanceDueMinor,
      validUntil: validUntil.toISOString().slice(0, 10),
      termsSnapshot: site.termsText,
      publicToken: token,
      personalMessage,
      eventDaySheet,
      milestoneDeposits,
    })
    .returning();

  if (lineRows.length) {
    await db.insert(quoteLineItemsTable).values(lineRows);
  }

  const full = await getQuoteWithLines(businessId, quote!.id);
  const briefIntelligence = buildQuoteBriefIntelligence({
    contactName: enquiry.contactName,
    eventType: enquiry.eventType,
    eventDate: enquiry.eventDate,
    guestCount: enquiry.guestCount,
    theme: enquiry.theme,
    venue: enquiry.venue,
    budgetRange: enquiry.budgetRange,
    servicesRequested: enquiry.servicesRequested as string[],
    presetLines,
    catalogueNames: services.map((s) => s.name),
    subtotalMinor: totals.subtotalMinor,
    setupFeeMinor: site.setupFeeMinor,
    stockCatalogue: services.map((s) => ({
      id: s.id,
      name: s.name,
      stockCount: s.stockCount,
    })),
    draftLines: lineRows.map((l) => ({
      name: l.name,
      quantity: l.quantity,
      serviceId: l.serviceId,
    })),
  });

  return { ...full, appliedTemplateId, briefIntelligence };
}

export async function updateQuote(
  businessId: string,
  quoteId: string,
  patch: {
    personalMessage?: string;
    depositPercent?: number;
    status?: string;
    customerId?: string | null;
    enquiryId?: string | null;
    lines?: Array<{
      id?: string;
      name: string;
      description?: string;
      quantity: number;
      unit: string;
      unitPriceMinor: number;
    }>;
    eventDaySheet?: Record<string, unknown>;
    milestoneDeposits?: MilestoneDeposit[];
  },
) {
  const existing = await getQuoteWithLines(businessId, quoteId);
  if (!existing) return null;
  if (existing.status !== "draft" && patch.lines) return null;
  if (
    existing.status === "sent" &&
    (patch.personalMessage != null ||
      patch.depositPercent != null ||
      patch.eventDaySheet != null ||
      patch.milestoneDeposits != null ||
      patch.customerId != null ||
      patch.enquiryId != null)
  ) {
    return null;
  }

  let linkCustomerId: string | null | undefined =
    patch.customerId !== undefined ? patch.customerId : undefined;
  let linkEnquiryId: string | null | undefined =
    patch.enquiryId !== undefined ? patch.enquiryId : undefined;
  let mergedSheet = patch.eventDaySheet ?? existing.eventDaySheet;

  if (patch.enquiryId !== undefined && existing.status === "draft") {
    if (patch.enquiryId === null) {
      linkEnquiryId = null;
    } else {
      const enquiry = await getEnquiry(businessId, patch.enquiryId);
      if (enquiry) {
        linkEnquiryId = enquiry.id;
        linkCustomerId = enquiry.customerId ?? linkCustomerId ?? null;
        const prev = (existing.eventDaySheet ?? {}) as QuoteEventDaySheet;
        mergedSheet = {
          ...prev,
          ...(patch.eventDaySheet ?? {}),
          eventDate: enquiry.eventDate ?? prev.eventDate,
          eventType: enquiry.eventType ?? prev.eventType,
          theme: enquiry.theme ?? prev.theme,
          guestCount: enquiry.guestCount ?? prev.guestCount,
          venue: enquiry.venue ?? prev.venue,
          billToName: enquiry.contactName,
          billToEmail: enquiry.contactEmail,
          billToPhone: enquiry.contactPhone,
        };
      }
    }
  } else if (patch.customerId !== undefined && existing.status === "draft") {
    if (patch.customerId === null) {
      linkCustomerId = null;
    } else {
      const customer = await getCustomerById(businessId, patch.customerId);
      if (customer) {
        linkCustomerId = customer.id;
        const prev = (existing.eventDaySheet ?? {}) as QuoteEventDaySheet;
        mergedSheet = {
          ...prev,
          ...(patch.eventDaySheet ?? {}),
          billToName:
            customer.displayName ??
            [customer.firstName, customer.lastName].filter(Boolean).join(" ") ??
            prev.billToName,
          billToEmail: customer.email ?? prev.billToEmail,
          billToPhone: customer.phone ?? prev.billToPhone,
        };
      }
    }
  } else if (patch.eventDaySheet) {
    mergedSheet = patch.eventDaySheet;
  }

  if (patch.lines) {
    await db.delete(quoteLineItemsTable).where(eq(quoteLineItemsTable.quoteId, quoteId));
    const lineRows = patch.lines.map((l, i) => ({
      id: l.id ?? generateId(),
      quoteId,
      serviceId: null,
      name: l.name,
      description: l.description,
      quantity: String(l.quantity),
      unit: l.unit,
      unitPriceMinor: l.unitPriceMinor,
      lineTotalMinor: lineTotal(l.quantity, l.unitPriceMinor),
      sortOrder: i,
    }));
    if (lineRows.length) await db.insert(quoteLineItemsTable).values(lineRows);
    const depositPercent = patch.depositPercent ?? existing.depositPercent;
    const totals = computeQuoteTotals(
      lineRows.map((l) => ({ quantity: Number(l.quantity), unitPriceMinor: l.unitPriceMinor })),
      depositPercent,
    );
    const milestones = (patch.milestoneDeposits ?? existing.milestoneDeposits) as MilestoneDeposit[];
    const depositAmountMinor = milestones[0]?.amountMinor ?? totals.depositAmountMinor;
    const balanceDueMinor = totals.subtotalMinor - depositAmountMinor;
    const [quote] = await db
      .update(quotesTable)
      .set({
        personalMessage: patch.personalMessage ?? existing.personalMessage,
        depositPercent,
        subtotalMinor: totals.subtotalMinor,
        depositAmountMinor,
        balanceDueMinor,
        eventDaySheet: mergedSheet ?? existing.eventDaySheet,
        milestoneDeposits: patch.milestoneDeposits ?? existing.milestoneDeposits,
        customerId: linkCustomerId !== undefined ? linkCustomerId : existing.customerId,
        enquiryId: linkEnquiryId !== undefined ? linkEnquiryId : existing.enquiryId,
        updatedAt: new Date(),
      })
      .where(and(eq(quotesTable.id, quoteId), eq(quotesTable.businessId, businessId)))
      .returning();
    return getQuoteWithLines(businessId, quote!.id);
  }

  const [quote] = await db
    .update(quotesTable)
    .set({
      personalMessage: patch.personalMessage,
      depositPercent: patch.depositPercent,
      status: patch.status,
      eventDaySheet: mergedSheet,
      milestoneDeposits: patch.milestoneDeposits,
      customerId: linkCustomerId !== undefined ? linkCustomerId : undefined,
      enquiryId: linkEnquiryId !== undefined ? linkEnquiryId : undefined,
      updatedAt: new Date(),
    })
    .where(and(eq(quotesTable.id, quoteId), eq(quotesTable.businessId, businessId)))
    .returning();
  if (quote && patch.status === "declined" && quote.enquiryId) {
    await updateEnquiry(businessId, quote.enquiryId, { status: "lost" });
  }
  return quote ? getQuoteWithLines(businessId, quote.id) : null;
}

/** Blank draft or new draft from enquiry (optional force when duplicate exists). */
export async function createManualQuote(
  businessId: string,
  input?: { enquiryId?: string; customerId?: string; forceNew?: boolean },
) {
  if (input?.enquiryId) {
    return generateQuoteFromEnquiry(businessId, input.enquiryId, undefined, {
      allowDuplicateDraft: input.forceNew ?? false,
    });
  }

  if (!input?.forceNew) {
    const [existingBlank] = await db
      .select({ id: quotesTable.id })
      .from(quotesTable)
      .where(
        and(
          eq(quotesTable.businessId, businessId),
          eq(quotesTable.status, "draft"),
          isNull(quotesTable.enquiryId),
        ),
      )
      .orderBy(desc(quotesTable.createdAt))
      .limit(1);
    if (existingBlank) {
      return getQuoteWithLines(businessId, existingBlank.id);
    }
  }

  const site = await ensureEventVendorSite(businessId);
  const depositPercent = site.defaultDepositPercent ?? 30;
  const validUntil = new Date();
  validUntil.setDate(validUntil.getDate() + (site.quoteValidityDays ?? 14));

  let customerId: string | null = input?.customerId ?? null;
  let eventDaySheet: QuoteEventDaySheet = {};
  if (customerId) {
    const customer = await getCustomerById(businessId, customerId);
    if (customer) {
      eventDaySheet = {
        billToName:
          customer.displayName?.trim() ||
          [customer.firstName, customer.lastName].filter(Boolean).join(" ") ||
          null,
        billToEmail: customer.email,
        billToPhone: customer.phone,
      };
    } else {
      customerId = null;
    }
  }

  const quoteId = generateId();
  const token = quoteToken();
  const lineId = generateId();
  const lineRows = [
    {
      id: lineId,
      quoteId,
      serviceId: null,
      name: "Custom item",
      description: null,
      quantity: "1",
      unit: "flat",
      unitPriceMinor: 0,
      lineTotalMinor: 0,
      sortOrder: 0,
    },
  ];
  const totals = computeQuoteTotals([{ quantity: 1, unitPriceMinor: 0 }], depositPercent);
  const milestoneDeposits = computeMilestoneDeposits(
    totals.subtotalMinor,
    [{ label: "Deposit", percent: depositPercent }],
    null,
  );
  const depositAmountMinor = milestoneDeposits[0]?.amountMinor ?? totals.depositAmountMinor;
  const balanceDueMinor = totals.subtotalMinor - depositAmountMinor;

  await db.insert(quotesTable).values({
    id: quoteId,
    businessId,
    enquiryId: null,
    customerId,
    status: "draft",
    personalMessage: "Thank you for your enquiry — here is your personalised quote.",
    depositPercent,
    subtotalMinor: totals.subtotalMinor,
    depositAmountMinor,
    balanceDueMinor,
    validUntil: validUntil.toISOString().slice(0, 10),
    publicToken: token,
    milestoneDeposits,
    eventDaySheet,
  });
  await db.insert(quoteLineItemsTable).values(lineRows);

  return getQuoteWithLines(businessId, quoteId);
}

export async function deleteDraftQuote(businessId: string, quoteId: string) {
  const existing = await getQuoteWithLines(businessId, quoteId);
  if (!existing || !["draft", "expired"].includes(existing.status)) return null;
  await db.delete(quoteLineItemsTable).where(eq(quoteLineItemsTable.quoteId, quoteId));
  await db.delete(quotesTable).where(
    and(eq(quotesTable.id, quoteId), eq(quotesTable.businessId, businessId)),
  );
  return { ok: true as const };
}

export async function sendQuote(
  businessId: string,
  quoteId: string,
  via: "email" | "whatsapp_assisted",
) {
  const quote = await getQuoteWithLines(businessId, quoteId);
  if (!quote) return null;

  const [biz] = await db
    .select({ slug: businessesTable.slug, name: businessesTable.name, logoUrl: businessesTable.logoUrl })
    .from(businessesTable)
    .where(eq(businessesTable.id, businessId))
    .limit(1);

  const enquiry = quote.enquiryId ? await getEnquiry(businessId, quote.enquiryId) : null;
  const customer =
    quote.customerId && !enquiry ? await getCustomerById(businessId, quote.customerId) : null;
  const { contactName, contactEmail } = resolveQuoteRecipient(quote, enquiry, customer);

  const site = await getEventVendorSite(businessId);
  const outdoorTerms = outdoorContingencyClause({
    eventType: enquiry?.eventType ?? (quote.eventDaySheet as { eventType?: string })?.eventType,
    venue: enquiry?.venue ?? (quote.eventDaySheet as { venue?: string })?.venue,
    notes: enquiry?.notes,
    operatorExtra: site.outdoorTermsExtra,
  });
  const termsSnapshot = [quote.termsSnapshot ?? site.termsText, outdoorTerms].filter(Boolean).join("\n\n");

  const [row] = await db
    .update(quotesTable)
    .set({
      status: "sent",
      sentAt: new Date(),
      sentVia: via,
      termsSnapshot,
      updatedAt: new Date(),
    })
    .where(and(eq(quotesTable.id, quoteId), eq(quotesTable.businessId, businessId)))
    .returning();

  if (quote.enquiryId) {
    const holdExpires = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
    await updateEnquiry(businessId, quote.enquiryId, {
      status: "quoted",
      eventDateHoldStatus: "tentative",
      holdExpiresAt: holdExpires,
      firstOperatorReplyAt: enquiry?.firstOperatorReplyAt ?? new Date(),
      ...(enquiry?.plannerEmail && !enquiry.plannerAccessToken
        ? { plannerAccessToken: quoteToken() }
        : {}),
    });
  }

  const slug = biz?.slug ?? businessId;
  const businessName = biz?.name ?? "Your vendor";
  const token = row!.publicToken;
  const publicPath = `/e/${slug}/q/${token}`;
  const pdfPath = `/api/public/${slug}/q/${token}/html`;

  let emailStatus: "sent" | "skipped" | "failed" = "skipped";
  if (via === "email" && contactEmail) {
    emailStatus = await emailQuoteToClient({
      businessId,
      businessName,
      slug,
      to: contactEmail,
      contactName,
      token,
      personalMessage: quote.personalMessage,
      lines: quote.lines,
      subtotalMinor: quote.subtotalMinor,
      depositAmountMinor: quote.depositAmountMinor,
      balanceDueMinor: quote.balanceDueMinor,
      depositPercent: quote.depositPercent,
      validUntil: quote.validUntil,
      termsSnapshot: quote.termsSnapshot,
      milestoneDeposits: quote.milestoneDeposits as MilestoneDeposit[],
      logoUrl: biz?.logoUrl,
      eventBrief: quote.eventDaySheet as QuoteHtmlEventBrief | null,
    });
  }

  const whatsappText = await resolveLivOutboundForBusiness(businessId, "quote_whatsapp", {
    firstName: contactName.split(" ")[0] ?? "there",
    businessName,
    total: new Intl.NumberFormat("en-IE", { style: "currency", currency: "EUR" }).format(
      quote.subtotalMinor / 100,
    ),
    quoteUrl: `${getPublicAppOrigin()}/e/${slug}/q/${token}`,
  });

  if (enquiry) {
    void recordOperatorDecision(businessId, "quote_sent", {
      eventType: enquiry.eventType,
      guestCount: enquiry.guestCount,
      budgetRange: enquiry.budgetRange,
    }).catch(() => undefined);
  }

  return {
    ...row,
    lines: quote.lines,
    publicPath,
    pdfPath,
    emailStatus,
    whatsappText,
  };
}

export async function getPublicQuoteByToken(slug: string, token: string) {
  const [biz] = await db
    .select({ id: businessesTable.id, name: businessesTable.name, slug: businessesTable.slug, logoUrl: businessesTable.logoUrl })
    .from(businessesTable)
    .where(eq(businessesTable.slug, slug))
    .limit(1);
  if (!biz) return null;

  await expireOverdueQuotes(biz.id);

  const [quote] = await db
    .select()
    .from(quotesTable)
    .where(and(eq(quotesTable.businessId, biz.id), eq(quotesTable.publicToken, token)))
    .limit(1);
  if (!quote) return null;

  const lines = await db
    .select()
    .from(quoteLineItemsTable)
    .where(eq(quoteLineItemsTable.quoteId, quote.id))
    .orderBy(quoteLineItemsTable.sortOrder);

  const site = await getEventVendorSite(biz.id);

  let eventType: string | null = null;
  if (quote.enquiryId) {
    const [enquiry] = await db
      .select({ eventType: enquiriesTable.eventType })
      .from(enquiriesTable)
      .where(and(eq(enquiriesTable.businessId, biz.id), eq(enquiriesTable.id, quote.enquiryId)))
      .limit(1);
    eventType = enquiry?.eventType ?? null;
  }

  const similarWork = matchGallerySimilarWork(site.gallery ?? [], eventType);

  let versionDiff: ReturnType<typeof diffQuoteLineItems> = [];
  let previousVersion: number | null = null;
  if (quote.supersedesQuoteId) {
    const prev = await getQuoteWithLines(biz.id, quote.supersedesQuoteId);
    if (prev) {
      previousVersion = prev.version ?? 1;
      versionDiff = diffQuoteLineItems(
        prev.lines.map((l) => ({
          name: l.name,
          quantity: l.quantity,
          lineTotalMinor: l.lineTotalMinor,
        })),
        lines.map((l) => ({
          name: l.name,
          quantity: l.quantity,
          lineTotalMinor: l.lineTotalMinor,
        })),
      );
    }
  }

  return {
    business: biz,
    quote: { ...quote, lines },
    site,
    similarWork,
    eventType,
    versionDiff,
    previousVersion,
  };
}

export async function declinePublicQuote(slug: string, token: string) {
  const data = await getPublicQuoteByToken(slug, token);
  if (!data || data.quote.status !== "sent") return null;

  const [row] = await db
    .update(quotesTable)
    .set({ status: "declined", updatedAt: new Date() })
    .where(eq(quotesTable.id, data.quote.id))
    .returning();

  if (data.quote.enquiryId) {
    await updateEnquiry(data.business.id, data.quote.enquiryId, { status: "lost" });
  }
  const { notifyClientWithdrew } = await import("./engagement-exit.service");
  notifyClientWithdrew({
    businessId: data.business.id,
    quoteId: data.quote.id,
    publicToken: data.quote.publicToken,
    depositPaidMinor: data.quote.depositPaidMinor ?? 0,
    depositAmountMinor: data.quote.depositAmountMinor ?? 0,
    initiatedBy: "client",
  });
  return row;
}

export async function acceptPublicQuote(slug: string, token: string) {
  const data = await getPublicQuoteByToken(slug, token);
  if (!data || data.quote.status !== "sent") return null;

  const [row] = await db
    .update(quotesTable)
    .set({ status: "accepted", acceptedAt: new Date(), updatedAt: new Date() })
    .where(eq(quotesTable.id, data.quote.id))
    .returning();

  if (data.quote.enquiryId) {
    await updateEnquiry(data.business.id, data.quote.enquiryId, { status: "accepted" });
  }

  const { notifyQuoteAccepted } = await import("./engagement-exit.service");
  notifyQuoteAccepted(data.business.id, row.id, row.publicToken);

  return row;
}

export async function listMoodBoardItems(businessId: string, enquiryId: string) {
  return db
    .select()
    .from(eventMoodBoardItemsTable)
    .where(
      and(
        eq(eventMoodBoardItemsTable.businessId, businessId),
        eq(eventMoodBoardItemsTable.enquiryId, enquiryId),
      ),
    )
    .orderBy(desc(eventMoodBoardItemsTable.createdAt));
}

export async function addMoodBoardItem(
  businessId: string,
  enquiryId: string,
  input: { imageUrl?: string; note?: string; status?: string },
) {
  const enq = await getEnquiry(businessId, enquiryId);
  if (!enq) return null;
  const id = generateId();
  const [row] = await db
    .insert(eventMoodBoardItemsTable)
    .values({
      id,
      businessId,
      enquiryId,
      imageUrl: input.imageUrl,
      note: input.note,
      status: input.status ?? "draft",
    })
    .returning();
  return row!;
}

export async function updateMoodBoardItem(
  businessId: string,
  itemId: string,
  patch: { imageUrl?: string; note?: string; status?: string },
) {
  const [row] = await db
    .update(eventMoodBoardItemsTable)
    .set({ ...patch, updatedAt: new Date() })
    .where(
      and(eq(eventMoodBoardItemsTable.id, itemId), eq(eventMoodBoardItemsTable.businessId, businessId)),
    )
    .returning();
  return row ?? null;
}

export async function deleteMoodBoardItem(businessId: string, itemId: string) {
  const [row] = await db
    .delete(eventMoodBoardItemsTable)
    .where(
      and(eq(eventMoodBoardItemsTable.id, itemId), eq(eventMoodBoardItemsTable.businessId, businessId)),
    )
    .returning();
  return row ?? null;
}

export async function requestPostEventReview(businessId: string, enquiryId: string) {
  const enquiry = await getEnquiry(businessId, enquiryId);
  if (!enquiry) return null;
  const [biz] = await db
    .select({ name: businessesTable.name })
    .from(businessesTable)
    .where(eq(businessesTable.id, businessId))
    .limit(1);
  const status = await sendPostEventReviewRequest({
    businessId,
    businessName: biz?.name ?? "Your vendor",
    to: enquiry.contactEmail,
    contactName: enquiry.contactName,
  });
  return { status };
}

export async function getLivDraftForEnquiry(businessId: string, enquiryId: string) {
  const enquiry = await getEnquiry(businessId, enquiryId);
  if (!enquiry) return null;
  const [biz] = await db
    .select({ name: businessesTable.name, slug: businessesTable.slug })
    .from(businessesTable)
    .where(eq(businessesTable.id, businessId))
    .limit(1);
  if (!biz?.slug) return null;
  return {
    whatsappText: await resolveLivOutboundForBusiness(businessId, "enquiry_thanks", {
      firstName: enquiry.contactName.split(" ")[0] ?? "there",
      businessName: biz.name,
      enquireUrl: `${getPublicAppOrigin()}/e/${biz.slug}/enquire`,
    }),
  };
}

export async function getLivDraftForQuote(businessId: string, quoteId: string) {
  const quote = await getQuoteWithLines(businessId, quoteId);
  if (!quote) return null;
  const enquiry = quote.enquiryId ? await getEnquiry(businessId, quote.enquiryId) : null;
  const [biz] = await db
    .select({ name: businessesTable.name, slug: businessesTable.slug })
    .from(businessesTable)
    .where(eq(businessesTable.id, businessId))
    .limit(1);
  if (!biz?.slug) return null;
  const contactName = enquiry?.contactName ?? "there";
  return {
    whatsappText: await resolveLivOutboundForBusiness(businessId, "quote_whatsapp", {
      firstName: contactName.split(" ")[0] ?? "there",
      businessName: biz.name,
      total: new Intl.NumberFormat("en-IE", { style: "currency", currency: "EUR" }).format(
        quote.subtotalMinor / 100,
      ),
      quoteUrl: `${getPublicAppOrigin()}/e/${biz.slug}/q/${quote.publicToken}`,
    }),
  };
}

export async function renderPublicQuoteHtml(slug: string, token: string) {
  const data = await getPublicQuoteByToken(slug, token);
  if (!data) return null;
  return renderQuoteHtml({
    businessName: data.business.name,
    slug: data.business.slug,
    token,
    logoUrl: data.business.logoUrl,
    personalMessage: data.quote.personalMessage,
    lines: data.quote.lines,
    subtotalMinor: data.quote.subtotalMinor,
    depositAmountMinor: data.quote.depositAmountMinor,
    balanceDueMinor: data.quote.balanceDueMinor,
    depositPercent: data.quote.depositPercent,
    validUntil: data.quote.validUntil,
    termsSnapshot: data.quote.termsSnapshot,
    milestoneDeposits: data.quote.milestoneDeposits as MilestoneDeposit[],
    eventBrief: data.quote.eventDaySheet as QuoteHtmlEventBrief | null,
    status: data.quote.status,
    invoiceNumber: data.quote.id,
  });
}

export async function listQuoteTemplates(businessId: string) {
  return db
    .select()
    .from(quoteTemplatesTable)
    .where(eq(quoteTemplatesTable.businessId, businessId))
    .orderBy(quoteTemplatesTable.sortOrder);
}

export async function upsertQuoteTemplate(
  businessId: string,
  input: {
    id?: string;
    name: string;
    eventTypes?: string[];
    presetLines?: Array<{ serviceName: string; quantity?: number; unit?: string }>;
    isActive?: boolean;
  },
) {
  if (input.id) {
    const [row] = await db
      .update(quoteTemplatesTable)
      .set({
        name: input.name,
        eventTypes: input.eventTypes ?? [],
        presetLines: input.presetLines ?? [],
        isActive: input.isActive ?? true,
        updatedAt: new Date(),
      })
      .where(and(eq(quoteTemplatesTable.id, input.id), eq(quoteTemplatesTable.businessId, businessId)))
      .returning();
    return row ?? null;
  }
  const [row] = await db
    .insert(quoteTemplatesTable)
    .values({
      id: generateId(),
      businessId,
      name: input.name,
      eventTypes: input.eventTypes ?? [],
      presetLines: input.presetLines ?? [],
    })
    .returning();
  return row!;
}

export async function getConsultFirstDashboard(businessId: string) {
  await expireOverdueQuotes(businessId);
  const enquiries = await listEnquiries(businessId);
  const quotes = await listQuotes(businessId);
  const staleRows = await listStaleQuotes(businessId);

  const enquiryById = new Map(enquiries.map((e) => [e.id, e]));
  const staleQuotesList = staleRows.map((q) => {
    const enq = q.enquiryId ? enquiryById.get(q.enquiryId) : undefined;
    const daysSinceSent = q.sentAt
      ? Math.floor((Date.now() - q.sentAt.getTime()) / (24 * 60 * 60 * 1000))
      : STALE_QUOTE_DAYS;
    return {
      quoteId: q.id,
      enquiryId: q.enquiryId,
      contactName: enq?.contactName ?? "Client",
      eventType: enq?.eventType,
      subtotalMinor: q.subtotalMinor,
      sentAt: q.sentAt?.toISOString(),
      daysSinceSent,
      publicToken: q.publicToken,
    };
  });

  const today = new Date().toISOString().slice(0, 10);
  const prepTaskRows: Array<{
    quoteId: string;
    enquiryId?: string | null;
    contactName: string;
    eventType?: string | null;
    taskId: string;
    label: string;
    dueDate: string;
    phase: string;
    overdue: boolean;
  }> = [];

  for (const q of quotes) {
    const sheet = (q.eventDaySheet ?? {}) as { livLifecycle?: LivEventLifecycle };
    const lifecycle = sheet.livLifecycle;
    if (!lifecycle?.prepInitializedAt) continue;
    const enq = q.enquiryId ? enquiryById.get(q.enquiryId) : undefined;
    const contactName = enq?.contactName ?? "Client";
    for (const t of overduePrepTasks(lifecycle, today)) {
      prepTaskRows.push({
        quoteId: q.id,
        enquiryId: q.enquiryId,
        contactName,
        eventType: enq?.eventType,
        taskId: t.id,
        label: t.label,
        dueDate: t.dueDate,
        phase: t.phase,
        overdue: true,
      });
    }
    for (const t of upcomingPrepTasks(lifecycle, 14, today)) {
      prepTaskRows.push({
        quoteId: q.id,
        enquiryId: q.enquiryId,
        contactName,
        eventType: enq?.eventType,
        taskId: t.id,
        label: t.label,
        dueDate: t.dueDate,
        phase: t.phase,
        overdue: false,
      });
    }
  }

  prepTaskRows.sort((a, b) => a.dueDate.localeCompare(b.dueDate));

  const newEnquiryRows = enquiries.filter((e) => e.status === "new");
  const lowFitList: Array<{
    enquiryId: string;
    contactName: string;
    eventType?: string | null;
    headline: string;
    score: number;
  }> = [];
  for (const enq of newEnquiryRows) {
    const prescreen = await prescreenEnquiry(businessId, {
      eventType: enq.eventType,
      guestCount: enq.guestCount,
      budgetRange: enq.budgetRange,
    });
    if (prescreen.tier === "low") {
      lowFitList.push({
        enquiryId: enq.id,
        contactName: enq.contactName,
        eventType: enq.eventType,
        headline: prescreen.headline,
        score: prescreen.score,
      });
    }
  }

  return {
    newEnquiries: newEnquiryRows.length,
    lowFitNewEnquiries: lowFitList.length,
    lowFitList: lowFitList.slice(0, 6),
    quotedEnquiries: enquiries.filter((e) => e.status === "quoted").length,
    acceptedAwaitingDeposit: quotes.filter(
      (q) => q.status === "accepted" && q.depositPaidMinor < q.depositAmountMinor,
    ).length,
    bookedEvents: enquiries.filter((e) => e.status === "booked").length,
    staleQuotes: staleQuotesList.length,
    staleQuotesList,
    prepTasksDue: prepTaskRows.length,
    prepTaskList: prepTaskRows.slice(0, 12),
    pipelineForecast: weightedPipelineForecast(quotes),
    replyBenchmark: (() => {
      const samples = enquiries
        .filter((e) => e.firstOperatorReplyAt)
        .map((e) =>
          Math.round(
            (e.firstOperatorReplyAt!.getTime() - e.createdAt.getTime()) / 60_000,
          ),
        );
      if (!samples.length) return null;
      const avg = Math.round(samples.reduce((a, b) => a + b, 0) / samples.length);
      return replyTimeBenchmark(avg);
    })(),
  };
}

export async function getEnquiryQuoteBrief(businessId: string, enquiryId: string) {
  const enquiry = await getEnquiry(businessId, enquiryId);
  if (!enquiry) return null;

  const [services, templates, site] = await Promise.all([
    db
      .select({ id: servicesTable.id, name: servicesTable.name, stockCount: servicesTable.stockCount })
      .from(servicesTable)
      .where(and(eq(servicesTable.businessId, businessId), eq(servicesTable.isActive, true))),
    listQuoteTemplates(businessId),
    getEventVendorSite(businessId),
  ]);

  const suggestedTemplate = matchTemplateByEventType(templates, enquiry.eventType);
  const presetLines = (suggestedTemplate?.presetLines ?? []) as Array<{
    serviceName: string;
    quantity?: number;
    unit?: string;
  }>;

  const prescreen = await prescreenEnquiry(businessId, {
    eventType: enquiry.eventType,
    guestCount: enquiry.guestCount,
    budgetRange: enquiry.budgetRange,
  });

  return {
    suggestedTemplateId: suggestedTemplate?.id ?? null,
    suggestedTemplateName: suggestedTemplate?.name ?? null,
    templates: templates.filter((t) => t.isActive !== false),
    prescreen,
    briefIntelligence: buildQuoteBriefIntelligence({
      contactName: enquiry.contactName,
      eventType: enquiry.eventType,
      eventDate: enquiry.eventDate,
      guestCount: enquiry.guestCount,
      theme: enquiry.theme,
      venue: enquiry.venue,
      budgetRange: enquiry.budgetRange,
      servicesRequested: enquiry.servicesRequested as string[],
      presetLines,
      catalogueNames: services.map((s) => s.name),
      setupFeeMinor: site.setupFeeMinor,
      stockCatalogue: services,
    }),
  };
}

/** Clone a sent quote into a new draft (v+1) for negotiation revisions. */
export async function reviseSentQuote(businessId: string, quoteId: string) {
  const quote = await getQuoteWithLines(businessId, quoteId);
  if (!quote || quote.status !== "sent") return null;

  const newId = generateId();
  const token = quoteToken();
  const version = (quote.version ?? 1) + 1;

  const [row] = await db
    .insert(quotesTable)
    .values({
      id: newId,
      businessId,
      enquiryId: quote.enquiryId,
      customerId: quote.customerId,
      status: "draft",
      personalMessage: quote.personalMessage,
      depositPercent: quote.depositPercent,
      subtotalMinor: quote.subtotalMinor,
      depositAmountMinor: quote.depositAmountMinor,
      balanceDueMinor: quote.balanceDueMinor,
      validUntil: quote.validUntil,
      termsSnapshot: quote.termsSnapshot,
      publicToken: token,
      eventDaySheet: quote.eventDaySheet,
      milestoneDeposits: quote.milestoneDeposits,
      supersedesQuoteId: quote.id,
      version,
    })
    .returning();

  if (quote.lines.length) {
    await db.insert(quoteLineItemsTable).values(
      quote.lines.map((l, i) => ({
        id: generateId(),
        quoteId: newId,
        serviceId: l.serviceId,
        name: l.name,
        description: l.description,
        quantity: l.quantity,
        unit: l.unit,
        unitPriceMinor: l.unitPriceMinor,
        lineTotalMinor: l.lineTotalMinor,
        sortOrder: i,
      })),
    );
  }

  await db
    .update(quotesTable)
    .set({ status: "expired", updatedAt: new Date() })
    .where(eq(quotesTable.id, quoteId));

  return getQuoteWithLines(businessId, row!.id);
}

export async function sendMoodBoardForApproval(businessId: string, enquiryId: string) {
  const enquiry = await getEnquiry(businessId, enquiryId);
  if (!enquiry) return null;
  const items = await listMoodBoardItems(businessId, enquiryId);
  if (!items.length) return null;

  const token = enquiry.moodBoardApprovalToken ?? quoteToken();
  await updateEnquiry(businessId, enquiryId, {
    moodBoardApprovalToken: token,
    moodBoardStatus: "sent",
  });

  const [biz] = await db
    .select({ slug: businessesTable.slug, name: businessesTable.name })
    .from(businessesTable)
    .where(eq(businessesTable.id, businessId))
    .limit(1);

  const path = `/e/${biz?.slug}/mood/${token}`;
  return {
    approvalUrl: `${getPublicAppOrigin()}${path}`,
    path,
    itemCount: items.length,
    businessName: biz?.name ?? "Studio",
  };
}

export async function getPublicMoodBoardByToken(slug: string, token: string) {
  const [biz] = await db
    .select({ id: businessesTable.id, name: businessesTable.name, slug: businessesTable.slug })
    .from(businessesTable)
    .where(eq(businessesTable.slug, slug))
    .limit(1);
  if (!biz) return null;

  const [enquiry] = await db
    .select()
    .from(enquiriesTable)
    .where(
      and(
        eq(enquiriesTable.businessId, biz.id),
        eq(enquiriesTable.moodBoardApprovalToken, token),
      ),
    )
    .limit(1);
  if (!enquiry) return null;

  const items = await listMoodBoardItems(biz.id, enquiry.id);
  return {
    business: biz,
    enquiry: {
      contactName: enquiry.contactName,
      eventType: enquiry.eventType,
      theme: enquiry.theme,
      status: enquiry.moodBoardStatus,
    },
    items,
  };
}

export async function decidePublicMoodBoard(
  slug: string,
  token: string,
  decision: "approved" | "changes_requested",
  note?: string,
) {
  const data = await getPublicMoodBoardByToken(slug, token);
  if (!data || data.enquiry.status === "approved") return null;

  const [enquiry] = await db
    .select({ id: enquiriesTable.id, businessId: enquiriesTable.businessId })
    .from(enquiriesTable)
    .where(eq(enquiriesTable.moodBoardApprovalToken, token))
    .limit(1);
  if (!enquiry) return null;

  const status = decision === "approved" ? "approved" : "changes_requested";
  await updateEnquiry(enquiry.businessId, enquiry.id, { moodBoardStatus: status });
  if (note?.trim()) {
    await db
      .update(enquiriesTable)
      .set({ internalNotes: note.trim(), updatedAt: new Date() })
      .where(eq(enquiriesTable.id, enquiry.id));
  }
  return { status };
}

export async function getPlannerPortalByToken(slug: string, token: string) {
  const [biz] = await db
    .select({ id: businessesTable.id, name: businessesTable.name, slug: businessesTable.slug })
    .from(businessesTable)
    .where(eq(businessesTable.slug, slug))
    .limit(1);
  if (!biz) return null;

  const enquiryRows = await db
    .select()
    .from(enquiriesTable)
    .where(
      and(
        eq(enquiriesTable.businessId, biz.id),
        eq(enquiriesTable.plannerAccessToken, token),
      ),
    );

  if (!enquiryRows.length) return null;

  const quoteRows = await db
    .select()
    .from(quotesTable)
    .where(
      and(
        eq(quotesTable.businessId, biz.id),
        inArray(
          quotesTable.enquiryId,
          enquiryRows.map((e) => e.id),
        ),
      ),
    );

  return {
    business: biz,
    plannerName: enquiryRows[0]?.plannerName ?? "Planner",
    clients: enquiryRows.map((e) => ({
      contactName: e.contactName,
      eventType: e.eventType,
      eventDate: e.eventDate,
      status: e.status,
      quotes: quoteRows
        .filter((q) => q.enquiryId === e.id)
        .map((q) => ({
          id: q.id,
          status: q.status,
          subtotalMinor: q.subtotalMinor,
          version: q.version,
          publicPath: `/e/${slug}/q/${q.publicToken}`,
        })),
    })),
  };
}

export async function getLivDraftForStaleQuote(businessId: string, quoteId: string) {
  const quote = await getQuoteWithLines(businessId, quoteId);
  if (!quote?.sentAt) return null;
  const enquiry = quote.enquiryId ? await getEnquiry(businessId, quote.enquiryId) : null;
  const [biz] = await db
    .select({ name: businessesTable.name, slug: businessesTable.slug })
    .from(businessesTable)
    .where(eq(businessesTable.id, businessId))
    .limit(1);
  if (!biz?.slug) return null;
  const daysSinceSent = Math.floor((Date.now() - quote.sentAt.getTime()) / (24 * 60 * 60 * 1000));
  const quoteUrl = `${getPublicAppOrigin()}/e/${biz.slug}/q/${quote.publicToken}`;
  const override = await getLivOutboundOverride(businessId, "stale_quote_nudge");
  return {
    whatsappText: staleQuoteNudgeCopy(
      {
        contactName: enquiry?.contactName ?? "Client",
        businessName: biz.name,
        daysSinceSent,
        quoteUrl,
      },
      override,
    ),
  };
}

export async function getPublicEventSite(slug: string) {
  const [biz] = await db
    .select()
    .from(businessesTable)
    .where(eq(businessesTable.slug, slug))
    .limit(1);
  if (!biz || biz.vertical !== "event-vendors") return null;

  const site = await ensureEventVendorSite(biz.id);
  const services = await db
    .select({
      id: servicesTable.id,
      name: servicesTable.name,
      description: servicesTable.description,
      category: servicesTable.category,
      priceMinor: servicesTable.priceMinor,
      quoteUnit: servicesTable.quoteUnit,
      imageUrl: servicesTable.imageUrl,
    })
    .from(servicesTable)
    .where(and(eq(servicesTable.businessId, biz.id), eq(servicesTable.isActive, true)))
    .orderBy(servicesTable.sortOrder);

  return {
    business: {
      id: biz.id,
      name: biz.name,
      slug: biz.slug,
      logoUrl: biz.logoUrl,
      coverImageUrl: biz.coverImageUrl,
      vertical: biz.vertical,
      currency: biz.currency,
      description: biz.description,
      instagramHandle: biz.instagramHandle,
      city: biz.city,
      email: biz.email,
      phone: biz.phone,
    },
    site,
    services: services.map((svc) => ({
      ...svc,
      imageUrl:
        resolvePublicServiceImageUrl(
          svc.name,
          inferDemoServiceImageUrl(svc.name, "event-vendors"),
          svc.imageUrl,
        ) ?? svc.imageUrl,
    })),
  };
}
