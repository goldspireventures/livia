/** Local dashboard (:5173) — in-app demo sign-in, not marketing book-demo. */
export function isLocalDashboardDev(): boolean {
  return import.meta.env.DEV;
}

export function localDevSignInPath(redirectPath?: string): string {
  const params = new URLSearchParams({ beta: "1" });
  if (redirectPath && redirectPath !== "/") {
    params.set("redirect_url", redirectPath);
  }
  return `/sign-in?${params.toString()}`;
}

export function readSignInRedirectPath(): string | null {
  if (typeof window === "undefined") return null;
  const raw = new URLSearchParams(window.location.search).get("redirect_url");
  if (!raw || !raw.startsWith("/")) return null;
  return raw;
}
