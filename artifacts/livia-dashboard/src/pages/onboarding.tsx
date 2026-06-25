import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "wouter";
import { useUser } from "@clerk/clerk-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useBusiness } from "@/lib/business-context";
import { isDemoAccountEmail } from "@/lib/demo-tenant";
import { apiFetch } from "@/lib/api-fetch";
import { parseUserFacingError } from "@/lib/user-facing-errors";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Sparkles } from "lucide-react";
import { OnboardingWizard, type OnboardingStatePayload } from "@/components/onboarding/onboarding-wizard";
import { isDemoLoginEnabled } from "@/lib/persona";
import { pickOnboardingResumeBusiness } from "@workspace/policy";
import { OnboardingExperienceShell } from "@/components/onboarding/onboarding-experience-shell";
import { OnboardingWelcomePanel } from "@/components/onboarding-welcome-panel";
import { OnboardingStartPathStep } from "@/components/onboarding/onboarding-start-path-step";
import { marketingBookDemoUrl } from "@/lib/demo-routes";
import { isOnboardingPortalExperienceEnabled } from "@/lib/onboarding-portal-enabled";
import {
  clearOnboardingMigrationIntent,
  onboardingPathAfterTrackPick,
  readOnboardingMigrationIntent,
  writeOnboardingMigrationIntent,
} from "@/lib/onboarding-migration-intent";
import type { MigrationIntent } from "@workspace/policy";

function readOnboardingIntent(): { secondShop?: boolean; fresh?: boolean; pathPick?: boolean } {
  if (typeof window === "undefined") return {};
  const params = new URLSearchParams(window.location.search);
  return {
    secondShop: params.get("intent") === "second-shop",
    fresh: params.get("fresh") === "1",
    pathPick: params.get("path") === "1",
  };
}

export default function OnboardingPage() {
  const intent = readOnboardingIntent();
  const [location, navigate] = useLocation();
  const { user } = useUser();
  const demoAccount = isDemoAccountEmail(user?.primaryEmailAddress?.emailAddress);
  const { businesses, setBusiness, setBusinessById, isLoading: businessesLoading } = useBusiness();
  const parentBusinessId =
    intent.secondShop && businesses.length > 0 ? businesses[0]!.id : undefined;
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [seedLoading, setSeedLoading] = useState(false);
  const [businessId, setBusinessId] = useState<string | null>(null);
  const [businessSlug, setBusinessSlug] = useState<string | null>(null);
  const [onboardingState, setOnboardingState] = useState<OnboardingStatePayload | null>(null);
  const [previewVertical, setPreviewVertical] = useState<string | null>(null);
  const [resumeHydrated, setResumeHydrated] = useState(false);
  const [migrationIntent, setMigrationIntent] = useState<MigrationIntent | null>(() => {
    if (typeof window === "undefined") return null;
    const params = new URLSearchParams(window.location.search);
    if (params.get("path") === "1") return null;
    return readOnboardingMigrationIntent();
  });

  const urlMigrationIntent = useMemo(() => readOnboardingMigrationIntent(), [location]);

  useEffect(() => {
    if (intent.pathPick) return;
    if (urlMigrationIntent && urlMigrationIntent !== migrationIntent) {
      setMigrationIntent(urlMigrationIntent);
    }
  }, [intent.pathPick, urlMigrationIntent, migrationIntent]);

  const needsStartPath =
    intent.fresh && !intent.secondShop && !businessId && migrationIntent === null;

  useEffect(() => {
    if (!intent.fresh || !intent.pathPick) return;
    clearOnboardingMigrationIntent();
    setMigrationIntent(null);
    try {
      const url = new URL(window.location.href);
      url.searchParams.delete("path");
      window.history.replaceState({}, "", url.pathname + url.search);
    } catch {
      /* ignore */
    }
  }, [intent.fresh, intent.pathPick]);

  const portalExperience =
    isOnboardingPortalExperienceEnabled() ||
    migrationIntent === "switching" ||
    intent.fresh;

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    if (params.get("migration_oauth") !== "1") return;
    const pull = params.get("pull");
    const imported = Number(params.get("imported") ?? "0");
    if (pull === "ok" && imported > 0) {
      toast({
        title: "Import complete",
        description: `${imported} records applied. Set your hours next.`,
      });
    } else if (pull === "empty") {
      toast({
        title: "Connected — nothing new to import",
        description: "Upload export files if data is missing.",
        variant: "destructive",
      });
    } else if (pull === "error") {
      toast({
        title: "Auto-import failed",
        description: "Use file upload on this step.",
        variant: "destructive",
      });
    } else {
      toast({ title: "Connected", description: "Continue import on this step." });
    }
    for (const key of ["migration_oauth", "pull", "imported", "broker", "oauth"]) {
      params.delete(key);
    }
    const qs = params.toString();
    window.history.replaceState({}, "", qs ? `${window.location.pathname}?${qs}` : window.location.pathname);
    void queryClient.invalidateQueries({ queryKey: ["/me/businesses"] });
  }, [toast, queryClient]);

  useEffect(() => {
    if (intent.fresh) {
      try {
        window.localStorage.removeItem("livia.currentBusinessId");
        window.localStorage.removeItem("livia_current_business_id");
      } catch {
        /* ignore */
      }
    }
  }, [intent.fresh]);

  useEffect(() => {
    if (intent.secondShop) {
      setResumeHydrated(true);
      return;
    }
    if (businessesLoading) return;

    const clerkUserId = user?.id ?? "";
    const email = user?.primaryEmailAddress?.emailAddress ?? null;
    const latest = pickOnboardingResumeBusiness(
      businesses as Parameters<typeof pickOnboardingResumeBusiness>[0],
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
        const trackIntent = (raw as OnboardingStatePayload).checklist?.migrationIntent;
        if (trackIntent === "switching" || trackIntent === "fresh") {
          setMigrationIntent(trackIntent);
        }
      } else {
        setOnboardingState({
          currentAct: "a2_shop_profile",
          completedActs: ["a1_create_business"],
          percentComplete: 8,
        });
      }
    }
    setResumeHydrated(true);
  }, [
    intent.secondShop,
    businesses,
    businessesLoading,
    user?.id,
    user?.primaryEmailAddress?.emailAddress,
  ]);

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
        description: parseUserFacingError(err, "Demo data could not be loaded"),
        variant: "destructive",
      });
      setSeedLoading(false);
    }
  };

  const showResumeSpinner =
    !intent.fresh && !intent.secondShop && (!resumeHydrated || businessesLoading);

  if (showResumeSpinner) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const themeVertical =
    previewVertical ??
    (businessId ? undefined : "hair");

  if (needsStartPath) {
    return (
      <OnboardingExperienceShell vertical={themeVertical} country="IE">
        <div data-testid="onboarding-page" className="contents">
          <OnboardingStartPathStep
            onContinue={(next) => {
              writeOnboardingMigrationIntent(next);
              setMigrationIntent(next);
              navigate(onboardingPathAfterTrackPick(next));
            }}
          />
        </div>
      </OnboardingExperienceShell>
    );
  }

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
      initialMigrationIntent={migrationIntent ?? undefined}
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
        void queryClient.invalidateQueries({ queryKey: ["/me/businesses"] });
        if (businesses.some((b) => b.id === id)) {
          setBusinessById(id);
        } else {
          void apiFetch(`/businesses/${id}`)
            .then((b) => setBusiness(b as Parameters<typeof setBusiness>[0]))
            .catch(() => {});
        }
      }}
      onComplete={() => {
        clearOnboardingMigrationIntent();
        if (intent.secondShop) {
          window.location.href = "/lifecycle#chain";
          return;
        }
        if (businessSlug) {
          window.location.href = `/book/${businessSlug}?welcome=1`;
          return;
        }
        window.location.href = "/dashboard";
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
                  : "A few minutes to open your shop — Liv handles the rest after."}
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
