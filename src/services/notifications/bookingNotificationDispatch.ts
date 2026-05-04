import "server-only";

import type { Booking } from "@prisma/client";

import { env } from "@/lib/env";

import { createInAppNotification } from "./inAppNotificationService";
import { listAdminUserIdsForBusiness } from "./notifyBusinessAdmins";
import { createNotificationLog, finalizeNotificationLog } from "./notificationLogService";
import { sendEmailViaResend } from "./resendOutbound";
import { sendWebPushToUser } from "./webPushOutbound";

function redactEmailTarget(email: string): string {
  const [local, domain] = email.split("@");
  if (!domain) return "***";
  const safeLocal = local.length <= 2 ? "***" : `${local.slice(0, 2)}***`;
  return `${safeLocal}@${domain}`;
}

function customerEmailOutboundEnabled(): boolean {
  const v = process.env.NOTIFICATION_EMAIL_ENABLED?.trim().toLowerCase();
  return v === "true" || v === "1" || v === "yes";
}

/**
 * Fire-and-forget friendly: catches internally; safe to `void` from routes.
 */
export async function dispatchPublicBookingCreatedNotifications(input: {
  booking: Booking;
  businessName: string;
  businessSlug: string;
  serviceName: string;
  staffDisplayName: string;
  customerEmail: string;
  customerName: string;
}): Promise<void> {
  const { booking, businessName, businessSlug, serviceName, staffDisplayName, customerEmail, customerName } = input;
  const appBase = env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ?? "";

  const when = `${booking.startsAt.toISOString().replace("T", " ").slice(0, 16)} UTC`;

  const adminIds = await listAdminUserIdsForBusiness(booking.businessId);
  const bookingHref = `/b/${booking.businessId}/bookings/${booking.id}`;

  // --- In-app inbox (owner / admin) — primary channel until email is opted in ---
  for (const userId of adminIds) {
    await createInAppNotification({
      userId,
      businessId: booking.businessId,
      kind: "PUBLIC_BOOKING_CREATED",
      title: "New booking",
      body: `${customerName} · ${serviceName} · ${when}`,
      href: bookingHref,
      payload: { bookingId: booking.id, businessSlug },
    });
  }

  // --- Customer email (opt-in: NOTIFICATION_EMAIL_ENABLED + Resend) ---
  if (customerEmailOutboundEnabled()) {
    const customerSubject = `Booking request at ${businessName}`;
    const customerHtml = `
    <p>Hi ${escapeHtml(customerName)},</p>
    <p>Thanks for booking with <strong>${escapeHtml(businessName)}</strong>.</p>
    <ul>
      <li><strong>Service:</strong> ${escapeHtml(serviceName)}</li>
      <li><strong>When:</strong> ${escapeHtml(when)}</li>
      <li><strong>Staff:</strong> ${escapeHtml(staffDisplayName)}</li>
    </ul>
    <p>Status: <strong>${escapeHtml(booking.status)}</strong>. The business may confirm or adjust your appointment.</p>
    ${appBase ? `<p><a href="${escapeHtml(`${appBase}/book/${businessSlug}`)}">View booking page</a></p>` : ""}
    <p style="color:#666;font-size:12px">Sent by Bliq</p>
  `.trim();

    const emailLog = await createNotificationLog({
      businessId: booking.businessId,
      channel: "EMAIL",
      templateKey: "public_booking_customer_email",
      payload: { bookingId: booking.id },
      target: redactEmailTarget(customerEmail),
    });

    if (!env.RESEND_API_KEY || !env.NOTIFICATION_EMAIL_FROM) {
      await finalizeNotificationLog(emailLog.id, { status: "SKIPPED", lastError: "resend_not_configured" });
    } else {
      const sent = await sendEmailViaResend({
        to: customerEmail,
        subject: customerSubject,
        html: customerHtml,
      });
      if ("error" in sent) {
        await finalizeNotificationLog(emailLog.id, { status: "FAILED", lastError: sent.error });
      } else {
        await finalizeNotificationLog(emailLog.id, { status: "SENT", providerMessageId: sent.id });
      }
    }
  }

  // --- Owner / admin web push ---
  const pushTitle = "New booking";
  const pushBody = `${customerName} · ${serviceName} · ${when}`;

  for (const userId of adminIds) {
    const log = await createNotificationLog({
      businessId: booking.businessId,
      recipientUserId: userId,
      channel: "WEB_PUSH",
      templateKey: "public_booking_admin_push",
      payload: { bookingId: booking.id },
      target: "web_push",
    });

    if (!env.VAPID_PUBLIC_KEY || !env.VAPID_PRIVATE_KEY || !env.VAPID_SUBJECT) {
      await finalizeNotificationLog(log.id, { status: "SKIPPED", lastError: "vapid_not_configured" });
      continue;
    }

    const result = await sendWebPushToUser({
      userId,
      payload: {
        title: pushTitle,
        body: pushBody,
        url: appBase ? `${appBase}${bookingHref}` : undefined,
      },
    });

    if (result.attempted === 0) {
      await finalizeNotificationLog(log.id, {
        status: "SKIPPED",
        lastError: result.errors[0] ?? "no_subscriptions",
      });
    } else if (result.delivered > 0) {
      await finalizeNotificationLog(log.id, { status: "SENT" });
    } else {
      await finalizeNotificationLog(log.id, {
        status: "FAILED",
        lastError: result.errors.join("; ").slice(0, 500),
      });
    }
  }
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
