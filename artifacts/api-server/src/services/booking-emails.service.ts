// Booking-lifecycle email senders. Templates live in
// `@workspace/integrations-resend/templates`; sendAiEmail applies the
// Art. 50 disclosure once on the persisted body. Fire-and-forget from
// the booking write path — send failures never fail the booking.

import {
  renderBookingConfirmationEmail,
  renderBookingReminderEmail,
  renderBookingCancellationEmail,
  type BookingTemplateContext,
} from "@workspace/integrations-resend/templates";
import { db, businessesTable, type Business, type Booking } from "@workspace/db";
import { eq } from "drizzle-orm";
import { sendAiEmail } from "./ai-outbound.service";
import { AI_DISCLOSURE } from "@workspace/ai-disclosure";
import { logger } from "../lib/logger";

interface EnrichedBooking extends Booking {
  service: { name: string; durationMinutes: number };
  customer: { firstName: string | null; displayName: string | null; email: string | null; phone: string | null };
  staff: { displayName: string } | null;
}

function formatStartAt(startAt: Date, timezone: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: timezone,
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(startAt);
}

function customerFirstName(c: EnrichedBooking["customer"]): string {
  return (c.firstName ?? c.displayName?.split(" ")[0] ?? "there").trim() || "there";
}

function manageUrl(business: Business, _booking: Booking): string {
  const base = process.env["PUBLIC_BASE_URL"] ?? "https://livia.io";
  return `${base.replace(/\/+$/, "")}/b/${business.slug}`;
}

function buildContext(args: {
  business: Business;
  booking: EnrichedBooking;
}): BookingTemplateContext {
  const { business, booking } = args;
  const startAtFormatted = formatStartAt(booking.startAt, business.timezone);
  // Plain body — sendAiEmail() runs composeAiEmailBody() once on this
  // text before persisting / sending so the Art. 50 disclosure is added
  // exactly once. Pre-composing here would double-print the disclosure.
  const bodyText = `Hi ${customerFirstName(booking.customer)},\n\nYour booking with ${business.name} is set:\n${booking.service.name}${booking.staff ? ` with ${booking.staff.displayName}` : ""}\n${startAtFormatted} · ${booking.service.durationMinutes} min`;
  return {
    businessName: business.name,
    customerFirstName: customerFirstName(booking.customer),
    serviceName: booking.service.name,
    staffName: booking.staff?.displayName ?? null,
    startAtFormatted,
    durationMinutes: booking.service.durationMinutes,
    locationLine: business.addressLine1
      ? [business.addressLine1, business.city].filter(Boolean).join(", ")
      : null,
    manageUrl: manageUrl(business, booking),
    bodyText,
    disclosureLine: AI_DISCLOSURE.emailBlock(business.name),
  };
}

async function loadBusinessIfMissing(business: Business | string): Promise<Business | null> {
  if (typeof business !== "string") return business;
  const [b] = await db.select().from(businessesTable).where(eq(businessesTable.id, business));
  return b ?? null;
}

async function sendTemplate(args: {
  business: Business | string;
  booking: EnrichedBooking;
  templateKey: string;
  render: (c: BookingTemplateContext) => { subject: string; html: string; text: string };
}): Promise<void> {
  const business = await loadBusinessIfMissing(args.business);
  if (!business) return;
  const to = args.booking.customer.email;
  if (!to) return; // No email on file → silently skip; SMS path covers it.

  const ctx = buildContext({ business, booking: args.booking });
  const rendered = args.render(ctx);

  try {
    await sendAiEmail({
      businessId: business.id,
      businessName: business.name,
      customerId: args.booking.customerId,
      bookingId: args.booking.id,
      to,
      subject: rendered.subject,
      body: rendered.text,
      html: rendered.html,
      templateKey: args.templateKey,
      fromAddress: business.resendFromAddress ?? null,
    });
  } catch (err) {
    // Booking write path must not fail because email failed.
    logger.error(
      { err, bookingId: args.booking.id, businessId: business.id, templateKey: args.templateKey },
      "Booking lifecycle email failed",
    );
  }
}

export async function sendBookingConfirmationEmail(args: {
  business: Business | string;
  booking: EnrichedBooking;
}): Promise<void> {
  await sendTemplate({
    business: args.business,
    booking: args.booking,
    templateKey: "booking-confirmation",
    render: renderBookingConfirmationEmail,
  });
}

export async function sendBookingReminderEmail(args: {
  business: Business | string;
  booking: EnrichedBooking;
}): Promise<void> {
  await sendTemplate({
    business: args.business,
    booking: args.booking,
    templateKey: "booking-reminder-t24",
    render: renderBookingReminderEmail,
  });
}

export async function sendBookingCancellationEmail(args: {
  business: Business | string;
  booking: EnrichedBooking;
  reason?: string | null;
}): Promise<void> {
  await sendTemplate({
    business: args.business,
    booking: args.booking,
    templateKey: "booking-cancellation",
    render: (c) => renderBookingCancellationEmail({ ...c, reason: args.reason ?? null, rebookUrl: c.manageUrl ?? null }),
  });
}

// Pure helpers re-exported for tests + the test-send route.
export { buildContext as _buildBookingTemplateContext };
