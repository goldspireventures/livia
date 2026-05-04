"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { requireOwnerUserId } from "@/lib/ownerSession";
import { assertUserRole } from "@/services/business/membershipService";
import { assignServiceToStaff, unassignServiceFromStaff } from "@/services/catalog/staffServiceAssignmentService";

export async function assignServiceAction(formData: FormData) {
  const businessId = z.string().min(1).parse(formData.get("businessId")?.toString());
  const staffId = z.string().min(1).parse(formData.get("staffId")?.toString());
  const serviceId = z.string().min(1).parse(formData.get("serviceId")?.toString());

  const userId = await requireOwnerUserId();
  await assertUserRole({
    userId,
    businessId,
    allowedRoles: ["OWNER", "ADMIN"],
    options: { emitAccessChecked: false },
  });

  await assignServiceToStaff({ businessId, staffId, serviceId, actorUserId: userId });

  revalidatePath(`/b/${businessId}/staff/${staffId}/services`);
  redirect(`/b/${businessId}/staff/${staffId}/services`);
}

export async function unassignServiceAction(formData: FormData) {
  const businessId = z.string().min(1).parse(formData.get("businessId")?.toString());
  const staffId = z.string().min(1).parse(formData.get("staffId")?.toString());
  const serviceId = z.string().min(1).parse(formData.get("serviceId")?.toString());

  const userId = await requireOwnerUserId();
  await assertUserRole({
    userId,
    businessId,
    allowedRoles: ["OWNER", "ADMIN"],
    options: { emitAccessChecked: false },
  });

  await unassignServiceFromStaff({ businessId, staffId, serviceId, actorUserId: userId });

  revalidatePath(`/b/${businessId}/staff/${staffId}/services`);
  redirect(`/b/${businessId}/staff/${staffId}/services`);
}
