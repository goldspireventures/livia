import { getMarketingUrl } from "./public-urls.js";

/**
 * Closed-beta signup control. Marketing copy promises invite-only batches;
 * this gate aligns product behaviour with ops (Clerk can still allow sign-up — we block shop creation).
 *
 * Modes (LIVIA_BETA_SIGNUP_MODE):
 *   open    — default local/dev; any authenticated user can create a business
 *   invite  — email must be in LIVIA_BETA_INVITE_EMAILS or @livia.io (demo)
 *   closed  — no new businesses (existing tenants unaffected)
 */

export type BetaSignupMode = "open" | "invite" | "closed";

export function getBetaSignupMode(): BetaSignupMode {
  const raw = (process.env.LIVIA_BETA_SIGNUP_MODE ?? "open").trim().toLowerCase();
  if (raw === "invite" || raw === "closed") return raw;
  return "open";
}

function parseInviteList(): Set<string> {
  const raw = process.env.LIVIA_BETA_INVITE_EMAILS ?? "";
  return new Set(
    raw
      .split(/[,;\s]+/)
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean),
  );
}

export type BetaSignupDecision =
  | { allowed: true }
  | { allowed: false; code: "BETA_SIGNUP_CLOSED" | "BETA_SIGNUP_INVITE_ONLY"; message: string };

export function evaluateBetaSignup(email: string | null | undefined): BetaSignupDecision {
  const mode = getBetaSignupMode();
  if (mode === "open") return { allowed: true };

  const normalized = (email ?? "").trim().toLowerCase();
  if (!normalized) {
    return {
      allowed: false,
      code: "BETA_SIGNUP_INVITE_ONLY",
      message: "Closed beta: we need a verified email on your account. Sign out and sign in again, or contact support.",
    };
  }

  if (normalized.endsWith("@livia.io")) return { allowed: true };

  const marketingHost = getMarketingUrl().replace(/^https?:\/\//, "");

  if (mode === "closed") {
    return {
      allowed: false,
      code: "BETA_SIGNUP_CLOSED",
      message: `New sign-ups are paused for the closed beta. Join the waitlist at ${marketingHost} — we invite studios in batches.`,
    };
  }

  const invites = parseInviteList();
  if (invites.has(normalized)) return { allowed: true };

  return {
    allowed: false,
    code: "BETA_SIGNUP_INVITE_ONLY",
    message: `This email is not on the beta invite list yet. Request access via the waitlist at ${marketingHost} or reply to your invite email.`,
  };
}
