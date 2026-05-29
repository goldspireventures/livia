import type { IncomingHttpHeaders } from "http";

const DEV = {
  dashboard: "http://localhost:5173",
  marketing: "http://localhost:5174",
  internal: "http://localhost:5175",
  api: "http://localhost:3000",
} as const;

const CLERK_PROXY_PATH = "/api/__clerk";

export function getClerkProxyHost(req: {
  headers: IncomingHttpHeaders;
}): string | undefined {
  const forwarded = req.headers["x-forwarded-host"];
  const raw = Array.isArray(forwarded) ? forwarded[0] : forwarded;
  const firstHop = raw?.split(",")[0]?.trim();
  return firstHop || req.headers.host?.trim() || undefined;
}

function normalizeUrl(raw: string | undefined): string | undefined {
  const t = raw?.trim();
  if (!t) return undefined;
  return t.replace(/\/+$/, "");
}

function firstUrl(...candidates: Array<string | undefined>): string | undefined {
  for (const c of candidates) {
    const n = normalizeUrl(c);
    if (n) return n;
  }
  return undefined;
}

/**
 * Owner dashboard origin.
 * **Production (Railway):** set `DASHBOARD_URL=https://app.livia-hq.com` only.
 * Legacy names (`DASHBOARD_BASE_URL`, `DASHBOARD_PUBLIC_URL`, …) still work.
 */
export function getDashboardUrl(): string {
  return (
    firstUrl(
      process.env.DASHBOARD_URL,
      process.env.DASHBOARD_BASE_URL,
      process.env.DASHBOARD_PUBLIC_URL,
      process.env.TENANT_DASHBOARD_URL,
      process.env.LIVIA_DASHBOARD_URL,
    ) ?? DEV.dashboard
  );
}

/** Marketing site origin. Production: `MARKETING_URL=https://livia-hq.com` */
export function getMarketingUrl(): string {
  return (
    firstUrl(
      process.env.MARKETING_URL,
      process.env.MARKETING_PUBLIC_URL,
      process.env.MARKETING_BASE_URL,
      process.env.LIVIA_MARKETING_URL,
    ) ?? DEV.marketing
  );
}

/** Internal ops portal origin. Production: `INTERNAL_URL=…` if deployed. */
export function getInternalUrl(): string {
  return (
    firstUrl(
      process.env.INTERNAL_URL,
      process.env.INTERNAL_PUBLIC_URL,
      process.env.INTERNAL_APP_BASE_URL,
    ) ?? DEV.internal
  );
}

/** This API’s public origin (uploads, webhooks). Production: `API_PUBLIC_URL=https://api.livia-hq.com` */
export function getApiPublicUrl(): string {
  return (
    firstUrl(process.env.API_PUBLIC_URL, process.env.PUBLIC_BASE_URL) ?? DEV.api
  );
}

/** Clerk Frontend API proxy — must match Clerk Dashboard → Proxy URL. */
export function resolveClerkProxyUrl(req: { headers: IncomingHttpHeaders }): string {
  const explicit = normalizeUrl(process.env.CLERK_PROXY_URL);
  if (explicit) return explicit;

  const dashboard = getDashboardUrl();
  if (dashboard !== DEV.dashboard) {
    return `${dashboard}${CLERK_PROXY_PATH}`;
  }

  const protocol = req.headers["x-forwarded-proto"] || "https";
  const host = getClerkProxyHost(req) || "";
  return `${protocol}://${host}${CLERK_PROXY_PATH}`;
}

/** Origins for CORS: explicit list plus configured surface URLs (deduped). */
export function getCorsAllowedOrigins(): string[] {
  const raw = process.env.CORS_ALLOWED_ORIGINS?.trim();
  const fromEnv = raw
    ? raw.split(",").map((o) => o.trim()).filter(Boolean)
    : [];

  const auto = [getDashboardUrl(), getMarketingUrl(), getInternalUrl()].filter(
    (u) => !u.startsWith("http://localhost") && !u.startsWith("http://127.0.0.1"),
  );

  const defaults =
    fromEnv.length > 0
      ? fromEnv
      : process.env.NODE_ENV === "production"
        ? auto
        : [
            DEV.dashboard,
            DEV.marketing,
            DEV.internal,
            DEV.api,
            "http://127.0.0.1:5173",
          ];

  return [...new Set([...defaults, ...auto])];
}
