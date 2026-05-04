import { Prisma } from "@prisma/client";
import { z } from "zod";

import { BliqEventTypes, logEvent } from "@/lib/events";
import { conflict, notFound } from "@/lib/errors";
import { prisma } from "@/lib/prisma";

const CreateCustomerInput = z.object({
  businessId: z.string().min(1),
  actorUserId: z.string().min(1),
  displayName: z.string().min(1),
  notes: z.string().optional().nullable(),
  metadata: z.record(z.string(), z.any()).optional().nullable(),
});

export async function createCustomer(input: z.infer<typeof CreateCustomerInput>) {
  const { businessId, actorUserId, displayName, notes, metadata } = CreateCustomerInput.parse(input);

  const customer = await prisma.customer.create({
    data: {
      businessId,
      displayName: displayName.trim(),
      notes: notes?.trim() ?? null,
      metadata: metadata ?? undefined,
    },
  });

  await logEvent({
    type: BliqEventTypes.CUSTOMER_CREATED,
    source: "api",
    businessId,
    actorUserId,
    subjectType: "Customer",
    subjectId: customer.id,
    payload: { displayName: customer.displayName },
  });

  return customer;
}

const ListCustomersInput = z.object({
  businessId: z.string().min(1),
});

export async function listCustomersForBusiness(input: z.infer<typeof ListCustomersInput>) {
  const { businessId } = ListCustomersInput.parse(input);
  return prisma.customer.findMany({
    where: { businessId },
    orderBy: [{ displayName: "asc" }, { createdAt: "asc" }],
  });
}

const GetCustomerInput = z.object({
  businessId: z.string().min(1),
  customerId: z.string().min(1),
});

export async function getCustomerById(input: z.infer<typeof GetCustomerInput>) {
  const { businessId, customerId } = GetCustomerInput.parse(input);
  const customer = await prisma.customer.findFirst({
    where: { id: customerId, businessId },
  });
  if (!customer) throw notFound("Customer not found.");
  return customer;
}

const UpdateCustomerInput = z.object({
  businessId: z.string().min(1),
  customerId: z.string().min(1),
  actorUserId: z.string().min(1),
  data: z
    .object({
      displayName: z.string().min(1).optional(),
      notes: z.string().optional().nullable(),
      metadata: z.record(z.string(), z.any()).optional().nullable(),
    })
    .strict(),
});

export async function updateCustomer(input: z.infer<typeof UpdateCustomerInput>) {
  const { businessId, customerId, actorUserId, data } = UpdateCustomerInput.parse(input);
  await getCustomerById({ businessId, customerId });

  const updated = await prisma.customer.update({
    where: { id: customerId },
    data: {
      ...(data.displayName ? { displayName: data.displayName.trim() } : {}),
      ...(data.notes !== undefined ? { notes: data.notes === null ? null : data.notes.trim() } : {}),
      ...(data.metadata !== undefined ? { metadata: data.metadata === null ? Prisma.JsonNull : data.metadata } : {}),
    },
  });

  await logEvent({
    type: BliqEventTypes.CUSTOMER_UPDATED,
    source: "api",
    businessId,
    actorUserId,
    subjectType: "Customer",
    subjectId: customerId,
    payload: { updatedFields: Object.keys(data) },
  });

  return updated;
}

const DeleteCustomerInput = z.object({
  businessId: z.string().min(1),
  customerId: z.string().min(1),
  actorUserId: z.string().min(1),
});

export async function deleteCustomer(input: z.infer<typeof DeleteCustomerInput>) {
  const { businessId, customerId, actorUserId } = DeleteCustomerInput.parse(input);
  await getCustomerById({ businessId, customerId });

  const bookingCount = await prisma.booking.count({
    where: { businessId, customerId },
  });
  if (bookingCount > 0) {
    throw conflict("Customer has bookings and cannot be deleted.");
  }

  await prisma.channelIdentity.deleteMany({
    where: { businessId, customerId },
  });

  await prisma.customer.delete({
    where: { id: customerId },
  });

  await logEvent({
    type: BliqEventTypes.CUSTOMER_DELETED,
    source: "api",
    businessId,
    actorUserId,
    subjectType: "Customer",
    subjectId: customerId,
    payload: {},
  });

  return { ok: true as const, id: customerId };
}
