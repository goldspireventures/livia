import { Prisma } from "@prisma/client";
import { z } from "zod";

import { BliqEventTypes, logEvent } from "@/lib/events";
import { notFound } from "@/lib/errors";
import { prisma } from "@/lib/prisma";

const CreateServiceInput = z.object({
  businessId: z.string().min(1),
  actorUserId: z.string().min(1),
  name: z.string().min(1),
  description: z.string().optional().nullable(),
  category: z.string().min(1).optional().nullable(),
  durationMinutes: z.number().int().positive(),
  basePriceMinorUnits: z.number().int().nonnegative().optional().nullable(),
  currency: z.string().length(3).optional().nullable(),
  imageUrl: z.string().url().optional().nullable(),
  sortOrder: z.number().int().optional(),
  metadata: z.record(z.string(), z.any()).optional().nullable(),
});

export async function createService(input: z.infer<typeof CreateServiceInput>) {
  const parsed = CreateServiceInput.parse(input);
  const {
    businessId,
    actorUserId,
    name,
    description,
    category,
    durationMinutes,
    basePriceMinorUnits,
    currency,
    imageUrl,
    sortOrder,
    metadata,
  } = parsed;

  const service = await prisma.service.create({
    data: {
      businessId,
      name: name.trim(),
      description: description?.trim() ?? null,
      category: category?.trim() ?? null,
      durationMinutes,
      basePriceMinorUnits: basePriceMinorUnits ?? null,
      currency: currency?.toUpperCase() ?? null,
      imageUrl: imageUrl ?? null,
      sortOrder: sortOrder ?? 0,
      metadata: metadata ?? undefined,
    },
  });

  await logEvent({
    type: BliqEventTypes.SERVICE_CREATED,
    source: "api",
    businessId,
    actorUserId,
    subjectType: "Service",
    subjectId: service.id,
    payload: { name: service.name, durationMinutes: service.durationMinutes },
  });

  return service;
}

const ListServicesInput = z.object({
  businessId: z.string().min(1),
  includeInactive: z.boolean().optional(),
});

export async function listServicesForBusiness(input: z.infer<typeof ListServicesInput>) {
  const { businessId, includeInactive } = ListServicesInput.parse(input);
  return prisma.service.findMany({
    where: {
      businessId,
      ...(includeInactive ? {} : { active: true }),
    },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  });
}

const GetServiceInput = z.object({
  businessId: z.string().min(1),
  serviceId: z.string().min(1),
});

export async function getServiceById(input: z.infer<typeof GetServiceInput>) {
  const { businessId, serviceId } = GetServiceInput.parse(input);
  const service = await prisma.service.findFirst({
    where: { id: serviceId, businessId },
  });
  if (!service) throw notFound("Service not found.");
  return service;
}

const UpdateServiceInput = z.object({
  businessId: z.string().min(1),
  serviceId: z.string().min(1),
  actorUserId: z.string().min(1),
  data: z
    .object({
      name: z.string().min(1).optional(),
      description: z.string().optional().nullable(),
      category: z.string().min(1).optional().nullable(),
      durationMinutes: z.number().int().positive().optional(),
      basePriceMinorUnits: z.number().int().nonnegative().optional().nullable(),
      currency: z.string().length(3).optional().nullable(),
      imageUrl: z.string().url().optional().nullable(),
      sortOrder: z.number().int().optional(),
      active: z.boolean().optional(),
      metadata: z.record(z.string(), z.any()).optional().nullable(),
    })
    .strict(),
});

export async function updateService(input: z.infer<typeof UpdateServiceInput>) {
  const { businessId, serviceId, actorUserId, data } = UpdateServiceInput.parse(input);
  await getServiceById({ businessId, serviceId });

  const updated = await prisma.service.update({
    where: { id: serviceId },
    data: {
      ...(data.name ? { name: data.name.trim() } : {}),
      ...(data.description !== undefined
        ? { description: data.description === null ? null : data.description.trim() }
        : {}),
      ...(data.category !== undefined
        ? { category: data.category === null ? null : data.category.trim() }
        : {}),
      ...(data.durationMinutes ? { durationMinutes: data.durationMinutes } : {}),
      ...(data.basePriceMinorUnits !== undefined
        ? { basePriceMinorUnits: data.basePriceMinorUnits }
        : {}),
      ...(data.currency !== undefined
        ? { currency: data.currency === null ? null : data.currency.toUpperCase() }
        : {}),
      ...(data.imageUrl !== undefined ? { imageUrl: data.imageUrl } : {}),
      ...(data.sortOrder !== undefined ? { sortOrder: data.sortOrder } : {}),
      ...(data.active !== undefined ? { active: data.active } : {}),
      ...(data.metadata !== undefined ? { metadata: data.metadata === null ? Prisma.JsonNull : data.metadata } : {}),
    },
  });

  await logEvent({
    type: BliqEventTypes.SERVICE_UPDATED,
    source: "api",
    businessId,
    actorUserId,
    subjectType: "Service",
    subjectId: serviceId,
    payload: { updatedFields: Object.keys(data) },
  });

  return updated;
}

const DeactivateServiceInput = z.object({
  businessId: z.string().min(1),
  serviceId: z.string().min(1),
  actorUserId: z.string().min(1),
});

export async function deactivateService(input: z.infer<typeof DeactivateServiceInput>) {
  const { businessId, serviceId, actorUserId } = DeactivateServiceInput.parse(input);
  await getServiceById({ businessId, serviceId });

  const updated = await prisma.service.update({
    where: { id: serviceId },
    data: { active: false },
  });

  await logEvent({
    type: BliqEventTypes.SERVICE_DEACTIVATED,
    source: "api",
    businessId,
    actorUserId,
    subjectType: "Service",
    subjectId: serviceId,
    payload: {},
  });

  return updated;
}
