import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  ONBOARDING_ACT_IDS,
  ONBOARDING_ACT_LABELS,
  type OnboardingActId,
} from "@/lib/onboarding-acts";
import { OnboardingCreateBusinessStep } from "./onboarding-create-business-step";
import { OnboardingImportShellStep } from "./onboarding-import-shell-step";
import { OnboardingInlinePanel } from "./onboarding-inline-panel";
import { OnboardingReadinessHint } from "./onboarding-readiness-hint";
import { OnboardingActForms, type OnboardingActSaveHandler } from "./onboarding-act-forms";
import { OnboardingChapterSpine } from "./onboarding-chapter-spine";
import { OnboardingPublicLinkSplit } from "./onboarding-public-link-split";
import { OnboardingPortalLayout } from "./onboarding-portal-layout";
import { OnboardingPortalStepSpine } from "./onboarding-portal-step-spine";
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
  prevPortalNavAct,
  resolvePortalCurrentAct,
  resolvePortalNavActs,
} from "@/lib/onboarding-portal-chapters";
import { apiFetch, ApiFetchError } from "@/lib/api-fetch";
import { parseUserFacingError } from "@/lib/user-facing-errors";
import { useToast } from "@/hooks/use-toast";
import { useBusiness } from "@/lib/business-context";
import { verticalPackUi } from "@/lib/vertical-pack-ui";
import { useTenantExperience } from "@/lib/tenant-experience-api";
import {
  blockingOnboardingPercent,
  afterPortalBusinessCreatedState,
  isOnboardingAppUnlocked,
  portalStepProgress,
  resolveFastTrackLivLine,
  type MigrationIntent,
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
  /** Fresh founder path — chosen before create-business. */
  initialMigrationIntent?: MigrationIntent;
  /** Cold open / welcome block above chapter spine (e.g. video). */
  arrivalSlot?: ReactNode;
};

function actHints(
  vocab: ReturnType<typeof verticalPackUi>,
): Partial<Record<OnboardingActId, { body: string; href?: string; cta?: string }>> {
  return {
  a2_shop_profile: {
    body: `Name your ${vocab.locationNoun.toLowerCase()}, phone, city, and a short description for your booking page.`,
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
    body: "Set when you take bookings — Liv only offers slots inside these hours.",
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
  initialMigrationIntent,
  portalMode: portalModeProp,
  arrivalSlot,
}: Props) {
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const { businesses, setBusinessById } = useBusiness();
  const actSaveHandlers = useRef<Partial<Record<OnboardingActId, OnboardingActSaveHandler>>>({});
  const seededChecklist = useMemo((): Partial<OnboardingChecklist> | undefined => {
    const fromState = initialState?.checklist;
    if (fromState?.migrationIntent) return fromState;
    if (initialMigrationIntent && initialMigrationIntent !== "unspecified") {
      return { migrationIntent: initialMigrationIntent };
    }
    return fromState;
  }, [initialMigrationIntent, initialState?.checklist]);
  const [state, setState] = useState<OnboardingStatePayload | null>(() =>
    initialState
      ? { ...initialState, checklist: { ...seededChecklist, ...initialState.checklist } }
      : seededChecklist
        ? { currentAct: "a1_create_business", completedActs: [], percentComplete: 0, checklist: seededChecklist }
        : null,
  );

  const activeChecklist = useMemo((): Partial<OnboardingChecklist> | undefined => {
    const intent =
      state?.checklist?.migrationIntent ??
      (initialMigrationIntent && initialMigrationIntent !== "unspecified"
        ? initialMigrationIntent
        : undefined);
    if (!intent) return state?.checklist;
    return { ...state?.checklist, migrationIntent: intent };
  }, [state?.checklist, initialMigrationIntent]);

  const isImportTrack = activeChecklist?.migrationIntent === "switching";

  const portalMode =
    portalModeProp ??
    (isOnboardingPortalExperienceEnabled({ previewMode }) ||
      (initialMigrationIntent != null && initialMigrationIntent !== "unspecified") ||
      isImportTrack);

  const [saving, setSaving] = useState(false);
  const [publicSlug, setPublicSlug] = useState<string | null>(businessSlug ?? null);
  const [businessName, setBusinessName] = useState<string>("");
  const [celebrate, setCelebrate] = useState(false);
  const [arrivalOpen, setArrivalOpen] = useState(() => {
    if (previewMode || initialMigrationIntent) return false;
    const portalLikely =
      portalModeProp ??
      (isOnboardingPortalExperienceEnabled({ previewMode }) ||
        (initialMigrationIntent != null && initialMigrationIntent !== "unspecified"));
    if (!portalLikely) return false;
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
    return resolvePortalCurrentAct(rawCurrentAct, activeChecklist);
  }, [portalMode, rawCurrentAct, activeChecklist]);

  const stepIndex = actIndex(currentAct);
  const tourPercent = state?.percentComplete ?? (businessId ? 8 : 0);
  const blockingPct = state
    ? blockingOnboardingPercent(
        (state.completedActs ?? []) as PolicyActId[],
        businessVertical,
        activeChecklist,
      )
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

  const persistState = async (next: OnboardingStatePayload, targetBusinessId = businessId) => {
    if (!targetBusinessId) return;
    if (previewMode) {
      setState(next);
      onPreviewStateChange?.(next);
      return;
    }
    setSaving(true);
    try {
      await apiFetch(`/businesses/${targetBusinessId}`, {
        method: "PATCH",
        body: JSON.stringify({ onboardingState: next }),
      });
      setState(next);
    } catch (err: unknown) {
      const e = err instanceof ApiFetchError ? err : null;
      toast({
        title: "Could not save progress",
        description: e?.requestId
          ? `${parseUserFacingError(err, "Could not save progress")} (ref ${e.requestId})`
          : parseUserFacingError(err, "Could not save progress"),
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
    const save = actSaveHandlers.current[act];
    if (save && !(await save())) return;

    if (
      act === "a11_migration" &&
      isImportTrack &&
      !state?.checklist?.migrationImported
    ) {
      toast({
        title: "Import your data first",
        description: "Upload a file or connect your old system. Profile and menu fill in from there.",
        variant: "destructive",
      });
      return;
    }

    if (act === "a12_go_live" && !state?.checklist?.testBooking) {
      toast({
        title: "One more step",
        description:
          "Complete a test booking on your public page (/book link), then return here to open Livia.",
        variant: "destructive",
      });
      return;
    }
    const autoDone = portalMode ? portalAutoCompleteActs(act, activeChecklist) : [];
    const completed = [...new Set([...(state?.completedActs ?? []), act, ...autoDone])];
    const nextAct = portalMode
      ? (nextPortalNavAct(act, activeChecklist) ?? act)
      : actIndex(act) >= 0 && actIndex(act) < ONBOARDING_ACT_IDS.length - 1
        ? ONBOARDING_ACT_IDS[actIndex(act) + 1]!
        : act;
    const nav = portalMode ? resolvePortalNavActs(activeChecklist) : ONBOARDING_ACT_IDS;
    const navDone = nav.filter((id) => completed.includes(id)).length;
    const next: OnboardingStatePayload = {
      currentAct: nextAct,
      completedActs: completed,
      percentComplete: Math.min(
        100,
        portalMode
          ? Math.round((navDone / Math.max(nav.length, 1)) * 100)
          : Math.round((completed.length / ONBOARDING_ACT_IDS.length) * 100),
      ),
      checklist: activeChecklist ?? state?.checklist,
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
    const target = portalMode ? resolvePortalCurrentAct(act, activeChecklist) : act;
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
      ? prevPortalNavAct(currentAct, !!businessId, activeChecklist)
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

  const hint = hints[currentAct];
  const stepProgress = portalMode ? portalStepProgress(currentAct, activeChecklist) : null;
  const canGoBack = portalMode
    ? !!prevPortalNavAct(currentAct, !!businessId, activeChecklist)
    : stepIndex > 0 && !(businessId && stepIndex === 1);
  const packLabel = tenantExperience?.vocabulary.label ?? vocab.label;
  const wideStep = currentAct === "a6_liv" || currentAct === "a8_public_link";
  const livMessage =
    currentAct === "a1_create_business" && activeChecklist?.migrationIntent
      ? resolveFastTrackLivLine({ intent: activeChecklist.migrationIntent })
      : currentAct === "a11_migration"
        ? "Pick your old system or upload a file. Liv maps it into your shop."
        : onboardingLivHostLine(currentAct, vocab, businessName);
  const checklistTicks = state?.checklist
    ? Object.values(state.checklist).filter(Boolean).length
    : 0;

  const stepBody = (
    <>
      {currentAct === "a1_create_business" && (!businessId || isImportTrack) ? (
        <>
          {activeChecklist?.migrationIntent ? (
            <div className="space-y-1">
              <h2 className="font-serif text-xl tracking-tight">
                {isImportTrack ? "Quick basics" : "Create your shop"}
              </h2>
              <p className="text-sm text-muted-foreground">
                {isImportTrack
                  ? "Three fields. Your menu and clients come from the import next."
                  : "A starter menu goes in automatically after this."}
              </p>
            </div>
          ) : null}
          {isImportTrack ? (
            <OnboardingImportShellStep
              businessId={businessId}
              onVerticalPreview={onVerticalPreview}
              onCreated={async (id, slug) => {
                setPublicSlug(slug);
                onBusinessCreated(id, slug);
                const intent = activeChecklist?.migrationIntent ?? initialMigrationIntent;
                if (intent && intent !== "unspecified") {
                  const next = afterPortalBusinessCreatedState(
                    { ...(activeChecklist ?? {}), migrationIntent: intent },
                    businessVertical,
                  ) as OnboardingStatePayload;
                  setState(next);
                  await persistState(next, id);
                }
              }}
              onSaved={() => {
                if (businessId && currentAct === "a1_create_business") {
                  void persistState({
                    currentAct: "a11_migration",
                    completedActs: state?.completedActs ?? [],
                    percentComplete: state?.percentComplete ?? percent,
                    checklist: state?.checklist,
                  });
                }
              }}
            />
          ) : (
          <OnboardingCreateBusinessStep
          onVerticalPreview={onVerticalPreview}
          initialMigrationIntent={activeChecklist?.migrationIntent ?? initialMigrationIntent}
          hideMigrationIntentPicker
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
          onCreated={async (id, slug, extras) => {
            setPublicSlug(slug);
            onBusinessCreated(id, slug);
            const intent =
              extras?.migrationIntent ??
              activeChecklist?.migrationIntent ??
              initialMigrationIntent;
            if (intent && intent !== "unspecified") {
              const next = afterPortalBusinessCreatedState(
                { ...(activeChecklist ?? {}), migrationIntent: intent },
                businessVertical,
              ) as OnboardingStatePayload;
              setState(next);
              await persistState(next, id);
            }
          }}
        />
          )}
        </>
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
          businessSlug={publicSlug}
          checklist={state?.checklist}
          onChecklistChange={updateChecklist}
          previewMode={previewMode}
          onRegisterSave={(actId, handler) => {
            if (handler) actSaveHandlers.current[actId] = handler;
            else delete actSaveHandlers.current[actId];
          }}
          onSaved={() => {
            if (currentAct === "a2_shop_profile" && businessId && !previewMode) {
              void apiFetch<{ name?: string }>(`/businesses/${businessId}`)
                .then((b) => {
                  if (b.name) setBusinessName(String(b.name));
                })
                .catch(() => {});
            }
          }}
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
      !portalMode &&
      currentAct !== "a1_create_business" &&
      !INLINE_FORM_ACTS.includes(currentAct) &&
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
        {appUnlocked && businessId ? (
          <Button
            variant="secondary"
            className="w-full"
            type="button"
            onClick={() => {
              setBusinessById(businessId);
              navigate("/dashboard");
            }}
          >
            Enter Livia — finish later
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
            {currentAct === "a12_go_live" ? "Open Livia" : "Continue"}
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
        ) : activeChecklist?.migrationIntent ? (
          <OnboardingPortalStepSpine
            currentAct={currentAct}
            completedActs={(state?.completedActs ?? []) as OnboardingActId[]}
            checklist={activeChecklist}
          />
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
        checklist={activeChecklist}
        chapterStepHint={
          stepProgress
            ? `Step ${stepProgress.index} of ${stepProgress.total}: ${stepProgress.label}`
            : null
        }
        showProgressSpine={!!activeChecklist?.migrationIntent}
        packLabel={null}
        wide={wideStep || currentAct === "a11_migration"}
        celebrate={celebrate}
        topSlot={
          <>
            {arrivalSlot}
            {businessId ? <CrossSurfaceContinueCard className="mt-4" /> : null}
          </>
        }
        footer={footerNav}
      >
        <div
          data-testid={isImportTrack ? "onboarding-track-import" : "onboarding-track-fresh"}
          className="contents"
        >
          {stepBody}
        </div>
      </OnboardingPortalLayout>
    </>
  );
}
