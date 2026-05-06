import { z } from "zod";

import { LiviaEventTypes, logEvent } from "@/lib/events";
import { conflict, notFound } from "@/lib/errors";
import { prisma } from "@/lib/prisma";

import { getServiceById } from "@/services/catalog/serviceCatalogService";
import { fanOutInAppAndPushToBusinessAdmins } from "@/services/notifications/notifyBusinessAdmins";
import { getStaffById } from "@/services/staff/staffService";

const AssignInput = z.object({
  businessId: z.string().min(1),
  staffId: z.string().min(1),
  serviceId: z.string().min(1),
  actorUserId: z.string().min(1),
});

export async function assignServiceToStaff(input: z.infer<typeof AssignInput>) {
  const { businessId, staffId, serviceId, actorUserId } = AssignInput.parse(input);

  const staff = await getStaffById({ businessId, staffId });
  const service = await getServiceById({ businessId, serviceId });

  try {
    const row = await prisma.staffServiceAssignment.create({
      data: { businessId, staffId, serviceId },
    });

    await logEvent({
      type: LiviaEventTypes.STAFF_SERVICE_ASSIGNED,
      source: "api",
      businessId,
      actorUserId,
      subjectType: "StaffServiceAssignment",
      subjectId: row.id,
      payload: { staffId, serviceId },
    });

    void fanOutInAppAndPushToBusinessAdmins({
      businessId,
      excludeUserId: actorUserId,
      kind: "STAFF_SERVICE_ASSIGNED",
      title: "Staff ↔ service",
      body: `${staff.displayName} is now bookable for ${service.name}.`,
      href: `/b/${businessId}/staff/${staffId}/services`,
      payload: { staffId, serviceId, assignmentId: row.id },
      push: {
        title: "Service assignment",
        body: `${staff.displayName} → ${service.name}`,
      },
    }).catch((err) => console.error("[STAFF_SERVICE_ASSIGNED notify]", err));

    return row;
  } catch (err: unknown) {
    const code = typeof err === "object" && err && "code" in err ? (err as { code?: string }).code : undefined;
    if (code === "P2002") {
      throw conflict("This service is already assigned to the staff member.");
    }
    throw err;
  }
}

const UnassignInput = z.object({
  businessId: z.string().min(1),
  staffId: z.string().min(1),
  serviceId: z.string().min(1),
  actorUserId: z.string().min(1),
});

export async function unassignServiceFromStaff(input: z.infer<typeof UnassignInput>) {
  const { businessId, staffId, serviceId, actorUserId } = UnassignInput.parse(input);

  const existing = await prisma.staffServiceAssignment.findFirst({
    where: { businessId, staffId, serviceId },
  });
  if (!existing) throw notFound("Assignment not found.");

  const staff = await getStaffById({ businessId, staffId });
  const service = await getServiceById({ businessId, serviceId });

  await prisma.staffServiceAssignment.delete({ where: { id: existing.id } });

  await logEvent({
    type: LiviaEventTypes.STAFF_SERVICE_UNASSIGNED,
    source: "api",
    businessId,
    actorUserId,
    subjectType: "StaffServiceAssignment",
    subjectId: existing.id,
    payload: { staffId, serviceId },
  });

  void fanOutInAppAndPushToBusinessAdmins({
    businessId,
    excludeUserId: actorUserId,
    kind: "STAFF_SERVICE_UNASSIGNED",
    title: "Staff ↔ service",
    body: `${staff.displayName} removed from ${service.name}.`,
    href: `/b/${businessId}/staff/${staffId}/services`,
    payload: { staffId, serviceId },
    push: {
      title: "Assignment removed",
      body: `${staff.displayName} · ${service.name}`,
    },
  }).catch((err) => console.error("[STAFF_SERVICE_UNASSIGNED notify]", err));

  return { ok: true as const };
}

const ListForStaffInput = z.object({
  businessId: z.string().min(1),
  staffId: z.string().min(1),
});

export async function listServicesForStaff(input: z.infer<typeof ListForStaffInput>) {
  const { businessId, staffId } = ListForStaffInput.parse(input);
  await getStaffById({ businessId, staffId });

  return prisma.staffServiceAssignment.findMany({
    where: { businessId, staffId },
    include: { service: true },
    orderBy: { createdAt: "asc" },
  });
}

const ListStaffForServiceInput = z.object({
  businessId: z.string().min(1),
  serviceId: z.string().min(1),
});

export async function listStaffForService(input: z.infer<typeof ListStaffForServiceInput>) {
  const { businessId, serviceId } = ListStaffForServiceInput.parse(input);
  await getServiceById({ businessId, serviceId });

  return prisma.staffServiceAssignment.findMany({
    where: { businessId, serviceId },
    include: { staff: true },
    orderBy: { createdAt: "asc" },
  });
}
