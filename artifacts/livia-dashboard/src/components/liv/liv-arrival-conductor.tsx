import { useState } from "react";
import { Link } from "wouter";
import { ChevronUp, Copy, ExternalLink, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useLivArrival } from "@/hooks/use-liv-arrival";
import { useBusiness } from "@/lib/business-context";
import { GO_LIVE_RIBBON_COPY, LIV_ARRIVAL_COPY } from "@workspace/policy";
import { publicBookingUrl } from "@/lib/surface-urls";
import { useToast } from "@/hooks/use-toast";

/** Single Liv-guided conductor — one beat at a time after platform tour. */
export function LivArrivalConductor() {
  const { toast } = useToast();
  const { business } = useBusiness();
  const {
    isConductorActive,
    dismiss,
    advanceBeat,
    flow,
    currentPhase,
    stepIndex,
    totalSteps,
    isLoading,
  } = useLivArrival();
  const [minimized, setMinimized] = useState(false);

  if (!isConductorActive || !currentPhase) return null;

  const publicUrl =
    flow.publicPath && business?.slug ? publicBookingUrl(business.slug) : null;
  const showShare =
    (flow.currentPhaseId === "publish" || flow.currentPhaseId === "first_booking") && publicUrl;

  async function copyLink() {
    if (!publicUrl) return;
    try {
      await navigator.clipboard.writeText(publicUrl);
      toast({ title: GO_LIVE_RIBBON_COPY.copied });
    } catch {
      toast({ title: "Could not copy link", variant: "destructive" });
    }
  }

  if (minimized) {
    return (
      <button
        type="button"
        className="fixed bottom-[calc(4.25rem+env(safe-area-inset-bottom))] left-4 z-[60] md:bottom-6 md:left-auto md:right-6 flex items-center gap-2 rounded-full border border-primary/30 bg-card/95 px-4 py-2 text-sm font-medium shadow-lg backdrop-blur-md motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-4"
        data-testid="liv-arrival-minimized"
        onClick={() => setMinimized(false)}
      >
        <Sparkles className="h-4 w-4 text-primary" aria-hidden />
        {LIV_ARRIVAL_COPY.minimizedLabel(stepIndex, totalSteps)}
        <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" aria-hidden />
      </button>
    );
  }

  return (
    <aside
      className={cn(
        "fixed bottom-[calc(4.25rem+env(safe-area-inset-bottom))] left-3 right-3 z-[60]",
        "md:bottom-6 md:left-auto md:right-6 md:w-[min(100%,420px)]",
        "rounded-xl border border-primary/30 bg-card/95 p-4 shadow-xl backdrop-blur-md",
        "motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-6",
      )}
      data-testid="liv-arrival-conductor"
      aria-label="Liv setup guide"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-primary flex items-center gap-1.5">
            <Sparkles className="h-3 w-3" aria-hidden />
            {LIV_ARRIVAL_COPY.eyebrow}
            <span className="text-muted-foreground font-normal normal-case tracking-normal">
              · {LIV_ARRIVAL_COPY.stepOf(stepIndex, totalSteps)}
            </span>
          </p>
          <p className="text-sm font-semibold leading-snug">{currentPhase.label}</p>
          <p className="text-xs text-muted-foreground leading-relaxed">
            {isLoading ? "Loading…" : currentPhase.headline}
          </p>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-7 shrink-0 text-xs text-muted-foreground"
          onClick={() => setMinimized(true)}
        >
          Minimize
        </Button>
      </div>

      {showShare ? (
        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
          <code className="rounded bg-muted px-2 py-1 font-mono truncate max-w-[min(100%,220px)]">
            {publicUrl}
          </code>
          <Button type="button" variant="secondary" size="sm" className="h-7 text-xs" onClick={() => void copyLink()}>
            <Copy className="h-3 w-3 mr-1" />
            {GO_LIVE_RIBBON_COPY.copyLink}
          </Button>
          <Button variant="outline" size="sm" className="h-7 text-xs" asChild>
            <a href={publicUrl ?? flow.publicPath ?? "#"} target="_blank" rel="noopener noreferrer">
              {GO_LIVE_RIBBON_COPY.preview}
              <ExternalLink className="ml-1 h-3 w-3" />
            </a>
          </Button>
        </div>
      ) : null}

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Button size="sm" asChild data-testid="liv-arrival-show-me">
          <Link href={currentPhase.href}>{LIV_ARRIVAL_COPY.showMe}</Link>
        </Button>
        <Button
          type="button"
          size="sm"
          variant="secondary"
          data-testid="liv-arrival-done-next"
          onClick={() => void advanceBeat()}
        >
          {LIV_ARRIVAL_COPY.doneNext}
        </Button>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          className="text-muted-foreground"
          data-testid="liv-arrival-dismiss"
          onClick={dismiss}
        >
          {LIV_ARRIVAL_COPY.exploreAlone}
        </Button>
        <Button size="sm" variant="outline" className="ml-auto" asChild>
          <Link href="/settings?tab=liv">{GO_LIVE_RIBBON_COPY.askLiv}</Link>
        </Button>
      </div>
    </aside>
  );
}
