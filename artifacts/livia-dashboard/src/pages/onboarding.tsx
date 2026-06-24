import { useEffect, useState } from "react";
import { Link } from "wouter";
import { useUser } from "@clerk/clerk-react";
import { useToast } from "@/hooks/use-toast";
import { useBusiness } from "@/lib/business-context";
import { isDemoAccountEmail } from "@/lib/demo-tenant";
import { apiFetch } from "@/lib/api-fetch";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Sparkles } from "lucide-react";
import { OnboardingWizard, type OnboardingStatePayload } from "@/components/onboarding/onboarding-wizard";
import { isDemoLoginEnabled } from "@/lib/persona";
import { afterBusinessCreatedState, pickPrimarySessionBusiness } from "@workspace/policy";
import { OnboardingExperienceShell } from "@/components/onboarding/onboarding-experience-shell";
import { OnboardingWelcomePanel } from "@/components/onboarding-welcome-panel";
import { marketingBookDemoUrl } from "@/lib/demo-routes";
import { isOnboardingPortalExperienceEnabled } from "@/lib/onboarding-portal-enabled";

type BusinessRow = {
  id: string;
  slug: string;
  ownerId?: string;
  vertical?: string | null;
  onboardingState?: OnboardingStatePayload | null;
};

function readOnboardingIntent(): { secondShop?: boolean } {
  if (typeof window === "undefined") return {};
  const params = new URLSearchParams(window.location.search);
  return params.get("intent") === "second-shop" ? { secondShop: true } : {};
}

export default function OnboardingPage() {
  const intent = readOnboardingIntent();
  const { user } = useUser();
  const demoAccount = isDemoAccountEmail(user?.primaryEmailAddress?.emailAddress);
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
      .then((rows) => {
        const clerkUserId = user?.id ?? "";
        const email = user?.primaryEmailAddress?.emailAddress ?? null;
        const latest = pickPrimarySessionBusiness(
          rows as Parameters<typeof pickPrimarySessionBusiness>[0],
          clerkUserId,
          email,
        );
        if (latest) {
          setBusinessId(latest.id);
          setBusinessSlug(latest.slug);
          const v = latest.vertical;
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
  }, [intent.secondShop, toast, user?.id, user?.primaryEmailAddress?.emailAddress]);

  const loadDemoData = async () => {
    setSeedLoading(true);
    try {
      await apiFetch("/demo/provision", { method: "POST" });
      toast({
        title: "Full Livia demo ready",
        description: "Opening demo gateway…",
      });
      window.location.href = marketingBookDemoUrl();
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

  const portalExperience = isOnboardingPortalExperienceEnabled();

  const arrivalSlot = (
    <>
      {!businessId && demoAccount ? (
        <Card className="border-primary/30 bg-primary/5" data-testid="onboarding-demo-hint">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              Demo login — link your shop
            </CardTitle>
            <CardDescription>
              <code className="text-xs">{user?.primaryEmailAddress?.emailAddress}</code> is signed in, but
              this environment has no Bloom membership yet. Book a demo to enter through the concierge, or load
              the full demo world here.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-2 sm:flex-row">
            <a href={marketingBookDemoUrl()} className="flex-1">
              <Button type="button" variant="default" className="w-full">
                Book a demo
              </Button>
            </a>
            {isDemoLoginEnabled ? (
              <Button
                type="button"
                variant="secondary"
                className="flex-1"
                onClick={loadDemoData}
                disabled={seedLoading}
              >
                {seedLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Loading demo…
                  </>
                ) : (
                  "Load full demo world"
                )}
              </Button>
            ) : null}
          </CardContent>
        </Card>
      ) : null}
      {!businessId && isDemoLoginEnabled && !demoAccount ? (
        <Card className="border-dashed border-muted-foreground/30 bg-background/40 backdrop-blur-sm">
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
    </>
  );

  const wizard = (
    <OnboardingWizard
      portalMode={portalExperience}
      businessId={businessId}
      businessSlug={businessSlug}
      parentBusinessId={parentBusinessId}
      initialState={onboardingState}
      businessVertical={previewVertical}
      onVerticalPreview={setPreviewVertical}
      arrivalSlot={arrivalSlot}
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
  );

  return (
    <OnboardingExperienceShell vertical={themeVertical} country="IE">
      <div data-testid="onboarding-page" className="contents">
      {portalExperience ? (
        wizard
      ) : (
        <div className="flex min-h-[100dvh] w-full flex-col items-center justify-center p-4 py-12">
          <div className="w-full max-w-2xl space-y-8">
            <div className="text-center space-y-2">
              <h1 className="text-3xl font-serif tracking-tight">
                {intent.secondShop ? "Add a location" : "Welcome to Livia"}
              </h1>
              <p className="text-muted-foreground text-sm max-w-md mx-auto">
                {intent.secondShop
                  ? "Chain tools activate when you own two shops."
                  : "Self-serve setup — about 15 minutes to go live."}
              </p>
            </div>
            {!businessId && !intent.secondShop ? <OnboardingWelcomePanel /> : null}
            {wizard}
          </div>
        </div>
      )}
      </div>
    </OnboardingExperienceShell>
  );
}
