import {
  isMarketingDemoWedgeUnlocked,
  MARKETING_DEMO_GATE_QUERY_PARAM,
  type BusinessVertical,
} from "@workspace/policy";
import {
  dashboardWedgeUrl,
  marketingGetStartedPath,
  marketingGetStartedUrl,
  marketingDemoConciergePath,
} from "@/lib/marketing-links";
import { readDemoGateKeyFromLocation } from "@/lib/marketing-demo-gate-client";

const VERTICAL_ALIASES: Record<string, BusinessVertical> = {
  tattoo: "body-art",
  barber: "hair",
};

/** Map marketing slugs (incl. tattoo/barber pages) to demo wedge verticals. */
export function normalizeMarketingVerticalSlug(raw?: string | null): BusinessVertical | null {
  if (!raw?.trim()) return null;
  const slug = (VERTICAL_ALIASES[raw.trim().toLowerCase()] ?? raw.trim()) as BusinessVertical;
  return isMarketingDemoWedgeUnlocked(slug) ? slug : null;
}

/** Where a prospect goes next — get-started, concierge, or straight into a wedge. */
export function marketingDemoHandoffUrl(opts: {
  vertical?: string | null;
  gateKey?: string | null;
}): string {
  const vertical = normalizeMarketingVerticalSlug(opts.vertical);
  const key = opts.gateKey?.trim() || null;
  if (key && vertical) return dashboardWedgeUrl(vertical, key);
  if (key) {
    return `${marketingDemoConciergePath}?${MARKETING_DEMO_GATE_QUERY_PARAM}=${encodeURIComponent(key)}`;
  }
  if (vertical) return marketingGetStartedUrl(vertical);
  return marketingGetStartedPath;
}

export function marketingDemoHandoffUrlFromBrowser(vertical?: string | null): string {
  return marketingDemoHandoffUrl({ vertical, gateKey: readDemoGateKeyFromLocation() });
}
