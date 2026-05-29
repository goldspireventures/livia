/**
 * Production boot checks — same code on staging/prod; env must differ explicitly.
 * Skip in tests via LIVIA_SKIP_PRODUCTION_ENV_CHECK=true.
 */

const DEV_ORIGINS = ["http://localhost:", "http://127.0.0.1:"];

export function isProductionRuntime(): boolean {
  return process.env.NODE_ENV === "production";
}

function isDevOrigin(url: string): boolean {
  return DEV_ORIGINS.some((p) => url.startsWith(p));
}

export function assertProductionEnvAtBoot(): void {
  if (!isProductionRuntime()) return;
  if (process.env.LIVIA_SKIP_PRODUCTION_ENV_CHECK === "true") return;

  const missing: string[] = [];
  for (const key of ["DASHBOARD_URL", "MARKETING_URL", "API_PUBLIC_URL"] as const) {
    if (!process.env[key]?.trim()) missing.push(key);
  }

  if (missing.length > 0) {
    throw new Error(
      `Production boot blocked: set ${missing.join(", ")} on Railway (no localhost fallbacks).`,
    );
  }

  for (const key of ["DASHBOARD_URL", "MARKETING_URL", "API_PUBLIC_URL"] as const) {
    const val = process.env[key]!.trim().replace(/\/+$/, "");
    if (isDevOrigin(val)) {
      throw new Error(`Production boot blocked: ${key} must not be localhost (${val}).`);
    }
  }
}

/** Warn when prod-shaped runtime uses localhost URL getters (post-boot diagnostic). */
export function warnIfProductionUsesDevUrls(urls: Record<string, string>): void {
  if (!isProductionRuntime()) return;
  for (const [name, url] of Object.entries(urls)) {
    if (isDevOrigin(url)) {
      console.warn(`[production-env] ${name} resolves to dev origin: ${url}`);
    }
  }
}
