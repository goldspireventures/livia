import { isDemoLiviaEmail } from "@workspace/demo-logins";
import {
  normalizeEmail,
  resolveDeployEnv,
  resolveWorkforceAccessTier,
  type WorkforceAccessTier,
} from "@workspace/policy";
import { getBetaSignupMode } from "./beta-signup-gate.js";
import { isDemoPortalEnabled } from "./demo-portal-config.js";
import { isPlatformExecEmail } from "./platform-exec.js";
import { getStagingRelaxations } from "./staging-relaxations.js";
import {
  getApiPublicUrl,
  getDashboardUrl,
  getInternalUrl,
  getMarketingUrl,
} from "./public-urls.js";
import { getWorkforceAccessConfig } from "./workforce-access-env.js";
import { getCockpitWorkforceGrantsSync } from "./workforce-access-grants-cache.js";

export type PlatformPrincipalKind = "customer" | "workforce" | "demo" | "platform_exec";

export type PlatformPrincipal = {
  email: string;
  kind: PlatformPrincipalKind;
  workforceTier: WorkforceAccessTier;
  platformExec: boolean;
  demoPersona: boolean;
};

export { resolveDeployEnv };

export function buildPlatformConfig() {
  const deployEnv = resolveDeployEnv();
  const stagingRelaxations = getStagingRelaxations();
  return {
    deployEnv,
    urls: {
      dashboard: getDashboardUrl(),
      marketing: getMarketingUrl(),
      api: getApiPublicUrl(),
      internal: getInternalUrl(),
    },
    betaSignupMode: getBetaSignupMode(),
    demoEnabled: isDemoPortalEnabled(),
    stagingRelaxations,
    capabilities: {
      /** Staging drills may enable demo on prod-shaped NODE_ENV via env pair. */
      demoPortal: isDemoPortalEnabled(),
    },
  };
}

export function resolvePlatformPrincipal(email: string | null | undefined): PlatformPrincipal {
  const normalized = normalizeEmail(email);
  const config = getWorkforceAccessConfig();
  const grants = getCockpitWorkforceGrantsSync();
  const workforceTier = resolveWorkforceAccessTier(normalized, config, grants);
  const platformExec = isPlatformExecEmail(normalized);
  const demoPersona = isDemoLiviaEmail(normalized);

  let kind: PlatformPrincipalKind = "customer";
  if (platformExec) kind = "platform_exec";
  else if (demoPersona) kind = "demo";
  else if (workforceTier !== "none") kind = "workforce";

  return {
    email: normalized,
    kind,
    workforceTier,
    platformExec,
    demoPersona,
  };
}
