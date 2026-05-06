import { Prisma, type StaffRole } from "@prisma/client";
import { z } from "zod";

import { LiviaEventTypes, logEvent } from "@/lib/events";
import { conflict, notFound } from "@/lib/errors";
import { prisma } from "@/lib/prisma";

const StaffRoleSchema = z.enum(["PROVIDER", "COORDINATOR", "OTHER"]);

function buildDisplayName(firstName: string, lastName?: string | null) {
  const last = lastName?.trim();
  return last ? `${firstName.trim()} ${last}` : firstName.trim();
}

const CreateStaffInput = z.object({
  businessId: z.string().min(1),
  actorUserId: z.string().min(1),
  firstName: z.string().min(1),
  lastName: z.string().min(1).optional().nullable(),
  displayName: z.string().min(1).optional(),
  email: z.string().email().optional().nullable(),
  phone: z.string().min(1).optional().nullable(),
  photoUrl: z.string().url().optional().nullable(),
  bio: z.string().optional().nullable(),
  role: StaffRoleSchema.optional(),
  userId: z.string().min(1).optional().nullable(),
  metadata: z.record(z.string(), z.any()).optional().nullable(),
});

export async function createStaff(input: z.infer<typeof CreateStaffInput>) {
  const parsed = CreateStaffInput.parse(input);
  const {
    businessId,
    actorUserId,
    firstName,
    lastName,
    displayName,
    email,
    phone,
    photoUrl,
    bio,
    role,
    userId,
    metadata,
  } = parsed;

  const resolvedDisplayName = (displayName?.trim() || buildDisplayName(firstName, lastName)).trim();
  if (!resolvedDisplayName) {
    throw new Error("Invalid display name");
  }

  if (email) {
    const dup = await prisma.staff.findFirst({
      where: { businessId, email, active: true },
      select: { id: true },
    });
    if (dup) throw conflict("A staff member with this email already exists for this business.");
  }

  const staff = await prisma.staff.create({
    data: {
      businessId,
      userId: userId ?? null,
      firstName: firstName.trim(),
      lastName: lastName?.trim() || null,
      displayName: resolvedDisplayName,
      email: email?.trim().toLowerCase() ?? null,
      phone: phone?.trim() ?? null,
      photoUrl: photoUrl ?? null,
      bio: bio?.trim() ?? null,
      role: (role ?? "PROVIDER") as StaffRole,
      metadata: metadata ?? undefined,
    },
  });

  await logEvent({
    type: LiviaEventTypes.STAFF_CREATED,
    source: "api",
    businessId,
    actorUserId,
    subjectType: "Staff",
    subjectId: staff.id,
    payload: { role: staff.role, displayName: staff.displayName },
  });

  return staff;
}

const ListStaffInput = z.object({
  businessId: z.string().min(1),
  includeInactive: z.boolean().optional(),
});

export async function listStaffForBusiness(input: z.infer<typeof ListStaffInput>) {
  const { businessId, includeInactive } = ListStaffInput.parse(input);
  return prisma.staff.findMany({
    where: {
      businessId,
      ...(includeInactive ? {} : { active: true }),
    },
    orderBy: [{ displayName: "asc" }, { createdAt: "asc" }],
  });
}

const GetStaffInput = z.object({
  businessId: z.string().min(1),
  staffId: z.string().min(1),
});

export async function getStaffById(input: z.infer<typeof GetStaffInput>) {
  const { businessId, staffId } = GetStaffInput.parse(input);
  const staff = await prisma.staff.findFirst({
    where: { id: staffId, businessId },
  });
  if (!staff) throw notFound("Staff not found.");
  return staff;
}

const UpdateStaffInput = z.object({
  businessId: z.string().min(1),
  staffId: z.string().min(1),
  actorUserId: z.string().min(1),
  data: z
    .object({
      firstName: z.string().min(1).optional(),
      lastName: z.string().min(1).optional().nullable(),
      displayName: z.string().min(1).optional().nullable(),
      email: z.string().email().optional().nullable(),
      phone: z.string().min(1).optional().nullable(),
      photoUrl: z.string().url().optional().nullable(),
      bio: z.string().optional().nullable(),
      role: StaffRoleSchema.optional(),
      userId: z.string().min(1).optional().nullable(),
      active: z.boolean().optional(),
      metadata: z.record(z.string(), z.any()).optional().nullable(),
    })
    .strict(),
});

export async function updateStaff(input: z.infer<typeof UpdateStaffInput>) {
  const { businessId, staffId, actorUserId, data } = UpdateStaffInput.parse(input);

  const existing = await getStaffById({ businessId, staffId });

  if (data.email !== undefined && data.email) {
    const dup = await prisma.staff.findFirst({
      where: {
        businessId,
        email: data.email.trim().toLowerCase(),
        active: true,
        NOT: { id: staffId },
      },
      select: { id: true },
    });
    if (dup) throw conflict("A staff member with this email already exists for this business.");
  }

  const nextFirst = data.firstName?.trim() ?? existing.firstName;
  const nextLast =
    data.lastName === undefined ? existing.lastName : data.lastName === null ? null : data.lastName.trim();
  const nextDisplay =
    data.displayName === undefined
      ? existing.displayName
      : data.displayName === null
        ? buildDisplayName(nextFirst, nextLast)
        : data.displayName.trim();

  const updated = await prisma.staff.update({
    where: { id: staffId },
    data: {
      ...(data.firstName ? { firstName: data.firstName.trim() } : {}),
      ...(data.lastName !== undefined ? { lastName: nextLast } : {}),
      ...(data.displayName !== undefined ? { displayName: nextDisplay } : {}),
      ...(data.email !== undefined
        ? { email: data.email === null ? null : data.email.trim().toLowerCase() }
        : {}),
      ...(data.phone !== undefined ? { phone: data.phone === null ? null : data.phone.trim() } : {}),
      ...(data.photoUrl !== undefined ? { photoUrl: data.photoUrl } : {}),
      ...(data.bio !== undefined ? { bio: data.bio === null ? null : data.bio.trim() } : {}),
      ...(data.role ? { role: data.role as StaffRole } : {}),
      ...(data.userId !== undefined ? { userId: data.userId } : {}),
      ...(data.active !== undefined ? { active: data.active } : {}),
      ...(data.metadata !== undefined ? { metadata: data.metadata === null ? Prisma.JsonNull : data.metadata } : {}),
    },
  });

  await logEvent({
    type: LiviaEventTypes.STAFF_UPDATED,
    source: "api",
    businessId,
    actorUserId,
    subjectType: "Staff",
    subjectId: staffId,
    payload: { updatedFields: Object.keys(data) },
  });

  return updated;
}

const DeactivateStaffInput = z.object({
  businessId: z.string().min(1),
  staffId: z.string().min(1),
  actorUserId: z.string().min(1),
});

export async function deactivateStaff(input: z.infer<typeof DeactivateStaffInput>) {
  const { businessId, staffId, actorUserId } = DeactivateStaffInput.parse(input);
  await getStaffById({ businessId, staffId });

  const updated = await prisma.staff.update({
    where: { id: staffId },
    data: { active: false },
  });

  await logEvent({
    type: LiviaEventTypes.STAFF_DEACTIVATED,
    source: "api",
    businessId,
    actorUserId,
    subjectType: "Staff",
    subjectId: staffId,
    payload: {},
  });

  return updated;
}
