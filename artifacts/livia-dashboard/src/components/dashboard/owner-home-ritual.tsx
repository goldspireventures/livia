import { Link } from "wouter";
import {
  ArrowRight,
  Calendar,
  Check,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  FileText,
  Flower2,
  Inbox,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { SettingsDisclosure } from "@/components/ui/settings-disclosure";
import { usePersonaBriefing } from "@/hooks/use-persona-briefing";
import { alignBriefingTimeOfDay } from "@/lib/briefing-display";
import { timeGreeting } from "@/lib/persona-rituals";
import { useListConversations, useUpdateBooking, getGetDashboardSummaryQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useBusiness } from "@/lib/business-context";
import { useTenantExperience } from "@/lib/tenant-experience-api";
import { useCallback, useState } from "react";
import { InboxPreviewPanel } from "@/components/dashboard/inbox-preview-panel";
import { OwnerLivGuardrails } from "@/components/dashboard/owner-liv-guardrails";
import { LivWaitlistNudge } from "@/components/dashboard/liv-waitlist-nudge";
import { HairColourDayCard } from "@/components/hair/hair-colour-day-card";
import { VerticalHomeModules } from "@/components/dashboard/vertical-home-modules";
import {
  consultFirstBriefingLine,
  isConsultFirstVertical,
  resolveConsultFirstOwnerHomeBriefingCta,
  resolveOwnerHomeBriefingCta,
  resolveOwnerHomeKpiChips,
  resolveOwnerHomeModuleLayout,
  resolveSoloOwnerHomeFallback,
  classifyPendingBookingAttention,
  filterOwnerHomeKpiWhenOperatingPulseVisible,
  shouldShowOwnerHomeBriefingCta,
  shouldShowOwnerOperatingPulsePrimaryAction,
  studioPendingBookingCount,
  inboxThreadStudioActionRequired,
} from "@workspace/policy";
import { OwnerOperatingPulse } from "@/components/dashboard/owner-operating-pulse";
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api-fetch";
import { SoloOperatorCopilot } from "@/components/dashboard/solo-operator-copilot";
import { useLivArrival } from "@/hooks/use-liv-arrival";
import { cn } from "@/lib/utils";
import { beautyNativeMorphForVertical, useBeautyChrome } from "@/lib/presentation-layout";
import { resolvePresentationLayoutMorph } from "@workspace/policy";
import { BeautyMorphTodayHome } from "@/components/beauty/beauty-morph-today";
import { WellnessMorphTodayHome } from "@/components/wellness/wellness-morph-today";
import { resolvePublicServiceImageUrl } from "@/lib/public-service-image";
import {
  PENDING_BOOKINGS_LIST_HREF,
  resolveOwnerHomeBookingSlices,
} from "@workspace/policy";
import { verticalPackUi } from "@/lib/vertical-pack-ui";
import { TodayAppointmentsStrip } from "@/components/dashboard/today-appointments-strip";
import {
  PendingBookingActions,
  type PendingBookingActionBooking,
} from "@/components/booking/pending-booking-actions";
import { PendingWhyLine } from "@/components/booking/pending-why-line";
import { ConsultFirstHomePanel } from "@/components/event-vendor/consult-first-home-panel";

type PendingBooking = PendingBookingActionBooking & {
  status: string;
  pendingReason?: string | null;
};

const PLACEHOLDER_GREETING_NAMES = /^(demo|test|owner|user|there|admin)$/i;

function ownerGreeting(firstName: string | null | undefined): string {
  const t = timeGreeting();
  const prefix =
    t === "morning" ? "Good morning" : t === "afternoon" ? "Good afternoon" : "Good evening";
  const name = firstName?.trim();
  if (!name || PLACEHOLDER_GREETING_NAMES.test(name)) return prefix;
  return `${prefix}, ${name}`;
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
    | "newEnquiries"
    | "quotedEnquiries"
    | "staleQuotes",
    { href: string; label: string; icon: typeof Calendar }
  >
> = {
  todayBookings: { href: "/bookings", label: "View calendar", icon: Calendar },
  inboxHandoffs: { href: "/inbox?lens=taken_over", label: "View inbox", icon: Inbox },
  toConfirm: { href: PENDING_BOOKINGS_LIST_HREF, label: "View pending", icon: CheckCircle2 },
  completedToday: { href: "/bookings", label: "View today", icon: Check },
  newEnquiries: { href: "/inbox?lens=leads", label: "Review leads", icon: ClipboardList },
  quotedEnquiries: { href: "/quotes", label: "Open quotes", icon: FileText },
  staleQuotes: { href: "/quotes", label: "Follow up", icon: Sparkles },
};

function KpiChip({
  label,
  value,
  sub,
  tone,
  loading,
  chipId,
  beauty,
  signalGlow,
}: {
  label: string;
  value: number | string;
  sub?: string;
  tone?: "warn" | "good";
  loading?: boolean;
  chipId?: keyof typeof KPI_VIEW;
  beauty?: boolean;
  /** Actionable KPI — left-edge glow in signal ambient tier */
  signalGlow?: boolean;
}) {
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
  pendingCount,
  isLoadingSummary,
  formatTime,
  updatePending,
  onConfirmBooking,
  onDeclineBooking,
  vertical,
  category,
  compact,
  title = "Needs you",
  hideCountInHeader = false,
}: {
  pendingBookings: PendingBooking[];
  pendingCount: number;
  isLoadingSummary: boolean;
  formatTime: (iso: string) => string;
  updatePending: boolean;
  onConfirmBooking: (id: string) => void;
  onDeclineBooking: (id: string) => void;
  vertical?: string | null;
  category?: string | null;
  compact?: boolean;
  title?: string;
  hideCountInHeader?: boolean;
}) {
  const needsYou = pendingBookings.filter(
    (b) => classifyPendingBookingAttention(b.pendingReason) === "needs_you",
  );
  const display = needsYou.length > 0 ? needsYou : pendingBookings;
  const displayCount = needsYou.length > 0 ? needsYou.length : pendingCount;

  return (
    <section
      className={cn(
        "rounded-lg border border-border/80 bg-card overflow-hidden flex flex-col",
        !compact && "min-h-[180px]",
      )}
    >
      <div className="flex items-center justify-between px-3 py-2 border-b border-border/60">
        <h2 className="text-sm font-semibold">{title}</h2>
        {!hideCountInHeader && displayCount > 0 ? (
          <span className="text-[10px] font-mono text-[hsl(var(--chart-4))]">{displayCount} pending</span>
        ) : null}
      </div>
      {isLoadingSummary ? (
        <div className="p-3 space-y-2">
          {[1, 2].map((i) => (
            <Skeleton key={i} className="h-12 w-full rounded-lg" />
          ))}
        </div>
      ) : display.length === 0 ? (
        <div className="flex flex-col items-center justify-center px-3 py-6 text-center">
          <Check className="h-6 w-6 text-[hsl(var(--chart-3))]/50 mb-1.5" aria-hidden />
          <p className="text-xs text-muted-foreground">Nothing waiting on you.</p>
        </div>
      ) : (
        <ul className="divide-y divide-border/60">
          {display.map((b) => (
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
      {pendingBookings.length > 1 ? (
        <div className="mt-auto border-t border-border/60 px-3 py-1.5">
          <Link href={PENDING_BOOKINGS_LIST_HREF}>
            <Button variant="ghost" size="sm" className="w-full text-xs h-8">
              View all {pendingCount} pending
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
  const bid = business?.id ?? "";
  const { suppressDuplicateSetupBanners } = useLivArrival();
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
  const studioInboxThreads = openThreads.filter((c) =>
    inboxThreadStudioActionRequired({ status: c.status, aiHandled: c.aiHandled }),
  );
  const previewThreads = studioInboxThreads.slice(0, 3).map((c) => ({
    id: c.id,
    customerName: c.customerName ?? null,
    lastMessagePreview: c.lastMessage ?? null,
    updatedAt: c.lastMessageAt,
    status: c.status,
    channel: c.channel,
  }));

  const consultFirst = isConsultFirstVertical(tenantVertical);
  const pendingCount = consultFirst ? 0 : (summary?.pendingCount ?? 0);
  const studioPendingCount = consultFirst
    ? 0
    : ((summary as { studioPendingCount?: number } | undefined)?.studioPendingCount ??
      studioPendingBookingCount(pendingBookings));
  const inboxAttentionCount =
    (summary as { inboxAttentionCount?: number } | undefined)?.inboxAttentionCount ??
    (summary?.handedOffCount ?? 0) + ((summary as { needsYouCount?: number } | undefined)?.needsYouCount ?? 0);
  const handoffCount = inboxAttentionCount;

  const { data: consultDash, isLoading: consultDashLoading } = useQuery({
    queryKey: ["event-vendor-dashboard", bid],
    queryFn: () =>
      apiFetch<{
        newEnquiries: number;
        lowFitNewEnquiries?: number;
        lowFitList?: Array<{
          enquiryId: string;
          contactName: string;
          eventType?: string | null;
          headline: string;
        }>;
        quotedEnquiries: number;
        staleQuotes: number;
        prepTasksDue?: number;
        staleQuotesList?: Array<{
          quoteId: string;
          contactName: string;
          eventType?: string | null;
          daysSinceSent: number;
        }>;
        prepTaskList?: Array<{
          quoteId: string;
          contactName: string;
          taskId: string;
          label: string;
          dueDate: string;
          overdue: boolean;
        }>;
        pipelineForecast?: { quotedMinor: number; expectedMinor: number; weightLabel: string };
        replyBenchmark?: { label: string; percentile: number } | null;
      }>(`/businesses/${bid}/event-vendor/dashboard`),
    enabled: consultFirst && !!bid,
    staleTime: 30_000,
  });

  const operatingPulse = (summary as { operatingPulse?: import("@workspace/policy").OperatingPulseView } | undefined)
    ?.operatingPulse;
  const bookingSlices = resolveOwnerHomeBookingSlices(summary?.upcomingBookings, now);
  const hasTodaySchedule =
    bookingSlices.pendingToday.length + bookingSlices.confirmedToday.length > 0;

  const moduleLayout = resolveOwnerHomeModuleLayout({
    pendingCount,
    studioPendingCount,
    openInboxCount: inboxAttentionCount,
    homePendingCount: pendingBookings.filter(
      (b) => classifyPendingBookingAttention(b.pendingReason) === "needs_you",
    ).length,
    pendingSurfacedElsewhere: hasTodaySchedule && bookingSlices.pendingToday.length > 0,
    consultFirst,
    newEnquiries: consultDash?.newEnquiries,
    staleQuotes: consultDash?.staleQuotes,
    prepTasksDue: consultDash?.prepTasksDue,
  });

  const queueDetailVisible = moduleLayout.mode !== "all_clear";
  const operatingPulseActive =
    !consultFirst &&
    !!operatingPulse &&
    (operatingPulse.needsYou > 0 || operatingPulse.guestAction > 0);
  const suppressQueueDuplicates = operatingPulseActive && queueDetailVisible;
  const showBriefingCta = shouldShowOwnerHomeBriefingCta({
    consultFirst,
    operatingPulseActive,
    moduleShowsQueueDetail: queueDetailVisible,
  });
  const showPulsePrimaryAction = shouldShowOwnerOperatingPulsePrimaryAction(moduleLayout);

  const todayTotal = consultFirst ? 0 : (summary?.todayBookings ?? 0);
  const kpiChips = filterOwnerHomeKpiWhenOperatingPulseVisible(
    resolveOwnerHomeKpiChips(
      {
        todayBookings: todayTotal,
        pendingCount,
        studioPendingCount,
        handedOffCount: summary?.handedOffCount ?? 0,
        inboxAttentionCount,
        newEnquiries: consultDash?.newEnquiries,
        quotedEnquiries: consultDash?.quotedEnquiries,
        staleQuotes: consultDash?.staleQuotes,
      },
      tenantVertical,
    ),
    operatingPulseActive ? operatingPulse : null,
  );
  const kpiGridClass =
    kpiChips.length <= 1
      ? "grid-cols-1"
      : kpiChips.length === 2
        ? "grid-cols-2"
        : kpiChips.length === 3
          ? "grid-cols-3"
          : "grid-cols-2 lg:grid-cols-4";
  const weekAvg = summary ? Math.round(summary.weekBookings! / 7) : 0;
  const todayDelta = summary ? summary.todayBookings! - weekAvg : 0;

  const operatorXp = tenantXp?.operatorExperience;
  const consultCta =
    consultFirst && consultDash
      ? resolveConsultFirstOwnerHomeBriefingCta({
          newEnquiries: consultDash.newEnquiries,
          staleQuotes: consultDash.staleQuotes,
          handoffs: handoffCount,
        })
      : null;
  const briefingCta = resolveOwnerHomeBriefingCta({
    pendingCount,
    studioPendingCount,
    handedOffCount: summary?.handedOffCount ?? 0,
    inboxAttentionCount,
    fallbackHref: ritual.primaryAction?.href ?? "/bookings",
    fallbackLabel: ritual.primaryAction?.label ?? "View calendar",
  });
  const soloFallback =
    tenantXp?.operator && operatorXp?.soloMode && !consultFirst
      ? resolveSoloOwnerHomeFallback(tenantXp.operator, {
          pendingCount: studioPendingCount,
          handedOffCount: handoffCount,
          todayBookings: todayTotal,
          weekBookings: summary?.weekBookings ?? 0,
        })
      : null;
  const oneThingHref = consultCta?.href ?? soloFallback?.href ?? briefingCta.href;
  const oneThingLabel = consultCta?.label ?? soloFallback?.label ?? briefingCta.label;
  const displayLivLine = alignBriefingTimeOfDay(
    consultFirst && consultDash
      ? consultFirstBriefingLine({
          newEnquiries: consultDash.newEnquiries,
          quotedEnquiries: consultDash.quotedEnquiries,
          staleQuotes: consultDash.staleQuotes,
          handoffs: handoffCount,
        })
      : livLine,
  );
  const beauty = useBeautyChrome(tenantVertical);
  const beautyMorph =
    tenantVertical === "beauty" && tenantXp?.presentation
      ? resolvePresentationLayoutMorph("beauty", tenantXp.presentation.presetId)
      : null;
  const beautyNativeMorph = beautyNativeMorphForVertical(tenantVertical, beautyMorph);
  const wellnessMorph =
    tenantVertical === "wellness" && tenantXp?.presentation
      ? resolvePresentationLayoutMorph("wellness", tenantXp.presentation.presetId)
      : null;
  const wellnessNativeMorph =
    wellnessMorph && wellnessMorph !== "constellation" ? wellnessMorph : null;
  const vocab = verticalPackUi(tenantVertical, business?.category);
  const heroPending = bookingSlices.pendingToday[0] ?? pendingBookings[0] ?? null;

  const briefingNeedsAttention =
    briefingLoading ||
    studioPendingCount > 0 ||
    inboxAttentionCount > 0 ||
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
      />
    );
  }

  return (
    <div className="space-y-4 max-w-5xl" data-testid="owner-home-ritual">
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

      {operatorXp?.soloMode && operatorXp.showSoloCopilotCard && !suppressDuplicateSetupBanners ? (
        <SoloOperatorCopilot pack={operatorXp} />
      ) : null}

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
            <Sparkles className="h-4 w-4 shrink-0 mt-0.5 text-primary" aria-hidden />
          )}
          <div className="min-w-0 flex-1">
            <p className="text-[10px] uppercase tracking-[0.2em] text-primary/80 font-medium mb-1">
              {beauty ? "Liv briefing" : "Briefing"}
            </p>
            {briefingLoading ? (
              <div className="space-y-1.5">
                <Skeleton className="h-3.5 w-full max-w-md" />
                <Skeleton className="h-3.5 w-4/5 max-w-sm" />
              </div>
            ) : (
              <>
                <p className="text-sm leading-relaxed text-foreground/90 line-clamp-3">{displayLivLine}</p>
                {operatorXp?.soloMode && operatorXp.showSoloCopilotCard && !suppressDuplicateSetupBanners && !briefingLoading ? (
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                    {operatorXp.livSubline}
                  </p>
                ) : null}
              </>
            )}
            {!beauty && livPulse !== "act" && livSource === "liv" ? (
              <p className="text-[10px] uppercase tracking-wider font-mono text-muted-foreground mt-0.5">
                Liv · briefing
              </p>
            ) : null}
          </div>
        </div>
        {showBriefingCta ? (
          <Link href={oneThingHref} className="beauty-briefing-cta shrink-0 w-full sm:w-auto">
            <Button
              size="sm"
              className="gap-1.5 h-9 w-full sm:w-auto min-h-[44px] rounded-xl"
            >
              {oneThingLabel}
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </Link>
        ) : null}
      </section>

      <OwnerLivGuardrails livNeedsAttention={livPulse === "act"} />

      <LivWaitlistNudge
        activeCount={(summary as { activeWaitlistCount?: number } | undefined)?.activeWaitlistCount ?? 0}
        loading={isLoadingSummary}
      />

      {!consultFirst ? (
        <OwnerOperatingPulse
          pulse={(summary as { operatingPulse?: import("@workspace/policy").OperatingPulseView })?.operatingPulse}
          loading={isLoadingSummary}
          showPrimaryAction={showPulsePrimaryAction}
          todayBookings={todayTotal}
          todayBookingsSub={
            isLoadingSummary
              ? undefined
              : todayDelta === 0
                ? "= week avg"
                : `${todayDelta > 0 ? "+" : ""}${todayDelta} vs avg`
          }
        />
      ) : null}

      {tenantVertical === "hair" ? <HairColourDayCard /> : null}

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
                loading={isLoadingSummary}
              />
            </Link>
          )
        ) : null}
        {kpiChips.includes("toConfirm") ? (
          <KpiChip
            chipId="toConfirm"
            beauty={beauty}
            signalGlow
            label="To confirm"
            value={studioPendingCount}
            sub="pending"
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
        {kpiChips.includes("newEnquiries") ? (
          <Link href="/inbox?lens=leads" className="block">
            <KpiChip
              chipId="newEnquiries"
              label="New leads"
              value={consultDash?.newEnquiries ?? 0}
              sub="to review"
              tone={consultDash?.newEnquiries ? "warn" : undefined}
              loading={consultDashLoading}
            />
          </Link>
        ) : null}
        {kpiChips.includes("quotedEnquiries") ? (
          <Link href="/quotes" className="block">
            <KpiChip
              chipId="quotedEnquiries"
              label="Quoted"
              value={consultDash?.quotedEnquiries ?? 0}
              sub="with client"
              loading={consultDashLoading}
            />
          </Link>
        ) : null}
        {kpiChips.includes("staleQuotes") ? (
          <Link href="/quotes" className="block">
            <KpiChip
              chipId="staleQuotes"
              label="Follow up"
              value={consultDash?.staleQuotes ?? 0}
              sub="quotes quiet"
              tone="warn"
              loading={consultDashLoading}
            />
          </Link>
        ) : null}
      </div>

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

      {!consultFirst ? (
      <TodayAppointmentsStrip
          pendingToday={bookingSlices.pendingToday}
          confirmedToday={bookingSlices.confirmedToday}
          formatTime={formatTime}
          loading={isLoadingSummary}
          scheduleTitle={vocab.ownerTodayScheduleTitle}
          calendarCta={vocab.ownerTodayScheduleCalendarCta}
          runningLateLabel={vocab.runningLateLabel}
          updatePending={updatePending}
          onConfirmBooking={onConfirmBooking}
          onDeclineBooking={onDeclineBooking}
          vertical={tenantVertical}
          category={(business as { category?: string } | null)?.category}
          skipPendingId={beauty && heroPending ? heroPending.id : null}
        />
      ) : null}

      {moduleLayout.mode === "all_clear" ? (
        <div
          className="rounded-lg border border-border/60 bg-muted/30 px-4 py-3 flex items-center gap-2 text-sm text-muted-foreground"
          data-testid="owner-home-all-clear"
        >
          <Check className="h-4 w-4 text-[hsl(var(--chart-3))] shrink-0" aria-hidden />
          <span>
            {consultFirst
              ? "All clear — enquiries and inbox are up to date."
              : "All clear — inbox and confirmations are up to date."}
          </span>
          <Link
            href={consultFirst ? "/inbox" : "/bookings"}
            className="ml-auto text-xs text-primary hover:underline shrink-0"
          >
            {consultFirst ? "Inbox" : "Calendar"}
          </Link>
        </div>
      ) : moduleLayout.mode === "single" ? (
        moduleLayout.focus === "inbox" ? (
          consultFirst ? (
            <ConsultFirstHomePanel
              newEnquiries={consultDash?.newEnquiries ?? 0}
              lowFitNewEnquiries={consultDash?.lowFitNewEnquiries ?? 0}
              lowFitList={consultDash?.lowFitList}
              staleQuotesList={consultDash?.staleQuotesList}
              prepTaskList={consultDash?.prepTaskList}
              pipelineForecast={consultDash?.pipelineForecast}
              replyBenchmark={consultDash?.replyBenchmark}
              loading={consultDashLoading}
            />
          ) : (
            <InboxPreviewPanel
              threads={previewThreads}
              loading={convosLoading}
              attentionCount={handoffCount}
              compact
              hideAttentionBadge={suppressQueueDuplicates}
            />
          )
        ) : hasTodaySchedule ? null : (
          <PendingPanel
            pendingBookings={pendingBookings}
            pendingCount={pendingCount}
            isLoadingSummary={isLoadingSummary}
            formatTime={formatTime}
            updatePending={updatePending}
            onConfirmBooking={onConfirmBooking}
            onDeclineBooking={onDeclineBooking}
            vertical={tenantVertical}
            category={(business as { category?: string } | null)?.category}
            hideCountInHeader={suppressQueueDuplicates}
          />
        )
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          <InboxPreviewPanel
            threads={previewThreads}
            loading={convosLoading}
            attentionCount={handoffCount}
            compact
            hideAttentionBadge={suppressQueueDuplicates}
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
          ) : hasTodaySchedule ? null : (
            <PendingPanel
              pendingBookings={pendingBookings}
              pendingCount={pendingCount}
              isLoadingSummary={isLoadingSummary}
              formatTime={formatTime}
              updatePending={updatePending}
              onConfirmBooking={onConfirmBooking}
              onDeclineBooking={onDeclineBooking}
              vertical={tenantVertical}
              category={(business as { category?: string } | null)?.category}
              compact
              hideCountInHeader={suppressQueueDuplicates}
            />
          )}
        </div>
      )}

      <SettingsDisclosure
        title="Quick links"
        defaultOpen={false}
      >
        <div className="pt-3">
          <VerticalHomeModules />
        </div>
      </SettingsDisclosure>

      <p className="text-center text-[11px] text-muted-foreground">
        {consultFirst ? (
          <>
            <Link href="/inbox" className="hover:text-primary underline-offset-2 hover:underline">
              Inbox
            </Link>
            <span className="mx-1 text-border">·</span>
            <Link href="/quotes" className="hover:text-primary underline-offset-2 hover:underline">
              Quotes
            </Link>
            <span className="mx-1 text-border">·</span>
            <Link href="/event-site" className="hover:text-primary underline-offset-2 hover:underline">
              Event website
            </Link>
          </>
        ) : (
          <>
            <Link href="/bookings" className="hover:text-primary underline-offset-2 hover:underline">
              Full timeline
            </Link>
            <span className="mx-1 text-border">·</span>
            <Link href="/toolkit" className="hover:text-primary underline-offset-2 hover:underline">
              Liv toolkit
            </Link>
          </>
        )}
        <span className="mx-1 text-border">·</span>
        <Link href="/settings" className="hover:text-primary underline-offset-2 hover:underline">
          Settings
        </Link>
      </p>
    </div>
  );
}
