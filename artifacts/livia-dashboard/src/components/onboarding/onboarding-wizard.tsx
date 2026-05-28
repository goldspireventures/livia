import { useMemo, useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronLeft, ChevronRight, ExternalLink } from "lucide-react";
import {
  ONBOARDING_ACT_IDS,
  ONBOARDING_ACT_LABELS,
  type OnboardingActId,
} from "@/lib/onboarding-acts";
import { OnboardingCreateBusinessStep } from "./onboarding-create-business-step";
import { OnboardingInlinePanel } from "./onboarding-inline-panel";
import { OnboardingActForms } from "./onboarding-act-forms";
import { apiFetch, ApiFetchError } from "@/lib/api-fetch";
import { useToast } from "@/hooks/use-toast";
import { verticalPackUi } from "@/lib/vertical-pack-ui";
import { useTenantExperience } from "@/lib/tenant-experience-api";
import {
  blockingOnboardingPercent,
  isOnboardingAppUnlocked,
  type OnboardingActId as PolicyActId,
  type OnboardingState,
} from "@workspace/policy";

export type OnboardingStatePayload = {
  currentAct: OnboardingActId;
  completedActs: OnboardingActId[];
  percentComplete: number;
  checklist?: Record<string, boolean>;
};

type Props = {
  businessId: string | null;
  businessSlug?: string | null;
  parentBusinessId?: string;
  initialState: OnboardingStatePayload | null;
  businessVertical?: string | null;
  onVerticalPreview?: (vertical: string | null) => void;
  onBusinessCreated: (businessId: string, slug: string) => void;
  onComplete: () => void;
};

function actHints(
  vocab: ReturnType<typeof verticalPackUi>,
): Partial<Record<OnboardingActId, { body: string; href?: string; cta?: string }>> {
  return {
  a2_shop_profile: {
    body: `Name your ${vocab.locationNoun.toLowerCase()}, phone, city, and description — customers see this on your booking page.`,
    href: "/settings?tab=shop",
    cta: `Edit ${vocab.locationNoun.toLowerCase()}`,
  },
  a3_service_menu: {
    body: `We seeded a starter ${vocab.serviceNoun.toLowerCase()} menu — confirm or add more.`,
    href: "/services",
    cta: `Edit ${vocab.serviceNoun.toLowerCase()}s`,
  },
  a4_team: {
    body: `Your profile is on the ${vocab.teamNoun.toLowerCase()} — invite others or stay solo.`,
    href: "/staff",
    cta: `Manage ${vocab.teamNoun.toLowerCase()}`,
  },
  a5_hours: {
    body: "Set weekly opening hours so Liv knows when you take bookings.",
    href: "/staff",
    cta: "Set availability",
  },
  a6_liv: {
    body: "Choose Liv's tone, greeting, and when she can book for you.",
    href: "/settings?tab=liv",
    cta: "Configure Liv",
  },
  a7_channels: {
    body: "Connect SMS and social channels so Liv can reply from one inbox.",
    href: "/settings?tab=comms",
    cta: "Open Communications",
  },
  a8_public_link: {
    body: "Share your booking page and run a test booking.",
    cta: "Test booking page",
  },
  a9_billing: {
    body: "Closed beta is on the house — pick a plan to lock in pricing for launch.",
    href: "/settings?tab=billing",
    cta: "Billing",
  },
  a10_invite_team: {
    body: "Invite your manager or front desk.",
    href: "/staff",
    cta: "Invite team",
  },
  a11_migration: {
    body: "Optional: import clients from a spreadsheet or your old system.",
  },
  a12_go_live: {
    body: "Tick off the essentials before you point customers at Livia.",
  },
};
}

function actIndex(act: OnboardingActId): number {
  return ONBOARDING_ACT_IDS.indexOf(act);
}

export function OnboardingWizard({
  businessId,
  businessSlug,
  parentBusinessId,
  initialState,
  businessVertical,
  onVerticalPreview,
  onBusinessCreated,
  onComplete,
}: Props) {
  const { toast } = useToast();
  const [state, setState] = useState<OnboardingStatePayload | null>(initialState);
  const [saving, setSaving] = useState(false);
  const [publicSlug, setPublicSlug] = useState<string | null>(businessSlug ?? null);
  const { data: tenantExperience } = useTenantExperience(businessId ?? undefined);
  const vocab = verticalPackUi(businessVertical ?? tenantExperience?.vertical ?? "hair");
  const hints = actHints(vocab);

  const currentAct: OnboardingActId = useMemo(() => {
    if (!businessId) return "a1_create_business";
    return state?.currentAct ?? "a2_shop_profile";
  }, [businessId, state]);

  const stepIndex = actIndex(currentAct);
  const tourPercent = state?.percentComplete ?? (businessId ? 8 : 0);
  const blockingPct = state
    ? blockingOnboardingPercent((state.completedActs ?? []) as PolicyActId[])
    : 0;
  const percent = Math.max(tourPercent, blockingPct);
  const appUnlocked = isOnboardingAppUnlocked(
    state
      ? ({
          currentAct: state.currentAct as PolicyActId,
          completedActs: (state.completedActs ?? []) as PolicyActId[],
          percentComplete: state.percentComplete,
          checklist: state.checklist,
        } as OnboardingState)
      : undefined,
  );

  const persistState = async (next: OnboardingStatePayload) => {
    if (!businessId) return;
    setSaving(true);
    try {
      await apiFetch(`/businesses/${businessId}`, {
        method: "PATCH",
        body: JSON.stringify({ onboardingState: next }),
      });
      setState(next);
    } catch (err: unknown) {
      const e = err instanceof ApiFetchError ? err : null;
      toast({
        title: "Could not save progress",
        description: e?.requestId
          ? `${e.message} (ref ${e.requestId})`
          : err instanceof Error
            ? err.message
            : "Try again",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const updateChecklist = (checklist: OnboardingStatePayload["checklist"]) => {
    if (!businessId) return;
    void persistState({
      currentAct: state?.currentAct ?? currentAct,
      completedActs: state?.completedActs ?? [],
      percentComplete: state?.percentComplete ?? percent,
      checklist,
    });
  };

  const completeAct = async (act: OnboardingActId) => {
    if (act === "a12_go_live" && !state?.checklist?.testBooking) {
      toast({
        title: "One more step",
        description:
          "Book a test appointment on your public page or use New booking, then tick “Test booking” on the checklist.",
        variant: "destructive",
      });
      return;
    }
    const completed = [...new Set([...(state?.completedActs ?? []), act])];
    const idx = actIndex(act);
    const nextAct =
      idx >= 0 && idx < ONBOARDING_ACT_IDS.length - 1 ? ONBOARDING_ACT_IDS[idx + 1]! : act;
    const next: OnboardingStatePayload = {
      currentAct: currentAct === act ? nextAct : (state?.currentAct ?? nextAct),
      completedActs: completed,
      percentComplete: Math.min(100, Math.round((completed.length / ONBOARDING_ACT_IDS.length) * 100)),
      checklist: state?.checklist,
    };
    await persistState(next);
    if (act === "a12_go_live") {
      onComplete();
    }
  };

  const INLINE_FORM_ACTS: OnboardingActId[] = [
    "a2_shop_profile",
    "a5_hours",
    "a6_liv",
    "a7_channels",
    "a12_go_live",
  ];
  const INLINE_PREVIEW_ACTS: OnboardingActId[] = ["a3_service_menu", "a4_team", "a9_billing"];

  const goBack = () => {
    if (stepIndex <= 0) return;
    let prev = ONBOARDING_ACT_IDS[stepIndex - 1]!;
    // Business already exists — never navigate back to create-business (no UI / dead end).
    if (businessId && prev === "a1_create_business") {
      if (stepIndex <= 1) return;
      prev = ONBOARDING_ACT_IDS[stepIndex - 2]!;
    }
    void persistState({
      currentAct: prev,
      completedActs: state?.completedActs ?? [],
      percentComplete: state?.percentComplete ?? 0,
      checklist: state?.checklist,
    });
  };

  const hint = hints[currentAct];
  const packLabel = tenantExperience?.vocabulary.label ?? vocab.label;

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            Step {Math.max(1, stepIndex + 1)} of {ONBOARDING_ACT_IDS.length}
          </span>
          <span>
            {blockingPct}% essentials · {tourPercent}% tour
          </span>
        </div>
        <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
          <div
            className="h-full bg-primary transition-all duration-300"
            style={{ width: `${percent}%` }}
          />
        </div>
      </div>

      {businessId && packLabel ? (
        <p className="text-xs text-muted-foreground border rounded-md px-3 py-2 bg-muted/30">
          <span className="font-medium text-foreground">{packLabel}</span>
          {tenantExperience?.vocabulary.hint ? (
            <span> · {tenantExperience.vocabulary.hint}</span>
          ) : null}
        </p>
      ) : null}

      <Card className="border-primary/10 shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl font-serif tracking-tight">
            {ONBOARDING_ACT_LABELS[currentAct]}
          </CardTitle>
          <CardDescription>
            {currentAct === "a1_create_business"
              ? `Tell us about your ${vocab.locationNoun.toLowerCase()} — we'll seed ${vocab.serviceNoun.toLowerCase()}s and policies for your market.`
              : (hint?.body ?? "Complete this step, then continue.")}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {currentAct === "a1_create_business" && !businessId ? (
            <OnboardingCreateBusinessStep
              onVerticalPreview={onVerticalPreview}
              parentBusinessId={
                parentBusinessId ??
                (typeof window !== "undefined"
                  ? new URLSearchParams(window.location.search).get("parentBusinessId") ?? undefined
                  : undefined)
              }
              defaultStructureKind={
                typeof window !== "undefined" &&
                new URLSearchParams(window.location.search).get("intent") === "second-shop"
                  ? "location"
                  : "standalone"
              }
              onCreated={(id, slug) => {
                setPublicSlug(slug);
                onBusinessCreated(id, slug);
              }}
            />
          ) : null}

          {currentAct === "a8_public_link" && publicSlug ? (
            <a
              href={`/b/${publicSlug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm text-aurora-cyan hover:underline"
            >
              Open your booking page
              <ExternalLink className="h-4 w-4" />
            </a>
          ) : null}

          {businessId && INLINE_FORM_ACTS.includes(currentAct) ? (
            <OnboardingActForms
              act={currentAct}
              businessId={businessId}
              checklist={state?.checklist}
              onChecklistChange={updateChecklist}
            />
          ) : null}

          {businessId && INLINE_PREVIEW_ACTS.includes(currentAct) ? (
            <OnboardingInlinePanel act={currentAct} businessId={businessId} />
          ) : null}

          {hint?.href &&
          currentAct !== "a1_create_business" &&
          !INLINE_PREVIEW_ACTS.includes(currentAct) ? (
            <Button variant="outline" asChild>
              <Link href={hint.href}>{hint.cta ?? "Open"}</Link>
            </Button>
          ) : null}

          {currentAct !== "a1_create_business" ? (
            <div className="flex flex-col gap-3 pt-2">
              {appUnlocked ? (
                <Button variant="secondary" className="w-full" asChild>
                  <Link href="/dashboard">Enter Livia — finish the rest later</Link>
                </Button>
              ) : null}
              <div className="flex items-center justify-between gap-3">
                <Button
                  type="button"
                  variant="ghost"
                  disabled={stepIndex <= 0 || saving || !businessId}
                  onClick={goBack}
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Back
                </Button>
                <Button
                  type="button"
                  disabled={saving || !businessId}
                  onClick={() => void completeAct(currentAct)}
                >
                  {currentAct === "a12_go_live" ? "Finish setup" : "Continue"}
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>

      <details className="text-xs text-muted-foreground">
        <summary className="cursor-pointer hover:text-foreground">All setup steps ({ONBOARDING_ACT_IDS.length})</summary>
        <nav className="mt-2 grid grid-cols-2 sm:grid-cols-3 gap-2">
          {ONBOARDING_ACT_IDS.map((act) => {
            const done = state?.completedActs?.includes(act);
            const active = act === currentAct;
            return (
              <div
                key={act}
                className={`rounded-md border px-2 py-1.5 truncate ${
                  active ? "border-primary/40 bg-primary/5 text-foreground" : "border-transparent"
                }`}
              >
                {done ? "✓ " : ""}
                {ONBOARDING_ACT_LABELS[act]}
              </div>
            );
          })}
        </nav>
      </details>
    </div>
  );
}
