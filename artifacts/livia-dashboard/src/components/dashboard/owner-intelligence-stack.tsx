import { Link } from "wouter";
import { CommerceSettingsLink } from "@/components/billing/commerce-settings-link";
import { useGetOwnerIntelligence, type OwnerIntelligenceBundle } from "@workspace/api-client-react";
import {
  buildCompactOwnerIntelligenceRows,
  ownerIntelligenceHasSurfaceContent,
  TWIN_TRAJECTORY_COPY,
} from "@workspace/policy";
import { useBusiness } from "@/lib/business-context";
import { useMembership } from "@/lib/membership-context";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowRight, ChevronRight, CreditCard, MessageSquare, Sparkles, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { PolicyEvolutionPanel } from "@/components/dashboard/policy-evolution-panel";
import { LivLearningPanel } from "@/components/dashboard/liv-learning-panel";
import { QualityRegistryPanel } from "@/components/dashboard/quality-registry-panel";

const SEVERITY_VARIANT: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  act: "destructive",
  watch: "secondary",
  info: "outline",
};

export type OwnerIntelligenceVariant =
  | "operator"
  | "owner-home"
  | "commerce-only"
  | "twin-only"
  | "embedded";

type StackProps = {
  className?: string;
  variant?: OwnerIntelligenceVariant;
};

/**
 * Unified owner-intelligence surface — one fetch for commerce, twin, remediation, setup.
 * Replaces separate TwinInsightsCard + CommerceSignalsPanel across dashboard surfaces.
 */
export function OwnerIntelligenceStack({ className, variant = "owner-home" }: StackProps) {
  const { business } = useBusiness();
  const { role } = useMembership();
  const bid = business?.id ?? "";

  const { data, isLoading } = useGetOwnerIntelligence(bid, {
    query: { enabled: !!bid, staleTime: 90_000 } as never,
  });

  if (!business || !["OWNER", "ADMIN"].includes(role ?? "")) return null;

  const skeletonHeight =
    variant === "embedded" ? "h-28" : variant === "commerce-only" || variant === "twin-only" ? "h-32" : "h-48";
  if (isLoading) return <Skeleton className={cn(`${skeletonHeight} w-full rounded-lg`, className)} />;
  if (!data) {
    if (variant === "commerce-only") {
      return (
        <p className="text-sm text-muted-foreground px-1 py-2">
          Commerce signals could not load — refresh the page or try again in a moment.
        </p>
      );
    }
    return null;
  }

  if (variant === "commerce-only") {
    return <CommerceSignalsBody data={data} className={className} />;
  }
  if (variant === "twin-only") {
    return <TwinInsightsBody data={data} className={className} />;
  }
  if (variant === "embedded") {
    return <EmbeddedBody data={data} className={className} />;
  }

  if (!ownerIntelligenceHasSurfaceContent(data)) return null;

  const testId =
    variant === "operator" ? "owner-operator-intelligence-stack" : "owner-intelligence-stack";

  const commerceBlockers = data.commerceCapabilityBlockers ?? [];
  const health = data.capabilityHealth;
  const { primary, more } = buildCompactOwnerIntelligenceRows(
    data as unknown as Parameters<typeof buildCompactOwnerIntelligenceRows>[0],
  );
  const prompt = data.livPrompts[0];

  return (
    <Card
      className={cn(
        "border-primary/15 bg-gradient-to-br from-primary/5 via-transparent to-transparent",
        className,
      )}
      data-testid={testId}
    >
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          What Liv sees
        </CardTitle>
        <CardDescription>
          {data.twinHeadline ?? "One priority from your calendar, inbox, and shop setup"}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {data.twinSubline ? (
          <p className="text-xs text-muted-foreground" data-testid="twin-insights-card">
            {data.twinSubline}
          </p>
        ) : null}

        <PolicyEvolutionPanel
          proposals={(data as { policyEvolutionProposals?: import("@workspace/policy").PolicyEvolutionProposal[] })
            .policyEvolutionProposals}
        />

        <LivLearningPanel
          hypotheses={(data as { learningHypotheses?: import("@/components/dashboard/liv-learning-panel").LivHypothesisRow[] })
            .learningHypotheses}
        />

        <QualityRegistryPanel
          entries={(data as { qualityRegistry?: import("@workspace/policy").QualityRegistryEntry[] })
            .qualityRegistry}
        />

        {primary ? (
          <div
            className="flex items-start justify-between gap-3 rounded-lg border bg-muted/30 p-3"
            data-testid="commerce-signals-panel"
          >
            <div className="min-w-0 space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <TrendingUp className="h-3.5 w-3.5 text-primary shrink-0" />
                <Badge variant={primary.severity === "act" ? "destructive" : "secondary"}>
                  {primary.severity}
                </Badge>
                <span className="text-sm font-medium">{primary.title}</span>
              </div>
              <p className="text-xs text-muted-foreground">{primary.body}</p>
            </div>
            <Button size="sm" variant="outline" className="shrink-0 h-8" asChild>
              <Link href={primary.href}>{primary.severity === "act" ? "Fix" : "Open"}</Link>
            </Button>
          </div>
        ) : null}

        {commerceBlockers[0] ? (
          <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-3 text-sm">
            <p className="text-xs font-medium flex items-center gap-1.5 mb-1">
              <CreditCard className="h-3.5 w-3.5" />
              Setup · {commerceBlockers[0].capabilityName}
            </p>
            <p className="text-xs text-muted-foreground">{commerceBlockers[0].blocker}</p>
            <Button size="sm" variant="link" className="h-auto p-0 mt-1" asChild>
              <Link href={commerceBlockers[0].href}>Fix in billing</Link>
            </Button>
          </div>
        ) : null}

        {data.twinHealth?.domains?.some((d) => d.trajectory === "weakening") ? (
          <div className="flex flex-wrap gap-1.5" data-testid="twin-domain-trajectory-strip">
            {data.twinHealth.domains
              .filter((d) => d.trajectory !== "unknown")
              .slice(0, 3)
              .map((d) => (
                <Badge
                  key={d.domain}
                  variant={d.trajectory === "weakening" ? "destructive" : "secondary"}
                  className="text-[10px] font-normal"
                >
                  {d.domain} · {TWIN_TRAJECTORY_COPY[d.trajectory] ?? d.trajectory}
                </Badge>
              ))}
          </div>
        ) : null}

        {more.length > 0 ? (
          <details className="rounded-lg border border-border/60 px-3 py-2 text-sm">
            <summary className="cursor-pointer text-xs font-medium text-muted-foreground">
              {more.length} more insight{more.length === 1 ? "" : "s"}
            </summary>
            <ul className="mt-2 space-y-2">
              {more.map((row) => (
                <li
                  key={row.id}
                  className="flex items-start justify-between gap-2 border-t border-border/40 pt-2 first:border-t-0 first:pt-0"
                >
                  <div className="min-w-0">
                    <span className="font-medium text-sm">{row.title}</span>
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{row.body}</p>
                  </div>
                  <Button size="sm" variant="ghost" className="shrink-0 h-7 px-2" asChild>
                    <Link href={row.href}>Open</Link>
                  </Button>
                </li>
              ))}
            </ul>
          </details>
        ) : null}

        {health && health.score < 85 ? (
          <p className="text-xs text-muted-foreground">
            Shop readiness{" "}
            <span className="font-medium text-foreground">
              {health.score}% ({health.grade})
            </span>
          </p>
        ) : null}

        {prompt ? (
          <Button size="sm" variant="outline" className="h-8 rounded-full gap-1" asChild>
            <Link href={`/toolkit?q=${encodeURIComponent(prompt)}`}>
              <MessageSquare className="h-3 w-3 opacity-60" />
              {prompt.length > 48 ? `${prompt.slice(0, 46)}…` : prompt}
            </Link>
          </Button>
        ) : null}
      </CardContent>
    </Card>
  );
}

type Bundle = OwnerIntelligenceBundle;

function CommerceSignalsBody({ data, className }: { data: Bundle; className?: string }) {
  const actionable = data.commerce.signals.filter((s) => s.severity !== "info");
  const signalsToShow = actionable.length > 0 ? actionable : data.commerce.signals;

  if (!signalsToShow.length) {
    return (
      <p className="text-sm text-muted-foreground px-1 py-2" data-testid="commerce-signals-empty">
        No revenue alerts for the last 30 days. Use the payment capture steps above if you are
        still setting up deposits.
      </p>
    );
  }

  return (
    <Card className={cn("border-primary/15", className)} data-testid="commerce-signals-panel">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-primary" />
          Commerce intelligence
        </CardTitle>
        <CardDescription>
          {data.commerce.snapshot.capturedLabel && data.commerce.snapshot.paymentCount30d > 0
            ? `${data.commerce.snapshot.capturedLabel} captured (30d)`
            : "Revenue signals from the last 30 days"}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        {signalsToShow.map((signal) => (
          <div
            key={signal.id}
            className="flex flex-wrap items-start justify-between gap-2 rounded-md border border-border/60 px-3 py-2"
          >
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 mb-0.5">
                <p className="text-sm font-medium">{signal.title}</p>
                <Badge variant={SEVERITY_VARIANT[signal.severity] ?? "outline"} className="text-[10px]">
                  {signal.severity}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">{signal.body}</p>
            </div>
            {signal.href.includes("commerce-fix") ? (
              <CommerceSettingsLink
                href={signal.href}
                label="Fix"
                variant="ghost"
                className="shrink-0 h-8"
              />
            ) : (
              <Button size="sm" variant="ghost" className="shrink-0 h-8" asChild>
                <Link href={signal.href}>
                  Open
                  <ArrowRight className="h-3 w-3 ml-1" />
                </Link>
              </Button>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function TwinInsightsBody({ data, className }: { data: Bundle; className?: string }) {
  const topAct = data.commerce.signals.find((s) => s.severity === "act");
  const twinRec = data.twinTopRecommendation;
  const snapshot = data.commerce.snapshot;

  if (!data.twinHeadline && !topAct && !twinRec) return null;

  return (
    <Card className={cn("border-border/80", className)} data-testid="twin-insights-card">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          Shop pulse
        </CardTitle>
        <CardDescription>{data.twinHeadline ?? "Revenue and setup at a glance"}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {data.twinSubline ? <p className="text-sm text-muted-foreground">{data.twinSubline}</p> : null}
        {topAct ? (
          <p className="text-xs text-amber-700 dark:text-amber-300">
            {topAct.title} —{" "}
            <Link href={topAct.href} className="underline">
              Review billing
            </Link>
          </p>
        ) : null}
        {snapshot.paymentCount30d > 0 ? (
          <p className="text-xs text-muted-foreground">
            Revenue (30d):{" "}
            <span className="font-medium text-foreground">{snapshot.capturedLabel}</span>
            {snapshot.captureRatePercent != null
              ? ` · ${snapshot.captureRatePercent}% capture rate`
              : null}
          </p>
        ) : null}
        {twinRec ? (
          <div className="flex items-start justify-between gap-2 text-sm">
            <div>
              <p className="font-medium text-foreground">{twinRec.title}</p>
              <p className="text-muted-foreground text-xs">{twinRec.reason}</p>
            </div>
            {twinRec.href ? (
              <Button variant="ghost" size="sm" className="shrink-0 h-8 px-2" asChild>
                <Link href={twinRec.href}>
                  <ChevronRight className="h-4 w-4" />
                </Link>
              </Button>
            ) : null}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

function EmbeddedBody({ data, className }: { data: Bundle; className?: string }) {
  const top = data.commerce.topSignal;
  const task = data.remediationTasks?.[0];
  if (!top && !task) return null;

  return (
    <div className={cn("space-y-2 rounded-lg border border-border/60 p-3", className)}>
      {top ? (
        <div className="flex items-start justify-between gap-2 text-sm">
          <div>
            <Badge variant={top.severity === "act" ? "destructive" : "secondary"} className="mr-2">
              {top.severity}
            </Badge>
            <span className="font-medium">{top.title}</span>
            <p className="text-xs text-muted-foreground mt-0.5">{top.body}</p>
          </div>
          <Button size="sm" variant="ghost" className="shrink-0 h-8" asChild>
            <Link href={top.href}>Open</Link>
          </Button>
        </div>
      ) : null}
      {task ? (
        <div className="flex items-start justify-between gap-2 text-sm border-t pt-2">
          <div>
            <span className="font-medium">{task.title}</span>
            <p className="text-xs text-muted-foreground">{task.body}</p>
          </div>
          <Button size="sm" variant="outline" className="shrink-0 h-7" asChild>
            <Link href={task.href}>Fix</Link>
          </Button>
        </div>
      ) : null}
    </div>
  );
}

/** @deprecated Use OwnerIntelligenceStack variant="operator" */
export function OwnerOperatorIntelligenceStack(props: { className?: string }) {
  return <OwnerIntelligenceStack {...props} variant="operator" />;
}
