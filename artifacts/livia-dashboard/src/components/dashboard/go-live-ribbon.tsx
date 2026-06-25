import { useState } from "react";
import { Link } from "wouter";
import { Check, Circle, Copy, ExternalLink, Share2, Sparkles, Target } from "lucide-react";
import {
  useGetDashboardSummary,
  useGetLivSetupGuidedFlow,
} from "@workspace/api-client-react";
import { useBusiness } from "@/lib/business-context";
import { useMembership } from "@/lib/membership-context";
import { isDemoTenantSlug } from "@/lib/demo-tenant";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  GO_LIVE_RIBBON_COPY,
  buildSetupGuidedFlow,
  goLiveRibbonFromActivation,
  type OnboardingState,
} from "@workspace/policy";
import { cn } from "@/lib/utils";
import { publicBookingUrl } from "@/lib/surface-urls";
import { useLivArrival } from "@/hooks/use-liv-arrival";

/** Hero ribbon until sacred metric (first booking) — every owner surface. */
export function GoLiveRibbon({ className }: { className?: string }) {
  const { business } = useBusiness();
  const { effectiveRole } = useMembership();
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  const bid = business?.id ?? "";
  const raw = (business as { onboardingState?: OnboardingState } | null)?.onboardingState;

  const { data: dashboard } = useGetDashboardSummary(bid, {
    query: { enabled: !!bid } as never,
  });
  const { data: guidedFlow } = useGetLivSetupGuidedFlow(bid, {
    query: { enabled: !!bid } as never,
  });
  const { suppressDuplicateSetupBanners } = useLivArrival();

  if (!business || !["OWNER", "ADMIN"].includes(effectiveRole ?? "")) return null;
  if (suppressDuplicateSetupBanners) return null;
  if (isDemoTenantSlug(business.slug)) return null;

  const sacredMetricMet = dashboard?.activation?.sacredMetricMet === true;
  if (
    !goLiveRibbonFromActivation({
      activation: dashboard?.activation,
      onboardingState: raw,
      vertical: (business as { vertical?: string }).vertical,
      slug: business.slug,
      isDemoTenant: false,
    })
  ) {
    return null;
  }

  const flow =
    guidedFlow ??
    buildSetupGuidedFlow({
      onboardingState: raw,
      vertical: (business as { vertical?: string }).vertical,
      slug: business.slug,
      sacredMetricMet,
    });

  const publicUrl =
    flow.publicPath && business.slug ? publicBookingUrl(business.slug) : null;

  async function copyLink() {
    if (!publicUrl) return;
    try {
      await navigator.clipboard.writeText(publicUrl);
      setCopied(true);
      toast({ title: GO_LIVE_RIBBON_COPY.copied });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({ title: "Could not copy — select the link manually", variant: "destructive" });
    }
  }

  async function shareLink() {
    if (!publicUrl || !navigator.share) {
      void copyLink();
      return;
    }
    try {
      await navigator.share({
        title: business?.name ?? "Book online",
        text: GO_LIVE_RIBBON_COPY.sharePrompt,
        url: publicUrl,
      });
    } catch {
      /* user cancelled */
    }
  }

  const showShare =
    (flow.currentPhaseId === "publish" || flow.currentPhaseId === "first_booking") && publicUrl;

  return (
    <section
      className={cn(
        "mb-5 rounded-xl border border-primary/30 bg-gradient-to-br from-primary/10 via-background to-background p-4 sm:p-5 space-y-4",
        className,
      )}
      data-testid="go-live-ribbon"
      aria-label={GO_LIVE_RIBBON_COPY.eyebrow}
    >
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
        <div className="space-y-1 min-w-0">
          <p className="text-xs font-medium uppercase tracking-widest text-primary flex items-center gap-1.5">
            <Target className="h-3.5 w-3.5" aria-hidden />
            {GO_LIVE_RIBBON_COPY.eyebrow}
          </p>
          <h2 className="text-lg font-semibold tracking-tight">{GO_LIVE_RIBBON_COPY.titleUntilActivated}</h2>
          <p className="text-sm text-muted-foreground max-w-xl">{GO_LIVE_RIBBON_COPY.subtitleUntilActivated}</p>
        </div>
        <div className="flex flex-wrap gap-2 shrink-0">
          <Button size="sm" variant="outline" asChild>
            <Link href="/settings?tab=liv">
              <Sparkles className="h-3.5 w-3.5 mr-1.5" />
              {GO_LIVE_RIBBON_COPY.askLiv}
            </Link>
          </Button>
          <Button size="sm" asChild>
            <Link href={flow.nextHref}>{GO_LIVE_RIBBON_COPY.continue}</Link>
          </Button>
        </div>
      </div>

      <ol className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        {flow.phases.map((phase) => (
          <li
            key={phase.id}
            className={cn(
              "rounded-lg border px-3 py-2.5 text-sm space-y-1",
              phase.current ? "border-primary/50 bg-background/90 shadow-sm" : "border-border/60 bg-muted/20",
              phase.done && "opacity-75",
            )}
            data-testid={`go-live-phase-${phase.id}`}
            data-current={phase.current ? "true" : undefined}
          >
            <div className="flex items-center gap-2 font-medium">
              {phase.done ? (
                <Check className="h-3.5 w-3.5 text-primary shrink-0" />
              ) : (
                <Circle className={cn("h-3.5 w-3.5 shrink-0", phase.current && "text-primary")} />
              )}
              <span className="truncate">{phase.label}</span>
              {phase.optional ? (
                <span className="text-[10px] text-muted-foreground font-normal">optional</span>
              ) : null}
            </div>
            <p className="text-xs text-muted-foreground leading-snug line-clamp-2">{phase.headline}</p>
          </li>
        ))}
      </ol>

      {showShare ? (
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 pt-1 border-t border-border/50">
          <p className="text-xs text-muted-foreground flex-1">{GO_LIVE_RIBBON_COPY.sharePrompt}</p>
          <code className="text-xs rounded bg-muted px-2 py-1 font-mono truncate max-w-full sm:max-w-[280px]">
            {publicUrl}
          </code>
          <div className="flex flex-wrap gap-2">
            <Button type="button" size="sm" variant="secondary" onClick={() => void copyLink()}>
              <Copy className="h-3.5 w-3.5 mr-1" />
              {copied ? GO_LIVE_RIBBON_COPY.copied : GO_LIVE_RIBBON_COPY.copyLink}
            </Button>
            {typeof navigator !== "undefined" && "share" in navigator ? (
              <Button type="button" size="sm" variant="outline" onClick={() => void shareLink()}>
                <Share2 className="h-3.5 w-3.5 mr-1" />
                Share
              </Button>
            ) : null}
            <Button size="sm" variant="outline" asChild>
              <a href={flow.publicPath ?? "#"} target="_blank" rel="noopener noreferrer">
                {GO_LIVE_RIBBON_COPY.preview}
                <ExternalLink className="ml-1 h-3 w-3" />
              </a>
            </Button>
          </div>
        </div>
      ) : null}
    </section>
  );
}
