import { createClerkClient } from "@clerk/express";
import type { Request } from "express";
import { getAuth } from "@clerk/express";
import { getUserId } from "./auth.js";

export function clerkProfileFromClaims(req: Request): {
  email?: string;
  fullName?: string;
} {
  const auth = getAuth(req);
  const email =
    (auth.sessionClaims?.email as string | undefined) ??
    (auth as { sessionClaims?: { primary_email_address?: string } }).sessionClaims
      ?.primary_email_address;
  const fullName =
    [auth.sessionClaims?.first_name, auth.sessionClaims?.last_name]
      .filter(Boolean)
      .join(" ")
      .trim() || undefined;
  return { email: email?.trim().toLowerCase(), fullName };
}

export function isPlaceholderUserEmail(email: string | null | undefined): boolean {
  if (!email) return true;
  return email.endsWith("@unknown.livia") || email.endsWith("@unknown.livia.local");
}

/** JWT claims often omit email on mobile — fall back to Clerk Backend API. */
export async function resolveClerkProfile(req: Request): Promise<{
  email?: string;
  fullName?: string;
}> {
  const fromClaims = clerkProfileFromClaims(req);
  if (fromClaims.email && !isPlaceholderUserEmail(fromClaims.email)) {
    return fromClaims;
  }

  const secretKey = process.env.CLERK_SECRET_KEY?.trim();
  if (!secretKey) return fromClaims;

  try {
    const clerk = createClerkClient({ secretKey });
    const user = await clerk.users.getUser(getUserId(req));
    const primary =
      user.emailAddresses.find((e) => e.id === user.primaryEmailAddressId) ??
      user.emailAddresses[0];
    const email = primary?.emailAddress?.trim().toLowerCase();
    const fullName =
      [user.firstName, user.lastName].filter(Boolean).join(" ").trim() || undefined;
    return {
      email: email || fromClaims.email,
      fullName: fullName || fromClaims.fullName,
    };
  } catch {
    return fromClaims;
  }
}
