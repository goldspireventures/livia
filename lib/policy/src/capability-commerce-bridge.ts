import type { ResolvedPlatformCapability } from "./capability-resolution";
import { COMMERCE_BILLING_FIX_HREF } from "./commerce-signals";

const COMMERCE_CAPABILITY_IDS = new Set(["payments", "deposits", "refunds", "memberships"]);

export function isCommerceCapabilityId(capabilityId: string): boolean {
  return COMMERCE_CAPABILITY_IDS.has(capabilityId);
}

export type CommerceCapabilityBlocker = {
  capabilityId: string;
  capabilityName: string;
  blocker: string;
  href: string;
};

/** Payment-related capability blockers — only when Stripe connect is actually required. */
export function resolveCommerceCapabilityBlockers(
  capabilities: ResolvedPlatformCapability[],
): CommerceCapabilityBlocker[] {
  const out: CommerceCapabilityBlocker[] = [];
  for (const cap of capabilities) {
    if (!COMMERCE_CAPABILITY_IDS.has(cap.id)) continue;
    for (const blocker of cap.readinessBlockers) {
      out.push({
        capabilityId: cap.id,
        capabilityName: cap.name,
        blocker,
        href: COMMERCE_BILLING_FIX_HREF,
      });
    }
  }
  return out.slice(0, 4);
}
