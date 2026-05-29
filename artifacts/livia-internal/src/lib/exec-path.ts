/**
 * Exec command center URL — not linked from customer apps.
 * Set `VITE_INTERNAL_EXEC_PATH` to a long random slug before any public deploy.
 */
export function getExecHomePath(): string {
  const raw = (import.meta.env.VITE_INTERNAL_EXEC_PATH as string | undefined)?.trim();
  if (!raw) return "/";
  const withSlash = raw.startsWith("/") ? raw : `/${raw}`;
  return withSlash.replace(/\/+$/, "") || "/";
}

export function execPathMatches(pathname: string): boolean {
  const exec = getExecHomePath();
  const norm = pathname.replace(/\/+$/, "") || "/";
  return norm === exec;
}
