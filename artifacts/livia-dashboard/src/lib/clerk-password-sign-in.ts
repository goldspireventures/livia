import type { useSignIn } from "@clerk/clerk-react";

type SignInResource = NonNullable<ReturnType<typeof useSignIn>["signIn"]>;

export type PasswordSignInOutcome =
  | { ok: true; sessionId: string }
  | { ok: false; reason: "incomplete"; status: string }
  | { ok: false; reason: "failed" };

/** Clerk often returns needs_first_factor even when identifier+password are sent together. */
export async function completeClerkPasswordSignIn(
  signIn: SignInResource,
  email: string,
  password: string,
): Promise<PasswordSignInOutcome> {
  const trimmedEmail = email.trim();
  const trimmedPassword = password.trim();
  if (!trimmedEmail || !trimmedPassword) {
    return { ok: false, reason: "failed" };
  }

  const direct = await signIn.create({
    identifier: trimmedEmail,
    password: trimmedPassword,
  });
  if (direct.status === "complete" && direct.createdSessionId) {
    return { ok: true, sessionId: direct.createdSessionId };
  }

  if (direct.status === "needs_first_factor") {
    const sessionId = await attemptPasswordFirstFactor(signIn, trimmedPassword);
    if (sessionId) return { ok: true, sessionId };
    return { ok: false, reason: "incomplete", status: direct.status };
  }

  if (direct.status === "needs_second_factor") {
    return { ok: false, reason: "incomplete", status: direct.status };
  }

  const staged = await signIn.create({ identifier: trimmedEmail });
  if (staged.status === "needs_first_factor") {
    const sessionId = await attemptPasswordFirstFactor(signIn, trimmedPassword);
    if (sessionId) return { ok: true, sessionId };
    return { ok: false, reason: "incomplete", status: staged.status };
  }

  return { ok: false, reason: "incomplete", status: direct.status ?? "unknown" };
}

async function attemptPasswordFirstFactor(
  signIn: SignInResource,
  password: string,
): Promise<string | null> {
  const hasPassword = signIn.supportedFirstFactors?.some((f) => f.strategy === "password");
  if (!hasPassword) return null;
  const factor = await signIn.attemptFirstFactor({
    strategy: "password",
    password,
  });
  if (factor.status === "complete" && factor.createdSessionId) {
    return factor.createdSessionId;
  }
  return null;
}

export function incompleteClerkSignInMessage(status: string): string {
  if (status === "needs_second_factor") {
    return "This account uses two-factor authentication. Use Google sign-in, or add an authenticator code flow in Clerk settings.";
  }
  if (status === "needs_new_password") {
    return "You need to set a new password before signing in. Use Forgot password or contact support.";
  }
  return "Extra verification is required for this account. Try Google sign-in, or contact support if this persists.";
}
