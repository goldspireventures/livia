"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { requireOwnerUserId } from "@/lib/ownerSession";
import { assertUserRole } from "@/services/business/membershipService";
import { createStaff, updateStaff } from "@/services/staff/staffService";

function optionalTrimmed(raw: unknown): string | null {
  const s = raw?.toString() ?? "";
  return s.trim() === "" ? null : s.trim();
}

function optionalEmail(raw: unknown): string | null {
  const s = raw?.toString().trim() ?? "";
  if (s === "") return null;
  return z.string().email().parse(s);
}

function optionalUrl(raw: unknown): string | null {
  const s = raw?.toString().trim() ?? "";
  if (s === "") return null;
  return z.string().url().parse(s);
}

const RoleSchema = z.enum(["PROVIDER", "COORDINATOR", "OTHER"]);

export async function createStaffAction(formData: FormData) {
  const businessId = z.string().min(1).parse(formData.get("businessId")?.toString());
  const firstName = z.string().min(1).parse(formData.get("firstName")?.toString().trim());
  const lastName = optionalTrimmed(formData.get("lastName"));
  const displayName = optionalTrimmed(formData.get("displayName"));
  const email = optionalEmail(formData.get("email"));
  const phone = optionalTrimmed(formData.get("phone"));
  const photoUrl = optionalUrl(formData.get("photoUrl"));
  const bio = optionalTrimmed(formData.get("bio"));
  const roleRaw = formData.get("role")?.toString();
  const role = RoleSchema.safeParse(roleRaw).success ? RoleSchema.parse(roleRaw) : "PROVIDER";

  const userId = await requireOwnerUserId();
  await assertUserRole({
    userId,
    businessId,
    allowedRoles: ["OWNER", "ADMIN"],
    options: { emitAccessChecked: false },
  });

  const staff = await createStaff({
    businessId,
    actorUserId: userId,
    firstName,
    lastName,
    displayName: displayName ?? undefined,
    email,
    phone,
    photoUrl,
    bio,
    role,
    userId: null,
    metadata: null,
  });

  revalidatePath(`/b/${businessId}/staff`);
  revalidatePath(`/b/${businessId}/availability`);
  redirect(`/b/${businessId}/staff/${staff.id}/edit`);
}

export async function updateStaffAction(formData: FormData) {
  const businessId = z.string().min(1).parse(formData.get("businessId")?.toString());
  const staffId = z.string().min(1).parse(formData.get("staffId")?.toString());
  const firstName = z.string().min(1).parse(formData.get("firstName")?.toString().trim());
  const lastName = optionalTrimmed(formData.get("lastName"));
  const displayName = optionalTrimmed(formData.get("displayName"));
  const email = optionalEmail(formData.get("email"));
  const phone = optionalTrimmed(formData.get("phone"));
  const photoUrl = optionalUrl(formData.get("photoUrl"));
  const bio = optionalTrimmed(formData.get("bio"));
  const roleRaw = formData.get("role")?.toString();
  const role = RoleSchema.safeParse(roleRaw).success ? RoleSchema.parse(roleRaw) : "PROVIDER";
  const active = formData.get("active") === "on";

  const userId = await requireOwnerUserId();
  await assertUserRole({
    userId,
    businessId,
    allowedRoles: ["OWNER", "ADMIN"],
    options: { emitAccessChecked: false },
  });

  await updateStaff({
    businessId,
    staffId,
    actorUserId: userId,
    data: {
      firstName,
      lastName,
      displayName,
      email,
      phone,
      photoUrl,
      bio,
      role,
      active,
    },
  });

  revalidatePath(`/b/${businessId}/staff`);
  revalidatePath(`/b/${businessId}/staff/${staffId}/edit`);
  revalidatePath(`/b/${businessId}/availability`);
  redirect(`/b/${businessId}/staff/${staffId}/edit`);
}
