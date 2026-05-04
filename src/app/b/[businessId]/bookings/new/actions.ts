"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { requireOwnerUserId } from "@/lib/ownerSession";
import { assertUserRole } from "@/services/business/membershipService";
import { createBooking } from "@/services/booking/bookingService";

const CreateSchema = z.object({
  businessId: z.string().min(1),
  customerId: z.string().min(1),
  serviceId: z.string().min(1),
  slotKey: z.string().min(1),
});

export async function createOwnerBookingAction(formData: FormData) {
  const businessId = z.string().min(1).parse(formData.get("businessId")?.toString());
  const parsed = CreateSchema.parse({
    businessId,
    customerId: formData.get("customerId")?.toString(),
    serviceId: formData.get("serviceId")?.toString(),
    slotKey: formData.get("slotKey")?.toString(),
  });

  const [staffId, startsAt] = parsed.slotKey.split("|");
  if (!staffId || !startsAt) {
    throw new Error("Invalid slot selection.");
  }

  const userId = await requireOwnerUserId();
  await assertUserRole({
    userId,
    businessId: parsed.businessId,
    allowedRoles: ["OWNER", "ADMIN", "STAFF"],
    options: { emitAccessChecked: false },
  });

  const booking = await createBooking({
    businessId: parsed.businessId,
    actorUserId: userId,
    customerId: parsed.customerId,
    serviceId: parsed.serviceId,
    staffId,
    // Treat the input as ISO; recommend entering UTC in UI for now.
    startsAt: new Date(startsAt),
    status: "CONFIRMED",
    notes: "Created from owner workspace",
    internalNotes: null,
    metadata: { source: "owner_workspace" },
  });

  revalidatePath(`/b/${businessId}/bookings`);
  redirect(`/b/${businessId}/bookings/${booking.id}`);
}

