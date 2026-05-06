import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { LiviaEventTypes, logEvent } from "@/lib/events";
import { conflict } from "@/lib/errors";

const CreateBusinessInput = z.object({
  ownerUserId: z.string().min(1),
  name: z.string().min(1),
  slug: z.string().min(1),
  timezone: z.string().min(1).optional(),
});

function normalizeSlug(slug: string) {
  return slug
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export async function createBusiness(input: z.infer<typeof CreateBusinessInput>) {
  const { ownerUserId, name, slug, timezone } = CreateBusinessInput.parse(input);
  const normalizedSlug = normalizeSlug(slug);
  if (!normalizedSlug) throw new Error("Invalid slug");

  const existing = await prisma.business.findFirst({
    where: { slug: normalizedSlug },
    select: { id: true },
  });
  if (existing) {
    throw conflict("Business slug is already in use.");
  }

  const result = await prisma.$transaction(async (tx) => {
    const business = await tx.business.create({
      data: {
        name,
        slug: normalizedSlug,
        settings: timezone ? { timezone } : undefined,
      },
    });

    const membership = await tx.businessMembership.create({
      data: {
        businessId: business.id,
        userId: ownerUserId,
        role: "OWNER",
      },
    });

    return { business, membership };
  });

  await logEvent({
    type: LiviaEventTypes.BUSINESS_CREATED,
    source: "api",
    businessId: result.business.id,
    actorUserId: ownerUserId,
    subjectType: "Business",
    subjectId: result.business.id,
    payload: { slug: result.business.slug },
  });

  await logEvent({
    type: LiviaEventTypes.MEMBERSHIP_CREATED,
    source: "api",
    businessId: result.business.id,
    actorUserId: ownerUserId,
    subjectType: "BusinessMembership",
    subjectId: result.membership.id,
    payload: { role: result.membership.role },
  });

  return result.business;
}

export async function getBusinessById({ businessId }: { businessId: string }) {
  return prisma.business.findFirst({
    where: { id: businessId },
  });
}

export async function getBusinessBySlug({ slug }: { slug: string }) {
  return prisma.business.findFirst({
    where: { slug },
  });
}

const UpdateBusinessInput = z.object({
  businessId: z.string().min(1),
  actorUserId: z.string().min(1),
  data: z
    .object({
      name: z.string().min(1).optional(),
      slug: z.string().min(1).optional(),
      timezone: z.string().min(1).optional(),
      settings: z.record(z.string(), z.any()).optional(),
    })
    .strict(),
});

export async function updateBusiness(input: z.infer<typeof UpdateBusinessInput>) {
  const { businessId, actorUserId, data } = UpdateBusinessInput.parse(input);

  if (data.slug) {
    const normalized = normalizeSlug(data.slug);
    const conflictBusiness = await prisma.business.findFirst({
      where: { slug: normalized, NOT: { id: businessId } },
      select: { id: true },
    });
    if (conflictBusiness) {
      throw conflict("Business slug is already in use.");
    }
  }

  const updated = await prisma.business.update({
    where: { id: businessId },
    data: {
      ...(data.name ? { name: data.name } : {}),
      ...(data.slug ? { slug: normalizeSlug(data.slug) } : {}),
      ...(data.timezone || data.settings
        ? {
            settings: {
              ...(data.settings ?? {}),
              ...(data.timezone ? { timezone: data.timezone } : {}),
            },
          }
        : {}),
    },
  });

  await logEvent({
    type: LiviaEventTypes.BUSINESS_UPDATED,
    source: "api",
    businessId,
    actorUserId,
    subjectType: "Business",
    subjectId: businessId,
    payload: { updatedFields: Object.keys(data) },
  });

  return updated;
}

