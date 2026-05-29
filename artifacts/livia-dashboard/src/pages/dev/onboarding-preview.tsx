import { useMemo, useState } from "react";
import { useLocation } from "wouter";
import { OnboardingExperienceShell } from "@/components/onboarding/onboarding-experience-shell";
import {
  OnboardingWizard,
  type OnboardingStatePayload,
} from "@/components/onboarding/onboarding-wizard";
import {
  ONBOARDING_ACT_IDS,
  ONBOARDING_ACT_LABELS,
  type OnboardingActId,
} from "@/lib/onboarding-acts";
import {
  ONBOARDING_PREVIEW_BUSINESS_ID,
  ONBOARDING_PREVIEW_DEFAULT_SLUG,
  parsePreviewAct,
  previewStateForAct,
} from "@/lib/onboarding-preview-fixtures";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

function usePreviewSearch() {
  const [location] = useLocation();
  return useMemo(() => new URLSearchParams(location.split("?")[1] ?? ""), [location]);
}

export default function OnboardingPreviewPage() {
  const params = usePreviewSearch();
  const { toast } = useToast();
  const initialAct = parsePreviewAct(params.get("act"));
  const slug = params.get("slug")?.trim() || ONBOARDING_PREVIEW_DEFAULT_SLUG;

  const [onboardingState, setOnboardingState] = useState<OnboardingStatePayload>(() =>
    previewStateForAct(initialAct),
  );

  const setActInUrl = (act: OnboardingActId) => {
    const next = new URLSearchParams(params);
    next.set("act", act);
    if (!next.get("slug")) next.set("slug", slug);
    window.history.replaceState(null, "", `/dev/onboarding-preview?${next.toString()}`);
    setOnboardingState(previewStateForAct(act));
  };

  const arrivalSlot = (
    <>
      <div
        className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm backdrop-blur-sm"
        data-testid="onboarding-preview-banner"
      >
        <p className="font-medium text-foreground">Dev preview — no sign-in</p>
            <p className="text-muted-foreground mt-1 leading-relaxed">
              Portal UI — 3 chapters (~6 Continue taps). Saves disabled. Staging:{" "}
              <code className="text-xs bg-muted px-1 rounded">/onboarding-preview</code> on{" "}
              <code className="text-xs bg-muted px-1 rounded">app.staging.livia-hq.com</code> — see{" "}
              <code className="text-xs bg-muted px-1 rounded">docs/operations/STAGING-SETUP.md</code>.
            </p>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <label className="text-xs text-muted-foreground flex items-center gap-2">
            Jump to act
            <Select
              value={onboardingState.currentAct}
              onValueChange={(v) => setActInUrl(v as OnboardingActId)}
            >
              <SelectTrigger className="h-8 w-[200px] bg-background">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ONBOARDING_ACT_IDS.map((id) => (
                  <SelectItem key={id} value={id}>
                    {ONBOARDING_ACT_LABELS[id]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </label>
          <a href="/sign-in" className="text-xs text-primary underline underline-offset-2">
            Real flow (sign in)
          </a>
          <button
            type="button"
            className="text-xs text-muted-foreground underline"
            onClick={() => {
              try {
                localStorage.removeItem("livia.onboarding.portal.entered.v1");
              } catch {
                /* ignore */
              }
              window.location.reload();
            }}
          >
            Replay arrival
          </button>
        </div>
      </div>
    </>
  );

  return (
    <OnboardingExperienceShell vertical="hair" country="IE">
      <OnboardingWizard
        previewMode
        businessId={ONBOARDING_PREVIEW_BUSINESS_ID}
        businessSlug={slug}
        initialState={onboardingState}
        businessVertical="hair"
        arrivalSlot={arrivalSlot}
        onPreviewStateChange={setOnboardingState}
        onBusinessCreated={() => {
          toast({ title: "Preview only", description: "Create business is disabled here." });
        }}
        onComplete={() => {
          toast({ title: "Preview only", description: "Go-live redirect is disabled here." });
        }}
      />
    </OnboardingExperienceShell>
  );
}
