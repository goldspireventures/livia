import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useBusiness } from "@/lib/business-context";
import { apiFetch } from "@/lib/api-fetch";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Loader2, Sparkles } from "lucide-react";
import { OnboardingWizard, type OnboardingStatePayload } from "@/components/onboarding/onboarding-wizard";
import { OnboardingWelcomePanel } from "@/components/onboarding-welcome-panel";
import type { OnboardingActId } from "@/lib/onboarding-acts";
import { isDemoLoginEnabled } from "@/lib/persona";
import { afterBusinessCreatedState } from "@workspace/policy";
import { OnboardingExperienceShell } from "@/components/onboarding/onboarding-experience-shell";

type BusinessRow = {
  id: string;
  slug: string;
  onboardingState?: OnboardingStatePayload | null;
};

function readOnboardingIntent(): { secondShop?: boolean } {
  if (typeof window === "undefined") return {};
  const params = new URLSearchParams(window.location.search);
  return params.get("intent") === "second-shop" ? { secondShop: true } : {};
}

export default function OnboardingPage() {
  const intent = readOnboardingIntent();
  const { businesses } = useBusiness();
  const parentBusinessId =
    intent.secondShop && businesses.length > 0 ? businesses[0]!.id : undefined;
  const { toast } = useToast();
  const [seedLoading, setSeedLoading] = useState(false);
  const [businessId, setBusinessId] = useState<string | null>(null);
  const [businessSlug, setBusinessSlug] = useState<string | null>(null);
  const [onboardingState, setOnboardingState] = useState<OnboardingStatePayload | null>(null);
  const [previewVertical, setPreviewVertical] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Second location = new business row — do not resume the first shop's onboarding.
    if (intent.secondShop) {
      setLoading(false);
      return;
    }
    apiFetch<BusinessRow[]>("/me/businesses")
      .then((businesses) => {
        const latest = businesses[0];
        if (latest) {
          setBusinessId(latest.id);
          setBusinessSlug(latest.slug);
          const v = (latest as { vertical?: string }).vertical;
          if (v) setPreviewVertical(v);
          const raw = latest.onboardingState;
          if (raw && typeof raw === "object" && "currentAct" in raw) {
            setOnboardingState(raw as OnboardingStatePayload);
          } else {
            setOnboardingState({
              currentAct: "a2_shop_profile",
              completedActs: ["a1_create_business"],
              percentComplete: 8,
            });
          }
        }
      })
      .catch((err: unknown) => {
        toast({
          title: "Could not load your setup progress",
          description: err instanceof Error ? err.message : "Try refreshing the page.",
          variant: "destructive",
        });
      })
      .finally(() => setLoading(false));
  }, [intent.secondShop, toast]);

  const loadDemoData = async () => {
    setSeedLoading(true);
    try {
      await apiFetch("/demo/provision", { method: "POST" });
      toast({
        title: "Full Livia demo ready",
        description: "Opening demo gateway…",
      });
      window.location.href = "/demo";
    } catch (err: unknown) {
      toast({
        title: "Could not load demo data",
        description: err instanceof Error ? err.message : "Seed failed",
        variant: "destructive",
      });
      setSeedLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const themeVertical =
    previewVertical ??
    (businessId ? undefined : "hair");

  return (
    <OnboardingExperienceShell vertical={themeVertical} country="IE">
    <div className="flex min-h-[100dvh] w-full flex-col items-center justify-center bg-background p-4 py-12">
      <div className="w-full max-w-2xl space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-serif tracking-tight">
            {intent.secondShop ? "Add a location" : "Welcome to Livia"}
          </h1>
          <p className="text-muted-foreground text-sm max-w-md mx-auto">
            {intent.secondShop
              ? "Chain tools activate when you own two shops."
              : "Self-serve setup for EU appointment businesses — about 15 minutes to go live."}
          </p>
        </div>

        {!businessId && isDemoLoginEnabled ? (
          <Card className="border-dashed border-muted-foreground/30 bg-muted/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-violet-400" />
                Just exploring?
              </CardTitle>
              <CardDescription>Load a full demo workspace with inbox, bookings, and staff.</CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                type="button"
                variant="secondary"
                className="w-full"
                onClick={loadDemoData}
                disabled={seedLoading}
              >
                {seedLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Loading demo…
                  </>
                ) : (
                  "Load full Livia demo"
                )}
              </Button>
            </CardContent>
          </Card>
        ) : null}

        {!businessId && isDemoLoginEnabled ? (
          <div className="flex items-center gap-3">
            <Separator className="flex-1" />
            <span className="text-xs text-muted-foreground">or set up your shop</span>
            <Separator className="flex-1" />
          </div>
        ) : null}

        <OnboardingWelcomePanel />

        <OnboardingWizard
          businessId={businessId}
          businessSlug={businessSlug}
          parentBusinessId={parentBusinessId}
          initialState={onboardingState}
          businessVertical={previewVertical}
          onVerticalPreview={setPreviewVertical}
          onBusinessCreated={(id, slug) => {
            setBusinessId(id);
            setBusinessSlug(slug);
            setOnboardingState(afterBusinessCreatedState() as OnboardingStatePayload);
          }}
          onComplete={() => {
            window.location.href = intent.secondShop
              ? "/lifecycle#chain"
              : businessSlug
                ? `/bookings?create=1`
                : "/dashboard";
          }}
        />
      </div>
    </div>
    </OnboardingExperienceShell>
  );
}
