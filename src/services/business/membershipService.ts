import type { MembershipRole } from "@prisma/client";

import { LiviaEventTypes, logEvent } from "@/lib/events";
import { forbidden, notFound } from "@/lib/errors";
import { prisma } from "@/lib/prisma";

export async function getUserBusinesses({ userId }: { userId: string }) {
  const memberships = await prisma.businessMembership.findMany({
    where: { userId },
    include: { business: true },
    orderBy: { createdAt: "asc" },
  });

  return memberships.map((m) => ({
    role: m.role,
    business: m.business,
  }));
}

export async function assertUserCanAccessBusiness({
  userId,
  businessId,
  options,
}: {
  userId: string;
  businessId: string;
  options?: { emitAccessChecked?: boolean; emitAccessDenied?: boolean };
}) {
  const emitAccessChecked = options?.emitAccessChecked ?? true;
  const emitAccessDenied = options?.emitAccessDenied ?? true;

  const membership = await prisma.businessMembership.findFirst({
    where: { userId, businessId },
  });

  if (!membership) {
    if (emitAccessDenied) {
      await logEvent({
        type: LiviaEventTypes.BUSINESS_ACCESS_DENIED,
        source: "api",
        businessId,
        actorUserId: userId,
        subjectType: "Business",
        subjectId: businessId,
        payload: { reason: "no_membership" },
      });
    }
    throw forbidden("You do not have access to this business.");
  }

  if (emitAccessChecked) {
    await logEvent({
      type: LiviaEventTypes.BUSINESS_ACCESS_CHECKED,
      source: "api",
      businessId,
      actorUserId: userId,
      subjectType: "BusinessMembership",
      subjectId: membership.id,
      payload: { role: membership.role },
    });
  }

  return membership;
}

export async function assertUserRole({
  userId,
  businessId,
  allowedRoles,
  options,
}: {
  userId: string;
  businessId: string;
  allowedRoles: MembershipRole[];
  options?: {
    emitAccessChecked?: boolean;
    emitAccessDenied?: boolean;
    emitRoleDenied?: boolean;
  };
}) {
  const emitAccessChecked = options?.emitAccessChecked ?? true;
  const emitAccessDenied = options?.emitAccessDenied ?? true;

  const membership = await prisma.businessMembership.findFirst({
    where: { userId, businessId },
  });

  if (!membership) {
    if (emitAccessDenied) {
      await logEvent({
        type: LiviaEventTypes.BUSINESS_ACCESS_DENIED,
        source: "api",
        businessId,
        actorUserId: userId,
        subjectType: "Business",
        subjectId: businessId,
        payload: { reason: "no_membership" },
      });
    }
    throw forbidden("You do not have access to this business.");
  }

  if (emitAccessChecked) {
    await logEvent({
      type: LiviaEventTypes.BUSINESS_ACCESS_CHECKED,
      source: "api",
      businessId,
      actorUserId: userId,
      subjectType: "BusinessMembership",
      subjectId: membership.id,
      payload: { role: membership.role },
    });
  }

  if (!allowedRoles.includes(membership.role)) {
    if (options?.emitRoleDenied ?? true) {
      await logEvent({
        type: LiviaEventTypes.BUSINESS_ACCESS_DENIED,
        source: "api",
        businessId,
        actorUserId: userId,
        subjectType: "BusinessMembership",
        subjectId: membership.id,
        payload: { reason: "role_not_allowed", role: membership.role, allowedRoles },
      });
    }
    throw forbidden("Your role does not allow this action.");
  }

  return membership;
}

export async function getMembershipRoleForUser({
  userId,
  businessId,
}: {
  userId: string;
  businessId: string;
}): Promise<MembershipRole | null> {
  const row = await prisma.businessMembership.findFirst({
    where: { userId, businessId },
    select: { role: true },
  });
  return row?.role ?? null;
}

export async function requireBusinessExists({ businessId }: { businessId: string }) {
  const business = await prisma.business.findFirst({ where: { id: businessId } });
  if (!business) throw notFound("Business not found.");
  return business;
}

