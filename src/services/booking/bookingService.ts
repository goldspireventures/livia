import { Prisma, type BookingStatus } from "@prisma/client";
import { z } from "zod";

import { LiviaEventTypes, logEvent } from "@/lib/events";
import { badRequest, conflict, notFound } from "@/lib/errors";
import { prisma } from "@/lib/prisma";
import { getServiceById } from "@/services/catalog/serviceCatalogService";
import { getCustomerById } from "@/services/customer/customerService";
import { fanOutInAppAndPushToBusinessAdmins } from "@/services/notifications/notifyBusinessAdmins";
import { getStaffById } from "@/services/staff/staffService";

const BookingStatusSchema = z.enum([
  "DRAFT",
  "PENDING",
  "CONFIRMED",
  "CANCELLED",
  "COMPLETED",
  "NO_SHOW",
]);

function assertRangeOrder(startsAt: Date, endsAt: Date) {
  if (!(startsAt < endsAt)) {
    throw badRequest("endsAt must be after startsAt.");
  }
}

function addMinutes(d: Date, minutes: number) {
  return new Date(d.getTime() + minutes * 60_000);
}

async function assertStaffAssignedToService({
  businessId,
  staffId,
  serviceId,
}: {
  businessId: string;
  staffId: string;
  serviceId: string;
}) {
  const link = await prisma.staffServiceAssignment.findFirst({
    where: { businessId, staffId, serviceId },
    select: { id: true },
  });
  if (!link) {
    throw badRequest("Selected staff member is not assigned to this service.");
  }
}

async function assertNoStaffOverlap({
  businessId,
  staffId,
  startsAt,
  endsAt,
  excludeBookingId,
}: {
  businessId: string;
  staffId: string;
  startsAt: Date;
  endsAt: Date;
  excludeBookingId?: string;
}) {
  const overlap = await prisma.booking.findFirst({
    where: {
      businessId,
      staffId,
      status: { not: "CANCELLED" },
      ...(excludeBookingId ? { NOT: { id: excludeBookingId } } : {}),
      AND: [{ startsAt: { lt: endsAt } }, { endsAt: { gt: startsAt } }],
    },
    select: { id: true, startsAt: true, endsAt: true },
  });
  if (overlap) {
    throw conflict("Staff member already has a booking that overlaps this time.");
  }
}

const CreateBookingInput = z.object({
  businessId: z.string().min(1),
  actorUserId: z.string().min(1),
  customerId: z.string().min(1),
  serviceId: z.string().min(1),
  staffId: z.string().min(1).optional().nullable(),
  startsAt: z.coerce.date(),
  endsAt: z.coerce.date().optional(),
  status: BookingStatusSchema.optional(),
  notes: z.string().optional().nullable(),
  internalNotes: z.string().optional().nullable(),
  metadata: z.record(z.string(), z.any()).optional().nullable(),
});

export async function createBooking(input: z.infer<typeof CreateBookingInput>) {
  const parsed = CreateBookingInput.parse(input);
  const {
    businessId,
    actorUserId,
    customerId,
    serviceId,
    staffId,
    startsAt,
    endsAt: endsAtInput,
    status,
    notes,
    internalNotes,
    metadata,
  } = parsed;

  await getCustomerById({ businessId, customerId });
  const service = await getServiceById({ businessId, serviceId });
  if (!service.active) {
    throw badRequest("Service is not active.");
  }

  const resolvedEndsAt = endsAtInput ?? addMinutes(startsAt, service.durationMinutes);
  assertRangeOrder(startsAt, resolvedEndsAt);

  if (staffId) {
    const staff = await getStaffById({ businessId, staffId });
    if (!staff.active) {
      throw badRequest("Staff member is not active.");
    }
    await assertStaffAssignedToService({ businessId, staffId, serviceId });
    await assertNoStaffOverlap({ businessId, staffId, startsAt, endsAt: resolvedEndsAt });
  }

  const resolvedStatus = (status ?? "PENDING") as BookingStatus;

  const booking = await prisma.booking.create({
    data: {
      businessId,
      customerId,
      serviceId,
      staffId: staffId ?? null,
      startsAt,
      endsAt: resolvedEndsAt,
      status: resolvedStatus,
      notes: notes?.trim() ?? null,
      internalNotes: internalNotes?.trim() ?? null,
      metadata: metadata ?? undefined,
    },
    include: {
      customer: { select: { displayName: true } },
      service: { select: { name: true } },
      staff: { select: { displayName: true } },
    },
  });

  await logEvent({
    type: LiviaEventTypes.BOOKING_CREATED,
    source: "api",
    businessId,
    actorUserId,
    subjectType: "Booking",
    subjectId: booking.id,
    payload: {
      customerId,
      serviceId,
      staffId: booking.staffId,
      status: booking.status,
      startsAt: booking.startsAt.toISOString(),
      endsAt: booking.endsAt.toISOString(),
    },
  });

  const when = `${booking.startsAt.toISOString().replace("T", " ").slice(0, 16)} UTC`;
  const staffPart = booking.staff ? ` · ${booking.staff.displayName}` : "";
  void fanOutInAppAndPushToBusinessAdmins({
    businessId,
    excludeUserId: actorUserId,
    kind: "BOOKING_CREATED",
    title: "New booking",
    body: `${booking.customer.displayName} · ${booking.service.name} · ${when}${staffPart}`,
    href: `/b/${businessId}/bookings/${booking.id}`,
    payload: { bookingId: booking.id },
    push: {
      title: "New booking",
      body: `${booking.customer.displayName} · ${booking.service.name}`,
    },
    auditWebPush: {
      templateKey: "booking_created_admin_push",
      payload: { bookingId: booking.id },
    },
  }).catch((err) => console.error("[BOOKING_CREATED notify]", err));

  return booking;
}

const ListBookingsInput = z.object({
  businessId: z.string().min(1),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
  status: BookingStatusSchema.optional(),
  customerId: z.string().min(1).optional(),
  staffId: z.string().min(1).optional(),
});

export async function listBookingsForBusiness(input: z.infer<typeof ListBookingsInput>) {
  const { businessId, from, to, status, customerId, staffId } = ListBookingsInput.parse(input);

  const rangeFilter =
    from && to
      ? {
          AND: [{ startsAt: { lt: to } }, { endsAt: { gt: from } }],
        }
      : from
        ? { endsAt: { gt: from } }
        : to
          ? { startsAt: { lt: to } }
          : {};

  return prisma.booking.findMany({
    where: {
      businessId,
      ...(status ? { status: status as BookingStatus } : {}),
      ...(customerId ? { customerId } : {}),
      ...(staffId ? { staffId } : {}),
      ...rangeFilter,
    },
    orderBy: { startsAt: "asc" },
    include: {
      customer: { select: { id: true, displayName: true } },
      service: { select: { id: true, name: true, durationMinutes: true } },
      staff: { select: { id: true, displayName: true } },
    },
  });
}

const GetBookingInput = z.object({
  businessId: z.string().min(1),
  bookingId: z.string().min(1),
});

export async function getBookingById(input: z.infer<typeof GetBookingInput>) {
  const { businessId, bookingId } = GetBookingInput.parse(input);
  const booking = await prisma.booking.findFirst({
    where: { id: bookingId, businessId },
    include: {
      customer: { select: { id: true, displayName: true } },
      service: { select: { id: true, name: true, durationMinutes: true } },
      staff: { select: { id: true, displayName: true } },
    },
  });
  if (!booking) throw notFound("Booking not found.");
  return booking;
}

const UpdateBookingInput = z.object({
  businessId: z.string().min(1),
  bookingId: z.string().min(1),
  actorUserId: z.string().min(1),
  data: z
    .object({
      customerId: z.string().min(1).optional(),
      serviceId: z.string().min(1).optional(),
      staffId: z.string().min(1).optional().nullable(),
      startsAt: z.coerce.date().optional(),
      endsAt: z.coerce.date().optional().nullable(),
      status: BookingStatusSchema.optional(),
      notes: z.string().optional().nullable(),
      internalNotes: z.string().optional().nullable(),
      metadata: z.record(z.string(), z.any()).optional().nullable(),
    })
    .strict(),
});

export async function updateBooking(input: z.infer<typeof UpdateBookingInput>) {
  const { businessId, bookingId, actorUserId, data } = UpdateBookingInput.parse(input);

  const existing = await getBookingById({ businessId, bookingId });

  const nextCustomerId = data.customerId ?? existing.customerId;
  const nextServiceId = data.serviceId ?? existing.serviceId;
  const nextStaffId = data.staffId !== undefined ? data.staffId : existing.staffId;
  const nextStartsAt = data.startsAt ?? existing.startsAt;
  let nextEndsAt = data.endsAt !== undefined ? data.endsAt : existing.endsAt;

  await getCustomerById({ businessId, customerId: nextCustomerId });
  const service = await getServiceById({ businessId, serviceId: nextServiceId });
  if (!service.active) {
    throw badRequest("Service is not active.");
  }

  if (nextEndsAt === null) {
    nextEndsAt = addMinutes(nextStartsAt, service.durationMinutes);
  }

  assertRangeOrder(nextStartsAt, nextEndsAt);

  if (nextStaffId) {
    const staff = await getStaffById({ businessId, staffId: nextStaffId });
    if (!staff.active) {
      throw badRequest("Staff member is not active.");
    }
    await assertStaffAssignedToService({
      businessId,
      staffId: nextStaffId,
      serviceId: nextServiceId,
    });
    await assertNoStaffOverlap({
      businessId,
      staffId: nextStaffId,
      startsAt: nextStartsAt,
      endsAt: nextEndsAt,
      excludeBookingId: bookingId,
    });
  }

  const updated = await prisma.booking.update({
    where: { id: bookingId },
    data: {
      customerId: nextCustomerId,
      serviceId: nextServiceId,
      staffId: nextStaffId,
      startsAt: nextStartsAt,
      endsAt: nextEndsAt,
      ...(data.status !== undefined ? { status: data.status as BookingStatus } : {}),
      ...(data.notes !== undefined ? { notes: data.notes === null ? null : data.notes.trim() } : {}),
      ...(data.internalNotes !== undefined
        ? { internalNotes: data.internalNotes === null ? null : data.internalNotes.trim() }
        : {}),
      ...(data.metadata !== undefined ? { metadata: data.metadata === null ? Prisma.JsonNull : data.metadata } : {}),
    },
  });

  await logEvent({
    type: LiviaEventTypes.BOOKING_UPDATED,
    source: "api",
    businessId,
    actorUserId,
    subjectType: "Booking",
    subjectId: bookingId,
    payload: { updatedFields: Object.keys(data) },
  });

  const rescheduled =
    (data.startsAt !== undefined && data.startsAt.getTime() !== existing.startsAt.getTime()) ||
    (data.endsAt !== undefined && (data.endsAt === null ? null : data.endsAt.getTime()) !== existing.endsAt.getTime()) ||
    (data.staffId !== undefined && data.staffId !== existing.staffId);

  if (rescheduled) {
    const when = `${updated.startsAt.toISOString().replace("T", " ").slice(0, 16)} UTC`;
    const staffName = nextStaffId ? ` · ${nextStaffId}` : "";
    void fanOutInAppAndPushToBusinessAdmins({
      businessId,
      excludeUserId: actorUserId,
      kind: "BOOKING_RESCHEDULED",
      title: "Booking rescheduled",
      body: `${existing.customer.displayName} · ${existing.service.name} · ${when}${staffName}`,
      href: `/b/${businessId}/bookings/${bookingId}`,
      payload: {
        bookingId,
        previousStartsAt: existing.startsAt.toISOString(),
        nextStartsAt: updated.startsAt.toISOString(),
        previousStaffId: existing.staffId,
        nextStaffId,
      },
      push: {
        title: "Booking rescheduled",
        body: `${existing.customer.displayName} · ${existing.service.name} · ${when}`,
      },
      auditWebPush: {
        templateKey: "booking_rescheduled_admin_push",
        payload: { bookingId },
      },
    }).catch((err) => console.error("[BOOKING_RESCHEDULED notify]", err));
  }

  if (data.status !== undefined && data.status !== existing.status) {
    const when = `${updated.startsAt.toISOString().replace("T", " ").slice(0, 16)} UTC`;
    void fanOutInAppAndPushToBusinessAdmins({
      businessId,
      excludeUserId: actorUserId,
      kind: "BOOKING_STATUS_CHANGED",
      title: "Booking status updated",
      body: `${existing.customer.displayName} · ${existing.service.name} · ${when} → ${data.status}`,
      href: `/b/${businessId}/bookings/${bookingId}`,
      payload: {
        bookingId,
        previousStatus: existing.status,
        nextStatus: data.status,
      },
      push: {
        title: "Booking updated",
        body: `${existing.customer.displayName}: ${existing.status} → ${data.status}`,
      },
      auditWebPush: {
        templateKey: "booking_status_admin_push",
        payload: {
          bookingId,
          previousStatus: existing.status,
          nextStatus: data.status,
        },
      },
    }).catch((err) => console.error("[BOOKING_STATUS_CHANGED notify]", err));
  }

  return updated;
}

export async function listUpcomingBookingsForUser(input: { userId: string; limit?: number }) {
  const { userId, limit = 25 } = input;
  const now = new Date();
  return prisma.booking.findMany({
    where: {
      startsAt: { gte: now },
      status: { notIn: ["CANCELLED"] },
      business: {
        memberships: { some: { userId } },
      },
    },
    orderBy: { startsAt: "asc" },
    take: limit,
    include: {
      business: { select: { id: true, name: true, slug: true } },
      service: { select: { name: true, durationMinutes: true } },
      customer: { select: { displayName: true } },
      staff: { select: { displayName: true } },
    },
  });
}
