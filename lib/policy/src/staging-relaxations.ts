/**
 * Staging / local relaxed verification rules — single source of truth for
 * guest OTP, phone normalization, and related QA toggles.
 *
 * Controlled on Railway via LIVIA_DEPLOY_ENV=staging + LIVIA_STAGING_RELAXED* vars.
 * See docs/operations/ENV-VARIABLES.md
 */

import { normalizePhoneE164 } from "./phone-normalize";

export type DeployEnv = "development" | "staging" | "production";

export type GuestOtpRelaxMode = "strict" | "dev" | "bypass";
export type GuestPhoneRelaxMode = "strict" | "loose";

/** Fixed OTP accepted in bypass mode (override via LIVIA_STAGING_GUEST_OTP_MAGIC). */
export const DEFAULT_STAGING_MAGIC_OTP = "000000";

/** Synthetic E.164 prefix for loose staging phones that fail strict normalize. */
export const STAGING_LOOSE_PHONE_PREFIX = "+1999";

export type StagingRelaxationsSnapshot = {
  /** Master relaxation active (staging default-on, local always, prod never). */
  active: boolean;
  deployEnv: DeployEnv;
  guestHub: {
    otpMode: GuestOtpRelaxMode;
    phoneMode: GuestPhoneRelaxMode;
    /** Shown to clients when bypass/dev — null in strict prod. */
    magicOtpCode: string | null;
    exposeDevOtp: boolean;
  };
  /** When true, platform legal gate is skipped (staging QA only). */
  legalGateSkipped: boolean;
  /** Env keys ops can flip on Railway (read-only reference for cockpit). */
  controls: {
    master: "LIVIA_STAGING_RELAXED";
    guestOtp: "LIVIA_STAGING_RELAX_GUEST_OTP";
    guestPhone: "LIVIA_STAGING_RELAX_GUEST_PHONE";
    guestOtpMagic: "LIVIA_STAGING_GUEST_OTP_MAGIC";
    legalGate: "LIVIA_STAGING_RELAX_LEGAL_GATE";
    deployEnv: "LIVIA_DEPLOY_ENV";
  };
};

export function resolveDeployEnv(
  env: Record<string, string | undefined> = {},
): DeployEnv {
  const raw = (env.LIVIA_DEPLOY_ENV ?? "").trim().toLowerCase();
  if (raw === "staging") return "staging";
  const nodeEnv = (env.NODE_ENV ?? "").trim().toLowerCase();
  if (nodeEnv === "production") return "production";
  return "development";
}

function parseGuestOtpMode(raw: string | undefined): GuestOtpRelaxMode | null {
  const v = raw?.trim().toLowerCase();
  if (v === "strict" || v === "dev" || v === "bypass") return v;
  return null;
}

function parseGuestPhoneMode(raw: string | undefined): GuestPhoneRelaxMode | null {
  const v = raw?.trim().toLowerCase();
  if (v === "strict" || v === "loose") return v;
  return null;
}

function isTruthy(raw: string | undefined): boolean {
  const v = raw?.trim().toLowerCase();
  return v === "1" || v === "true" || v === "yes";
}

function isExplicitlyFalse(raw: string | undefined): boolean {
  const v = raw?.trim().toLowerCase();
  return v === "0" || v === "false" || v === "no";
}

/**
 * Resolve relaxation profile from env. Production deploy env is always strict.
 * Staging defaults to relaxed (master on unless LIVIA_STAGING_RELAXED=false).
 * Local development is always relaxed for guest OTP dev surfaces.
 */
export function resolveStagingRelaxations(
  env: Record<string, string | undefined> = {},
): StagingRelaxationsSnapshot {
  const deployEnv = resolveDeployEnv(env);
  const masterVar = env.LIVIA_STAGING_RELAXED;

  const active =
    deployEnv === "development" ||
    (deployEnv === "staging" && !isExplicitlyFalse(masterVar));

  const guestOtpExplicit = parseGuestOtpMode(env.LIVIA_STAGING_RELAX_GUEST_OTP);
  const guestPhoneExplicit = parseGuestPhoneMode(env.LIVIA_STAGING_RELAX_GUEST_PHONE);

  let guestOtpMode: GuestOtpRelaxMode = "strict";
  let guestPhoneMode: GuestPhoneRelaxMode = "strict";

  if (active) {
    guestOtpMode = guestOtpExplicit ?? (deployEnv === "staging" ? "bypass" : "dev");
    guestPhoneMode = guestPhoneExplicit ?? "loose";
  }

  const magicRaw = env.LIVIA_STAGING_GUEST_OTP_MAGIC?.trim();
  const magicOtpCode =
    active && guestOtpMode !== "strict"
      ? magicRaw && /^\d{4,8}$/.test(magicRaw)
        ? magicRaw
        : DEFAULT_STAGING_MAGIC_OTP
      : null;

  const exposeDevOtp = active && guestOtpMode !== "strict";

  const legalGateSkipped =
    isTruthy(env.LIVIA_SKIP_LEGAL_GATE) ||
    (active && deployEnv === "staging" && isTruthy(env.LIVIA_STAGING_RELAX_LEGAL_GATE));

  return {
    active,
    deployEnv,
    guestHub: {
      otpMode: guestOtpMode,
      phoneMode: guestPhoneMode,
      magicOtpCode,
      exposeDevOtp,
    },
    legalGateSkipped,
    controls: {
      master: "LIVIA_STAGING_RELAXED",
      guestOtp: "LIVIA_STAGING_RELAX_GUEST_OTP",
      guestPhone: "LIVIA_STAGING_RELAX_GUEST_PHONE",
      guestOtpMagic: "LIVIA_STAGING_GUEST_OTP_MAGIC",
      legalGate: "LIVIA_STAGING_RELAX_LEGAL_GATE",
      deployEnv: "LIVIA_DEPLOY_ENV",
    },
  };
}

/** Guest hub phone — strict E.164 first; loose staging accepts short test numbers. */
export function normalizeGuestHubPhone(
  raw: string,
  defaultCountry: string,
  phoneMode: GuestPhoneRelaxMode,
): string | null {
  const strict = normalizePhoneE164(raw, defaultCountry);
  if (strict) return strict;
  if (phoneMode !== "loose") return null;

  const digits = raw.replace(/\D/g, "");
  if (digits.length < 4) return null;
  return `${STAGING_LOOSE_PHONE_PREFIX}${digits.slice(0, 12)}`;
}

export function guestOtpCodeMatches(
  storedCode: string,
  submittedCode: string,
  otpMode: GuestOtpRelaxMode,
  magicOtpCode: string | null,
): boolean {
  const submitted = submittedCode.trim();
  if (otpMode === "strict") return storedCode === submitted;
  if (submitted === storedCode) return true;
  if (otpMode === "bypass" && magicOtpCode && submitted === magicOtpCode) return true;
  return false;
}
