import { Prisma } from "@prisma/client";
import { z } from "zod";

import { BliqEventTypes, logEvent } from "@/lib/events";
import { conflict, notFound } from "@/lib/errors";
import { prisma } from "@/lib/prisma";

const FlagKeySchema = z
  .string()
  .min(1)
  .max(128)
  .regex(/^[a-zA-Z][a-zA-Z0-9._-]*$/, "key must start with a letter and contain only letters, digits, ., _, -");

const CreateFeatureFlagInput = z.object({
  businessId: z.string().min(1),
  actorUserId: z.string().min(1),
  key: FlagKeySchema,
  enabled: z.boolean().optional(),
  metadata: z.record(z.string(), z.any()).optional().nullable(),
});

export async function createFeatureFlag(input: z.infer<typeof CreateFeatureFlagInput>) {
  const { businessId, actorUserId, key, enabled, metadata } = CreateFeatureFlagInput.parse(input);

  try {
    const row = await prisma.featureFlag.create({
      data: {
        businessId,
        key: key.trim(),
        enabled: enabled ?? false,
        metadata: metadata ?? undefined,
      },
    });

    await logEvent({
      type: BliqEventTypes.FEATURE_FLAG_CREATED,
      source: "api",
      businessId,
      actorUserId,
      subjectType: "FeatureFlag",
      subjectId: row.id,
      payload: { key: row.key, enabled: row.enabled },
    });

    return row;
  } catch (err: unknown) {
    const code = typeof err === "object" && err && "code" in err ? (err as { code?: string }).code : undefined;
    if (code === "P2002") {
      throw conflict("A feature flag with this key already exists for this business.");
    }
    throw err;
  }
}

const ListFeatureFlagsInput = z.object({
  businessId: z.string().min(1),
});

export async function listFeatureFlagsForBusiness(input: z.infer<typeof ListFeatureFlagsInput>) {
  const { businessId } = ListFeatureFlagsInput.parse(input);
  return prisma.featureFlag.findMany({
    where: { businessId },
    orderBy: { key: "asc" },
  });
}

const GetFeatureFlagInput = z.object({
  businessId: z.string().min(1),
  featureFlagId: z.string().min(1),
});

export async function getFeatureFlagById(input: z.infer<typeof GetFeatureFlagInput>) {
  const { businessId, featureFlagId } = GetFeatureFlagInput.parse(input);
  const row = await prisma.featureFlag.findFirst({
    where: { id: featureFlagId, businessId },
  });
  if (!row) throw notFound("Feature flag not found.");
  return row;
}

const UpdateFeatureFlagInput = z.object({
  businessId: z.string().min(1),
  featureFlagId: z.string().min(1),
  actorUserId: z.string().min(1),
  data: z
    .object({
      enabled: z.boolean().optional(),
      metadata: z.record(z.string(), z.any()).optional().nullable(),
    })
    .strict(),
});

export async function updateFeatureFlag(input: z.infer<typeof UpdateFeatureFlagInput>) {
  const { businessId, featureFlagId, actorUserId, data } = UpdateFeatureFlagInput.parse(input);
  await getFeatureFlagById({ businessId, featureFlagId });

  const updated = await prisma.featureFlag.update({
    where: { id: featureFlagId },
    data: {
      ...(data.enabled !== undefined ? { enabled: data.enabled } : {}),
      ...(data.metadata !== undefined ? { metadata: data.metadata === null ? Prisma.JsonNull : data.metadata } : {}),
    },
  });

  await logEvent({
    type: BliqEventTypes.FEATURE_FLAG_UPDATED,
    source: "api",
    businessId,
    actorUserId,
    subjectType: "FeatureFlag",
    subjectId: featureFlagId,
    payload: { updatedFields: Object.keys(data) },
  });

  return updated;
}

const DeleteFeatureFlagInput = z.object({
  businessId: z.string().min(1),
  featureFlagId: z.string().min(1),
  actorUserId: z.string().min(1),
});

export async function deleteFeatureFlag(input: z.infer<typeof DeleteFeatureFlagInput>) {
  const { businessId, featureFlagId, actorUserId } = DeleteFeatureFlagInput.parse(input);
  const existing = await getFeatureFlagById({ businessId, featureFlagId });

  await prisma.featureFlag.delete({ where: { id: featureFlagId } });

  await logEvent({
    type: BliqEventTypes.FEATURE_FLAG_DELETED,
    source: "api",
    businessId,
    actorUserId,
    subjectType: "FeatureFlag",
    subjectId: featureFlagId,
    payload: { key: existing.key },
  });

  return { ok: true as const, id: featureFlagId };
}
