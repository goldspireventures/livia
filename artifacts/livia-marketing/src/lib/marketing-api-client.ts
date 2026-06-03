import { setBaseUrl } from "@workspace/api-client-react";

/** Wire Orval client — same-origin /api rewrite on Vercel, or explicit VITE_API_BASE_URL locally. */
export function initMarketingApiClient(): void {
  const configured = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.trim();
  if (configured) {
    setBaseUrl(configured.replace(/\/+$/, ""));
  }
}

/** Resolve /api/... for probes and gate verify (honours rewrite + env). */
export function marketingApiUrl(apiPath: string): string {
  const path = apiPath.startsWith("/") ? apiPath : `/${apiPath}`;
  const configured = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/+$/, "");
  if (configured) return `${configured}${path}`;
  if (typeof window !== "undefined") return `${window.location.origin}${path}`;
  return `http://127.0.0.1:3000${path}`;
}
