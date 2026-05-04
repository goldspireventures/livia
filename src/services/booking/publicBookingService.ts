import "server-only";

import { formatInTimeZone } from "date-fns-tz";
import { z } from "zod";

import { getTimezoneFromBusinessSettings } from "@/lib/businessSettings";
import { badRequest, notFound } from "@/lib/errors";
import { prisma } from "@/lib/prisma";
import { listPublicSlotsForDay } from "@/services/availability/slotService";
import { isWindowInPublicSlotList } from "@/services/availability/slotUtils";
import { getBusinessBySlug } from "@/services/business/businessService";
import { createBooking } from "@/services/booking/bookingService";
import { createChannelIdentityForCustomer } from "@/services/customer/channelIdentityService";
import { createCustomer } from "@/services/customer/customerService";
import { getServiceById } from "@/services/catalog/serviceCatalogService";
import { dispatchPublicBookingCreatedNotifications } from "@/services/notifications/bookingNotificationDispatch";
import { getStaffById } from "@/services/staff/staffService";

const CreatePublicBookingInput = z.object({
  businessSlug: z.string().min(1),
  serviceId: z.string().min(1).max(64),
  staffId: z.string().min(1).max(64),
  startsAt: z.coerce.date(),
  customerName: z.string().min(1).max(120),
  customerEmail: z.string().email().max(320),
});

async function getFirstOwnerUserId(businessId: string): Promise<string> {
  const m = await prisma.businessMembership.findFirst({
    where: { businessId, role: "OWNER" },
    orderBy: { createdAt: "asc" },
    select: { userId: true },
  });
  if (!m) throw badRequest("Business has no owner membership.");
  return m.userId;
}

function assertPublicStartTimeOk(startsAt: Date, businessTz: string): void {
  const now = new Date();
  const nowMs = now.getTime();
  const startsMs = startsAt.getTime();
  if (!Number.isFinite(startsMs)) throw badRequest("Invalid startsAt.");
  if (startsMs < nowMs - 5 * 60_000) throw badRequest("Start time is in the past.");

  const dateStr = formatInTimeZone(startsAt, businessTz, "yyyy-MM-dd");
  const todayStr = formatInTimeZone(now, businessTz, "yyyy-MM-dd");
  const dayA = new Date(`${todayStr}T12:00:00Z`).getTime();
  const dayB = new Date(`${dateStr}T12:00:00Z`).getTime();
  const diffDays = Math.floor((dayB - dayA) / (24 * 60 * 60 * 1000));
  if (diffDays > 180) throw badRequest("Start time is too far in the future.");
}

export async function createPublicBooking(input: z.infer<typeof CreatePublicBookingInput>) {
  const parsed = CreatePublicBookingInput.parse(input);
  const { businessSlug, serviceId, staffId, startsAt, customerName, customerEmail } = parsed;

  const business = await getBusinessBySlug({ slug: businessSlug });
  if (!business) throw notFound("Business not found.");

  const ownerUserId = await getFirstOwnerUserId(business.id);
  const bizTz = getTimezoneFromBusinessSettings(business.settings);
  assertPublicStartTimeOk(startsAt, bizTz);
  const dateStr = formatInTimeZone(startsAt, bizTz, "yyyy-MM-dd");

  const service = await getServiceById({ businessId: business.id, serviceId });
  const staff = await getStaffById({ businessId: business.id, staffId });
  const endsAt = new Date(startsAt.getTime() + service.durationMinutes * 60_000);

  const offeredSlots = await listPublicSlotsForDay({
    businessSlug,
    serviceId,
    dateStr,
  });
  const okSlot = isWindowInPublicSlotList(offeredSlots, staffId, startsAt, endsAt);
  if (!okSlot) {
    throw badRequest("That time is not available for booking.");
  }

  const email = customerEmail.trim().toLowerCase();
  const displayName = customerName.trim();
  if (displayName.length === 0) throw badRequest("Customer name is required.");
  const existingChannel = await prisma.channelIdentity.findFirst({
    where: { businessId: business.id, channel: "EMAIL", value: email },
    select: { customerId: true },
  });

  let customerId = existingChannel?.customerId ?? null;
  if (!customerId) {
    const customer = await createCustomer({
      businessId: business.id,
      actorUserId: ownerUserId,
      displayName,
      notes: null,
      metadata: { source: "public_booking" },
    });
    try {
      await createChannelIdentityForCustomer({
        businessId: business.id,
        customerId: customer.id,
        actorUserId: ownerUserId,
        channel: "EMAIL",
        value: email,
        metadata: null,
      });
    } catch {
      throw badRequest("Could not register this email for booking.");
    }
    customerId = customer.id;
  }

  const booking = await createBooking({
    businessId: business.id,
    actorUserId: ownerUserId,
    customerId,
    serviceId,
    staffId,
    startsAt,
    endsAt,
    status: "PENDING",
    notes: `Public booking (${email})`,
    internalNotes: null,
    metadata: { channel: "public_web" },
  });

  void dispatchPublicBookingCreatedNotifications({
    booking,
    businessName: business.name,
    businessSlug: business.slug,
    serviceName: service.name,
    staffDisplayName: staff.displayName,
    customerEmail: email,
    customerName: displayName,
  }).catch((err) => {
    console.error("[dispatchPublicBookingCreatedNotifications]", err);
  });

  return booking;
}

export async function getPublicBusinessOverview(slug: string) {
  const business = await getBusinessBySlug({ slug });
  if (!business) return null;
  const services = await prisma.service.findMany({
    where: { businessId: business.id, active: true },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    select: {
      id: true,
      name: true,
      description: true,
      durationMinutes: true,
      basePriceMinorUnits: true,
      currency: true,
    },
  });
  return {
    name: business.name,
    slug: business.slug,
    timezone: getTimezoneFromBusinessSettings(business.settings),
    services,
  };
}
