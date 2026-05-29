/** How this dashboard build is deployed (set on Vercel per project). */
export type DeployEnvironment = "local" | "staging" | "production";

/**
 * Prefer `VITE_LIVIA_DEPLOY_ENV=staging` on the staging Vercel project.
 * Falls back to hostname `*.staging.livia-hq.com` when the var is unset.
 */
export function getDeployEnvironment(): DeployEnvironment {
  const explicit = import.meta.env.VITE_LIVIA_DEPLOY_ENV?.trim().toLowerCase();
  if (explicit === "staging" || explicit === "production" || explicit === "local") {
    return explicit;
  }
  if (import.meta.env.DEV) return "local";
  if (typeof window !== "undefined" && window.location.hostname.includes("staging.")) {
    return "staging";
  }
  return "production";
}

export function isStagingDeploy(): boolean {
  return getDeployEnvironment() === "staging";
}
