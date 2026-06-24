import { Link } from "wouter";
import { useBusiness } from "@/lib/business-context";
import { useListServices } from "@workspace/api-client-react";
import { BEAUTY_STUDIO_SETUP_STEPS } from "@workspace/policy";
import { OperationalPageShell } from "@/components/layout/operational-page-shell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Circle, Sparkles } from "lucide-react";
import { useOperationalChrome } from "@/lib/operational-chrome";
import { cn } from "@/lib/utils";
import { beautyPrimaryButton } from "@/lib/beauty-operational-ui";

export default function StudioSetupPage() {
  const { business } = useBusiness();
  const bid = business?.id ?? "";
  const vertical = (business as { vertical?: string } | null)?.vertical;
  const op = useOperationalChrome(vertical);
  const { data: services, isLoading } = useListServices(
    bid,
    { isActive: true },
    { query: { enabled: !!bid } as never },
  );
  const serviceCount = Array.isArray(services) ? services.length : 0;

  function stepDone(step: (typeof BEAUTY_STUDIO_SETUP_STEPS)[number]): boolean {
    if (step.id === "menu" && "minServices" in step) {
      return serviceCount >= (step.minServices ?? 0);
    }
    return false;
  }

  const completed = BEAUTY_STUDIO_SETUP_STEPS.filter((s) => stepDone(s)).length;

  return (
    <OperationalPageShell
      title="Studio setup"
      subtitle="Get Bloom-ready in minutes — menu, patch-test policy, brand, and Liv channels."
      width="md"
      data-testid="studio-setup-page"
    >
      <Card className={cn(op.beauty && "beauty-operational-panel")}>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" aria-hidden />
            Onboarding checklist
          </CardTitle>
          <CardDescription>
            {isLoading
              ? "Checking your menu…"
              : `${completed} of ${BEAUTY_STUDIO_SETUP_STEPS.length} complete`}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {BEAUTY_STUDIO_SETUP_STEPS.map((step) => {
            const done = stepDone(step);
            return (
              <div
                key={step.id}
                id={step.id === "patch" ? "patch-test" : undefined}
                className="flex items-start gap-3 rounded-lg border border-border/60 px-3 py-3"
              >
                {done ? (
                  <CheckCircle2 className="h-5 w-5 text-[hsl(var(--chart-3))] shrink-0 mt-0.5" aria-hidden />
                ) : (
                  <Circle className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" aria-hidden />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{step.label}</p>
                  {step.id === "menu" ? (
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {serviceCount} active treatment{serviceCount === 1 ? "" : "s"}
                      {"minServices" in step ? ` · ${step.minServices}+ recommended` : ""}
                    </p>
                  ) : step.id === "patch" ? (
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Flag services that need a patch test — guests see the gate on your booking page.
                    </p>
                  ) : null}
                </div>
                <Button
                  asChild
                  size="sm"
                  variant={done ? "outline" : "default"}
                  className={cn(!done && beautyPrimaryButton(op.beauty))}
                >
                  <Link href={step.href}>{done ? "Review" : "Open"}</Link>
                </Button>
              </div>
            );
          })}
        </CardContent>
      </Card>

      <p className="text-xs text-muted-foreground text-center pt-2">
        Reception uses{" "}
        <Link href="/beauty-reception" className="text-primary hover:underline">
          desk mode
        </Link>{" "}
        · Waiting area{" "}
        <Link href="/beauty-tv" className="text-primary hover:underline">
          TV queue
        </Link>
      </p>
    </OperationalPageShell>
  );
}
