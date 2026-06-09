import { Link } from "wouter";
import {
  ArrowRight,
  Calendar,
  Check,
  CheckCircle2,
  ChevronRight,
  DollarSign,
  Flower2,
  Inbox,
  Sparkles,
  Star,
  Users,
  ClipboardList,
  FileCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { SettingsDisclosure } from "@/components/ui/settings-disclosure";
import { usePersonaBriefing } from "@/hooks/use-persona-briefing";
import { timeGreeting } from "@/lib/persona-rituals";
import { useListConversations, useUpdateBooking, getGetDashboardSummaryQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useBusiness } from "@/lib/business-context";
import { useTenantExperience } from "@/lib/tenant-experience-api";
import { useCallback, useState } from "react";
import { InboxPreviewPanel } from "@/components/dashboard/inbox-preview-panel";
import { OwnerLivGuardrails } from "@/components/dashboard/owner-liv-guardrails";
import { OwnerLivSuggestionsStrip } from "@/components/dashboard/owner-liv-suggestions-strip";
import { VerticalHomeModules } from "@/components/dashboard/vertical-home-modules";
import {
  ownerHomeCommerceNeedsAttention,
  ownerIntelligenceHasSurfaceContent,
  resolveOwnerHomeBriefingCta,
  resolveOwnerHomeKpiChips,
  resolveOwnerHomeModuleLayout,
  shouldExpandOwnerHomeInsightsDisclosure,
  shouldShowOwnerPendingPanel,
} from "@workspace/policy";
import { useGetOwnerIntelligence } from "@workspace/api-client-react";
import { useMembership } from "@/lib/membership-context";
import { cn } from "@/lib/utils";
import { beautyNativeMorphForVertical, useBeautyChrome } from "@/lib/presentation-layout";
import { effectivePresentationMorph } from "@/lib/appearance-preview-mode";
import { BeautyMorphTodayHome } from "@/components/beauty/beauty-morph-today";
import { WellnessMorphTodayHome } from "@/components/wellness/wellness-morph-today";
import { HairColourDayCard } from "@/components/hair/hair-colour-day-card";
import { AutomotiveBayBoard } from "@/components/automotive/automotive-bay-board";
import { BodyArtPipelineCard } from "@/components/body-art/body-art-pipeline-card";
import { resolvePublicServiceImageUrl } from "@/lib/public-service-image";
import {
  PENDING_BOOKINGS_LIST_HREF,
  resolveOwnerHomeBookingSlices,
} from "@workspace/policy";
import { verticalPackUi } from "@/lib/vertical-pack-ui";
import { TodayAppointmentsStrip } from "@/components/dashboard/today-appointments-strip";
import { AtRiskGuestsStrip } from "@/components/dashboard/at-risk-guests-strip";
import { VisitFeedbackStrip } from "@/components/dashboard/visit-feedback-strip";
import {
  PendingBookingActions,
  type PendingBookingActionBooking,
} from "@/components/booking/pending-booking-actions";
import { PendingWhyLine } from "@/components/booking/pending-why-line";
import { OwnerIntelligenceStack } from "@/components/dashboard/owner-intelligence-stack";

type PendingBooking = PendingBookingActionBooking & {
  status: string;
  pendingReason?: string | null;
};

function ownerGreeting(firstName: string | null | undefined): string {
  const t = timeGreeting();
  const prefix =
    t === "morning" ? "Good morning" : t === "afternoon" ? "Good afternoon" : "Good evening";
  return `${prefix}, ${firstName?.trim() || "there"}`;
}

function customerName(c: PendingBooking["customer"]): string {
  return (
    c.displayName ||
    [c.firstName, c.lastName].filter(Boolean).join(" ").trim() ||
    "Guest"
  );
}

const KPI_VIEW: Partial<
  Record<
    | "todayBookings"
    | "inboxHandoffs"
    | "toConfirm"
    | "completedToday"
    | "atRiskGuests"
    | "lowFeedback"
    | "revenue30d"
    | "depositsGap"
    | "fillsDue"
    | "colourDayBlocks"
    | "medspaConsentQueue",
    { href: string; label: string; icon: typeof Calendar }
  >
> = {
  todayBookings: { href: "/bookings", label: "View calendar", icon: Calendar },
  inboxHandoffs: { href: "/inbox?lens=taken_over", label: "View inbox", icon: Inbox },
  toConfirm: { href: PENDING_BOOKINGS_LIST_HREF, label: "View pending", icon: CheckCircle2 },
  completedToday: { href: "/bookings", label: "View today", icon: Check },
  atRiskGuests: { href: "/customers", label: "View guests", icon: Users },
  lowFeedback: { href: "/dashboard", label: "View feedback", icon: Star },
  revenue30d: { href: "/settings?tab=billing", label: "View payments", icon: DollarSign },
  depositsGap: {
    href: "/settings?tab=billing#commerce-fix",
    label: "Turn on deposits",
    icon: DollarSign,
  },
  fillsDue: { href: "/customers#fill-cycle", label: "View fill cycle", icon: Users },
  colourDayBlocks: { href: "/bookings", label: "Colour-day plan", icon: ClipboardList },
  medspaConsentQueue: { href: "/medspa", label: "Consent queue", icon: FileCheck },
};

function KpiChip({
  label,
  value,
  sub,
  tone,
  loading,
  chipId,
  beauty,
  constellation: constellationProp,
  signalGlow,
}: {
  label: string;
  value: number | string;
  sub?: string;
  tone?: "warn" | "good";
  loading?: boolean;
  chipId?: keyof typeof KPI_VIEW;
  beauty?: boolean;
  constellation?: boolean;
  /** Actionable KPI — left-edge glow in signal ambient tier */
  signalGlow?: boolean;
}) {
  const constellation =
    constellationProp ??
    (!beauty &&
      typeof document !== "undefined" &&
      document.documentElement.dataset.presentation === "platform-default");
  const view = chipId ? KPI_VIEW[chipId] : undefined;
  const inner = (
    <>
      <p className="text-[12px] text-muted-foreground font-medium leading-tight">{label}</p>
      {loading ? (
        <Skeleton className="h-6 w-10" />
      ) : (
        <>
          <p
            className={cn(
              "text-2xl font-bold tabular-nums leading-none tracking-tight",
              beauty && "font-serif",
              tone === "warn" && "text-[hsl(var(--chart-4))]",
              tone === "good" && "text-[hsl(var(--chart-3))]",
            )}
            style={beauty ? { fontFamily: "var(--app-font-serif)" } : undefined}
          >
            {value}
          </p>
          {sub ? <p className="text-[10px] text-muted-foreground font-mono truncate">{sub}</p> : null}
        </>
      )}
    </>
  );

  const cardClass = cn(
    "rounded-lg border border-border/80 bg-card px-3 py-2.5 flex flex-col gap-0.5 min-h-[72px] justify-center",
    beauty && "beauty-kpi-card",
    beauty && signalGlow && "beauty-kpi-card--signal",
    constellation && "constellation-kpi",
    constellation && signalGlow && tone === "warn" && "constellation-kpi--signal",
    constellation && tone === "good" && "constellation-kpi--good",
  );

  if (beauty && view) {
    return (
      <Link href={view.href} className="block">
        <div className={cardClass}>{inner}</div>
      </Link>
    );
  }

  return <div className={cardClass}>{inner}</div>;
}

function inferServiceTags(serviceName: string): string[] {
  const n = serviceName.toLowerCase();
  const tags: string[] = [];
  if (n.includes("gel")) tags.push("Gel");
  if (n.includes("nail") || n.includes("manicure")) tags.push("Nails");
  if (n.includes("lash")) tags.push("Lashes");
  if (n.includes("brow")) tags.push("Brows");
  if (n.includes("facial") || n.includes("skin")) tags.push("Skin");
  if (tags.length === 0) tags.push(serviceName.split(/\s+/).slice(0, 2).join(" "));
  return tags.slice(0, 3);
}

function BeautyPendingHero({
  booking,
  pendingCount,
  formatTime,
  updatePending,
  onConfirmBooking,
  onDeclineBooking,
  vertical,
}: {
  booking: PendingBooking;
  pendingCount: number;
  formatTime: (iso: string) => string;
  updatePending: boolean;
  onConfirmBooking: (id: string) => void;
  onDeclineBooking: (id: string) => void;
  vertical?: string | null;
}) {
  const thumb = resolvePublicServiceImageUrl(booking.service.name, vertical);
  const tags = inferServiceTags(booking.service.name);

  return (
    <section className="beauty-pending-hero" data-testid="beauty-pending-hero">
      <div className="px-3 py-2 border-b border-border/60 flex items-center justify-between">
        <h2 className="text-[11px] font-semibold tracking-wide uppercase text-muted-foreground">
          Pending appointment
        </h2>
        {pendingCount > 1 ? (
          <Link href={PENDING_BOOKINGS_LIST_HREF} className="text-xs text-primary">
            +{pendingCount - 1} more
          </Link>
        ) : null}
      </div>
      <div className="p-3 flex flex-col sm:flex-row gap-3">
        {thumb ? (
          <img src={thumb} alt="" className="beauty-pending-hero-image rounded-lg shrink-0" />
        ) : (
          <div className="beauty-pending-hero-image rounded-lg bg-muted shrink-0" aria-hidden />
        )}
        <div className="flex-1 min-w-0 space-y-1.5">
          <p
            className="text-lg font-serif leading-tight"
            style={{ fontFamily: "var(--app-font-serif)" }}
          >
            {customerName(booking.customer)}
          </p>
          <p className="text-sm text-muted-foreground">
            {formatTime(booking.startAt)} · {booking.service.name}
          </p>
          <PendingWhyLine reason={booking.pendingReason} vertical={vertical} className="pt-0.5" />
          <div className="flex flex-wrap gap-1.5">
            {tags.map((t) => (
              <span key={t} className="beauty-tag-pill">
                {t}
              </span>
            ))}
          </div>
          <PendingBookingActions
            booking={booking}
            disabled={updatePending}
            layout="beauty"
            onConfirm={onConfirmBooking}
            onDecline={onDeclineBooking}
          />
        </div>
      </div>
    </section>
  );
}

function PendingPanel({
  pendingBookings,
  homePendingCount,
  globalPendingCount,
  isLoadingSummary,
  formatTime,
  updatePending,
  onConfirmBooking,
  onDeclineBooking,
  vertical,
  category,
  compact,
}: {
  pendingBookings: PendingBooking[];
  /** Pending on today's home surface — matches list rows. */
  homePendingCount: number;
  /** All pending bookings — for "view all" when backlog extends beyond today. */
  globalPendingCount: number;
  isLoadingSummary: boolean;
  formatTime: (iso: string) => string;
  updatePending: boolean;
  onConfirmBooking: (id: string) => void;
  onDeclineBooking: (id: string) => void;
  vertical?: string | null;
  category?: string | null;
  compact?: boolean;
}) {
  return (
    <section
      className={cn(
        "rounded-lg border border-border/80 bg-card overflow-hidden flex flex-col",
        !compact && "min-h-[180px]",
      )}
    >
      <div className="flex items-center justify-between px-3 py-2 border-b border-border/60">
        <h2 className="text-sm font-semibold">Needs confirmation</h2>
        {homePendingCount > 0 ? (
          <span className="text-[10px] font-mono text-[hsl(var(--chart-4))]">
            {homePendingCount} today
          </span>
        ) : null}
      </div>
      {isLoadingSummary ? (
        <div className="p-3 space-y-2">
          {[1, 2].map((i) => (
            <Skeleton key={i} className="h-12 w-full rounded-lg" />
          ))}
        </div>
      ) : (
        <ul className="divide-y divide-border/60">
          {pendingBookings.map((b) => (
            <li key={b.id} className="flex items-center justify-between gap-2 px-3 py-2.5">
              <Link href={`/bookings/${b.id}`} className="min-w-0 flex-1">
                <p className="text-sm font-medium truncate">{customerName(b.customer)}</p>
                <p className="text-xs text-muted-foreground font-mono truncate">
                  {formatTime(b.startAt)} · {b.service.name}
                </p>
                <PendingWhyLine
                  reason={b.pendingReason}
                  vertical={vertical}
                  category={category}
                  className="mt-1"
                />
              </Link>
              <PendingBookingActions
                booking={b}
                disabled={updatePending}
                layout="compact"
                onConfirm={onConfirmBooking}
                onDecline={onDeclineBooking}
              />
            </li>
          ))}
        </ul>
      )}
      {globalPendingCount > pendingBookings.length ? (
        <div className="mt-auto border-t border-border/60 px-3 py-1.5">
          <Link href={PENDING_BOOKINGS_LIST_HREF}>
            <Button variant="ghost" size="sm" className="w-full text-xs h-8">
              View all {globalPendingCount} pending
            </Button>
          </Link>
        </div>
      ) : null}
    </section>
  );
}

export function OwnerHomeRitual({
  summary,
  isLoadingSummary,
  pendingBookings,
  formatTime,
  formatHeaderDate,
  now,
  onConfirmBooking,
  onDeclineBooking,
  updatePending,
}: {
  summary?: {
    todayBookings?: number;
    pendingCount?: number;
    handedOffCount?: number;
    completedTodayCount?: number;
    weekBookings?: number;
    totalCustomers?: number;
    upcomingBookings?: PendingBooking[];
    bookingResources?: Array<{
      id: string;
      name: string;
      resourceType: string;
      capacity: number;
    }>;
    packageCreditSummary?: {
      ledgerCount: number;
      activePackages: number;
      creditsSold: number;
      creditsRedeemed: number;
      creditsRemaining: number;
    };
    atRiskGuests?: Array<{
      customerId: string;
      displayName: string;
      stage: "at_risk" | "lapsed";
      daysSinceLastVisit: number;
      headline: string;
    }>;
    recentVisitFeedback?: Array<{
      id: string;
      bookingId: string;
      score: number;
      comment: string | null;
      createdAt: string;
    }>;
    lowFeedbackCount?: number;
    confirmedCount?: number;
    commerce?: {
      capturedMinor30d: number;
      captureRatePercent?: number | null;
      paymentCount30d: number;
      currency: string;
      capturedLabel: string;
    };
  } | null;
  isLoadingSummary: boolean;
  pendingBookings: PendingBooking[];
  formatTime: (iso: string) => string;
  formatHeaderDate: (d: Date) => string;
  now: Date;
  onConfirmBooking: (id: string) => void;
  onDeclineBooking: (id: string) => void;
  updatePending: boolean;
}) {
  const { business } = useBusiness();
  const { role } = useMembership();
  const bid = business?.id ?? "";
  const canViewOwnerIntel = ["OWNER", "ADMIN"].includes(role ?? "");
  const { data: ownerIntel } = useGetOwnerIntelligence(bid, {
    query: { enabled: !!bid && canViewOwnerIntel, staleTime: 90_000 } as never,
  });
  const showInsightsDisclosure =
    canViewOwnerIntel && ownerIntelligenceHasSurfaceContent(ownerIntel ?? null);
  const queryClient = useQueryClient();
  const [assigningBookingId, setAssigningBookingId] = useState<string | null>(null);
  const updateBooking = useUpdateBooking();
  const { data: tenantXp } = useTenantExperience(bid || undefined);
  const tenantVertical =
    (tenantXp as { vertical?: string } | undefined)?.vertical ?? business?.category ?? null;
  const {
    firstName,
    livLine,
    livPulse,
    livSource,
    isLoading: briefingLoading,
    ritual,
  } = usePersonaBriefing();

  const { data: convos, isLoading: convosLoading } = useListConversations(
    bid,
    { status: "OPEN" },
    { query: { enabled: !!bid } as never },
  );

  const openThreads = Array.isArray(convos) ? convos : [];
  const previewThreads = openThreads.slice(0, 3).map((c) => ({
    id: c.id,
    customerName: c.customerName ?? null,
    lastMessagePreview: c.lastMessage ?? null,
    updatedAt: c.lastMessageAt,
    status: c.status,
    channel: c.channel,
  }));

  const pendingCount = summary?.pendingCount ?? 0;
  const handoffCount = summary?.handedOffCount ?? 0;
  const atRiskCount = summary?.atRiskGuests?.length ?? 0;
  const lowFeedbackCount = summary?.lowFeedbackCount ?? 0;

  const todayTotal = summary?.todayBookings ?? 0;
  const fillsDueCount = (ownerIntel?.ops as { fillsDueCount?: number } | undefined)?.fillsDueCount;
  const colourDayBlocks = (ownerIntel?.ops as { colourDayBlocks?: number } | undefined)?.colourDayBlocks;
  const medspaConsentQueueCount = (
    ownerIntel?.ops as { medspaConsentQueueCount?: number } | undefined
  )?.medspaConsentQueueCount;
  const isAutomotive = tenantVertical === "automotive-detailing";
  const kpiChips = resolveOwnerHomeKpiChips({
    todayBookings: todayTotal,
    pendingCount,
    handedOffCount: handoffCount,
    atRiskCount,
    lowFeedbackCount,
    capturedMinor30d: summary?.commerce?.capturedMinor30d,
    paymentCount30d: summary?.commerce?.paymentCount30d,
    confirmedCount: summary?.confirmedCount,
    weekBookings: summary?.weekBookings,
    fillsDueCount,
    colourDayBlocks,
    medspaConsentQueueCount,
  });
  const kpiGridClass =
    kpiChips.length <= 1
      ? "grid-cols-1"
      : kpiChips.length === 2
        ? "grid-cols-2"
        : kpiChips.length === 3
          ? "grid-cols-3"
          : kpiChips.length === 4
            ? "grid-cols-2 lg:grid-cols-4"
            : "grid-cols-2 sm:grid-cols-3 lg:grid-cols-6";
  const weekAvg = summary ? Math.round(summary.weekBookings! / 7) : 0;
  const todayDelta = summary ? summary.todayBookings! - weekAvg : 0;

  const briefingCta = resolveOwnerHomeBriefingCta({
    pendingCount,
    handedOffCount: handoffCount,
    atRiskCount,
    lowFeedbackCount,
    captureRatePercent: summary?.commerce?.captureRatePercent,
    paymentCount30d: summary?.commerce?.paymentCount30d,
    confirmedCount: summary?.confirmedCount,
    weekBookings: summary?.weekBookings,
    fallbackHref: ritual.primaryAction?.href ?? "/bookings",
    fallbackLabel: ritual.primaryAction?.label ?? "View calendar",
  });
  const commerceLowCapture = ownerHomeCommerceNeedsAttention({
    captureRatePercent: summary?.commerce?.captureRatePercent,
    paymentCount30d: summary?.commerce?.paymentCount30d,
  });
  const oneThingHref = briefingCta.href;
  const oneThingLabel = briefingCta.label;
  const beauty = useBeautyChrome(tenantVertical);
  const beautyMorph =
    tenantVertical === "beauty"
      ? effectivePresentationMorph("beauty", tenantXp?.presentation?.presetId)
      : null;
  const beautyNativeMorph = beautyNativeMorphForVertical(tenantVertical, beautyMorph);
  const wellnessMorph =
    tenantVertical === "wellness"
      ? effectivePresentationMorph("wellness", tenantXp?.presentation?.presetId)
      : null;
  const wellnessNativeMorph =
    wellnessMorph && wellnessMorph !== "constellation" ? wellnessMorph : null;
  const presentationCss = tenantXp?.presentation?.cssPreset;
  const isConstellationToday =
    !beautyNativeMorph &&
    !wellnessNativeMorph &&
    (presentationCss === "platform-default" || presentationCss == null);
  const vocab = verticalPackUi(tenantVertical, business?.category);
  const bookingSlices = resolveOwnerHomeBookingSlices(summary?.upcomingBookings, now);
  const heroPending = bookingSlices.pendingToday[0] ?? pendingBookings[0] ?? null;
  const hasTodaySchedule =
    bookingSlices.pendingToday.length + bookingSlices.confirmedToday.length > 0;
  const homePendingCount = bookingSlices.pendingToday.length;
  const homePendingBookings = bookingSlices.pendingToday.slice(0, 5);
  const showPendingPanel =
    shouldShowOwnerPendingPanel(homePendingCount, isLoadingSummary) && !hasTodaySchedule;
  const moduleLayout = resolveOwnerHomeModuleLayout({
    pendingCount,
    openInboxCount: handoffCount,
    homePendingCount,
    pendingSurfacedElsewhere: hasTodaySchedule,
  });

  const briefingNeedsAttention =
    briefingLoading ||
    pendingCount > 0 ||
    handoffCount > 0 ||
    lowFeedbackCount > 0 ||
    atRiskCount > 0 ||
    livPulse === "act";

  const morphBookings = [...bookingSlices.pendingToday, ...bookingSlices.confirmedToday];

  const onAssignBookingToResource = useCallback(
    async (bookingId: string, resourceId: string | null) => {
      if (!bid) return false;
      setAssigningBookingId(bookingId);
      try {
        await updateBooking.mutateAsync({
          businessId: bid,
          bookingId,
          data: { resourceId },
        });
        await queryClient.invalidateQueries({ queryKey: getGetDashboardSummaryQueryKey(bid) });
        return true;
      } catch {
        return false;
      } finally {
        setAssigningBookingId(null);
      }
    },
    [bid, updateBooking, queryClient],
  );

  if (beautyNativeMorph) {
    return (
      <BeautyMorphTodayHome
        morph={beautyNativeMorph}
        firstName={firstName}
        headerDate={formatHeaderDate(now)}
        livLine={livLine}
        oneThingHref={oneThingHref}
        oneThingLabel={oneThingLabel}
        pendingCount={pendingCount}
        handoffCount={handoffCount}
        bookings={morphBookings}
        businessName={business?.name ?? undefined}
        todayTotal={todayTotal}
        completedToday={summary?.completedTodayCount ?? 0}
        vertical={tenantVertical}
        previewThreads={previewThreads.map((t) => ({
          ...t,
          updatedAt: t.updatedAt ?? undefined,
        }))}
        convosLoading={convosLoading}
        bookingResources={summary?.bookingResources}
        onAssignBookingToResource={
          summary?.bookingResources?.length ? onAssignBookingToResource : undefined
        }
        assigningBookingId={assigningBookingId}
        atRiskGuests={summary?.atRiskGuests}
        recentVisitFeedback={summary?.recentVisitFeedback}
        lowFeedbackCount={summary?.lowFeedbackCount}
        signalsLoading={isLoadingSummary}
      />
    );
  }

  if (wellnessNativeMorph) {
    const ann = tenantXp?.announcement;
    return (
      <WellnessMorphTodayHome
        morph={wellnessNativeMorph}
        firstName={firstName}
        headerDate={formatHeaderDate(now)}
        livLine={livLine}
        oneThingHref={oneThingHref}
        oneThingLabel={oneThingLabel}
        pendingCount={pendingCount}
        handoffCount={handoffCount}
        bookings={morphBookings}
        businessName={business?.name ?? undefined}
        roomBoardFootnote={ann?.roomBoard?.footnote}
        bookingResources={summary?.bookingResources}
        onAssignBookingToResource={onAssignBookingToResource}
        assigningBookingId={assigningBookingId}
        packageCreditSummary={summary?.packageCreditSummary ?? null}
        tomorrowStress={
          (summary as { wellnessTomorrowStress?: { score: number; pendingBookings: number; roomConflicts: number } | null })
            ?.wellnessTomorrowStress ?? null
        }
        vertical={tenantVertical}
        category={(business as { category?: string } | null)?.category}
        atRiskGuests={summary?.atRiskGuests}
        recentVisitFeedback={summary?.recentVisitFeedback}
        lowFeedbackCount={summary?.lowFeedbackCount}
        signalsLoading={isLoadingSummary}
      />
    );
  }

  return (
    <div
      className={cn("space-y-4 max-w-5xl", isConstellationToday && "constellation-today")}
      data-testid="owner-home-ritual"
      data-constellation={isConstellationToday ? "true" : undefined}
    >
      <header className="flex flex-col gap-0.5 sm:flex-row sm:items-end sm:justify-between">
        <h1
          className="text-2xl sm:text-[26px] font-serif tracking-tight leading-tight"
          style={{ fontFamily: "var(--app-font-serif)" }}
          data-testid="owner-dashboard-greeting"
        >
          {ownerGreeting(firstName)}
        </h1>
        <p className="text-xs text-muted-foreground font-mono tabular-nums">{formatHeaderDate(now)}</p>
      </header>

      <section
        className={cn(
          beauty
            ? "beauty-briefing-banner"
            : "rounded-lg border border-border/80 bg-card pl-3 pr-3 py-3 md:pl-4 border-l-4 border-l-primary platform-default-liv-glass",
          beauty && briefingNeedsAttention && "beauty-briefing-banner--attention",
          !beauty && briefingLoading && "motion-liv-pulse",
          beauty && briefingLoading && "beauty-briefing-banner--attention motion-liv-pulse",
        )}
        data-testid="owner-dashboard-briefing"
      >
        <div className="beauty-briefing-body flex gap-3 min-w-0">
          {beauty ? (
            <div className="beauty-briefing-icon" aria-hidden>
              <Flower2 className="h-4 w-4" strokeWidth={1.5} />
            </div>
          ) : (
            <Star className="h-4 w-4 shrink-0 mt-0.5 text-primary fill-primary/20" aria-hidden />
          )}
          <div className="min-w-0 flex-1">
            <p className="text-[10px] uppercase tracking-[0.2em] text-primary/80 font-medium mb-1">
              {beauty ? "What needs you" : isConstellationToday ? "Your orbit today" : "What needs you today"}
            </p>
            {briefingLoading ? (
              <div className="space-y-1.5">
                <Skeleton className="h-3.5 w-full max-w-md" />
                <Skeleton className="h-3.5 w-4/5 max-w-sm" />
              </div>
            ) : (
              <p className="text-sm leading-relaxed text-foreground/90 line-clamp-3">{livLine}</p>
            )}
            {!beauty && livPulse !== "act" && livSource === "liv" ? (
              <p className="text-[10px] uppercase tracking-wider font-mono text-muted-foreground mt-0.5">
                Liv · briefing
              </p>
            ) : null}
          </div>
        </div>
        <Link href={oneThingHref} className="beauty-briefing-cta shrink-0 w-full sm:w-auto">
          <Button
            size="sm"
            className="gap-1.5 h-9 w-full sm:w-auto min-h-[44px] rounded-xl"
          >
            {oneThingLabel}
            <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        </Link>
      </section>

      <OwnerLivGuardrails livNeedsAttention={livPulse === "act"} />

      <div className={cn("grid gap-2.5", kpiGridClass)} data-testid="owner-kpi-row">
        {kpiChips.includes("todayBookings") ? (
          <KpiChip
            chipId="todayBookings"
            beauty={beauty}
            label="Today's bookings"
            value={summary?.todayBookings ?? 0}
            sub={
              isLoadingSummary
                ? undefined
                : todayDelta === 0
                  ? "= week avg"
                  : `${todayDelta > 0 ? "+" : ""}${todayDelta} vs avg`
            }
            loading={isLoadingSummary}
          />
        ) : null}
        {kpiChips.includes("inboxHandoffs") ? (
          beauty ? (
            <KpiChip
              chipId="inboxHandoffs"
              beauty
              signalGlow
              label="Inbox handoffs"
              value={handoffCount}
              sub={handoffCount === 1 ? "needs you" : "need you"}
              tone="warn"
              loading={isLoadingSummary}
            />
          ) : (
            <Link href="/inbox?lens=taken_over" className="block">
              <KpiChip
                label="Inbox handoffs"
                value={handoffCount}
                sub={handoffCount === 1 ? "needs you" : "need you"}
                tone="warn"
                signalGlow={handoffCount > 0}
                loading={isLoadingSummary}
              />
            </Link>
          )
        ) : null}
        {kpiChips.includes("toConfirm") ? (
          <KpiChip
            chipId="toConfirm"
            beauty={beauty}
            signalGlow={pendingCount > 0}
            label="To confirm"
            value={pendingCount}
            sub="pending"
            tone="warn"
            loading={isLoadingSummary}
          />
        ) : null}
        {kpiChips.includes("lowFeedback") ? (
          beauty ? (
            <KpiChip
              chipId="lowFeedback"
              beauty
              signalGlow
              label="Low scores"
              value={lowFeedbackCount}
              sub="need follow-up"
              tone="warn"
              loading={isLoadingSummary}
            />
          ) : (
            <Link href="/dashboard" className="block">
              <KpiChip
                label="Low scores"
                value={lowFeedbackCount}
                sub="need follow-up"
                tone="warn"
                loading={isLoadingSummary}
              />
            </Link>
          )
        ) : null}
        {kpiChips.includes("atRiskGuests") ? (
          beauty ? (
            <KpiChip
              chipId="atRiskGuests"
              beauty
              signalGlow
              label="At-risk guests"
              value={atRiskCount}
              sub="drifting"
              tone="warn"
              loading={isLoadingSummary}
            />
          ) : (
            <Link href="/customers" className="block">
              <KpiChip
                label="At-risk guests"
                value={atRiskCount}
                sub="drifting"
                tone="warn"
                loading={isLoadingSummary}
              />
            </Link>
          )
        ) : null}
        {kpiChips.includes("revenue30d") ? (
          beauty ? (
            <KpiChip
              chipId="revenue30d"
              beauty
              signalGlow={commerceLowCapture}
              label="Revenue (30d)"
              value={summary?.commerce?.capturedLabel ?? "—"}
              sub={
                summary?.commerce?.captureRatePercent != null
                  ? `${summary.commerce.captureRatePercent}% capture`
                  : `${summary?.commerce?.paymentCount30d ?? 0} payments`
              }
              tone={commerceLowCapture ? "warn" : "good"}
              loading={isLoadingSummary}
            />
          ) : (
            <Link href="/settings?tab=billing" className="block">
              <KpiChip
                label="Revenue (30d)"
                value={summary?.commerce?.capturedLabel ?? "—"}
                sub={
                  summary?.commerce?.captureRatePercent != null
                    ? `${summary.commerce.captureRatePercent}% capture`
                    : `${summary?.commerce?.paymentCount30d ?? 0} payments`
                }
                tone={commerceLowCapture ? "warn" : "good"}
                loading={isLoadingSummary}
              />
            </Link>
          )
        ) : null}
        {kpiChips.includes("depositsGap") ? (
          beauty ? (
            <KpiChip
              chipId="depositsGap"
              beauty
              signalGlow
              label="Deposits"
              value="Not captured"
              sub="Demand without payments"
              tone="warn"
              loading={isLoadingSummary}
            />
          ) : (
            <Link href="/settings?tab=billing" className="block">
              <KpiChip
                label="Deposits"
                value="Not captured"
                sub="Turn on Stripe"
                tone="warn"
                signalGlow
                loading={isLoadingSummary}
              />
            </Link>
          )
        ) : null}
        {kpiChips.includes("fillsDue") ? (
          <KpiChip
            chipId="fillsDue"
            beauty={beauty}
            signalGlow
            label="Fills due"
            value={fillsDueCount ?? 0}
            sub="past cycle"
            tone="warn"
            loading={isLoadingSummary}
          />
        ) : null}
        {kpiChips.includes("colourDayBlocks") ? (
          <KpiChip
            chipId="colourDayBlocks"
            beauty={beauty}
            signalGlow
            label="Colour blocks"
            value={colourDayBlocks ?? 0}
            sub="today"
            loading={isLoadingSummary}
          />
        ) : null}
        {kpiChips.includes("medspaConsentQueue") ? (
          <KpiChip
            chipId="medspaConsentQueue"
            beauty={beauty}
            signalGlow
            label="Consent queue"
            value={medspaConsentQueueCount ?? 0}
            sub="awaiting sign"
            tone="warn"
            loading={isLoadingSummary}
          />
        ) : null}
        {kpiChips.includes("completedToday") ? (
          <KpiChip
            chipId="completedToday"
            beauty={beauty}
            label="Completed today"
            value={summary?.completedTodayCount ?? 0}
            sub={
              todayTotal > 0
                ? `${Math.round(((summary?.completedTodayCount ?? 0) / todayTotal) * 100)}%`
                : "—"
            }
            tone="good"
            loading={isLoadingSummary}
          />
        ) : null}
      </div>

      <OwnerLivSuggestionsStrip
        pendingCount={pendingCount}
        handedOffCount={handoffCount}
        atRiskCount={atRiskCount}
        lowFeedbackCount={lowFeedbackCount}
        confirmedCount={summary?.confirmedCount}
        weekBookings={summary?.weekBookings}
        commerce={summary?.commerce}
        className="mb-1"
      />

      {beauty && heroPending && !isLoadingSummary ? (
        <BeautyPendingHero
          booking={heroPending}
          pendingCount={pendingCount}
          formatTime={formatTime}
          updatePending={updatePending}
          onConfirmBooking={onConfirmBooking}
          onDeclineBooking={onDeclineBooking}
          vertical={tenantVertical}
        />
      ) : null}

      {tenantVertical === "hair" ? <HairColourDayCard /> : null}

      {tenantVertical === "body-art" ? <BodyArtPipelineCard /> : null}

      {isAutomotive && summary?.bookingResources?.length ? (
        <AutomotiveBayBoard
          bookings={morphBookings}
          resources={summary.bookingResources}
          onAssignBookingToResource={onAssignBookingToResource}
          assigningBookingId={assigningBookingId}
          vertical={tenantVertical}
        />
      ) : null}

      <TodayAppointmentsStrip
          pendingToday={bookingSlices.pendingToday}
          confirmedToday={bookingSlices.confirmedToday}
          formatTime={formatTime}
          loading={isLoadingSummary}
          scheduleTitle={isConstellationToday ? "Today's orbit" : vocab.ownerTodayScheduleTitle}
          calendarCta={isConstellationToday ? "View calendar" : vocab.ownerTodayScheduleCalendarCta}
          runningLateLabel={vocab.runningLateLabel}
          updatePending={updatePending}
          onConfirmBooking={onConfirmBooking}
          onDeclineBooking={onDeclineBooking}
          vertical={tenantVertical}
          category={(business as { category?: string } | null)?.category}
          skipPendingId={beauty && heroPending ? heroPending.id : null}
        />

      <AtRiskGuestsStrip
        guests={summary?.atRiskGuests ?? []}
        loading={isLoadingSummary}
      />

      <VisitFeedbackStrip
        items={summary?.recentVisitFeedback}
        loading={isLoadingSummary}
      />

      {showInsightsDisclosure ? (
        <SettingsDisclosure
          title="Payments & Liv insights"
          description="Optional depth — one priority action, not six repeats of the same signal."
          defaultOpen={shouldExpandOwnerHomeInsightsDisclosure({
            hasIntelligenceContent: true,
            commerceNeedsAttention: commerceLowCapture,
            pendingRemediationCount: ownerIntel?.remediationTasks?.length ?? 0,
          })}
        >
          <div className="pt-2">
            <OwnerIntelligenceStack variant="owner-home" />
          </div>
        </SettingsDisclosure>
      ) : null}

      {moduleLayout.mode === "all_clear" ? (
        <div
          className="rounded-lg border border-border/60 bg-muted/30 px-4 py-3 flex items-center gap-2 text-sm text-muted-foreground"
          data-testid="owner-home-all-clear"
        >
          <Check className="h-4 w-4 text-[hsl(var(--chart-3))] shrink-0" aria-hidden />
          <span>All clear — inbox and confirmations are up to date.</span>
          <Link href="/bookings" className="ml-auto text-xs text-primary hover:underline shrink-0">
            Calendar
          </Link>
        </div>
      ) : moduleLayout.mode === "single" ? (
        moduleLayout.focus === "inbox" ? (
          <InboxPreviewPanel
            threads={previewThreads}
            loading={convosLoading}
            attentionCount={handoffCount}
            compact
          />
        ) : showPendingPanel ? (
          <PendingPanel
            pendingBookings={homePendingBookings}
            homePendingCount={homePendingCount}
            globalPendingCount={pendingCount}
            isLoadingSummary={isLoadingSummary}
            formatTime={formatTime}
            updatePending={updatePending}
            onConfirmBooking={onConfirmBooking}
            onDeclineBooking={onDeclineBooking}
            vertical={tenantVertical}
            category={(business as { category?: string } | null)?.category}
          />
        ) : null
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          <InboxPreviewPanel
            threads={previewThreads}
            loading={convosLoading}
            attentionCount={handoffCount}
            compact
          />
          {hasTodaySchedule ? null : beauty && heroPending && !isLoadingSummary ? (
            <BeautyPendingHero
              booking={heroPending}
              pendingCount={pendingCount}
              formatTime={formatTime}
              updatePending={updatePending}
              onConfirmBooking={onConfirmBooking}
              onDeclineBooking={onDeclineBooking}
              vertical={tenantVertical}
            />
          ) : showPendingPanel ? (
            <PendingPanel
              pendingBookings={homePendingBookings}
              homePendingCount={homePendingCount}
              globalPendingCount={pendingCount}
              isLoadingSummary={isLoadingSummary}
              formatTime={formatTime}
              updatePending={updatePending}
              onConfirmBooking={onConfirmBooking}
              onDeclineBooking={onDeclineBooking}
              vertical={tenantVertical}
              category={(business as { category?: string } | null)?.category}
              compact
            />
          ) : null}
        </div>
      )}

      <SettingsDisclosure
        title="Quick links"
        description="Pages and tools you reach for often — expand when you need them."
        defaultOpen={false}
      >
        <div className="pt-3">
          <VerticalHomeModules />
        </div>
      </SettingsDisclosure>

      <p className="text-center text-[11px] text-muted-foreground">
        <Link href="/bookings" className="hover:text-primary underline-offset-2 hover:underline">
          Full timeline
        </Link>
        <span className="mx-1 text-border">·</span>
        <Link href="/toolkit" className="hover:text-primary underline-offset-2 hover:underline">
          Liv toolkit
        </Link>
        <span className="mx-1 text-border">·</span>
        <Link href="/settings" className="hover:text-primary underline-offset-2 hover:underline">
          Settings
        </Link>
      </p>
    </div>
  );
}
