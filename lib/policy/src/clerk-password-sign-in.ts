/** Clerk password sign-in + Client Trust (new device) — web + mobile. */

export type ClerkSignInFactor = { strategy: string };

export type ClerkSignInResource = {
  status: string | null;
  supportedFirstFactors?: ClerkSignInFactor[] | null;
  supportedSecondFactors?: ClerkSignInFactor[] | null;
  create: (params: Record<string, string>) => Promise<{
    status: string | null;
    createdSessionId: string | null;
    supportedSecondFactors?: ClerkSignInFactor[] | null;
  }>;
  attemptFirstFactor: (
    params: Record<string, string>,
  ) => Promise<{ status: string | null; createdSessionId: string | null }>;
  prepareSecondFactor: (params: Record<string, string>) => Promise<unknown>;
  attemptSecondFactor: (
    params: Record<string, string>,
  ) => Promise<{ status: string | null; createdSessionId: string | null }>;
};

export type DeviceVerificationStrategy = "email_code" | "phone_code";

export type PasswordSignInOutcome =
  | { ok: true; sessionId: string }
  | { ok: false; reason: "needs_device_verification"; status: string }
  | { ok: false; reason: "incomplete"; status: string }
  | { ok: false; reason: "failed" };

/** Clerk Client Trust (new device) — not user-enrolled MFA. */
export function isClerkDeviceVerificationStatus(status: string): boolean {
  return status === "needs_second_factor" || status === "needs_client_trust";
}

function deviceVerificationStatus(signIn: ClerkSignInResource): string | null {
  const status = signIn.status;
  if (status && isClerkDeviceVerificationStatus(status)) return status;
  return null;
}

function asSignIn(signIn: unknown): ClerkSignInResource {
  return signIn as ClerkSignInResource;
}

export function getClerkDeviceVerificationStatus(signIn: unknown): string | null {
  return deviceVerificationStatus(asSignIn(signIn));
}

/** Clerk often returns needs_first_factor even when identifier+password are sent together. */
export async function completeClerkPasswordSignIn(
  signInRaw: unknown,
  email: string,
  password: string,
): Promise<PasswordSignInOutcome> {
  const signIn = asSignIn(signInRaw);
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

  const directDevice = deviceVerificationStatus(signIn);
  if (directDevice) {
    return { ok: false, reason: "needs_device_verification", status: directDevice };
  }

  if (direct.status === "needs_first_factor") {
    const first = await attemptPasswordFirstFactor(signIn, trimmedPassword);
    if (first?.kind === "session") return { ok: true, sessionId: first.sessionId };
    if (first?.kind === "needs_device_verification") {
      return { ok: false, reason: "needs_device_verification", status: first.status };
    }
    const afterFirst = deviceVerificationStatus(signIn);
    if (afterFirst) {
      return { ok: false, reason: "needs_device_verification", status: afterFirst };
    }
    return { ok: false, reason: "incomplete", status: direct.status };
  }

  const staged = await signIn.create({ identifier: trimmedEmail });
  if (staged.status === "needs_first_factor") {
    const first = await attemptPasswordFirstFactor(signIn, trimmedPassword);
    if (first?.kind === "session") return { ok: true, sessionId: first.sessionId };
    if (first?.kind === "needs_device_verification") {
      return { ok: false, reason: "needs_device_verification", status: first.status };
    }
    const afterStaged = deviceVerificationStatus(signIn);
    if (afterStaged) {
      return { ok: false, reason: "needs_device_verification", status: afterStaged };
    }
    return { ok: false, reason: "incomplete", status: staged.status };
  }

  if (staged.status && isClerkDeviceVerificationStatus(staged.status)) {
    return { ok: false, reason: "needs_device_verification", status: staged.status };
  }

  const pending = deviceVerificationStatus(signIn);
  if (pending) {
    return { ok: false, reason: "needs_device_verification", status: pending };
  }

  return { ok: false, reason: "incomplete", status: direct.status ?? signIn.status ?? "unknown" };
}

type FirstFactorResult =
  | { kind: "session"; sessionId: string }
  | { kind: "needs_device_verification"; status: string }
  | null;

async function attemptPasswordFirstFactor(
  signIn: ClerkSignInResource,
  password: string,
): Promise<FirstFactorResult> {
  const hasPassword = signIn.supportedFirstFactors?.some((f) => f.strategy === "password");
  if (!hasPassword) return null;
  const factor = await signIn.attemptFirstFactor({
    strategy: "password",
    password,
  });
  if (factor.status === "complete" && factor.createdSessionId) {
    return { kind: "session", sessionId: factor.createdSessionId };
  }
  if (factor.status && isClerkDeviceVerificationStatus(factor.status)) {
    return { kind: "needs_device_verification", status: factor.status };
  }
  const pending = deviceVerificationStatus(signIn);
  if (pending) {
    return { kind: "needs_device_verification", status: pending };
  }
  return null;
}

function pickSecondFactorStrategy(signIn: ClerkSignInResource): DeviceVerificationStrategy | null {
  const factors = signIn.supportedSecondFactors ?? [];
  if (factors.some((f) => f.strategy === "email_code")) return "email_code";
  if (factors.some((f) => f.strategy === "phone_code")) return "phone_code";
  return null;
}

/** Send Client Trust / second-step email or SMS code (Clerk sends the message). */
export async function prepareClerkDeviceVerification(
  signInRaw: unknown,
): Promise<DeviceVerificationStrategy> {
  const signIn = asSignIn(signInRaw);
  const strategy = pickSecondFactorStrategy(signIn);
  if (!strategy) {
    const linkOnly = signIn.supportedSecondFactors?.some((f) => f.strategy === "email_link");
    if (linkOnly) {
      throw new Error(
        "Clerk sent a sign-in link to your email. Open it in this browser, then return to Sign in.",
      );
    }
    throw new Error("No email or phone verification available for this sign-in.");
  }
  await signIn.prepareSecondFactor({ strategy });
  return strategy;
}

/** Move to device-verify UI — still show step if prepare fails (Clerk may have sent already). */
export async function beginClerkDeviceVerification(
  signInRaw: unknown,
): Promise<{ strategy: DeviceVerificationStrategy; prepared: boolean }> {
  const signIn = asSignIn(signInRaw);
  const strategy = pickSecondFactorStrategy(signIn) ?? "email_code";
  try {
    await prepareClerkDeviceVerification(signIn);
    return { strategy, prepared: true };
  } catch {
    return { strategy, prepared: false };
  }
}

export async function attemptClerkDeviceVerification(
  signInRaw: unknown,
  code: string,
  strategy: DeviceVerificationStrategy = "email_code",
): Promise<PasswordSignInOutcome> {
  const signIn = asSignIn(signInRaw);
  const trimmed = code.replace(/\D/g, "").trim();
  if (!trimmed) return { ok: false, reason: "failed" };
  const result = await signIn.attemptSecondFactor({
    strategy,
    code: trimmed,
  });
  if (result.status === "complete" && result.createdSessionId) {
    return { ok: true, sessionId: result.createdSessionId };
  }
  const pending = deviceVerificationStatus(signIn);
  if (pending) {
    return { ok: false, reason: "needs_device_verification", status: pending };
  }
  return { ok: false, reason: "incomplete", status: result.status ?? "unknown" };
}

export function incompleteClerkSignInMessage(status: string): string {
  if (status === "needs_email_link") {
    return "Check your email for a sign-in link from Clerk, click it in this browser, then try again.";
  }
  if (isClerkDeviceVerificationStatus(status)) {
    return "Check your email for a 6-digit sign-in code (new device check — not an authenticator app).";
  }
  if (status === "needs_new_password") {
    return "You need to set a new password before signing in. Use Forgot password or contact support.";
  }
  return "Extra verification is required. Check your email for a code from Clerk, or contact support.";
}
