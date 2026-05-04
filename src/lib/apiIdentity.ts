import "server-only";

import { auth } from "@clerk/nextjs/server";

import { AppError, unauthorized } from "@/lib/errors";
import { ensureUserForClerk } from "@/services/auth/clerkUserService";

function clerkConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY &&
      process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY.length > 0 &&
      process.env.CLERK_SECRET_KEY &&
      process.env.CLERK_SECRET_KEY.length > 0,
  );
}

function assertClerkConfigured(): void {
  if (!clerkConfigured()) {
    throw new AppError(
      "INTERNAL",
      "Clerk is required (set NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY and CLERK_SECRET_KEY).",
      503,
    );
  }
}

/**
 * Read-side identity: Clerk session.
 */
export async function requireReaderUserId(req: Pick<Request, "url">): Promise<string> {
  void req;
  assertClerkConfigured();
  const { userId: clerkId } = await auth();
  if (!clerkId) throw unauthorized("Not signed in.");
  return ensureUserForClerk({ clerkUserId: clerkId });
}

type MaybeActor = { actorUserId?: string | undefined; ownerUserId?: string | undefined };

/**
 * Write-side identity: Clerk session.
 */
export async function requireWriterActorId(body: MaybeActor): Promise<string> {
  void body;
  assertClerkConfigured();
  const { userId: clerkId } = await auth();
  if (!clerkId) throw unauthorized("Not signed in.");
  return ensureUserForClerk({ clerkUserId: clerkId });
}

/**
 * `POST /api/businesses` — owner is the signed-in user.
 */
export async function resolveOwnerUserIdForCreateBusiness(body: MaybeActor): Promise<string> {
  void body;
  assertClerkConfigured();
  const { userId: clerkId } = await auth();
  if (!clerkId) throw unauthorized("Not signed in.");
  return ensureUserForClerk({ clerkUserId: clerkId });
}
