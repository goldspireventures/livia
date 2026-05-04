"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { requireOwnerUserId } from "@/lib/ownerSession";
import { assertUserRole } from "@/services/business/membershipService";
import { createCustomer, updateCustomer } from "@/services/customer/customerService";

export async function createCustomerAction(formData: FormData) {
  const businessId = z.string().min(1).parse(formData.get("businessId")?.toString());
  const displayName = z.string().min(1).parse(formData.get("displayName")?.toString().trim());
  const notesRaw = formData.get("notes")?.toString() ?? "";
  const notes = notesRaw.trim() === "" ? null : notesRaw.trim();

  const userId = await requireOwnerUserId();
  await assertUserRole({
    userId,
    businessId,
    allowedRoles: ["OWNER", "ADMIN"],
    options: { emitAccessChecked: false },
  });

  const customer = await createCustomer({
    businessId,
    actorUserId: userId,
    displayName,
    notes,
    metadata: null,
  });

  revalidatePath(`/b/${businessId}/customers`);
  redirect(`/b/${businessId}/customers/${customer.id}`);
}

export async function updateCustomerAction(formData: FormData) {
  const businessId = z.string().min(1).parse(formData.get("businessId")?.toString());
  const customerId = z.string().min(1).parse(formData.get("customerId")?.toString());
  const displayName = z.string().min(1).parse(formData.get("displayName")?.toString().trim());
  const notesRaw = formData.get("notes")?.toString() ?? "";
  const notes = notesRaw.trim() === "" ? null : notesRaw.trim();

  const userId = await requireOwnerUserId();
  await assertUserRole({
    userId,
    businessId,
    allowedRoles: ["OWNER", "ADMIN"],
    options: { emitAccessChecked: false },
  });

  await updateCustomer({
    businessId,
    customerId,
    actorUserId: userId,
    data: { displayName, notes },
  });

  revalidatePath(`/b/${businessId}/customers`);
  revalidatePath(`/b/${businessId}/customers/${customerId}`);
  redirect(`/b/${businessId}/customers/${customerId}`);
}
