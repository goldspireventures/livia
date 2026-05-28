/**
 * Staff push + notification_logs for operational events.
 * Fan-out from domain-events and direct calls (Meta inbound).
 */
import type { EventName, EventPayload } from "@workspace/event-bus";
import { and, eq } from "drizzle-orm";
import {
  bookingsTable,
  businessMembershipsTable,
  businessesTable,
  customersTable,
  db,
  notificationLogsTable,
} from "@workspace/db";
import {
  buildBookingCancelledPush,
  buildBookingCreatedPush,
  buildInboxHandoffPush,
  buildInboxInboundPush,
  parseNotificationPrefs,
} from "@workspace/policy";
import { generateId } from "../lib/id";
import { logger } from "../lib/logger";
import { enrichBooking } from "./bookings.service";
import { getConversation } from "./conversations.service";
import {
  deliverInAppNotification,
  inAppAllowedForPrefs,
} from "./in-app-notifications.service";
import { notifyBusinessMembersPushForRoles } from "./push.service";
import type { InAppNotificationKind } from "@workspace/policy";

async function loadBusinessContext(businessId: string) {
  const [biz] = await db
    .select({
      name: businessesTable.name,
      timezone: businessesTable.timezone,
      vertical: businessesTable.vertical,
      category: businessesTable.category,
      operationalPolicy: businessesTable.operationalPolicy,
    })
    .from(businessesTable)
    .where(eq(businessesTable.id, businessId))
    .limit(1);
  if (!biz) return null;
  const prefs = parseNotificationPrefs(biz.operationalPolicy);
  return { ...biz, prefs };
}

async function logPush(
  businessId: string,
  templateKey: string,
  payload: Record<string, unknown>,
  bookingId?: string,
  customerId?: string,
): Promise<void> {
  try {
    await db.insert(notificationLogsTable).values({
      id: generateId(),
      businessId,
      bookingId: bookingId ?? null,
      customerId: customerId ?? null,
      channel: "PUSH",
      templateKey,
      status: "SENT",
      payload,
      sentAt: new Date(),
    });
  } catch (err) {
    logger.warn({ err, templateKey, businessId }, "notification log insert failed");
  }
}

export async function notifyInboxInbound(args: {
  businessId: string;
  conversationId: string;
  channel: string;
  customerName?: string | null;
  preview: string;
  livWillReply: boolean;
}): Promise<void> {
  const ctx = await loadBusinessContext(args.businessId);
  if (!ctx?.prefs.pushInboxInbound) return;

  const copy = buildInboxInboundPush({
    businessName: ctx.name,
    channel: args.channel,
    customerName: args.customerName,
    preview: args.preview,
    livWillReply: args.livWillReply,
  });

  const result = await notifyBusinessMembersPushForRoles({
    businessId: args.businessId,
    roles: ["OWNER", "ADMIN"],
    title: copy.title,
    body: copy.body,
    data: {
      type: "inbox.inbound",
      businessId: args.businessId,
      conversationId: args.conversationId,
    },
  });

  if (result.sent > 0) {
    await logPush(args.businessId, "push-inbox-inbound", {
      conversationId: args.conversationId,
      sent: result.sent,
    });
  }

  if (ctx.prefs.pushInboxInbound) {
    await deliverInAppNotification({
      kind: "inbox.inbound",
      businessId: args.businessId,
      title: copy.title,
      body: copy.body,
      priority: args.livWillReply ? "info" : "watch",
      resourceKind: "conversation",
      resourceId: args.conversationId,
      dedupeKey: `inbox-inbound:${args.conversationId}`,
      audience: "inbox_team",
    });
  }
}

export async function notifyLivBookedViaChannel(args: {
  businessId: string;
  bookingId: string;
  conversationId: string;
  channel: string;
  customerName?: string | null;
  serviceName?: string | null;
  startAt: string;
}): Promise<void> {
  const ctx = await loadBusinessContext(args.businessId);
  if (!ctx?.prefs.pushLivBookingViaChannel) return;

  const ch = args.channel.toUpperCase();
  const source =
    ch === "WHATSAPP"
      ? "whatsapp"
      : ch === "INSTAGRAM"
        ? "instagram"
        : ch === "SMS"
          ? "sms"
          : "web";

  const startLocal = new Date(args.startAt).toLocaleString("en-IE", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: ctx.timezone ?? "Europe/Dublin",
  });

  const copy = buildBookingCreatedPush({
    businessName: ctx.name,
    vertical: ctx.vertical,
    category: ctx.category,
    customerName: args.customerName,
    serviceName: args.serviceName,
    startLocal,
    source,
  });

  const result = await notifyBusinessMembersPushForRoles({
    businessId: args.businessId,
    roles: ["OWNER", "ADMIN"],
    title: `Liv booked · ${copy.title}`,
    body: copy.body,
    data: {
      type: "inbox.liv_booked",
      businessId: args.businessId,
      bookingId: args.bookingId,
      conversationId: args.conversationId,
    },
  });

  if (result.sent > 0) {
    await logPush(args.businessId, "push-liv-booked-channel", {
      bookingId: args.bookingId,
      conversationId: args.conversationId,
      sent: result.sent,
    });
  }

  await deliverInAppNotification({
    kind: "inbox.liv_booked",
    businessId: args.businessId,
    title: `Liv booked · ${copy.title}`,
    body: copy.body,
    priority: "info",
    resourceKind: "booking",
    resourceId: args.bookingId,
    dedupeKey: `liv-booked:${args.bookingId}`,
    audience: "inbox_team",
  });
}

export async function notifyInboxHandoff(args: {
  businessId: string;
  conversationId: string;
}): Promise<void> {
  const ctx = await loadBusinessContext(args.businessId);
  if (!ctx?.prefs.pushInboxHandoff) return;

  const conv = await getConversation(args.conversationId);
  if (!conv) return;

  const copy = buildInboxHandoffPush({
    businessName: ctx.name,
    channel: conv.channel,
    customerName: conv.customerName,
  });

  const result = await notifyBusinessMembersPushForRoles({
    businessId: args.businessId,
    roles: ["OWNER", "ADMIN"],
    title: copy.title,
    body: copy.body,
    data: {
      type: "inbox.handoff",
      businessId: args.businessId,
      conversationId: args.conversationId,
    },
  });

  if (result.sent > 0) {
    await logPush(args.businessId, "push-inbox-handoff", {
      conversationId: args.conversationId,
      sent: result.sent,
    });
  }

  await deliverInAppNotification({
    kind: "inbox.handoff",
    businessId: args.businessId,
    title: copy.title,
    body: copy.body,
    priority: "act",
    resourceKind: "conversation",
    resourceId: args.conversationId,
    dedupeKey: `inbox-handoff:${args.conversationId}`,
    audience: "inbox_team",
  });
}

export async function notifyBookingCreatedFromRow(bookingId: string, businessId: string): Promise<void> {
  const ctx = await loadBusinessContext(businessId);
  const [row] = await db
    .select()
    .from(bookingsTable)
    .where(and(eq(bookingsTable.id, bookingId), eq(bookingsTable.businessId, businessId)))
    .limit(1);
  if (!row) return;

  if (!ctx) return;
  if (row.status === "PENDING" && !ctx.prefs.pushBookingPending) return;
  if (row.status !== "PENDING" && !ctx.prefs.pushBookingCreated) return;

  const booking = await enrichBooking(row);

  const startLocal = new Date(booking.startAt).toLocaleString("en-IE", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: ctx.timezone ?? "Europe/Dublin",
  });

  const copy =
    row.status === "PENDING"
      ? {
          title: ctx.name ? `Approve booking · ${ctx.name}` : "Booking needs approval",
          body: `${booking.customer?.displayName ?? booking.customer?.firstName ?? "A client"} — ${booking.service?.name ?? "appointment"} on ${startLocal}.`,
        }
      : buildBookingCreatedPush({
          businessName: ctx.name,
          vertical: ctx.vertical,
          category: ctx.category,
          customerName: booking.customer?.displayName ?? booking.customer?.firstName,
          serviceName: booking.service?.name,
          startLocal,
          source: booking.source ?? undefined,
        });

  const result = await notifyBusinessMembersPushForRoles({
    businessId,
    roles: ["OWNER", "ADMIN", "STAFF"],
    title: copy.title,
    body: copy.body,
    data: {
      type: "booking.created",
      businessId,
      bookingId,
    },
  });

  if (result.sent > 0) {
    await logPush(
      businessId,
      "push-booking-created",
      { bookingId, sent: result.sent },
      bookingId,
      booking.customerId,
    );
  }

  const inAppKind: InAppNotificationKind =
    row.status === "PENDING" ? "booking.pending" : "booking.created";
  if (inAppAllowedForPrefs(inAppKind, ctx.prefs)) {
    await deliverInAppNotification({
      kind: inAppKind,
      businessId,
      title: copy.title,
      body: copy.body,
      priority: row.status === "PENDING" ? "act" : "info",
      resourceKind: "booking",
      resourceId: bookingId,
      dedupeKey: `${inAppKind}:${bookingId}`,
      assignedStaffId: row.staffId,
      audience: "operators",
    });
  }
}

export async function notifyBookingCancelledFromPayload(
  payload: EventPayload<"booking.cancelled">,
): Promise<void> {
  const ctx = await loadBusinessContext(payload.businessId);
  if (!ctx?.prefs.pushBookingCancelled) return;

  const [row] = await db
    .select()
    .from(bookingsTable)
    .where(
      and(eq(bookingsTable.id, payload.bookingId), eq(bookingsTable.businessId, payload.businessId)),
    )
    .limit(1);
  if (!row) return;

  const [customer] = row.customerId
    ? await db
        .select({ firstName: customersTable.firstName, lastName: customersTable.lastName })
        .from(customersTable)
        .where(eq(customersTable.id, row.customerId))
        .limit(1)
    : [null];

  const customerName = customer
    ? [customer.firstName, customer.lastName].filter(Boolean).join(" ")
    : null;

  const startLocal = new Date(row.startAt).toLocaleString("en-IE", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: ctx.timezone ?? "Europe/Dublin",
  });

  const copy = buildBookingCancelledPush({
    businessName: ctx.name,
    vertical: ctx.vertical,
    category: ctx.category,
    customerName,
    startLocal,
  });

  const result = await notifyBusinessMembersPushForRoles({
    businessId: payload.businessId,
    roles: ["OWNER", "ADMIN", "STAFF"],
    title: copy.title,
    body: copy.body,
    data: {
      type: "booking.cancelled",
      businessId: payload.businessId,
      bookingId: payload.bookingId,
    },
  });

  if (result.sent > 0) {
    await logPush(
      payload.businessId,
      "push-booking-cancelled",
      { bookingId: payload.bookingId, sent: result.sent },
      payload.bookingId,
      row.customerId,
    );
  }

  if (inAppAllowedForPrefs("booking.cancelled", ctx.prefs)) {
    await deliverInAppNotification({
      kind: "booking.cancelled",
      businessId: payload.businessId,
      title: copy.title,
      body: copy.body,
      priority: "watch",
      resourceKind: "booking",
      resourceId: payload.bookingId,
      dedupeKey: `booking.cancelled:${payload.bookingId}`,
      assignedStaffId: row.staffId,
      audience: "operators",
    });
  }
}

/** Domain-event fan-out for staff push (idempotent with domain dedupe). */
export async function processPushNotificationsForEvent(
  name: EventName,
  payload: EventPayload<EventName>,
): Promise<void> {
  try {
    if (name === "booking.created") {
      const p = payload as EventPayload<"booking.created">;
      await notifyBookingCreatedFromRow(p.bookingId, p.businessId);
      return;
    }
    if (name === "booking.cancelled") {
      await notifyBookingCancelledFromPayload(payload as EventPayload<"booking.cancelled">);
      return;
    }
    if (name === "conversation.updated") {
      const p = payload as EventPayload<"conversation.updated">;
      if (p.status === "HANDED_OFF") {
        await notifyInboxHandoff({
          businessId: p.businessId,
          conversationId: p.conversationId,
        });
      }
      return;
    }
    if (name === "morning.briefing.ready") {
      const p = payload as EventPayload<"morning.briefing.ready">;
      await notifyMorningBriefingReady({
        businessId: p.businessId,
        briefingId: p.briefingId,
        briefingDate: p.briefingDate,
      });
      return;
    }
    if (name === "refund.proposed") {
      const p = payload as EventPayload<"refund.proposed">;
      await notifyLivProposalPending({
        businessId: p.businessId,
        proposalId: p.refundId,
        action: "process_refund",
        preview: "Refund needs your approval",
        valueMinor: p.amountEurCents,
      });
    }
  } catch (err) {
    logger.warn({ err, name }, "push notification fanout failed");
  }
}

export async function notifyLivProposalPending(args: {
  businessId: string;
  proposalId: string;
  action: string;
  preview: string;
  valueMinor?: number;
}): Promise<void> {
  const ctx = await loadBusinessContext(args.businessId);
  if (!ctx) return;

  const amount =
    args.valueMinor && args.valueMinor > 0
      ? ` · €${(args.valueMinor / 100).toFixed(0)}`
      : "";
  const title = `Liv proposal · ${args.action.replace(/_/g, " ")}`;
  const body = `${args.preview}${amount}`;

  await deliverInAppNotification({
    kind: args.action === "process_refund" ? "refund.pending" : "liv.proposal.pending",
    businessId: args.businessId,
    title,
    body,
    priority: "act",
    resourceKind: "liv_proposal",
    resourceId: args.proposalId,
    dedupeKey: `liv.proposal:${args.proposalId}`,
    audience: "operators",
  });
}

export async function notifyMorningBriefingReady(args: {
  businessId: string;
  briefingId: string;
  briefingDate: string;
}): Promise<void> {
  const ctx = await loadBusinessContext(args.businessId);
  if (!ctx) return;

  await deliverInAppNotification({
    kind: "morning.briefing.ready",
    businessId: args.businessId,
    title: `Morning briefing · ${ctx.name}`,
    body: `Your ${args.briefingDate} briefing is ready on Today.`,
    priority: "info",
    resourceKind: "briefing",
    resourceId: args.briefingId,
    dedupeKey: `morning.briefing:${args.businessId}:${args.briefingDate}`,
    audience: "operators",
  });
}
