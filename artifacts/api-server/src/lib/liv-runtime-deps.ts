import type { Business } from "@workspace/db";
import type { LivSlot, LivToolDeps } from "@workspace/liv-runtime";
import { recordEvalTraceForTool } from "./eval-traces";
import { createBookingViaLiv } from "../services/liv-booking.service";
import { getAvailableSlots } from "../services/slots.service";
import { sendStaffMessage } from "../services/conversations.service";
import {
  confirmBooking,
  cancelBookingWithReason,
  rescheduleBooking,
} from "../services/bookings.service";
import { lookupCustomersForLiv } from "../services/customers.service";
import { getMorningBriefing } from "../services/morning-briefing.service";
import { getBookingById } from "../services/bookings.service";
import { listStuckContinuityBookings } from "../services/booking-continuity.service";

export function buildLivToolDeps(args: {
  business: Business;
  conversationId: string;
  channelType: "WEB" | "SMS" | "WHATSAPP" | "INSTAGRAM" | "MESSENGER" | "VOICE";
  /** When set, send_message and staff booking tools are enabled. */
  staffAuthorUserId?: string;
}): LivToolDeps {
  const { business, conversationId, channelType, staffAuthorUserId } = args;
  const businessId = business.id;

  const base: LivToolDeps = {
    async findSlots(input) {
      const slots = await getAvailableSlots({
        businessId,
        serviceId: input.serviceId,
        date: input.date,
        staffId: input.staffId,
        timezone: business.timezone,
      });
      const available: LivSlot[] = slots
        .filter((s: { available: boolean }) => s.available)
        .map(
          (s: {
            startAt: string;
            endAt: string;
            staffId?: string | null;
            staffName?: string | null;
          }) => ({
            startAt: s.startAt,
            endAt: s.endAt,
            staffId: s.staffId ?? null,
            staffName: s.staffName ?? null,
          }),
        );

      await recordEvalTraceForTool({
        businessId,
        suite: "liv.book",
        scenario: "find_slots",
        toolName: "find_slots",
        toolInput: input,
        toolResult: { slotCount: available.length },
      });

      return available;
    },

    async createBooking(input) {
      return createBookingViaLiv({
        businessId,
        conversationId,
        channelType,
        serviceId: input.serviceId,
        startAt: input.startAt,
        staffId: input.staffId,
        customerFirstName: input.customerFirstName,
        customerLastName: input.customerLastName,
        customerEmail: input.customerEmail,
        customerPhone: input.customerPhone,
        notes: input.notes,
      });
    },
  };

  if (!staffAuthorUserId) return base;

  return {
    ...base,
    async sendMessage(input) {
      const row = await sendStaffMessage({
        businessId,
        conversationId,
        authorUserId: staffAuthorUserId,
        content: input.content,
      });
      return { messageId: row.id };
    },
    async confirmBooking(input) {
      const row = await confirmBooking(businessId, input.bookingId);
      if (!row) throw new Error("BOOKING_NOT_FOUND");
      return { bookingId: row.id, status: row.status };
    },
    async cancelBooking(input) {
      const row = await cancelBookingWithReason(businessId, input.bookingId, input.reason);
      if (!row) throw new Error("BOOKING_NOT_FOUND");
      return { bookingId: row.id, status: row.status };
    },
    async rescheduleBooking(input) {
      const row = await rescheduleBooking(businessId, input.bookingId, input.startAt);
      return { bookingId: row.id, startAt: row.startAt, endAt: row.endAt };
    },
    async lookupCustomer(input) {
      const res = await lookupCustomersForLiv(businessId, input.query.trim(), 8);
      return {
        customers: res.data.map((c) => ({
          id: c.id,
          displayName: c.displayName,
          email: c.email,
          phone: c.phone,
          trustedClient: c.trustedClient,
          strikeCount: c.strikeCount,
        })),
        total: res.total,
      };
    },
    async morningBriefing() {
      const b = await getMorningBriefing(businessId);
      return { briefing: b };
    },
    async getBooking(input) {
      const row = await getBookingById(businessId, input.bookingId);
      if (!row) return { ok: false, error: "NOT_FOUND" };
      return {
        ok: true,
        booking: {
          id: row.id,
          status: row.status,
          pendingReason: row.pendingReason,
          startAt: row.startAt,
          endAt: row.endAt,
          customerName: row.customer?.displayName ?? null,
          serviceName: row.service?.name ?? null,
          staffName: row.staff?.displayName ?? null,
        },
      };
    },
    async listStuckContinuity(input) {
      const rows = await listStuckContinuityBookings(businessId);
      const limit = input.limit ?? 10;
      return {
        stuck: rows.slice(0, limit).map((r) => ({
          bookingId: r.bookingId,
          customerName: r.customerName,
          serviceName: r.serviceName,
          startAt: r.startAt,
        })),
        total: rows.length,
      };
    },
  };
}
