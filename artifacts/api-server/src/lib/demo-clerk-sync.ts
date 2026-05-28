/**
 * Keep demo @livia.io Clerk users password-ready for direct sign-in (no extra verification steps).
 */
import type { createClerkClient } from "@clerk/express";
import { logger } from "./logger";

type ClerkClient = ReturnType<typeof createClerkClient>;

export async function syncDemoClerkUser(
  clerk: ClerkClient,
  userId: string,
  opts: { email: string; password: string },
): Promise<void> {
  try {
    await clerk.users.updateUser(userId, {
      password: opts.password,
      skipPasswordChecks: true,
    });
  } catch (err) {
    logger.warn({ err, userId, email: opts.email }, "demo.clerk password reset failed");
  }

  const user = await clerk.users.getUser(userId);
  for (const addr of user.emailAddresses) {
    try {
      await clerk.emailAddresses.updateEmailAddress(addr.id, { verified: true });
    } catch (err) {
      logger.warn({ err, email: addr.emailAddress }, "demo.clerk email verify failed");
    }
    if (
      addr.emailAddress.toLowerCase() === opts.email.toLowerCase() &&
      user.primaryEmailAddressId !== addr.id
    ) {
      try {
        await clerk.emailAddresses.updateEmailAddress(addr.id, { primary: true });
      } catch {
        /* non-fatal */
      }
    }
  }

  try {
    await clerk.users.disableUserMFA(userId);
  } catch (err) {
    logger.debug({ err, userId }, "demo.clerk disable MFA (may already be off)");
  }

  try {
    await clerk.users.deleteUserTOTP(userId);
  } catch (err) {
    logger.debug({ err, userId }, "demo.clerk delete TOTP (may not exist)");
  }
}
