import { useMemo } from "react";
import { Link } from "wouter";
import { ArrowRight, Check, Sparkles } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useBusiness } from "@/lib/business-context";
import { useTenantExperience } from "@/lib/tenant-experience-api";
import { Skeleton } from "@/components/ui/skeleton";
import { useMembership } from "@/lib/membership-context";
import { resolveTenantExperience, type OnboardingState } from "@workspace/policy";

const WELCOME_DISMISSED_KEY = "livia.activationWelcomeDismissed";

function readDismissed(businessId: string): boolean {
  if (typeof window === "undefined") return false;
  try {
    const raw = window.localStorage.getItem(WELCOME_DISMISSED_KEY);
    if (!raw) return false;
    const map = JSON.parse(raw) as Record<string, boolean>;
    return map[businessId] === true;
  } catch {
    return false;
  }
}

function writeDismissed(businessId: string) {
  try {
    const raw = window.localStorage.getItem(WELCOME_DISMISSED_KEY);
    const map = raw ? (JSON.parse(raw) as Record<string, boolean>) : {};
    map[businessId] = true;
    window.localStorage.setItem(WELCOME_DISMISSED_KEY, JSON.stringify(map));
  } catch {
    // ignore
  }
}

/**
 * First-run guide after onboarding — activation steps from policy, vertical copy.
 */
export function ActivationWelcome() {
  const { business } = useBusiness();
  const { effectiveRole } = useMembership();
  const { data: experience, isLoading } = useTenantExperience(business?.id);

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

  if (!business || !["OWNER", "ADMIN"].includes(effectiveRole ?? "")) return null;
  if (readDismissed(business.id)) return null;

  if (isLoading && !resolved) {
    return <Skeleton className="h-32 w-full rounded-lg mb-4" />;
  }

  if (!resolved) return null;

  const steps = resolved.onboarding.activationSteps;
  const pending = steps.filter((s) => !s.done);
  const allDone = pending.length === 0;

  if (allDone && resolved.onboarding.appUnlocked) {
    return (
      <Card className="mb-4 border-primary/20 bg-primary/5" data-testid="activation-welcome-done">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-serif flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            {resolved.onboarding.welcomeHeadline}
          </CardTitle>
          <CardDescription>{resolved.playbook.wedge}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Button size="sm" variant="secondary" asChild>
            <Link href="/inbox">Open inbox</Link>
          </Button>
          <Button size="sm" variant="outline" asChild>
            <Link href={`/b/${business.slug}`} target="_blank">
              {resolved.playbook.publicCta}
            </Link>
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => writeDismissed(business.id)}
          >
            Dismiss
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mb-4 border-primary/25" data-testid="activation-welcome">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-lg font-serif">{resolved.onboarding.welcomeHeadline}</CardTitle>
          <span className="text-xs text-muted-foreground shrink-0">
            {resolved.vocabulary.label}
          </span>
        </div>
        <CardDescription>{resolved.onboarding.welcomeSubline}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
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
        <div className="flex flex-wrap gap-2 pt-1">
          {pending[0] ? (
            <Button size="sm" className="gap-1" asChild>
              <Link href={pending[0].href}>
                Continue setup
                <ArrowRight className="h-3 w-3" />
              </Link>
            </Button>
          ) : null}
          {resolved.onboarding.appUnlocked ? (
            <Button
              size="sm"
              variant="outline"
              onClick={() => writeDismissed(business.id)}
            >
              Explore the app
            </Button>
          ) : (
            <Button size="sm" variant="outline" asChild>
              <Link href="/onboarding">Finish setup</Link>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
