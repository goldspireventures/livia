import { Link } from "wouter";
import { Check, Circle, Copy, ExternalLink, Layers, Sparkles } from "lucide-react";
import {
  useGetLivSetupGuidedFlow,
  type LivSetupGuidedFlow as LivSetupGuidedFlowData,
} from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { publicBookingUrl } from "@/lib/surface-urls";
import { GO_LIVE_RIBBON_COPY } from "@workspace/policy";
import { useToast } from "@/hooks/use-toast";

type Props = {
  businessId: string;
  compact?: boolean;
  onAskLiv?: (prompt: string) => void;
  className?: string;
};

export function LivSetupGuidedFlow({ businessId, compact, onAskLiv, className }: Props) {
  const { toast } = useToast();
  const { data, isLoading, refetch } = useGetLivSetupGuidedFlow(businessId, {
    query: { enabled: !!businessId } as never,
  });

  if (isLoading) {
    return (
      <Skeleton
        className={cn("h-28 w-full rounded-lg", className)}
        data-testid="liv-setup-guided-flow-loading"
      />
    );
  }

  if (!data) return null;

  const blockersOnly = data.complete && data.capabilityBlockers.length > 0;
  if (data.complete && !blockersOnly) return null;

  const publicUrl =
    data.publicPath?.match(/^\/book\/([^/?]+)/)?.[1] != null
      ? publicBookingUrl(data.publicPath.match(/^\/book\/([^/?]+)/)![1]!)
      : data.publicPath && typeof window !== "undefined"
        ? `${window.location.origin}${data.publicPath}`
        : data.publicPath;

  async function copyPublicLink() {
    if (!publicUrl || typeof publicUrl !== "string") return;
    try {
      await navigator.clipboard.writeText(publicUrl);
      toast({ title: GO_LIVE_RIBBON_COPY.copied });
    } catch {
      toast({ title: "Could not copy link", variant: "destructive" });
    }
  }

  return (
    <div
      className={cn(
        "rounded-lg border border-primary/25 bg-primary/5 p-4 space-y-3",
        className,
      )}
      data-testid="liv-setup-guided-flow"
    >
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <p className="text-xs font-mono uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <Sparkles className="h-3 w-3 text-primary" />
            {blockersOnly ? "Still to fix" : "Path to live"}
          </p>
          <p className="text-sm font-medium mt-0.5">
            {blockersOnly
              ? `${data.capabilityBlockers.length} item${data.capabilityBlockers.length === 1 ? "" : "s"} blocking smooth bookings`
              : `${data.percentComplete}% complete · step ${data.phases.findIndex((p) => p.current) + 1} of ${data.phases.length}`}
          </p>
        </div>
        {onAskLiv ? (
          <Button type="button" size="sm" variant="secondary" onClick={() => onAskLiv(data.nextLivPrompt)}>
            Ask Liv
          </Button>
        ) : null}
      </div>

      {!blockersOnly ? (
      <ol className={cn("grid gap-2", compact ? "grid-cols-1" : "sm:grid-cols-2 lg:grid-cols-4")}>
        {data.phases.map((phase) => (
          <li
            key={phase.id}
            className={cn(
              "rounded-md border px-3 py-2 text-sm space-y-1",
              phase.current ? "border-primary/40 bg-background/80" : "border-border/60 bg-background/40",
              phase.done && "opacity-80",
            )}
            data-testid={`setup-phase-${phase.id}`}
            data-current={phase.current ? "true" : undefined}
            data-done={phase.done ? "true" : undefined}
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
            <p className="text-xs text-muted-foreground leading-snug">{phase.headline}</p>
            {phase.current && !phase.done ? (
              <Button variant="link" size="sm" className="h-auto p-0 text-xs" asChild>
                <Link href={phase.href}>Continue →</Link>
              </Button>
            ) : null}
          </li>
        ))}
      </ol>
      ) : null}

      {data.capabilityBlockers.length > 0 ? (
        <div
          className="rounded-md border border-amber-500/25 bg-amber-500/5 px-3 py-2 space-y-1"
          data-testid="setup-capability-blockers"
        >
          <p className="text-xs font-medium flex items-center gap-1.5 text-amber-800 dark:text-amber-200">
            <Layers className="h-3 w-3" />
            Before guests can book
          </p>
          <ul className="text-xs text-muted-foreground space-y-0.5">
            {data.capabilityBlockers.slice(0, 4).map((b) => (
              <li key={`${b.capabilityId}-${b.blocker}`}>
                <span className="font-medium text-foreground">{b.capabilityName}:</span> {b.blocker}
              </li>
            ))}
          </ul>
          {data.readinessActHints?.length ? (
            <p className="text-[10px] text-muted-foreground pt-0.5">
              Readiness acts: {data.readinessActHints.join(", ")}
            </p>
          ) : null}
          {onAskLiv && data.capabilityBlockers[0] ? (
            <Button
              type="button"
              variant="link"
              size="sm"
              className="h-auto p-0 text-xs"
              onClick={() =>
                onAskLiv(
                  `Help me unblock ${data.capabilityBlockers[0]!.capabilityName}: ${data.capabilityBlockers[0]!.blocker}`,
                )
              }
            >
              Ask Liv to unblock →
            </Button>
          ) : null}
        </div>
      ) : null}

      {(data.publicPath && (data.currentPhaseId === "publish" || data.currentPhaseId === "first_booking")) ? (
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <code className="rounded bg-muted px-2 py-1 font-mono truncate max-w-[min(100%,280px)]">
            {publicUrl ?? data.publicPath}
          </code>
          <Button type="button" variant="secondary" size="sm" onClick={() => void copyPublicLink()}>
            <Copy className="ml-0 mr-1 h-3 w-3" />
            {GO_LIVE_RIBBON_COPY.copyLink}
          </Button>
          <Button variant="outline" size="sm" asChild>
            <a href={data.publicPath} target="_blank" rel="noopener noreferrer">
              {GO_LIVE_RIBBON_COPY.preview}
              <ExternalLink className="ml-1 h-3 w-3" />
            </a>
          </Button>
        </div>
      ) : null}

      <button type="button" className="sr-only" onClick={() => void refetch()}>
        Refresh guided flow
      </button>
    </div>
  );
}

export type { LivSetupGuidedFlow as GuidedFlowResponse } from "@workspace/api-client-react";
