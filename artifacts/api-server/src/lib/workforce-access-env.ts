import {
  workforceAccessConfigFromEnv,
  type WorkforceAccessConfig,
} from "@workspace/policy";

let cached: WorkforceAccessConfig | null = null;

export function getWorkforceAccessConfig(): WorkforceAccessConfig {
  if (!cached) {
    cached = workforceAccessConfigFromEnv({
      liviaStaffDomains: process.env.LIVIA_STAFF_EMAIL_DOMAINS,
      goldspireStaffDomains: process.env.GOLDSPIRE_STAFF_EMAIL_DOMAINS,
    });
  }
  return cached;
}

/** Test-only */
export function resetWorkforceAccessConfigCache(): void {
  cached = null;
}
