/**
 * Post-session aftercare — service text + tenant policy + guest channel preference.
 */
import {
  db,
  businessesTable,
  bookingsTable,
  customersTable,
  servicesTable,
  retailProductsTable,
  retailOrdersTable,
  guestIdentitiesTable,
  aftercareSequenceStepsTable,
  notificationLogsTable,
} from "@workspace/db";
import { eq, and, desc } from "drizzle-orm";
import {
  resolveAftercareMessageBody,
  resolveGuestCareAutomation,
  resolveRetailProductForService,
  resolveOutboundChannel,
  aftercareDelayMs,
  type BusinessVertical,
  type GuestPreferredModality,
} from "@workspace/policy";
import { generateId } from "../lib/id";
import { getBookingById } from "./bookings.service";
import { appendMessage, createConversation, attachCustomer } from "./conversations.service";
import { sendAiSms, sendAiEmail } from "./ai-outbound.service";
import { resolveGuestManageVisitUrl } from "../lib/guest-public-urls";

const TEMPLATE_KEY = "guest-care-aftercare";

export async function buildAftercareBodyForBooking(
  businessId: string,
  bookingId: string,
): Promise<{ body: string; mode: string } | null> {
  const booking = await getBookingById(businessId, bookingId);
  if (!booking || booking.status !== "COMPLETED") return null;

  const [biz] = await db
    .select()
    .from(businessesTable)
    .where(eq(businessesTable.id, businessId))
    .limit(1);
  if (!biz) return null;

  const care = resolveGuestCareAutomation({
    vertical: biz.vertical as BusinessVertical,
    operationalPolicy: biz.operationalPolicy,
  });
  if (!care.aftercareEnabled || care.aftercareMode === "manual_only") return null;

  const [svc] = await db
    .select()
    .from(servicesTable)
    .where(eq(servicesTable.id, booking.serviceId))
    .limit(1);

  let retailProductName: string | null = null;
  let retailUsageText: string | null = null;

  if (care.retailAftercareEnabled && svc?.linkedRetailProductId) {
    const [product] = await db
      .select()
      .from(retailProductsTable)
      .where(eq(retailProductsTable.id, svc.linkedRetailProductId))
      .limit(1);
    if (product) {
      retailProductName = product.name;
      retailUsageText = product.aftercareUsageText ?? null;
    }
  }

  if (care.retailAftercareEnabled && !retailProductName && svc) {
    const catalog = await db
      .select({
        id: retailProductsTable.id,
        name: retailProductsTable.name,
        category: retailProductsTable.category,
        linkedServiceCategory: retailProductsTable.linkedServiceCategory,
        aftercareUsageText: retailProductsTable.aftercareUsageText,
        isActive: retailProductsTable.isActive,
      })
      .from(retailProductsTable)
      .where(
        and(
          eq(retailProductsTable.businessId, businessId),
          eq(retailProductsTable.isActive, true),
        ),
      );
    const matched = resolveRetailProductForService({
      products: catalog,
      serviceCategory: svc.category,
      linkedProductId: svc.linkedRetailProductId,
    });
    if (matched) {
      const row = catalog.find((p) => p.id === matched.id);
      retailProductName = matched.name;
      retailUsageText = row?.aftercareUsageText ?? null;
    }
  }

  if (care.retailAftercareEnabled && booking.customerId) {
    const [recentOrder] = await db
      .select({ productId: retailOrdersTable.productId })
      .from(retailOrdersTable)
      .where(
        and(
          eq(retailOrdersTable.businessId, businessId),
          eq(retailOrdersTable.customerId, booking.customerId),
          eq(retailOrdersTable.status, "PAID"),
        ),
      )
      .orderBy(desc(retailOrdersTable.createdAt))
      .limit(1);
    if (recentOrder?.productId) {
      const [product] = await db
        .select()
        .from(retailProductsTable)
        .where(eq(retailProductsTable.id, recentOrder.productId))
        .limit(1);
      if (product?.aftercareUsageText) {
        retailProductName = product.name;
        retailUsageText = product.aftercareUsageText;
      }
    }
  }

  const visitUrl = resolveGuestManageVisitUrl(biz.slug, bookingId);
  const body = resolveAftercareMessageBody({
    vertical: biz.vertical as BusinessVertical,
    businessName: biz.name,
    serviceName: booking.service?.name ?? svc?.name ?? "your visit",
    serviceCategory: svc?.category ?? null,
    serviceInstructions: svc?.aftercareInstructions ?? null,
    visitUrl,
    retailProductName,
    retailUsageText,
  });

  return { body, mode: care.aftercareMode };
}

export async function prepareAftercareOnComplete(businessId: string, bookingId: string) {
  const built = await buildAftercareBodyForBooking(businessId, bookingId);
  if (!built) return { skipped: true as const };

  const [biz] = await db
    .select({ vertical: businessesTable.vertical, operationalPolicy: businessesTable.operationalPolicy })
    .from(businessesTable)
    .where(eq(businessesTable.id, businessId))
    .limit(1);

  const care = resolveGuestCareAutomation({
    vertical: (biz?.vertical ?? "hair") as BusinessVertical,
    operationalPolicy: biz?.operationalPolicy,
  });

  if (built.mode === "liv_draft") {
    const booking = await getBookingById(businessId, bookingId);
    const chairNote = booking?.internalNotes?.trim();
    const draftBody = chairNote
      ? `${built.body}\n\nFrom your visit: ${chairNote}`
      : built.body;
    await db
      .update(bookingsTable)
      .set({
        aftercareDraftBody: draftBody,
        aftercareStatus: "draft",
        updatedAt: new Date(),
      })
      .where(eq(bookingsTable.id, bookingId));
    return { draft: true as const };
  }

  await scheduleAftercareSequenceIfNeeded(businessId, bookingId, built.body, care.aftercareSequenceDays);
  return { scheduled: true as const, delay: care.aftercareDelay };
}

export async function sendAftercareForBooking(
  businessId: string,
  bookingId: string,
  opts?: { forceBody?: string },
): Promise<{ sent: boolean; skipped?: string; channel?: string }> {
  const booking = await getBookingById(businessId, bookingId);
  if (!booking) return { sent: false, skipped: "not_found" };
  if (booking.aftercareSentAt) return { sent: false, skipped: "already_sent" };

  const built = opts?.forceBody
    ? { body: opts.forceBody, mode: "auto" }
    : await buildAftercareBodyForBooking(businessId, bookingId);
  if (!built) return { sent: false, skipped: "disabled" };

  const [biz] = await db
    .select()
    .from(businessesTable)
    .where(eq(businessesTable.id, businessId))
    .limit(1);
  if (!biz) return { sent: false, skipped: "no_business" };

  const [cust] = await db
    .select()
    .from(customersTable)
    .where(eq(customersTable.id, booking.customerId))
    .limit(1);
  if (!cust) return { sent: false, skipped: "no_customer" };

  const care = resolveGuestCareAutomation({
    vertical: biz.vertical as BusinessVertical,
    operationalPolicy: biz.operationalPolicy,
  });

  let guestPref: GuestPreferredModality = "ANY";
  if (cust.phone) {
    const [guest] = await db
      .select({ preferredModality: guestIdentitiesTable.preferredModality })
      .from(guestIdentitiesTable)
      .where(eq(guestIdentitiesTable.phoneE164, cust.phone))
      .limit(1);
    if (guest?.preferredModality) {
      guestPref = guest.preferredModality as GuestPreferredModality;
    }
  }
  if (cust.preferredModality && cust.preferredModality !== "ANY") {
    guestPref = cust.preferredModality as GuestPreferredModality;
  }

  const channel = resolveOutboundChannel({
    preferredModality: guestPref,
    aftercareChannel: care.aftercareChannel,
    hasContinuityThread: Boolean(booking.continuityConversationId),
    hasPhone: Boolean(cust.phone),
    hasEmail: Boolean(cust.email),
    lastInboundChannel: cust.lastInboundChannel,
    lastInboundAt: cust.lastInboundAt,
  });

  const body = built.body;
  const name =
    cust.displayName?.trim() || cust.firstName?.trim() || "there";

  if (channel === "THREAD" && booking.continuityConversationId) {
    await appendMessage({
      conversationId: booking.continuityConversationId,
      role: "ASSISTANT",
      content: body,
      bookingId,
    });
    if (cust.phone && biz.twilioPhoneNumber) {
      await sendAiSms({
        conversationId: booking.continuityConversationId,
        businessId,
        businessName: biz.name,
        customerId: cust.id,
        customerPhone: cust.phone,
        content: body,
        fromPhone: biz.twilioPhoneNumber,
      });
    }
    await markAftercareSent(bookingId);
    return { sent: true, channel: "THREAD" };
  }

  if (channel === "EMAIL" && cust.email) {
    await sendAiEmail({
      businessId,
      businessName: biz.name,
      to: cust.email,
      subject: `After your visit at ${biz.name}`,
      body: `Hi ${name},\n\n${body}`,
      customerId: cust.id,
    });
    await markAftercareSent(bookingId);
    return { sent: true, channel: "EMAIL" };
  }

  if (!cust.phone || !biz.twilioPhoneNumber) {
    return { sent: false, skipped: "no_phone" };
  }

  let conversationId = booking.continuityConversationId ?? booking.sourceConversationId;
  if (!conversationId) {
    const conv = await createConversation({
      businessId,
      channel: "SMS",
      customerName: name,
      customerPhone: cust.phone,
    });
    await attachCustomer(conv.id, cust.id, { name, phone: cust.phone });
    conversationId = conv.id;
  }

  const sent = await sendAiSms({
    conversationId,
    businessId,
    businessName: biz.name,
    customerId: cust.id,
    customerPhone: cust.phone,
    content: body,
    fromPhone: biz.twilioPhoneNumber,
  });

  if (sent.status === "SENT") {
    await db.insert(notificationLogsTable).values({
      id: generateId(),
      businessId,
      customerId: cust.id,
      channel: "SMS",
      templateKey: TEMPLATE_KEY,
      status: "SENT",
      payload: { bookingId, body },
      sentAt: new Date(),
    });
    await markAftercareSent(bookingId);
    return { sent: true, channel: "SMS" };
  }

  return { sent: false, skipped: "send_failed" };
}

async function markAftercareSent(bookingId: string) {
  await db
    .update(bookingsTable)
    .set({
      aftercareSentAt: new Date(),
      aftercareStatus: "sent",
      aftercareDraftBody: null,
      updatedAt: new Date(),
    })
    .where(eq(bookingsTable.id, bookingId));
}

async function scheduleAftercareSequenceIfNeeded(
  businessId: string,
  bookingId: string,
  primaryBody: string,
  sequenceDays?: number[],
) {
  if (!sequenceDays?.length) return;
  const base = Date.now();
  const followUps = sequenceDays.filter((d) => d > 0);
  for (let i = 0; i < followUps.length; i++) {
    const day = followUps[i]!;
    const scheduledAt = new Date(base + day * 24 * 60 * 60 * 1000);
    const body =
      day === 1
        ? "Day 1 check-in — how is healing going? Reply with a photo if anything looks unusual."
        : day === 3
          ? "Day 3 — keep following your aftercare. Reply here with any questions."
          : `Day ${day} follow-up from your studio — reply if you need a touch-up or have concerns.`;
    await db.insert(aftercareSequenceStepsTable).values({
      id: generateId(),
      businessId,
      bookingId,
      stepIndex: i + 1,
      scheduledAt,
      body,
      status: "pending",
    });
  }
}

export async function processDueAftercareSequences(): Promise<{ sent: number }> {
  const now = new Date();
  const due = await db
    .select()
    .from(aftercareSequenceStepsTable)
    .where(eq(aftercareSequenceStepsTable.status, "pending"))
    .limit(50);

  let sent = 0;
  for (const step of due) {
    if (step.scheduledAt > now) continue;
    const result = await sendAftercareForBooking(step.businessId, step.bookingId, {
      forceBody: step.body,
    });
    if (result.sent) {
      await db
        .update(aftercareSequenceStepsTable)
        .set({ status: "sent", sentAt: new Date() })
        .where(eq(aftercareSequenceStepsTable.id, step.id));
      sent++;
    }
  }
  return { sent };
}

export function aftercareWorkflowDelayMs(businessId: string): Promise<number> {
  return db
    .select({ vertical: businessesTable.vertical, operationalPolicy: businessesTable.operationalPolicy })
    .from(businessesTable)
    .where(eq(businessesTable.id, businessId))
    .limit(1)
    .then(([biz]) => {
      const care = resolveGuestCareAutomation({
        vertical: (biz?.vertical ?? "hair") as BusinessVertical,
        operationalPolicy: biz?.operationalPolicy,
      });
      return aftercareDelayMs(care.aftercareDelay);
    });
}
