import { getInternalUrl } from "./public-urls.js";

const DEFAULT_PLATFORM_EXEC_EMAILS = ["projectlazarus@livia.io"];

/** Clerk exec / Livia Inc operator inboxes — not salon tenants. */
export function parsePlatformExecEmails(): Set<string> {
  const raw = process.env.LIVIA_PLATFORM_EXEC_EMAILS?.trim();
  const fromEnv = raw
    ? raw.split(/[,;\s]+/).map((e) => e.trim().toLowerCase()).filter(Boolean)
    : [];
  return new Set([...DEFAULT_PLATFORM_EXEC_EMAILS.map((e) => e.toLowerCase()), ...fromEnv]);
}

export function isPlatformExecEmail(email: string | null | undefined): boolean {
  const normalized = (email ?? "").trim().toLowerCase();
  if (!normalized) return false;
  return parsePlatformExecEmails().has(normalized);
}

/** Internal ops web app URL (separate origin from tenant dashboard). */
export function getOpsPortalUrl(): string {
  const base = (
    process.env.INTERNAL_PORTAL_URL?.trim() ||
    process.env.INTERNAL_URL?.trim() ||
    getInternalUrl()
  ).replace(/\/+$/, "");

  const pathRaw = process.env.INTERNAL_EXEC_PATH?.trim() || "";
  if (!pathRaw) return base;
  const path = pathRaw.startsWith("/") ? pathRaw : `/${pathRaw}`;
  return `${base}${path.replace(/\/+$/, "")}`;
}
