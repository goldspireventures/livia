"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireOwnerUserId } from "@/lib/ownerSession";
import { assertUserRole } from "@/services/business/membershipService";
import { updateBooking } from "@/services/booking/bookingService";

const StatusSchema = z.enum([
  "DRAFT",
  "PENDING",
  "CONFIRMED",
  "CANCELLED",
  "COMPLETED",
  "NO_SHOW",
]);

export async function updateBookingStatusAction(formData: FormData) {
  const businessId = z.string().min(1).parse(formData.get("businessId")?.toString());
  const bookingId = z.string().min(1).parse(formData.get("bookingId")?.toString());
  const status = StatusSchema.parse(formData.get("status")?.toString());

  const userId = await requireOwnerUserId();
  await assertUserRole({
    userId,
    businessId,
    allowedRoles: ["OWNER", "ADMIN", "STAFF"],
    options: { emitAccessChecked: false },
  });

  await updateBooking({
    businessId,
    bookingId,
    actorUserId: userId,
    data: { status },
  });

  revalidatePath(`/b/${businessId}/bookings/${bookingId}`);
  revalidatePath(`/b/${businessId}/bookings`);
}
