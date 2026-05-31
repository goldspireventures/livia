import { useSignIn } from "@clerk/clerk-react";
import type { DemoSignInResult } from "@/lib/demo-portal";

type SignInResource = NonNullable<ReturnType<typeof useSignIn>["signIn"]>;

type ClerkSessionActions = {
  signOut?: (opts: { sessionId: string }) => Promise<unknown>;
  setActive: (opts: { session: string }) => Promise<unknown>;
  sessionId?: string | null;
};

const TICKET_INVALID = /invalid ticket|ticket is invalid/i;

async function finishSession(
  actions: ClerkSessionActions,
  sessionId: string,
): Promise<void> {
  await actions.setActive({ session: sessionId });
}

async function tryPasswordSignIn(
  signIn: SignInResource,
  email: string,
  password: string,
): Promise<string | null> {
  const trimmed = password.trim();
  if (!trimmed) return null;

  const direct = await signIn.create({
    identifier: email.trim(),
    password: trimmed,
  });
  if (direct.status === "complete" && direct.createdSessionId) {
    return direct.createdSessionId;
  }

  if (direct.status === "needs_first_factor") {
    const hasPassword = direct.supportedFirstFactors?.some((f) => f.strategy === "password");
    if (hasPassword) {
      const factor = await signIn.attemptFirstFactor({
        strategy: "password",
        password: trimmed,
      });
      if (factor.status === "complete" && factor.createdSessionId) {
        return factor.createdSessionId;
      }
    }
  }

  const staged = await signIn.create({ identifier: email.trim() });
  if (staged.status === "needs_first_factor") {
    const factor = await signIn.attemptFirstFactor({
      strategy: "password",
      password: trimmed,
    });
    if (factor.status === "complete" && factor.createdSessionId) {
      return factor.createdSessionId;
    }
  }

  return null;
}

/**
 * Demo sign-in: Clerk ticket first (skips MFA), password fallback when ticket
 * fails (common when dashboard PK and API secret are different Clerk apps).
 */
export async function completeDemoClerkSignIn(
  signIn: SignInResource,
  actions: ClerkSessionActions,
  result: DemoSignInResult,
  password?: string,
): Promise<void> {
  if (actions.sessionId && actions.signOut) {
    await actions.signOut({ sessionId: actions.sessionId });
  }

  if (result.token) {
    try {
      const attempt = await signIn.create({
        strategy: "ticket",
        ticket: result.token,
      });
      if (attempt.status === "complete" && attempt.createdSessionId) {
        await finishSession(actions, attempt.createdSessionId);
        return;
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      if (!password?.trim() || !TICKET_INVALID.test(msg)) throw e;
    }
  }

  const sessionId = await tryPasswordSignIn(signIn, result.email, password ?? "");
  if (sessionId) {
    await finishSession(actions, sessionId);
    return;
  }

  if (!password?.trim()) {
    throw new Error(
      "Clerk ticket failed — use a quick-login button on /demo, or enter the shared demo password.",
    );
  }

  throw new Error(
    "Demo sign-in did not complete. Confirm Clerk keys match between Vercel (VITE_CLERK_PUBLISHABLE_KEY) and Railway (CLERK_SECRET_KEY) — both must be the same Clerk app.",
  );
}
