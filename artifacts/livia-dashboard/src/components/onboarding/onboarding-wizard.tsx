import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  ONBOARDING_ACT_IDS,
  ONBOARDING_ACT_LABELS,
  type OnboardingActId,
} from "@/lib/onboarding-acts";
import { OnboardingCreateBusinessStep } from "./onboarding-create-business-step";
import { OnboardingInlinePanel } from "./onboarding-inline-panel";
import { OnboardingReadinessHint } from "./onboarding-readiness-hint";
import { OnboardingActForms } from "./onboarding-act-forms";
import { OnboardingChapterSpine } from "./onboarding-chapter-spine";
import { OnboardingPublicLinkSplit } from "./onboarding-public-link-split";
import { OnboardingPortalLayout } from "./onboarding-portal-layout";
import { OnboardingCockpitTease } from "./onboarding-cockpit-tease";
import {
  OnboardingArrivalOverlay,
  ONBOARDING_ARRIVAL_STORAGE_KEY,
} from "./onboarding-arrival-overlay";
import { CrossSurfaceContinueCard } from "./cross-surface-continue-card";
import { playCelebrationChime } from "@/lib/celebrate";
import { isOnboardingPortalExperienceEnabled } from "@/lib/onboarding-portal-enabled";
import { ONBOARDING_PREVIEW_SHOP_NAME } from "@/lib/onboarding-preview-fixtures";
import { onboardingLivHostLine } from "@/lib/onboarding-portal-copy";
import {
  nextPortalNavAct,
  portalAutoCompleteActs,
  portalVisibleStepInChapter,
  prevPortalNavAct,
  resolvePortalCurrentAct,
  type PortalChapterId,
} from "@/lib/onboarding-portal-chapters";
import { apiFetch, ApiFetchError } from "@/lib/api-fetch";
import { useToast } from "@/hooks/use-toast";
import { verticalPackUi } from "@/lib/vertical-pack-ui";
import { useTenantExperience } from "@/lib/tenant-experience-api";
import {
  blockingOnboardingPercent,
  isOnboardingAppUnlocked,
  type OnboardingActId as PolicyActId,
  type OnboardingState,
  type OnboardingChecklist,
} from "@workspace/policy";

export type OnboardingStatePayload = {
  currentAct: OnboardingActId;
  completedActs: OnboardingActId[];
  percentComplete: number;
  checklist?: Partial<OnboardingChecklist>;
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
  /** Dev `/dev/onboarding-preview` — local state only, no API. */
  previewMode?: boolean;
  onPreviewStateChange?: (next: OnboardingStatePayload) => void;
  /** Full-bleed portal shell (default). Set false to opt out. */
  portalMode?: boolean;
  /** Cold open / welcome block above chapter spine (e.g. video). */
  arrivalSlot?: ReactNode;
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
    href: "/onboarding",
    cta: "Set hours",
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
  previewMode = false,
  onPreviewStateChange,
  portalMode = isOnboardingPortalExperienceEnabled({ previewMode }),
  arrivalSlot,
}: Props) {
  const { toast } = useToast();
  const [state, setState] = useState<OnboardingStatePayload | null>(initialState);
  const [saving, setSaving] = useState(false);
  const [publicSlug, setPublicSlug] = useState<string | null>(businessSlug ?? null);
  const [businessName, setBusinessName] = useState<string>("");
  const [celebrate, setCelebrate] = useState(false);
  const [arrivalOpen, setArrivalOpen] = useState(() => {
    if (!portalMode || previewMode) return false;
    try {
      return !localStorage.getItem(ONBOARDING_ARRIVAL_STORAGE_KEY);
    } catch {
      return true;
    }
  });

  const dismissArrival = () => {
    setArrivalOpen(false);
    try {
      localStorage.setItem(ONBOARDING_ARRIVAL_STORAGE_KEY, "1");
    } catch {
      /* ignore */
    }
  };

  useEffect(() => {
    if (previewMode && initialState) setState(initialState);
  }, [previewMode, initialState]);

  useEffect(() => {
    if (businessId) setArrivalOpen(false);
  }, [businessId]);

  useEffect(() => {
    if (!businessId) return;
    if (previewMode) {
      setBusinessName(ONBOARDING_PREVIEW_SHOP_NAME);
      if (businessSlug) setPublicSlug(businessSlug);
      return;
    }
    void apiFetch<{ name?: string; slug?: string }>(`/businesses/${businessId}`)
      .then((b) => {
        if (b.name) setBusinessName(String(b.name));
        if (b.slug) setPublicSlug(String(b.slug));
      })
      .catch(() => {});
  }, [businessId, previewMode, businessSlug]);
  const { data: tenantExperience } = useTenantExperience(businessId ?? undefined);
  const vocab = verticalPackUi(businessVertical ?? tenantExperience?.vertical ?? "hair");
  const hints = actHints(vocab);

  const rawCurrentAct: OnboardingActId = useMemo(() => {
    if (!businessId) return "a1_create_business";
    return state?.currentAct ?? "a2_shop_profile";
  }, [businessId, state]);

  const currentAct: OnboardingActId = useMemo(() => {
    if (!portalMode) return rawCurrentAct;
    return resolvePortalCurrentAct(rawCurrentAct, state?.checklist);
  }, [portalMode, rawCurrentAct, state?.checklist]);

  const stepIndex = actIndex(currentAct);
  const tourPercent = state?.percentComplete ?? (businessId ? 8 : 0);
  const blockingPct = state
    ? blockingOnboardingPercent((state.completedActs ?? []) as PolicyActId[], businessVertical)
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
    businessVertical,
  );

  const persistState = async (next: OnboardingStatePayload) => {
    if (!businessId) return;
    if (previewMode) {
      setState(next);
      onPreviewStateChange?.(next);
      return;
    }
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

  useEffect(() => {
    if (!portalMode || !businessId || !state) return;
    if (rawCurrentAct === currentAct) return;
    void persistState({
      currentAct,
      completedActs: state.completedActs ?? [],
      percentComplete: state.percentComplete ?? percent,
      checklist: state.checklist,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- snap when resuming on a skipped act
  }, [portalMode, businessId, rawCurrentAct, currentAct]);

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
    const autoDone = portalMode ? portalAutoCompleteActs(act, state?.checklist) : [];
    const completed = [...new Set([...(state?.completedActs ?? []), act, ...autoDone])];
    const nextAct = portalMode
      ? (nextPortalNavAct(act, state?.checklist) ?? act)
      : actIndex(act) >= 0 && actIndex(act) < ONBOARDING_ACT_IDS.length - 1
        ? ONBOARDING_ACT_IDS[actIndex(act) + 1]!
        : act;
    const next: OnboardingStatePayload = {
      currentAct: nextAct,
      completedActs: completed,
      percentComplete: Math.min(100, Math.round((completed.length / ONBOARDING_ACT_IDS.length) * 100)),
      checklist: state?.checklist,
    };
    await persistState(next);
    if (act === "a12_go_live") {
      playCelebrationChime();
      setCelebrate(true);
      window.setTimeout(() => onComplete(), 900);
    }
  };

  const INLINE_FORM_ACTS: OnboardingActId[] = [
    "a2_shop_profile",
    "a5_hours",
    "a6_liv",
    "a7_channels",
    "a11_migration",
    "a12_go_live",
  ];
  const INLINE_PREVIEW_ACTS: OnboardingActId[] = ["a3_service_menu", "a4_team", "a9_billing"];

  const jumpToAct = (act: OnboardingActId) => {
    if (!businessId) return;
    const target = portalMode ? resolvePortalCurrentAct(act, state?.checklist) : act;
    const idx = actIndex(target);
    const curIdx = actIndex(currentAct);
    const done = state?.completedActs?.includes(target);
    if (!done && idx > curIdx) return;
    void persistState({
      currentAct: target,
      completedActs: state?.completedActs ?? [],
      percentComplete: state?.percentComplete ?? percent,
      checklist: state?.checklist,
    });
  };

  const goBack = () => {
    const prev = portalMode
      ? prevPortalNavAct(currentAct, !!businessId, state?.checklist)
      : (() => {
          if (stepIndex <= 0) return null;
          let p = ONBOARDING_ACT_IDS[stepIndex - 1]!;
          if (businessId && p === "a1_create_business") {
            if (stepIndex <= 1) return null;
            p = ONBOARDING_ACT_IDS[stepIndex - 2]!;
          }
          return p;
        })();
    if (!prev) return;
    void persistState({
      currentAct: prev,
      completedActs: state?.completedActs ?? [],
      percentComplete: state?.percentComplete ?? 0,
      checklist: state?.checklist,
    });
  };

  const jumpToChapter = (_chapterId: PortalChapterId, targetAct: OnboardingActId) => {
    jumpToAct(targetAct);
  };

  const hint = hints[currentAct];
  const chapterMicro = portalMode ? portalVisibleStepInChapter(currentAct, state?.checklist) : null;
  const canGoBack = portalMode
    ? !!prevPortalNavAct(currentAct, !!businessId, state?.checklist)
    : stepIndex > 0 && !(businessId && stepIndex === 1);
  const packLabel = tenantExperience?.vocabulary.label ?? vocab.label;
  const wideStep = currentAct === "a6_liv" || currentAct === "a8_public_link";
  const livMessage = onboardingLivHostLine(currentAct, vocab, businessName);
  const checklistTicks = state?.checklist
    ? Object.values(state.checklist).filter(Boolean).length
    : 0;

  const preBusinessProgress = !businessId ? (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>
          {portalMode
            ? "Chapter 1 of 3 · Your shop"
            : `Step ${Math.max(1, stepIndex + 1)} of ${ONBOARDING_ACT_IDS.length}`}
        </span>
        <span>
          {blockingPct}% essentials · {tourPercent}% tour
        </span>
      </div>
      <div className="h-1.5 w-full rounded-full bg-muted/80 overflow-hidden">
        <div
          className="h-full bg-primary transition-all duration-500"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  ) : null;

  const stepBody = (
    <>
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
          onCreated={(id, slug, extras) => {
            setPublicSlug(slug);
            onBusinessCreated(id, slug);
            if (extras?.migrationIntent && extras.migrationIntent !== "unspecified") {
              void persistState({
                currentAct: "a2_shop_profile",
                completedActs: ["a1_create_business"],
                percentComplete: state?.percentComplete ?? 8,
                checklist: {
                  ...(state?.checklist ?? {}),
                  migrationIntent: extras.migrationIntent,
                },
              });
            }
          }}
        />
      ) : null}

      {currentAct === "a8_public_link" && publicSlug ? (
        <OnboardingPublicLinkSplit
          slug={publicSlug}
          businessName={businessName}
          businessId={businessId}
          onPresentationReviewed={() =>
            updateChecklist({
              ...(state?.checklist ?? {}),
              presentationPresetReviewed: true,
            })
          }
        />
      ) : null}

      {businessId && INLINE_FORM_ACTS.includes(currentAct) ? (
        <OnboardingActForms
          act={currentAct}
          businessId={businessId}
          checklist={state?.checklist}
          onChecklistChange={updateChecklist}
          previewMode={previewMode}
        />
      ) : null}

      {currentAct === "a12_go_live" && businessId ? (
        <>
          <OnboardingCockpitTease readyCount={Math.min(3, Math.floor(checklistTicks / 2))} />
          {portalMode ? (
            <p className="text-xs text-muted-foreground">
              Billing, team invites, and client import are in Settings — we marked them done so you can
              launch now.
            </p>
          ) : null}
        </>
      ) : null}

      {businessId && !previewMode ? (
        <OnboardingReadinessHint businessId={businessId} state={state} />
      ) : null}

      {businessId && INLINE_PREVIEW_ACTS.includes(currentAct) ? (
        previewMode ? (
          <p className="text-sm text-muted-foreground rounded-lg border bg-muted/30 p-4">
            Inline preview for this step uses live data — open signed-in onboarding to test.
          </p>
        ) : (
          <OnboardingInlinePanel act={currentAct} businessId={businessId} />
        )
      ) : null}

      {hint?.href &&
      !previewMode &&
      currentAct !== "a1_create_business" &&
      !INLINE_PREVIEW_ACTS.includes(currentAct) ? (
        <Button variant="outline" asChild>
          <Link href={hint.href}>{hint.cta ?? "Open"}</Link>
        </Button>
      ) : null}
    </>
  );

  const footerNav =
    currentAct !== "a1_create_business" ? (
      <div className="flex flex-col gap-3">
        {appUnlocked ? (
          <Button variant="secondary" className="w-full" asChild>
            <Link href="/dashboard">Enter Livia — finish the rest later</Link>
          </Button>
        ) : null}
        <div className="flex items-center justify-between gap-3">
          <Button
            type="button"
            variant="ghost"
            disabled={!canGoBack || saving || !businessId}
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
            {currentAct === "a12_go_live" ? "Open your cockpit" : "Continue"}
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </div>
    ) : null;

  if (!portalMode) {
    return (
      <div className="w-full max-w-2xl mx-auto space-y-6">
        {businessId ? (
          <OnboardingChapterSpine
            currentAct={currentAct}
            completedActs={(state?.completedActs ?? []) as OnboardingActId[]}
            onJump={jumpToAct}
          />
        ) : (
          preBusinessProgress
        )}
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
            {stepBody}
            {footerNav}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <>
      {arrivalOpen ? <OnboardingArrivalOverlay onEnter={dismissArrival} /> : null}
      <OnboardingPortalLayout
        livMessage={livMessage}
        currentAct={currentAct}
        completedActs={(state?.completedActs ?? []) as OnboardingActId[]}
        onJumpChapter={businessId ? jumpToChapter : undefined}
        chapterStepHint={
          chapterMicro
            ? `${chapterMicro.label} · ${chapterMicro.index} of ${chapterMicro.total} in this chapter`
            : null
        }
        showChapterSpine={!!businessId}
        packLabel={packLabel}
        wide={wideStep}
        celebrate={celebrate}
        topSlot={
          <>
            {arrivalSlot}
            {preBusinessProgress}
            {businessId ? <CrossSurfaceContinueCard className="mt-4" /> : null}
          </>
        }
        footer={footerNav}
      >
        {stepBody}
      </OnboardingPortalLayout>
    </>
  );
}
