/**
 * Company workforce access (Livia Inc / Goldspire).
 *
 * - @livia-hq.com — Livia staff, **restricted** by default (automatic).
 * - @goldspireventures.com — **no automatic access**; grants only via exec cockpit (DB).
 */

import type { WorkforceAccessTier } from "./workforce-access-types";
import {
  DEFAULT_GOLDSPIRE_STAFF_DOMAINS,
  DEFAULT_LIVIA_STAFF_DOMAINS,
} from "./workforce-access-types";

export type { WorkforceAccessTier } from "./workforce-access-types";
export {
  DEFAULT_LIVIA_STAFF_DOMAINS,
  DEFAULT_GOLDSPIRE_STAFF_DOMAINS,
} from "./workforce-access-types";

export type WorkforceAccessConfig = {
  liviaStaffDomains: readonly string[];
  /** Used only to validate cockpit grant targets (not for auto-access). */
  goldspireStaffDomains: readonly string[];
};

export type CockpitWorkforceGrants = ReadonlyMap<string, Exclude<WorkforceAccessTier, "none">>;

export function normalizeEmail(email: string | null | undefined): string {
  return (email ?? "").trim().toLowerCase();
}

export function emailDomain(email: string | null | undefined): string | null {
  const normalized = normalizeEmail(email);
  const at = normalized.lastIndexOf("@");
  if (at <= 0 || at === normalized.length - 1) return null;
  return normalized.slice(at + 1);
}

function domainInList(domain: string | null, list: readonly string[]): boolean {
  if (!domain) return false;
  const d = domain.toLowerCase();
  return list.some((entry) => entry.trim().toLowerCase() === d);
}

export function parseDomainList(raw: string | undefined, fallback: readonly string[]): string[] {
  const parsed = (raw ?? "")
    .split(/[,;\s]+/)
    .map((d) => d.trim().toLowerCase())
    .filter(Boolean);
  return parsed.length > 0 ? parsed : [...fallback];
}

export function workforceAccessConfigFromEnv(raw?: {
  liviaStaffDomains?: string;
  goldspireStaffDomains?: string;
}): WorkforceAccessConfig {
  return {
    liviaStaffDomains: parseDomainList(raw?.liviaStaffDomains, DEFAULT_LIVIA_STAFF_DOMAINS),
    goldspireStaffDomains: parseDomainList(raw?.goldspireStaffDomains, DEFAULT_GOLDSPIRE_STAFF_DOMAINS),
  };
}

export function isLiviaStaffDomain(domain: string | null, config: WorkforceAccessConfig): boolean {
  return domainInList(domain, config.liviaStaffDomains);
}

export function isGoldspireStaffDomain(domain: string | null, config: WorkforceAccessConfig): boolean {
  return domainInList(domain, config.goldspireStaffDomains);
}

/** True when email is a valid cockpit grant target (@goldspireventures.com). */
export function isCockpitGrantableGoldspireEmail(
  email: string | null | undefined,
  config: WorkforceAccessConfig,
): boolean {
  return isGoldspireStaffDomain(emailDomain(email), config);
}

export function resolveWorkforceAccessTier(
  email: string | null | undefined,
  config: WorkforceAccessConfig,
  cockpitGrants: CockpitWorkforceGrants = new Map(),
): WorkforceAccessTier {
  const normalized = normalizeEmail(email);
  if (!normalized) return "none";

  const cockpitTier = cockpitGrants.get(normalized);
  if (cockpitTier) return cockpitTier;

  if (isLiviaStaffDomain(emailDomain(normalized), config)) return "restricted";

  return "none";
}

/** Beta / shop creation: Livia staff auto; Goldspire only when cockpit-granted. */
export function workforceAllowsBetaSignup(
  email: string | null | undefined,
  config: WorkforceAccessConfig,
  cockpitGrants: CockpitWorkforceGrants = new Map(),
): boolean {
  const normalized = normalizeEmail(email);
  if (!normalized) return false;
  if (cockpitGrants.has(normalized)) return true;
  return isLiviaStaffDomain(emailDomain(normalized), config);
}
