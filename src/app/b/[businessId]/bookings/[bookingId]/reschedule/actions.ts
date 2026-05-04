"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { requireOwnerUserId } from "@/lib/ownerSession";
import { assertUserRole } from "@/services/business/membershipService";
import { updateBooking } from "@/services/booking/bookingService";
import { listOwnerSlotsForDay } from "@/services/availability/slotService";

const Schema = z.object({
  businessId: z.string().min(1),
  bookingId: z.string().min(1),
  serviceId: z.string().min(1),
  dateStr: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  slotKey: z.string().min(1),
});

export async function rescheduleBookingAction(formData: FormData) {
  const businessId = z.string().min(1).parse(formData.get("businessId")?.toString());
  const bookingId = z.string().min(1).parse(formData.get("bookingId")?.toString());

  const parsed = Schema.parse({
    businessId,
    bookingId,
    serviceId: formData.get("serviceId")?.toString(),
    dateStr: formData.get("dateStr")?.toString(),
    slotKey: formData.get("slotKey")?.toString(),
  });

  const [staffId, startsAtIso, endsAtIso] = parsed.slotKey.split("|");
  if (!staffId || !startsAtIso || !endsAtIso) {
    throw new Error("Invalid slot selection.");
  }

  const userId = await requireOwnerUserId();
  await assertUserRole({
    userId,
    businessId: parsed.businessId,
    allowedRoles: ["OWNER", "ADMIN", "STAFF"],
    options: { emitAccessChecked: false },
  });

  // Validate the chosen slot is still offered at submit time.
  const offered = await listOwnerSlotsForDay({
    businessId: parsed.businessId,
    serviceId: parsed.serviceId,
    dateStr: parsed.dateStr,
    staffId,
  });
  const ok = offered.some(
    (s) => s.staffId === staffId && s.startsAt === startsAtIso && s.endsAt === endsAtIso,
  );
  if (!ok) {
    throw new Error("That slot is no longer available. Reload slots and try again.");
  }

  await updateBooking({
    businessId: parsed.businessId,
    bookingId: parsed.bookingId,
    actorUserId: userId,
    data: {
      staffId,
      startsAt: new Date(startsAtIso),
      endsAt: new Date(endsAtIso),
    },
  });

  revalidatePath(`/b/${businessId}/bookings/${bookingId}`);
  revalidatePath(`/b/${businessId}/bookings`);
  redirect(`/b/${businessId}/bookings/${bookingId}`);
}

