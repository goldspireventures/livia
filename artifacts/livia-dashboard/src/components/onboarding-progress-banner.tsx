import { Link } from "wouter";
import { useBusiness } from "@/lib/business-context";
import { isDemoTenantSlug } from "@/lib/demo-tenant";
import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";

type OnboardingState = {
  percentComplete?: number;
  currentAct?: string;
};

export function OnboardingProgressBanner() {
  const { business } = useBusiness();
  const raw = (business as { onboardingState?: OnboardingState } | null)?.onboardingState;
  const pct = raw?.percentComplete ?? 100;
  if (!business || isDemoTenantSlug(business.slug) || pct >= 100) return null;

  return (
    <div
      className="mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-lg border border-aurora-cyan/30 bg-aurora-cyan/5 px-4 py-3"
      data-testid="onboarding-progress-banner"
    >
      <div className="flex items-center gap-2 text-sm">
        <Sparkles className="h-4 w-4 text-aurora-cyan shrink-0" />
        <span>
          Setup <strong>{pct}%</strong> complete — finish onboarding so Liv can go live.
        </span>
      </div>
      <Button size="sm" variant="secondary" asChild>
        <Link href="/onboarding">Continue setup</Link>
      </Button>
    </div>
  );
}
