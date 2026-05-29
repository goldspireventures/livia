/**
 * Canonical environment reads for the API server.
 * Legacy variable names are supported via fallbacks — see docs/operations/ENV-VARIABLES.md.
 */

export {
  getApiPublicUrl,
  getClerkProxyHost,
  getCorsAllowedOrigins,
  getDashboardUrl,
  getInternalUrl,
  getMarketingUrl,
  resolveClerkProxyUrl,
} from "./public-urls";

function firstNonEmpty(...values: Array<string | undefined>): string | undefined {
  for (const v of values) {
    const t = v?.trim();
    if (t) return t.replace(/\/+$/, "");
  }
  return undefined;
}

/** Grafana UI for internal ops embeds (local docker or hosted). */
export function getGrafanaUrl(): string | undefined {
  return firstNonEmpty(
    process.env.GRAFANA_URL,
    process.env.GRAFANA_EMBED_BASE_URL,
    process.env.GRAFANA_LOCAL_URL,
    process.env.INTERNAL_GRAFANA_URL,
  );
}

/** Loki query API; defaults from LOKI_PUSH_URL (/push → /loki/api/v1). */
export function getLokiQueryBaseUrl(): string | undefined {
  const explicit = process.env.LOKI_QUERY_BASE_URL?.trim();
  if (explicit) return explicit.replace(/\/+$/, "");
  const push = process.env.LOKI_PUSH_URL?.trim();
  if (!push) return undefined;
  const base = push.replace(/\/loki\/api\/v1\/push\/?$/i, "").replace(/\/+$/, "");
  return base || undefined;
}

export function getClerkPublishableKey(): string | undefined {
  return firstNonEmpty(
    process.env.CLERK_PUBLISHABLE_KEY,
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
  );
}
