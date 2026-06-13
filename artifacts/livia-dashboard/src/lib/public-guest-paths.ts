/** P7 guest routes — no Clerk session required (W5 book + W6 /my). */
export function isPublicGuestPath(path: string): boolean {
  const p = path.split("?")[0]?.replace(/\/+$/, "") || "/";
  if (p === "/my" || p.startsWith("/my/")) return true;
  if (p.startsWith("/book/") || p.startsWith("/b/")) return true;
  if (p.startsWith("/p/")) return true;
  if (p.startsWith("/e/")) return true;
  return false;
}
