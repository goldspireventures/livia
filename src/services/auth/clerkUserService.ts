import "server-only";

import { currentUser } from "@clerk/nextjs/server";

import { badRequest, conflict } from "@/lib/errors";
import { prisma } from "@/lib/prisma";

/**
 * Map Clerk session to internal `User.id`, creating or linking the row as needed.
 */
export async function ensureUserForClerk({ clerkUserId }: { clerkUserId: string }): Promise<string> {
  const byClerk = await prisma.user.findFirst({
    where: { clerkUserId },
    select: { id: true },
  });
  if (byClerk) return byClerk.id;

  const clerk = await currentUser();
  const email =
    clerk?.primaryEmailAddress?.emailAddress ??
    clerk?.emailAddresses?.[0]?.emailAddress;
  if (!email) {
    throw badRequest("Clerk user has no email; cannot create Bliq user.");
  }

  const name =
    [clerk?.firstName, clerk?.lastName].filter(Boolean).join(" ").trim() ||
    clerk?.username ||
    null;

  const existingByEmail = await prisma.user.findUnique({
    where: { email },
    select: { id: true, clerkUserId: true },
  });

  if (existingByEmail) {
    if (existingByEmail.clerkUserId && existingByEmail.clerkUserId !== clerkUserId) {
      throw conflict("This email is already linked to another sign-in account.");
    }
    await prisma.user.update({
      where: { id: existingByEmail.id },
      data: {
        clerkUserId,
        ...(name ? { name } : {}),
        ...(clerk?.imageUrl ? { imageUrl: clerk.imageUrl } : {}),
      },
    });
    return existingByEmail.id;
  }

  const created = await prisma.user.create({
    data: {
      clerkUserId,
      email,
      name: name ?? undefined,
      imageUrl: clerk?.imageUrl ?? undefined,
    },
    select: { id: true },
  });

  return created.id;
}
