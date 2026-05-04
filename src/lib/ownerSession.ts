import "server-only";

import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

import { ensureUserForClerk } from "@/services/auth/clerkUserService";

export function isClerkEnabled(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY &&
      process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY.length > 0,
  );
}

/**
 * `/b/*` owner workspace: Clerk session only (no dev `?userId=`).
 */
export async function requireOwnerUserId(): Promise<string> {
  if (!isClerkEnabled()) {
    redirect("/dashboard");
  }
  const { userId: clerkId } = await auth();
  if (!clerkId) {
    redirect("/sign-in");
  }
  return ensureUserForClerk({ clerkUserId: clerkId });
}
