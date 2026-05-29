import {
  resolveWorkforceAccessTier,
  workforceAccessConfigFromEnv,
  type WorkforceAccessTier,
} from "@workspace/policy";

function config() {
  return workforceAccessConfigFromEnv({
    liviaStaffDomains: import.meta.env.VITE_LIVIA_STAFF_EMAIL_DOMAINS as string | undefined,
    goldspireStaffDomains: import.meta.env.VITE_GOLDSPIRE_STAFF_EMAIL_DOMAINS as string | undefined,
  });
}

/** UI hint only — Goldspire tier requires cockpit grant (not available client-side). */
export function workforceAccessTierForEmail(email: string | null | undefined): WorkforceAccessTier {
  return resolveWorkforceAccessTier(email, config(), new Map());
}
