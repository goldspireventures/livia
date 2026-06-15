import { useMemo } from "react";
import { Link } from "wouter";
import { Check, Target } from "lucide-react";
import { useGetDashboardSummary } from "@workspace/api-client-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useBusiness } from "@/lib/business-context";
import { useMembership } from "@/lib/membership-context";
import { useTenantExperience } from "@/lib/tenant-experience-api";
import {
  ACTIVATION_FUNNEL_COPY,
  resolveTenantExperience,
  type OnboardingState,
} from "@workspace/policy";

/** Sacred-metric funnel — owner lifecycle page (Era 1 Q4). */
export function ActivationFunnelPanel() {
  const { business } = useBusiness();
  const { effectiveRole } = useMembership();
  const bid = business?.id ?? "";
  const { data: dashboard, isLoading: dashLoading } = useGetDashboardSummary(bid, {
    query: { enabled: !!bid } as never,
  });
  const { data: experience, isLoading: expLoading } = useTenantExperience(bid);

  const resolved = useMemo(() => {
    if (experience) return experience;
    if (!business) return null;
    const b = business as {
      vertical?: string | null;
      category?: string | null;
      country?: string | null;
      name?: string | null;
      onboardingState?: OnboardingState | null;
    };
    return resolveTenantExperience({
      vertical: b.vertical,
      category: b.category,
      country: b.country,
      businessName: b.name,
      onboardingState: b.onboardingState ?? null,
    });
  }, [experience, business]);

  if (!business || effectiveRole !== "OWNER") return null;

  if ((dashLoading || expLoading) && !resolved) {
    return <Skeleton className="h-40 w-full rounded-lg" />;
  }

  const activation = dashboard?.activation;
  const steps = resolved?.onboarding.activationSteps ?? [];
  const pending = steps.filter((s) => !s.done);
  const sacredMet = activation?.sacredMetricMet === true;

  return (
    <Card className="border-primary/25" data-testid="activation-funnel-panel">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <Target className="h-4 w-4 text-primary" />
          {ACTIVATION_FUNNEL_COPY.title}
        </CardTitle>
        <CardDescription className="text-xs">
          {sacredMet
            ? ACTIVATION_FUNNEL_COPY.sacredMetricMet
            : ACTIVATION_FUNNEL_COPY.sacredMetricPending}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-md border border-border/70 px-3 py-2.5 text-sm">
          <p className="text-xs uppercase tracking-widest text-muted-foreground font-medium">
            {ACTIVATION_FUNNEL_COPY.sacredMetricLabel}
          </p>
          <p className="mt-1 font-medium">{sacredMet ? "Complete" : "Not yet"}</p>
          {activation?.timeToFirstBookingLabel ? (
            <p className="text-xs text-muted-foreground mt-1">
              {ACTIVATION_FUNNEL_COPY.timeToFirstBooking}: {activation.timeToFirstBookingLabel}
            </p>
          ) : null}
        </div>

        <div>
          <p className="text-xs text-muted-foreground mb-2">
            {ACTIVATION_FUNNEL_COPY.stepsComplete}: {activation?.activationStepsComplete ?? 0} of{" "}
            {activation?.activationStepsTotal ?? steps.length}
          </p>
          <ul className="space-y-2">
            {steps.map((step) => (
              <li key={step.id} className="flex items-center gap-2 text-sm">
                {step.done ? (
                  <Check className="h-4 w-4 text-primary shrink-0" aria-hidden />
                ) : (
                  <span className="h-4 w-4 rounded-full border border-muted-foreground/40 shrink-0" />
                )}
                <span className={step.done ? "text-muted-foreground line-through" : ""}>
                  {step.label}
                </span>
              </li>
            ))}
          </ul>
        </div>

        {!sacredMet && pending[0] ? (
          <Button size="sm" className="h-8" asChild>
            <Link href={pending[0].href}>Continue setup</Link>
          </Button>
        ) : null}
      </CardContent>
    </Card>
  );
}
