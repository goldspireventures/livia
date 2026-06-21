/**
 * Demo tenant slugs — keep in sync with `@workspace/policy` `listDemoWorldSlugs()`.
 */
import { listDemoWorldSlugs } from "@workspace/policy";

export const DEMO_TENANT_SLUGS = new Set(listDemoWorldSlugs());

export function isDemoTenantSlug(slug: string | null | undefined): boolean {
  if (!slug) return false;
  return DEMO_TENANT_SLUGS.has(slug);
}

/** Demo roster emails (@livia.io legacy + @demo.livia-hq.com). */
export function isDemoAccountEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  const lower = email.trim().toLowerCase();
  const at = lower.lastIndexOf("@");
  if (at <= 0) return false;
  const domain = lower.slice(at + 1);
  return domain === "livia.io" || domain === "demo.livia-hq.com";
}
