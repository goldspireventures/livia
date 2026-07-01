import { and, eq, lt, sql } from "drizzle-orm";
import {
  db,
  bookingsTable,
  businessesTable,
  conversationMessagesTable,
  customersTable,
  servicesTable,
  staffTable,
} from "@workspace/db";
import {
  getContinuityTemplate,
  publicAwaitingContinuityHoldLines,
  publicPendingReasonLine,
  type ContinuityMode,
} from "@workspace/policy";
import { generateId } from "../lib/id";
import { createConversation, attachCustomer, getConversation } from "./conversations.service";
import { sendAiSms, sendAiEmail } from "./ai-outbound.service";
import { getPoliciesForBusinessId } from "./policies.service";
import { getBookingById } from "./bookings.service";
import { logEvent } from "./events.service";
import { ensureBookingGuestAccess } from "./booking-guest-access.service";
import { resolveGuestVisitTokenUrl } from "../lib/guest-public-urls";

function formatLocal(iso: string, timezone: string, locale: string): string {
  try {
    return new Intl.DateTimeFormat(locale, {
      dateStyle: "medium",
      timeStyle: "short",
      timeZone: timezone,
    }).format(new Date(iso));
  } catch {
    return new Date(iso).toLocaleString();
  }
}

export async function runBookingContinuityBridge(
  businessId: string,
  bookingId: string,
): Promise<{ ok: boolean; skipped?: string; conversationId?: string }> {
  const enriched = await getBookingById(businessId, bookingId);
  if (!enriched) return { ok: false, skipped: "booking_not_found" };

  if (enriched.continuitySentAt) {
    return { ok: true, skipped: "already_sent", conversationId: enriched.continuityConversationId ?? undefined };
  }

  const policies = await getPoliciesForBusinessId(businessId);
  if (!policies?.operational.bookingContinuityEnabled) {
    return { ok: false, skipped: "continuity_disabled" };
  }

  const customer = enriched.customer;
  if (!customer) return { ok: false, skipped: "no_customer" };

  const mode: ContinuityMode =
    (policies.operational.bookingContinuityMode as ContinuityMode) ?? "sms_thread";
  const [biz] = await db
    .select()
    .from(businessesTable)
    .where(eq(businessesTable.id, businessId));
  if (!biz) return { ok: false, skipped: "no_business" };

  const template = getContinuityTemplate(
    biz.vertical as Parameters<typeof getContinuityTemplate>[0],
    biz.locale,
  );
  const bookingRef = bookingId.slice(-8).toUpperCase();
  const guestToken = await ensureBookingGuestAccess(businessId, bookingId);
  const visitUrl = resolveGuestVisitTokenUrl(biz.slug, guestToken);
  const msgArgs = {
    businessName: biz.name,
    serviceName: enriched.service?.name ?? "Appointment",
    staffDisplayName: enriched.staff?.displayName ?? null,
    startAtLocal: formatLocal(
      new Date(enriched.startAt).toISOString(),
      biz.timezone,
      biz.locale,
    ),
    bookingRef,
    instagramHandle: biz.instagramHandle,
    visitUrl,
    bookingStatus: enriched.status,
    pendingReason: enriched.pendingReason ?? null,
  };

  const existingSourceId = enriched.sourceConversationId?.trim() || null;
  let conversation =
    existingSourceId ? await getConversation(existingSourceId).catch(() => null) : null;
  if (!conversation || conversation.businessId !== businessId) {
    conversation = await createConversation({
      businessId,
      channel: mode === "whatsapp_thread" ? "WHATSAPP" : mode === "email_only" ? "EMAIL" : "SMS",
      customerName: [customer.firstName, customer.lastName].filter(Boolean).join(" ") || undefined,
      customerEmail: customer.email ?? undefined,
      customerPhone: customer.phone ?? undefined,
    });
    await attachCustomer(conversation.id, customer.id, {
      name: [customer.firstName, customer.lastName].filter(Boolean).join(" "),
      email: customer.email ?? undefined,
      phone: customer.phone ?? undefined,
    });
  } else if (!conversation.customerId) {
    await attachCustomer(conversation.id, customer.id, {
      name: [customer.firstName, customer.lastName].filter(Boolean).join(" "),
      email: customer.email ?? undefined,
      phone: customer.phone ?? undefined,
    });
  }

  const body = template.smsBody(msgArgs);

  if (mode === "email_only" && customer.email) {
    await sendAiEmail({
      businessId,
      businessName: biz.name,
      customerId: customer.id,
      bookingId,
      to: customer.email,
      subject: template.emailSubject(msgArgs),
      body: template.emailBody(msgArgs),
      fromAddress: biz.resendFromAddress,
    });
  } else if (customer.phone && mode !== "instagram_deep_link") {
    await sendAiSms({
      conversationId: conversation.id,
      businessId,
      businessName: biz.name,
      customerId: customer.id,
      customerPhone: customer.phone,
      content: body,
      fromPhone: biz.twilioPhoneNumber,
    });
  } else if (customer.email) {
    await sendAiEmail({
      businessId,
      businessName: biz.name,
      customerId: customer.id,
      bookingId,
      to: customer.email,
      subject: template.emailSubject(msgArgs),
      body: template.emailBody(msgArgs),
      fromAddress: biz.resendFromAddress,
    });
  } else {
    return { ok: false, skipped: "no_contact_channel" };
  }

  const now = new Date();
  await db
    .update(bookingsTable)
    .set({
      continuityConversationId: conversation.id,
      continuitySentAt: now,
      sourceConversationId: enriched.sourceConversationId ?? conversation.id,
      updatedAt: now,
    })
    .where(and(eq(bookingsTable.id, bookingId), eq(bookingsTable.businessId, businessId)));

  await logEvent({
    type: "BOOKING_CONTINUITY_SENT",
    businessId,
    entityType: "booking",
    entityId: bookingId,
    context: { conversationId: conversation.id, mode },
  });

  return { ok: true, conversationId: conversation.id };
}

export async function listStuckContinuityBookings(businessId: string, slaHours = 24) {
  const cutoff = new Date(Date.now() - slaHours * 60 * 60 * 1000);
  const rows = await db
    .select({
      booking: bookingsTable,
      customerFirstName: customersTable.firstName,
      customerLastName: customersTable.lastName,
      serviceName: servicesTable.name,
    })
    .from(bookingsTable)
    .innerJoin(customersTable, eq(bookingsTable.customerId, customersTable.id))
    .innerJoin(servicesTable, eq(bookingsTable.serviceId, servicesTable.id))
    .where(
      and(
        eq(bookingsTable.businessId, businessId),
        eq(bookingsTable.status, "PENDING"),
        eq(bookingsTable.pendingReason, "awaiting_continuity"),
        lt(bookingsTable.continuitySentAt, cutoff),
      ),
    )
    .limit(50);

  const stuck: typeof rows = [];
  for (const row of rows) {
    if (!row.booking.continuityConversationId) {
      stuck.push(row);
      continue;
    }
    const [reply] = await db
      .select({ id: conversationMessagesTable.id })
      .from(conversationMessagesTable)
      .where(
        and(
          eq(conversationMessagesTable.conversationId, row.booking.continuityConversationId),
          eq(conversationMessagesTable.role, "USER"),
          sql`${conversationMessagesTable.createdAt} > ${row.booking.continuitySentAt}`,
        ),
      )
      .limit(1);
    if (!reply) stuck.push(row);
  }

  return stuck.map((r) => ({
    bookingId: r.booking.id,
    startAt: r.booking.startAt,
    customerName: [r.customerFirstName, r.customerLastName].filter(Boolean).join(" "),
    serviceName: r.serviceName,
    continuitySentAt: r.booking.continuitySentAt,
  }));
}

export function buildPublicNextSteps(args: {
  vertical: string;
  businessName: string;
  serviceName: string;
  staffDisplayName: string | null;
  startAt: string;
  timezone: string;
  locale: string;
  bookingId: string;
  instagramHandle?: string | null;
  status: string;
  pendingReason?: string | null;
  visitUrl?: string | null;
}): string[] {
  const template = getContinuityTemplate(
    args.vertical as Parameters<typeof getContinuityTemplate>[0],
    args.locale,
  );
  const bookingRef = args.bookingId.slice(-8).toUpperCase();
  const messageArgs = {
    businessName: args.businessName,
    serviceName: args.serviceName,
    staffDisplayName: args.staffDisplayName,
    startAtLocal: formatLocal(args.startAt, args.timezone, args.locale),
    bookingRef,
    instagramHandle: args.instagramHandle,
    visitUrl: args.visitUrl ?? null,
  };

  if (args.status === "PENDING" && args.pendingReason === "awaiting_continuity") {
    return publicAwaitingContinuityHoldLines(args.vertical);
  }
  if (args.status === "PENDING") {
    const reason = publicPendingReasonLine(
      args.pendingReason ?? null,
      args.businessName,
      args.vertical,
    );
    return [reason, ...template.publicNextSteps(messageArgs).slice(-1)];
  }

  const steps = template.publicNextSteps(messageArgs);
  const confirmedLead =
    args.vertical === "wellness" ? "Your session is confirmed." : "You're confirmed.";
  const receivedLead =
    args.vertical === "wellness"
      ? "We've received your session request."
      : "We've received your booking.";
  if (args.status === "CONFIRMED") {
    return [confirmedLead, ...steps.slice(1)];
  }
  return [receivedLead, ...steps];
}
