import { createClerkClient } from "@clerk/express";
import { buildPlatformLegalAcceptance } from "../lib/platform-legal-gate.js";
import { getOrCreateUser, updateUser } from "./users.service.js";

const E2E_SIGNUP_PASSWORD = () =>
  process.env.LIVIA_E2E_SIGNUP_PASSWORD?.trim() || "LiviaE2eSignup2026!";

function getClerk() {
  const secretKey = process.env.CLERK_SECRET_KEY;
  if (!secretKey) return null;
  return createClerkClient({ secretKey });
}

export type FreshSignupFounderResult = {
  email: string;
  password: string;
  token: string;
  userId: string;
  landingPath: string;
  signInStrategy: "ticket";
};

/** Non-demo founder account for E2E sacred-path (sign-up → onboarding → first booking). */
export async function provisionFreshSignupFounder(
  suffix = `${Date.now()}`,
): Promise<FreshSignupFounderResult> {
  const clerk = getClerk();
  if (!clerk) {
    throw Object.assign(new Error("Clerk not configured"), { code: "CLERK_NOT_CONFIGURED" });
  }

  const email = `sacred-e2e-${suffix}@signup-test.livia-hq.com`.toLowerCase();
  const password = E2E_SIGNUP_PASSWORD();

  const existing = await clerk.users.getUserList({ emailAddress: [email], limit: 1 });
  let userId: string;
  if (existing.data[0]) {
    userId = existing.data[0].id;
    await clerk.users.updateUser(userId, {
      password,
      skipPasswordChecks: true,
    });
  } else {
    const created = await clerk.users.createUser({
      emailAddress: [email],
      firstName: "E2E",
      lastName: "Founder",
      password,
      skipPasswordChecks: true,
      skipPasswordRequirement: true,
    });
    userId = created.id;
  }

  await getOrCreateUser(userId, email, "E2E Founder");
  await updateUser(userId, {
    platformLegal: buildPlatformLegalAcceptance(`e2e-signup-${suffix}`),
  });

  const { token } = await clerk.signInTokens.createSignInToken({
    userId,
    expiresInSeconds: 300,
  });

  return {
    email,
    password,
    token,
    userId,
    landingPath: "/onboarding?fresh=1&path=1",
    signInStrategy: "ticket",
  };
}
