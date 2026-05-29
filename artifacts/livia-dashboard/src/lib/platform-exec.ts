/**
 * @deprecated Prefer GET /api/me (platformExec, opsPortalUrl). Kept for local dev fallbacks only.
 */
const DEFAULT_EXEC_EMAILS = ["projectlazarus@livia-hq.com"];

function parseExecEmails(): Set<string> {
  const raw = (import.meta.env.VITE_PLATFORM_EXEC_EMAILS as string | undefined)?.trim();
  const fromEnv = raw
    ? raw.split(/[,;\s]+/).map((e) => e.trim().toLowerCase()).filter(Boolean)
    : [];
  return new Set([...DEFAULT_EXEC_EMAILS.map((e) => e.toLowerCase()), ...fromEnv]);
}

/** @deprecated Use /api/me.platformExec from the API. */
export function isPlatformExecEmail(email: string | null | undefined): boolean {
  const normalized = (email ?? "").trim().toLowerCase();
  if (!normalized) return false;
  return parseExecEmails().has(normalized);
}

/** @deprecated Use /api/me.opsPortalUrl from the API. */
export function getOpsPortalUrl(): string {
  const base = (
    (import.meta.env.VITE_INTERNAL_PORTAL_URL as string | undefined)?.trim() ||
    "http://127.0.0.1:5175"
  ).replace(/\/+$/, "");
  const pathRaw = (import.meta.env.VITE_INTERNAL_EXEC_PATH as string | undefined)?.trim() || "";
  if (!pathRaw) return base;
  const path = pathRaw.startsWith("/") ? pathRaw : `/${pathRaw}`;
  return `${base}${path.replace(/\/+$/, "")}`;
}
