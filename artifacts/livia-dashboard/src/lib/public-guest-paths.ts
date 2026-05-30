/** P7 guest routes — no Clerk session required (W5 + W6). */
export function isPublicGuestPath(path: string): boolean {
  const p = path.split("?")[0]?.replace(/\/+$/, "") || "/";
  if (p === "/my") return true;
  if (p.startsWith("/b/")) return true;
  if (p.startsWith("/p/")) return true;
  return false;
}
