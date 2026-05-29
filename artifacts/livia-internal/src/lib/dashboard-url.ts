/** Owner dashboard — set `VITE_DASHBOARD_URL` at build time (matches API `DASHBOARD_URL`). */
export function getDashboardUrl(): string {
  return (
    (import.meta.env.VITE_DASHBOARD_URL as string | undefined)?.replace(/\/+$/, "") ??
    "http://localhost:5173"
  );
}
