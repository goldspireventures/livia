import type { PersonaKind } from "@/lib/persona";
import { isDemoTenantSlug } from "@/lib/demo-tenant";

export type OperatorMaturity = "new_starter" | "establishing" | "veteran" | "founder_multi";

export function resolveOperatorMaturity(args: {
  persona: PersonaKind;
  percentComplete: number | null | undefined;
  ownedShopCount: number;
  businessSlug?: string | null;
}): OperatorMaturity | null {
  if (isDemoTenantSlug(args.businessSlug)) return null;
  if (args.persona === "org_admin" && args.ownedShopCount >= 2) return "founder_multi";
  const pct = args.percentComplete ?? 100;
  if (pct >= 100) return "veteran";
  if (pct < 40) return "new_starter";
  if (pct < 100) return "establishing";
  return null;
}

export function maturityBannerCopy(
  maturity: OperatorMaturity,
  persona: PersonaKind,
): { title: string; body: string; href: string; cta: string } {
  switch (maturity) {
    case "founder_multi":
      return {
        title: "Multi-location operator",
        body: "Glance across shops, approvals, and chain rollups — Liv briefs per location.",
        href: "/chain",
        cta: "Open Glance",
      };
    case "new_starter":
      return {
        title: "Welcome — let's get you live",
        body: "Finish setup so Liv can answer clients and your team can book on the floor.",
        href: "/onboarding",
        cta: "Continue setup",
      };
    case "establishing":
      return {
        title: "Almost there",
        body: "Connect comms and confirm services — then turn Liv on for your booking link.",
        href: "/onboarding",
        cta: "Finish onboarding",
      };
    case "veteran":
      return {
        title: persona === "manager" ? "Floor rhythm" : "You're live",
        body:
          persona === "manager"
            ? "Queue and approvals are your home — Liv handles routine threads until you take over."
            : "Liv moments and proposals surface what needs a human — the rest runs on policy.",
        href: persona === "manager" ? "/inbox" : "/settings?tab=liv",
        cta: persona === "manager" ? "Open queue" : "Liv settings",
      };
  }
}
