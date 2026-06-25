import { Link } from "wouter";
import { Sparkles, ArrowRight } from "lucide-react";
import { useBusiness } from "@/lib/business-context";
import { usePersona } from "@/lib/persona";
import { shouldShowOnboardingMaturityBanner } from "@workspace/policy";
import { maturityBannerCopy, resolveOperatorMaturity } from "@/lib/operator-maturity";
import { Button } from "@/components/ui/button";
import { useLivArrival } from "@/hooks/use-liv-arrival";

type OnboardingState = { percentComplete?: number };

export function OperatorMaturityBanner() {
  const { business, businesses } = useBusiness();
  const { kind: persona } = usePersona();
  const { suppressDuplicateSetupBanners } = useLivArrival();
  const pct = (business as { onboardingState?: OnboardingState } | null)?.onboardingState
    ?.percentComplete;

  const maturity = resolveOperatorMaturity({
    persona,
    percentComplete: pct,
    ownedShopCount: businesses.length,
    businessSlug: business?.slug,
  });

  if (!maturity || !business) return null;
  if (suppressDuplicateSetupBanners) return null;
  if (!shouldShowOnboardingMaturityBanner(pct)) return null;

  const copy = maturityBannerCopy(maturity, persona);

  return (
    <div
      className="mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-lg border border-primary/25 bg-primary/5 px-4 py-3"
      data-testid={`operator-maturity-${maturity}`}
    >
      <div className="flex items-start gap-2 text-sm min-w-0">
        <Sparkles className="h-4 w-4 text-primary shrink-0 mt-0.5" aria-hidden />
        <span>
          <strong className="text-foreground">{copy.title}</strong>
          <span className="text-muted-foreground"> — {copy.body}</span>
        </span>
      </div>
      <Button size="sm" variant="secondary" className="shrink-0 gap-1" asChild>
        <Link href={copy.href}>
          {copy.cta}
          <ArrowRight className="h-3 w-3" />
        </Link>
      </Button>
    </div>
  );
}
