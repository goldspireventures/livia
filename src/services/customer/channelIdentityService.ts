import { Prisma, type ChannelType } from "@prisma/client";
import { z } from "zod";

import { LiviaEventTypes, logEvent } from "@/lib/events";
import { conflict, notFound } from "@/lib/errors";
import { prisma } from "@/lib/prisma";

import { getCustomerById } from "./customerService";

const ChannelTypeSchema = z.enum(["EMAIL", "PHONE", "SMS", "EXTERNAL", "OTHER"]);

const CreateChannelIdentityInput = z.object({
  businessId: z.string().min(1),
  customerId: z.string().min(1),
  actorUserId: z.string().min(1),
  channel: ChannelTypeSchema,
  value: z.string().min(1),
  metadata: z.record(z.string(), z.any()).optional().nullable(),
});

export async function createChannelIdentityForCustomer(input: z.infer<typeof CreateChannelIdentityInput>) {
  const { businessId, customerId, actorUserId, channel, value, metadata } =
    CreateChannelIdentityInput.parse(input);

  await getCustomerById({ businessId, customerId });

  const normalizedValue = value.trim();
  if (!normalizedValue) {
    throw new Error("Invalid channel value");
  }

  try {
    const row = await prisma.channelIdentity.create({
      data: {
        businessId,
        customerId,
        channel: channel as ChannelType,
        value: normalizedValue,
        metadata: metadata ?? undefined,
      },
    });

    await logEvent({
      type: LiviaEventTypes.CHANNEL_IDENTITY_CREATED,
      source: "api",
      businessId,
      actorUserId,
      subjectType: "ChannelIdentity",
      subjectId: row.id,
      payload: { customerId, channel: row.channel },
    });

    return row;
  } catch (err: unknown) {
    const code = typeof err === "object" && err && "code" in err ? (err as { code?: string }).code : undefined;
    if (code === "P2002") {
      throw conflict("This channel value is already registered for this business.");
    }
    throw err;
  }
}

const ListForCustomerInput = z.object({
  businessId: z.string().min(1),
  customerId: z.string().min(1),
});

export async function listChannelIdentitiesForCustomer(input: z.infer<typeof ListForCustomerInput>) {
  const { businessId, customerId } = ListForCustomerInput.parse(input);
  await getCustomerById({ businessId, customerId });

  return prisma.channelIdentity.findMany({
    where: { businessId, customerId },
    orderBy: [{ channel: "asc" }, { value: "asc" }],
  });
}

const GetChannelIdentityInput = z.object({
  businessId: z.string().min(1),
  customerId: z.string().min(1),
  channelIdentityId: z.string().min(1),
});

export async function getChannelIdentityForCustomer(input: z.infer<typeof GetChannelIdentityInput>) {
  const { businessId, customerId, channelIdentityId } = GetChannelIdentityInput.parse(input);
  await getCustomerById({ businessId, customerId });

  const row = await prisma.channelIdentity.findFirst({
    where: { id: channelIdentityId, businessId, customerId },
  });
  if (!row) throw notFound("Channel identity not found.");
  return row;
}

const UpdateChannelIdentityInput = z.object({
  businessId: z.string().min(1),
  customerId: z.string().min(1),
  channelIdentityId: z.string().min(1),
  actorUserId: z.string().min(1),
  data: z
    .object({
      value: z.string().min(1).optional(),
      verifiedAt: z.union([z.coerce.date(), z.null()]).optional(),
      metadata: z.record(z.string(), z.any()).optional().nullable(),
    })
    .strict(),
});

export async function updateChannelIdentityForCustomer(input: z.infer<typeof UpdateChannelIdentityInput>) {
  const { businessId, customerId, channelIdentityId, actorUserId, data } =
    UpdateChannelIdentityInput.parse(input);

  await getChannelIdentityForCustomer({ businessId, customerId, channelIdentityId });

  let updated;
  try {
    updated = await prisma.channelIdentity.update({
      where: { id: channelIdentityId },
      data: {
        ...(data.value ? { value: data.value.trim() } : {}),
        ...(data.verifiedAt !== undefined
          ? {
              verifiedAt: data.verifiedAt === null ? null : data.verifiedAt,
            }
          : {}),
        ...(data.metadata !== undefined ? { metadata: data.metadata === null ? Prisma.JsonNull : data.metadata } : {}),
      },
    });
  } catch (err: unknown) {
    const code = typeof err === "object" && err && "code" in err ? (err as { code?: string }).code : undefined;
    if (code === "P2002") {
      throw conflict("This channel value is already registered for this business.");
    }
    throw err;
  }

  await logEvent({
    type: LiviaEventTypes.CHANNEL_IDENTITY_UPDATED,
    source: "api",
    businessId,
    actorUserId,
    subjectType: "ChannelIdentity",
    subjectId: channelIdentityId,
    payload: { customerId, updatedFields: Object.keys(data) },
  });

  return updated;
}

const DeleteChannelIdentityInput = z.object({
  businessId: z.string().min(1),
  customerId: z.string().min(1),
  channelIdentityId: z.string().min(1),
  actorUserId: z.string().min(1),
});

export async function deleteChannelIdentityForCustomer(input: z.infer<typeof DeleteChannelIdentityInput>) {
  const { businessId, customerId, channelIdentityId, actorUserId } = DeleteChannelIdentityInput.parse(input);
  await getChannelIdentityForCustomer({ businessId, customerId, channelIdentityId });

  await prisma.channelIdentity.delete({
    where: { id: channelIdentityId },
  });

  await logEvent({
    type: LiviaEventTypes.CHANNEL_IDENTITY_DELETED,
    source: "api",
    businessId,
    actorUserId,
    subjectType: "ChannelIdentity",
    subjectId: channelIdentityId,
    payload: { customerId },
  });

  return { ok: true as const, id: channelIdentityId };
}
