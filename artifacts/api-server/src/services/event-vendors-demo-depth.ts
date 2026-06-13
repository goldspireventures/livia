import { and, eq } from "drizzle-orm";
import { db, businessesTable, customersTable, enquiriesTable, quotesTable, servicesTable } from "@workspace/db";
import { defaultLivOutboundOverridesForVertical, formatOperatorDecisionMemory } from "@workspace/policy";
import { patchLivOutboundOverrides } from "./liv-outbound.service";
import { appendLivMemory } from "./liv-memory.service";
import { getOperatorDecisionPatterns } from "./liv-operator-learning.service";
import { pruneConsultFirstDemoCustomers } from "./demo-showcase-depth";
import { resyncConsultFirstDemoInbox } from "./demo-inbox.seed";
import {
  ensureEventVendorSite,
  generateQuoteFromEnquiry,
  sendQuote,
  submitPublicEnquiry,
  updateEventVendorSite,
  upsertQuoteTemplate,
} from "./consult-first.service";

const QUOTE_UNITS: Record<string, string> = {
  "Balloon garland": "flat",
  "Table centrepieces": "per_table",
  "Backdrop styling": "flat",
  "Chair covers & sashes": "per_guest",
  "Setup & delivery": "flat",
  "Floral table runner": "per_table",
};

export async function ensureEventVendorsShowcaseDepth(businessId: string) {
  await db
    .update(businessesTable)
    .set({
      instagramHandle: "atelierdecordublin",
      phone: "+353 87 123 4567",
      coverImageUrl: "/event-vendor-media/wedding-reception.jpg",
      updatedAt: new Date(),
    })
    .where(eq(businessesTable.id, businessId));

  const services = await db
    .select({ id: servicesTable.id, name: servicesTable.name })
    .from(servicesTable)
    .where(eq(servicesTable.businessId, businessId));

  for (const svc of services) {
    const unit = QUOTE_UNITS[svc.name];
    const stockCount = svc.name === "Balloon garland" ? 3 : null;
    if (unit || stockCount != null) {
      await db
        .update(servicesTable)
        .set({
          ...(unit ? { quoteUnit: unit, durationMinutes: 0 } : {}),
          ...(stockCount != null ? { stockCount } : {}),
        })
        .where(eq(servicesTable.id, svc.id));
    }
  }

  await updateEventVendorSite(businessId, {
    heroTitle: "Atelier Decor Dublin",
    heroSubtitle: "Weddings, birthdays & celebrations — styled with care.",
    aboutText:
      "We are a Dublin event styling studio — the kind of team you want when the Pinterest board has to become a room. From balloon installs and backdrops to tablescapes and venue dressing, we work with couples, families, and planners across Leinster.\n\nEvery quote is itemised. Every date is secured with a deposit. No DM chaos — just a clear path from enquiry to your celebration.",
    defaultDepositPercent: 30,
    quoteValidityDays: 14,
    termsText: "Quote valid 14 days. 30% deposit secures your event date. Balance due 7 days before the event.",
    gallery: [
      {
        url: "/event-vendor-media/wedding-reception.jpg",
        caption: "Wedding reception",
        eventType: "wedding",
      },
      {
        url: "/event-vendor-media/birthday-party.jpg",
        caption: "Birthday party",
        eventType: "birthday",
      },
      {
        url: "/event-vendor-media/christening.jpg",
        caption: "Christening",
        eventType: "christening",
      },
    ],
    blockedDates: ["2026-12-25"],
    setupFeeMinor: 9500,
    outdoorTermsExtra: "Marquee installs may require reschedule in storm warnings above wind threshold.",
    milestoneDepositTemplate: [
      { label: "Deposit to secure date", percent: 30, dueDaysBeforeEvent: undefined },
      { label: "Balance", percent: 70, dueDaysBeforeEvent: 7 },
    ],
  });

  await upsertQuoteTemplate(businessId, {
    name: "Birthday – standard",
    eventTypes: ["birthday"],
    presetLines: [
      { serviceName: "Balloon garland", quantity: 1 },
      { serviceName: "Table centrepieces", quantity: 8 },
      { serviceName: "Setup & delivery", quantity: 1 },
    ],
  });

  await upsertQuoteTemplate(businessId, {
    name: "Wedding – styling",
    eventTypes: ["wedding"],
    presetLines: [
      { serviceName: "Backdrop styling", quantity: 1 },
      { serviceName: "Chair covers & sashes", quantity: 1 },
      { serviceName: "Floral table runner", quantity: 12 },
      { serviceName: "Setup & delivery", quantity: 1 },
    ],
  });

  const [existingEnquiry] = await db
    .select({ id: enquiriesTable.id })
    .from(enquiriesTable)
    .where(eq(enquiriesTable.businessId, businessId))
    .limit(1);

  if (!existingEnquiry) {
  const sample = await submitPublicEnquiry("atelier-decor-dublin", {
    contactName: "Sarah Murphy",
    contactEmail: "sarah.murphy@example.com",
    contactPhone: "+353871234567",
    eventType: "birthday",
    eventDate: "2026-09-15",
    guestCount: 40,
    budgetRange: "€500–€1,000",
    theme: "Blush and gold",
    venue: "The Glass House, Dublin 8",
    servicesRequested: ["Balloon garland", "Table centrepieces"],
    preferredQuoteChannel: "whatsapp",
    source: "instagram",
    notes: "Surprise party for mum — need setup before 4pm.",
  });

  if (sample) {
    const quote = await generateQuoteFromEnquiry(businessId, sample.id);
    if (quote?.id) {
      await sendQuote(businessId, quote.id, "email");
    }
  }
  }

  await patchLivOutboundOverrides(
    businessId,
    defaultLivOutboundOverridesForVertical("event-vendors"),
  );
  await ensureDemoSentQuoteForDeposit(businessId);
  await seedDemoOperatorLearning(businessId);

  await ensureEventVendorSite(businessId);

  await pruneConsultFirstDemoCustomers(businessId);

  const customers = await db
    .select({
      id: customersTable.id,
      displayName: customersTable.displayName,
      email: customersTable.email,
      phone: customersTable.phone,
    })
    .from(customersTable)
    .where(eq(customersTable.businessId, businessId));
  await resyncConsultFirstDemoInbox(
    businessId,
    customers.map((c) => ({
      id: c.id,
      displayName: c.displayName ?? "Guest",
      email: c.email ?? "",
      phone: c.phone ?? "",
    })),
    "event-vendors",
  );
}

/** E2E walkthrough: public quote accept → pay deposit (dev sim when Stripe off). */
/** Teaches Liv pre-screen in demo — small birthdays declined, weddings quoted. */
async function seedDemoOperatorLearning(businessId: string) {
  const existing = await getOperatorDecisionPatterns(businessId);
  if (existing.length >= 2) return;

  const seeds = [
    formatOperatorDecisionMemory({
      kind: "decline",
      eventType: "birthday",
      guestCount: 18,
      budgetRange: "€200–€400",
    }),
    formatOperatorDecisionMemory({
      kind: "decline",
      eventType: "birthday",
      guestCount: 22,
      budgetRange: "under €500",
    }),
    formatOperatorDecisionMemory({
      kind: "quote_sent",
      eventType: "wedding",
      guestCount: 120,
      budgetRange: "€3,000+",
    }),
    formatOperatorDecisionMemory({
      kind: "booked",
      eventType: "wedding",
      guestCount: 95,
      budgetRange: "€2,500–€4,000",
    }),
  ];
  for (const content of seeds) {
    await appendLivMemory({
      businessId,
      entityType: "business",
      entityId: businessId,
      kind: "procedural",
      content,
      createdBy: "liv",
      ttlDays: 400,
    });
  }
}

async function ensureDemoSentQuoteForDeposit(businessId: string) {
  const [sent] = await db
    .select({ id: quotesTable.id })
    .from(quotesTable)
    .where(and(eq(quotesTable.businessId, businessId), eq(quotesTable.status, "sent")))
    .limit(1);
  if (sent) return;

  const [draft] = await db
    .select({ id: quotesTable.id })
    .from(quotesTable)
    .where(and(eq(quotesTable.businessId, businessId), eq(quotesTable.status, "draft")))
    .limit(1);
  if (draft) {
    await sendQuote(businessId, draft.id, "email");
    return;
  }

  const [enquiry] = await db
    .select({ id: enquiriesTable.id })
    .from(enquiriesTable)
    .where(eq(enquiriesTable.businessId, businessId))
    .limit(1);
  if (!enquiry) return;
  const quote = await generateQuoteFromEnquiry(businessId, enquiry.id);
  if (quote?.id) {
    await sendQuote(businessId, quote.id, "email");
  }
}

/** Demo E2E — first sent quote public token for event-vendors slug. */
export async function getDemoGuestQuoteToken(slug: string): Promise<string | null> {
  const [biz] = await db
    .select({ id: businessesTable.id, vertical: businessesTable.vertical })
    .from(businessesTable)
    .where(eq(businessesTable.slug, slug))
    .limit(1);
  if (!biz || biz.vertical !== "event-vendors") return null;

  const [quote] = await db
    .select({ publicToken: quotesTable.publicToken })
    .from(quotesTable)
    .where(and(eq(quotesTable.businessId, biz.id), eq(quotesTable.status, "sent")))
    .limit(1);
  return quote?.publicToken ?? null;
}
