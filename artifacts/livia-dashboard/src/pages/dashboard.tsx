import { useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { customFetch } from "@workspace/api-client-react";
import {
  useGetDashboardSummary,
  useGetActivityFeed,
  useUpdateBooking,
  getGetDashboardSummaryQueryKey,
  getListBookingsQueryKey,
  getGetActivityFeedQueryKey,
} from "@workspace/api-client-react";
import { useBusiness } from "@/lib/business-context";
import { Skeleton } from "@/components/ui/skeleton";
import { useFormat } from "@/lib/use-format";
import {
  Calendar,
  Check,
  Clock,
  Sparkles,
  Users,
  X,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { getActivityEventMeta } from "@/lib/activity-labels";
import DemoDataControls from "@/components/demo-data-controls";
import { PersonaRitualHeader } from "@/components/ritual/persona-ritual-header";
import { OperatorMaturityBanner } from "@/components/operator-maturity-banner";
import { RunningLateSheet } from "@/components/ops/running-late-sheet";
import { VerticalTodayInsights } from "@/components/vertical-today-insights";
import { LivProposalsPanel } from "@/components/liv-proposals-panel";
import { AccountantPreviewCard } from "@/components/accountant-preview-card";
import { LivMomentsStrip } from "@/components/ritual/liv-moments-strip";
import { LivIncidentsStrip } from "@/components/ritual/liv-incidents-strip";
import { VerticalHomeModules } from "@/components/dashboard/vertical-home-modules";
import { OwnerHomeRitual } from "@/components/dashboard/owner-home-ritual";
import { OwnerDashboardLoading } from "@/components/dashboard/owner-dashboard-loading";
import { VisitFeedbackStrip } from "@/components/dashboard/visit-feedback-strip";
import { LazyMount } from "@/components/lazy-mount";
import { isDemoLoginEnabled, usePersona } from "@/lib/persona";
import { useUser } from "@clerk/clerk-react";
import { timeGreeting } from "@/lib/persona-rituals";
import { invalidateOperationalState } from "@/lib/operational-cache";
import { ActivationWelcome } from "@/components/activation/activation-welcome";
import { ActivationMilestone } from "@/components/activation/activation-milestone";
import { CapabilityReadinessPanel } from "@/components/capabilities/capability-readiness-panel";
import { OwnerIntelligenceStack } from "@/components/dashboard/owner-intelligence-stack";
import { ChainCommercePanel } from "@/components/chain/chain-commerce-panel";
import type { ChainRollup } from "@/components/chain/founder-chain-types";
import {
  shouldShowOperatorDashboardSupplements,
  shouldShowRunningLateAffordance,
} from "@workspace/policy";
import { cn } from "@/lib/utils";
import { isAppearanceEmbed } from "@/lib/appearance-preview-mode";
import { useTenantExperience } from "@/lib/tenant-experience-api";
import { wellnessNativeMorphForVertical } from "@/lib/presentation-layout";
import { effectivePresentationMorph } from "@/lib/appearance-preview-mode";
import { GuestVaultOwnerCallout } from "@/components/customers/guest-vault-owner-callout";
import { SoloOperatorCopilot } from "@/components/dashboard/solo-operator-copilot";
import { useLivArrival } from "@/hooks/use-liv-arrival";

// ------------ helpers ------------

function formatRelativeTime(dateStr: string | Date): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function customerName(c: { firstName?: string | null; lastName?: string | null; displayName?: string | null }): string {
  return (
    c.displayName ||
    [c.firstName, c.lastName].filter(Boolean).join(" ").trim() ||
    "Guest"
  );
}

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase() ?? "")
    .join("");
}

function collapseActivityFeed<T extends { id: string; type: string }>(items: T[]): T[] {
  const out: T[] = [];
  for (const item of items) {
    const prev = out[out.length - 1];
    if (prev?.type === "BUSINESS_UPDATED" && item.type === "BUSINESS_UPDATED") continue;
    out.push(item);
  }
  return out;
}

// Status → token-based color tuple. Uses chart vars so light/dark both work.
const STATUS_STYLE: Record<string, { dot: string; text: string; bg: string; border: string }> = {
  COMPLETED: { dot: "bg-[hsl(var(--chart-3))]", text: "text-[hsl(var(--chart-3))]", bg: "bg-[hsl(var(--chart-3))]/10",  border: "border-[hsl(var(--chart-3))]/30" },
  CONFIRMED: { dot: "bg-primary",                text: "text-primary",                bg: "bg-primary/10",                  border: "border-primary/40" },
  PENDING:   { dot: "bg-[hsl(var(--chart-4))]", text: "text-[hsl(var(--chart-4))]", bg: "bg-[hsl(var(--chart-4))]/10",  border: "border-[hsl(var(--chart-4))]/40" },
  CANCELLED: { dot: "bg-destructive",            text: "text-destructive",            bg: "bg-destructive/10",              border: "border-destructive/30" },
  NO_SHOW:   { dot: "bg-muted-foreground",       text: "text-muted-foreground",       bg: "bg-muted",                       border: "border-border" },
};

// ------------ timeline math ------------

const TL_START_HOUR = 8;
const TL_END_HOUR = 20;
const TL_HOURS = TL_END_HOUR - TL_START_HOUR; // 12 hours

function pctForDate(d: Date): number {
  const h = d.getHours() + d.getMinutes() / 60;
  return ((h - TL_START_HOUR) / TL_HOURS) * 100;
}

function durationMinutes(start: Date, end: Date): number {
  return Math.max(15, Math.round((end.getTime() - start.getTime()) / 60000));
}

// ------------ page ------------

function shopScopedGreeting(firstName: string | null | undefined, shopName: string): string {
  const t = timeGreeting();
  const prefix =
    t === "morning" ? "Good morning" : t === "afternoon" ? "Good afternoon" : "Good evening";
  const name = firstName?.trim() || "there";
  return `${prefix}, ${name} — here's ${shopName} today.`;
}

export default function DashboardPage() {
  const { user } = useUser();
  const { business, businesses } = useBusiness();
  const { kind: persona } = usePersona();
  const { formatTime, formatHeaderDate } = useFormat();
  const qc = useQueryClient();

  const businessId = business?.id ?? "";
  const { suppressDuplicateSetupBanners } = useLivArrival();

  const { data: summary, isLoading: isLoadingSummary } = useGetDashboardSummary(
    businessId,
    { query: { enabled: !!businessId } as any }
  );

  const { data: activityFeed, isLoading: isLoadingActivity } = useGetActivityFeed(
    businessId,
    { limit: 12 },
    { query: { enabled: !!businessId } as any }
  );

  const { data: chainRollup } = useQuery({
    queryKey: ["chain-rollup-dashboard"],
    queryFn: () => customFetch<ChainRollup>("/api/me/chain-rollup"),
    enabled: persona === "org_admin" && businesses.length >= 2,
    staleTime: 60_000,
  });

  const updateBooking = useUpdateBooking({
    mutation: {
      onSuccess: () => {
        if (!businessId) return;
        invalidateOperationalState(qc, businessId);
        qc.invalidateQueries({ queryKey: getGetActivityFeedQueryKey(businessId) });
      },
    },
  });

  // Reactive "now": tick every 60s so the current-time marker, today filter,
  // and "next staff booking" stay current without a page refresh.
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);

  // One-shot welcome aurora sweep, fired once per browser session on
  // first cockpit mount. Respects reduced-motion via the CSS class itself
  // and the global celebrate kill-switch.
  const [showWelcomeSweep, setShowWelcomeSweep] = useState(false);
  useEffect(() => {
    let timeoutId: number | undefined;
    try {
      const seen = window.sessionStorage.getItem("livia.welcomeSweep") === "1";
      const off = window.localStorage.getItem("livia.celebrate") === "off";
      if (!seen && !off) {
        setShowWelcomeSweep(true);
        window.sessionStorage.setItem("livia.welcomeSweep", "1");
        timeoutId = window.setTimeout(() => setShowWelcomeSweep(false), 1900);
      }
    } catch {
      // sessionStorage may be unavailable (private mode in some browsers).
    }
    return () => {
      if (timeoutId !== undefined) window.clearTimeout(timeoutId);
    };
  }, []);

  // Filter to today's bookings only for both timeline + queue
  const todaysBookings = useMemo(() => {
    if (!summary?.upcomingBookings) return [];
    return summary.upcomingBookings
      .filter((b) => isSameDay(new Date(b.startAt), now))
      .sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime());
  }, [summary?.upcomingBookings, now]);

  const pendingBookings = useMemo(
    () => todaysBookings.filter((b) => b.status === "PENDING").slice(0, 5),
    [todaysBookings]
  );

  const activityRows = useMemo(
    () => collapseActivityFeed((activityFeed ?? []) as Array<{ id: string; type: string; createdAt: string }>),
    [activityFeed],
  );

  // Group today's bookings by staff member to derive "Staff on shift"
  const staffShift = useMemo(() => {
    const map = new Map<
      string,
      {
        id: string;
        name: string;
        photoUrl?: string | null;
        total: number;
        completed: number;
        next: typeof todaysBookings[number] | null;
      }
    >();
    for (const b of todaysBookings) {
      if (!b.staff) continue;
      const id = b.staff.id;
      const existing = map.get(id);
      if (existing) {
        existing.total += 1;
        if (b.status === "COMPLETED") existing.completed += 1;
        if (
          (!existing.next && new Date(b.startAt) >= now) ||
          (existing.next && new Date(b.startAt) >= now && new Date(b.startAt) < new Date(existing.next.startAt))
        ) {
          existing.next = b;
        }
      } else {
        map.set(id, {
          id,
          name: b.staff.displayName,
          photoUrl: b.staff.photoUrl,
          total: 1,
          completed: b.status === "COMPLETED" ? 1 : 0,
          next: new Date(b.startAt) >= now ? b : null,
        });
      }
    }
    return Array.from(map.values()).sort((a, b) => b.total - a.total);
  }, [todaysBookings, now]);

  const todayTotal = summary?.todayBookings ?? 0;
  const completedPct = todayTotal > 0
    ? Math.round(((summary?.completedTodayCount ?? 0) / todayTotal) * 100)
    : 0;
  const weekAvg = summary ? Math.round(summary.weekBookings / 7) : 0;
  const todayDelta = summary ? summary.todayBookings - weekAvg : 0;

  const nowPct = pctForDate(now);
  const nowVisible = nowPct >= 0 && nowPct <= 100;

  // Greedy interval-packing: assign each booking the lowest lane index whose
  // last-occupied end-time is <= this booking's start. Bookings are already
  // sorted by startAt above. Lanes grow as needed; in practice 1–3 lanes.
  const { packedLanes, laneCount } = useMemo(() => {
    const laneEnds: number[] = [];
    const packed = todaysBookings.map((booking) => {
      const start = new Date(booking.startAt).getTime();
      const end = new Date(booking.endAt).getTime();
      let lane = laneEnds.findIndex((laneEnd) => laneEnd <= start);
      if (lane === -1) {
        lane = laneEnds.length;
        laneEnds.push(end);
      } else {
        laneEnds[lane] = end;
      }
      return { booking, lane };
    });
    return { packedLanes: packed, laneCount: Math.max(1, laneEnds.length) };
  }, [todaysBookings]);

  // Each lane is 48px (40px block + 8px gap). Container needs at least 2 lanes
  // worth of height so empty/sparse days don't look cramped.
  const blocksAreaHeightPx = Math.max(2, laneCount) * 48;

  const handleStatusUpdate = (bookingId: string, status: "CONFIRMED" | "CANCELLED") => {
    if (!businessId) return;
    updateBooking.mutate({ businessId, bookingId, data: { status } });
  };

  // Brand-new account: no bookings, no customers — show a beautiful onboarding
  // empty state instead of a sea of zeros.
  const isOperatorHome = persona === "owner" || persona === "manager";
  const appearanceEmbed = isAppearanceEmbed();
  const { data: tenantXp } = useTenantExperience(businessId || undefined);
  const tenantVertical = (business as { vertical?: string } | null)?.vertical;
  const wellnessMorphShell = wellnessNativeMorphForVertical(
    tenantVertical,
    tenantVertical === "wellness"
      ? effectivePresentationMorph("wellness", tenantXp?.presentation?.presetId)
      : null,
  );
  const showTenantOpsPanels =
    persona === "owner" || persona === "manager" || persona === "org_admin";

  if (appearanceEmbed && isOperatorHome) {
    if (isLoadingSummary && !summary) {
      return (
        <div className="max-w-5xl w-full min-w-0" data-testid="appearance-embed-today">
          <OwnerDashboardLoading />
        </div>
      );
    }
    return (
      <div className="max-w-5xl w-full min-w-0" data-testid="appearance-embed-today">
        <OwnerHomeRitual
          summary={summary as Parameters<typeof OwnerHomeRitual>[0]["summary"]}
          isLoadingSummary={isLoadingSummary}
          pendingBookings={pendingBookings as Parameters<typeof OwnerHomeRitual>[0]["pendingBookings"]}
          formatTime={formatTime}
          formatHeaderDate={formatHeaderDate}
          now={now}
          onConfirmBooking={(id) => handleStatusUpdate(id, "CONFIRMED")}
          onDeclineBooking={(id) => handleStatusUpdate(id, "CANCELLED")}
          updatePending={updateBooking.isPending}
        />
      </div>
    );
  }

  const isFirstRun =
    !!summary &&
    !isLoadingSummary &&
    summary.todayBookings === 0 &&
    summary.weekBookings === 0 &&
    summary.totalCustomers === 0;

  const operatorXp = tenantXp?.operatorExperience;
  const firstRunSteps = operatorXp?.firstRunSteps?.length
    ? operatorXp.firstRunSteps
    : [
        {
          step: 1,
          label: "Add your staff & services",
          body: "Livia needs to know who works there and what they do.",
          href: "/staff",
        },
        {
          step: 2,
          label: "Set your booking page",
          body: "Share your book page on socials — customers book on your brand, not a marketplace.",
          href: "/settings",
        },
        {
          step: 3,
          label: "Take your first booking",
          body: "Manually or share your public link with customers.",
          href: "/bookings?create=1",
        },
      ];

  if (isFirstRun && !suppressDuplicateSetupBanners) {
    return (
      <div
        className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500"
        style={{ fontFamily: "var(--app-font-sans)" }}
      >
        <header>
          <h1
            className="text-base font-semibold tracking-tight"
            style={{ fontFamily: "var(--app-font-display)" }}
          >
            {operatorXp?.soloMode ? "Liv is on your team" : "Welcome to Livia"}
          </h1>
          <p className="text-xs text-muted-foreground font-mono mt-1">
            {operatorXp?.soloMode
              ? operatorXp.livSubline
              : "Your command center is ready. Let's get something on screen."}
          </p>
        </header>

        {operatorXp?.soloMode ? <SoloOperatorCopilot pack={operatorXp} /> : null}

        <div className={`grid grid-cols-1 gap-4 ${isDemoLoginEnabled ? "lg:grid-cols-2" : ""}`}>
          {isDemoLoginEnabled ? (
            <div className="relative overflow-hidden rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/10 via-card to-[hsl(var(--chart-1))]/10 p-8">
              <div className="absolute -top-12 -right-12 h-48 w-48 rounded-full bg-primary/20 blur-3xl" />
              <div className="relative">
                <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-[hsl(var(--chart-1))] mb-4 shadow-lg shadow-primary/30">
                  <Sparkles className="h-5 w-5 text-primary-foreground" />
                </div>
                <h2 className="text-xl font-semibold mb-2">See Livia in 5 seconds</h2>
                <p className="text-sm text-muted-foreground mb-6 max-w-md">
                  Load a demo workspace — hair, beauty, wellness, tattoo, and barber examples
                  studio, and a personal training gym — pre-loaded with staff, services,
                  customers, and 40+ bookings. Click around, take it apart, and break things
                  freely.
                </p>
                <DemoDataControls variant="primary" />
                <p className="text-[11px] text-muted-foreground mt-3 font-mono">
                  Tip: try the public booking link in /settings → and chat with the AI.
                </p>
              </div>
            </div>
          ) : null}

          <div className="rounded-2xl border border-border bg-card p-8">
            <h2 className="text-base font-semibold mb-4">
              {operatorXp?.soloMode ? "Four steps — then Liv runs with you" : "Or build it yourself"}
            </h2>
            <ul className="space-y-3 text-sm">
              {firstRunSteps.map((step) => (
                <li key={step.step} className="flex items-start gap-3">
                  <span className="mt-1 h-5 w-5 rounded-full bg-muted text-[10px] font-mono text-muted-foreground flex items-center justify-center shrink-0">
                    {step.step}
                  </span>
                  <div>
                    <Link href={step.href}>
                      <span className="font-medium hover:text-primary cursor-pointer">
                        {step.label}
                      </span>
                    </Link>
                    <p className="text-xs text-muted-foreground">{step.body}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    );
  }

  if (isOperatorHome && isLoadingSummary && !summary) {
    return (
      <div className="max-w-6xl w-full" style={{ fontFamily: "var(--app-font-sans)" }}>
        <OwnerDashboardLoading />
      </div>
    );
  }

  return (
    <div
      className={`flex w-full min-w-0 flex-col gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500 ${
        wellnessMorphShell ? "max-w-none" : "max-w-5xl"
      } ${showWelcomeSweep ? "welcome-sweep" : ""}`}
      style={{ fontFamily: "var(--app-font-sans)" }}
    >
      {isOperatorHome ? (
        <OwnerHomeRitual
          summary={summary as Parameters<typeof OwnerHomeRitual>[0]["summary"]}
          isLoadingSummary={isLoadingSummary}
          pendingBookings={pendingBookings as Parameters<typeof OwnerHomeRitual>[0]["pendingBookings"]}
          formatTime={formatTime}
          formatHeaderDate={formatHeaderDate}
          now={now}
          onConfirmBooking={(id) => handleStatusUpdate(id, "CONFIRMED")}
          onDeclineBooking={(id) => handleStatusUpdate(id, "CANCELLED")}
          updatePending={updateBooking.isPending}
        />
      ) : persona === "org_admin" ? (
        <PersonaRitualHeader
          variant="home"
          showActions={false}
          showAlert={false}
          greeting={shopScopedGreeting(
            user?.firstName ?? user?.fullName?.split(" ")[0],
            business?.name ?? "this shop",
          )}
          title={`Today · ${business?.name ?? "this shop"}`}
          subtitle="This location's floor — switch shops from Glance when you need the chain view."
        />
      ) : null}

      {isOperatorHome && shouldShowOperatorDashboardSupplements() ? (
        <OwnerIntelligenceStack variant="operator" className="mb-2" />
      ) : null}

      {!isOperatorHome ? <ActivationMilestone /> : null}
      {!isOperatorHome ? <CapabilityReadinessPanel /> : null}
      {!isOperatorHome ? <ActivationWelcome /> : null}
      {!isOperatorHome && business?.slug ? (
        <GuestVaultOwnerCallout
          slug={business.slug}
          businessName={business.name}
          compact
        />
      ) : null}
      {!isOperatorHome && persona !== "staff" && persona !== "receptionist" ? (
        <OwnerIntelligenceStack variant="owner-home" className="mb-4" />
      ) : null}
      {!wellnessMorphShell ? <OperatorMaturityBanner /> : null}

      {!isOperatorHome && persona === "org_admin" && businesses.length >= 2 ? (
        <ChainCommercePanel
          commerceAlerts={chainRollup?.commerceAlerts}
          commerceSummary={chainRollup?.commerceSummary}
        />
      ) : null}

      {!isOperatorHome && persona === "org_admin" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <LivProposalsPanel variant="home" maxItems={3} />
          <VerticalTodayInsights />
        </div>
      )}

      {showTenantOpsPanels && !isOperatorHome ? <LivMomentsStrip /> : null}

      {showTenantOpsPanels && !isOperatorHome && <LivIncidentsStrip />}

      {showTenantOpsPanels &&
      !isOperatorHome &&
      shouldShowRunningLateAffordance(todayTotal, {
        pendingConfirmations: summary?.pendingCount ?? 0,
      }) ? (
        <div className="flex flex-wrap gap-2">
          <RunningLateSheet />
        </div>
      ) : null}

      {persona === "org_admin" && <AccountantPreviewCard />}

      {persona === "org_admin" && (
        <LazyMount minHeight={160}>
          <VerticalHomeModules />
        </LazyMount>
      )}

      {showTenantOpsPanels && !isOperatorHome && (
        <LazyMount minHeight={80}>
          <VisitFeedbackStrip
            items={
              (summary as { recentVisitFeedback?: Parameters<typeof VisitFeedbackStrip>[0]["items"] } | undefined)
                ?.recentVisitFeedback
            }
            loading={isLoadingSummary}
          />
        </LazyMount>
      )}

      {isOperatorHome ? null : (
      <>
      {/* ============== Operational cockpit (org_admin / legacy) ============== */}
      <header className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between relative z-10">
        <div className="flex items-center gap-3 flex-wrap">
          <h2
            className="text-base font-semibold tracking-tight"
            style={{ fontFamily: "var(--app-font-display)" }}
          >
            {isOperatorHome ? "Today's timeline" : "Flight plan"}
          </h2>
          <span className="hidden md:inline-block w-1 h-1 rounded-full bg-border" />
          <span className="text-xs text-muted-foreground font-mono">
            {formatHeaderDate(now)} · {todayTotal} today · {summary?.pendingCount ?? 0} to confirm
          </span>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-primary/30 bg-primary/5">
            <Zap className="w-3.5 h-3.5 text-primary" />
            <span className="text-[10px] font-medium text-primary">
              Liv: {summary?.pendingCount ?? 0} suggestion{(summary?.pendingCount ?? 0) === 1 ? "" : "s"} ready
            </span>
          </div>
          <div className="hidden md:flex items-center gap-2 text-[10px] font-mono text-muted-foreground bg-muted px-2 py-1 rounded border border-border">
            <span>⌘K</span>
            <span>Quick Actions</span>
          </div>
        </div>
      </header>

      {/* ============== KPI strip + Action Queue (org_admin / legacy layout) ============== */}
      {!isOperatorHome ? (
      <div
        className={cn(
          "grid grid-cols-1 gap-4",
          (isLoadingSummary || pendingBookings.length > 0) && "lg:grid-cols-3",
        )}
      >
        <div
          className={cn(
            "grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4",
            isLoadingSummary || pendingBookings.length > 0
              ? "lg:col-span-2 lg:grid-cols-5"
              : "lg:col-span-full lg:grid-cols-5",
          )}
        >
          <KpiTile
            label="Today's Bookings"
            value={summary?.todayBookings ?? 0}
            sub={
              isLoadingSummary
                ? ""
                : todayDelta === 0
                ? "= week avg"
                : `${todayDelta > 0 ? "+" : ""}${todayDelta} vs avg`
            }
            subTone={todayDelta >= 0 ? "good" : "warn"}
            loading={isLoadingSummary}
          />
          <KpiTile
            label="Pending"
            value={summary?.pendingCount ?? 0}
            valueTone="warn"
            sub="needs action"
            loading={isLoadingSummary}
          />
          <KpiTile
            label="Completed"
            value={summary?.completedTodayCount ?? 0}
            valueTone="good"
            sub={todayTotal > 0 ? `${completedPct}% of day` : "—"}
            loading={isLoadingSummary}
          />
          <KpiTile
            label="Total Customers"
            value={summary?.totalCustomers ?? 0}
            sub={`${summary?.weekBookings ?? 0} bookings this wk`}
            loading={isLoadingSummary}
          />
          <KpiTile
            label="Voice recovered"
            value={
              summary && (summary.voiceRecoveredValueEurCents ?? 0) > 0
                ? `€${((summary.voiceRecoveredValueEurCents ?? 0) / 100).toFixed(0)}`
                : "—"
            }
            sub={
              summary
                ? `${summary.voiceBookingsThisWeek ?? 0} voice bookings · €${((summary.voiceOutcomeShareEurCents ?? 0) / 100).toFixed(0)} share est.`
                : "Liv answers your line"
            }
            loading={isLoadingSummary}
          />
        </div>

        {isLoadingSummary || pendingBookings.length > 0 ? (
          <Panel
            title="Action Queue"
            right={
              pendingBookings.length > 0 ? (
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[hsl(var(--chart-4))]/10 text-[hsl(var(--chart-4))]">
                  {pendingBookings.length} today
                </span>
              ) : null
            }
          >
            {isLoadingSummary ? (
              <div className="p-3 space-y-2">
                {[0, 1, 2].map((i) => (
                  <Skeleton key={i} className="h-12 w-full rounded" />
                ))}
              </div>
            ) : (
              <div className="p-2 space-y-2 max-h-[220px] overflow-y-auto">
                {pendingBookings.map((b) => (
                  <div
                    key={b.id}
                    className="flex items-center justify-between p-2 rounded border border-border bg-background/40 hover:border-muted-foreground/30 transition-colors"
                  >
                    <Link href={`/bookings/${b.id}`}>
                      <div className="flex flex-col gap-0.5 cursor-pointer min-w-0">
                        <span className="text-xs font-medium truncate">{customerName(b.customer)}</span>
                        <span className="text-[10px] text-muted-foreground font-mono truncate">
                          {formatTime(b.startAt)} · {b.service.name}
                        </span>
                      </div>
                    </Link>
                    <div className="flex items-center gap-1 shrink-0 ml-2">
                      <button
                        type="button"
                        aria-label="Decline booking"
                        disabled={updateBooking.isPending}
                        onClick={() => handleStatusUpdate(b.id, "CANCELLED")}
                        className="w-7 h-7 rounded bg-muted hover:bg-destructive/15 hover:text-destructive flex items-center justify-center transition-colors disabled:opacity-40"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        aria-label="Confirm booking"
                        disabled={updateBooking.isPending}
                        onClick={() => handleStatusUpdate(b.id, "CONFIRMED")}
                        className="w-7 h-7 rounded bg-primary/15 text-primary hover:bg-primary/25 flex items-center justify-center transition-colors disabled:opacity-40"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Panel>
        ) : null}
      </div>
      ) : null}

      {/* ============== Live Timeline (hero) ============== */}
      <Panel
        title="Live Timeline"
        right={
          <div className="hidden sm:flex items-center gap-3 text-[10px] font-mono">
            <LegendDot color="bg-[hsl(var(--chart-3))]" label="Completed" />
            <LegendDot color="bg-primary" label="Confirmed" />
            <LegendDot color="bg-[hsl(var(--chart-4))]" label="Pending" />
          </div>
        }
      >
        {isLoadingSummary ? (
          <div className="p-4">
            <Skeleton className="h-44 w-full" />
          </div>
        ) : (
          <div
            className="relative w-full min-w-0 bg-background/40"
            style={{ height: `${64 + blocksAreaHeightPx + 16}px` }}
          >
            <div className="relative h-full w-full min-w-0">
              {/* Hour grid */}
              <div className="absolute inset-0 flex">
                {Array.from({ length: TL_HOURS + 1 }).map((_, i) => (
                  <div
                    key={i}
                    className="relative h-full min-w-0 flex-1 border-r border-dashed border-border/70"
                  >
                    <div className="absolute top-2 -left-3 text-[10px] font-mono text-muted-foreground bg-card px-1 z-10">
                      {String(TL_START_HOUR + i).padStart(2, "0")}:00
                    </div>
                  </div>
                ))}
              </div>

              {/* Current time marker */}
              {nowVisible && (
                <div
                  className="absolute top-0 bottom-0 w-px bg-primary z-20"
                  style={{ left: `${nowPct}%` }}
                >
                  <div className="absolute top-8 -left-6 bg-primary text-primary-foreground text-[9px] font-mono px-1.5 py-0.5 rounded-full font-bold shadow-[0_0_10px_hsl(var(--primary)/0.6)]">
                    {formatTime(now.toISOString())}
                  </div>
                </div>
              )}

              {/* Booking blocks — overlap-aware lane assignment via greedy packing.
                  Container height grows with lane count so packing is never clipped. */}
              <div
                className="absolute top-16 left-0 right-0"
                style={{ height: `${blocksAreaHeightPx}px` }}
              >
                {todaysBookings.length === 0 ? (
                  <div className="absolute inset-0 flex items-center justify-center text-xs text-muted-foreground">
                    No bookings scheduled today.
                  </div>
                ) : (
                  packedLanes.map(({ booking: b, lane }) => {
                    const start = new Date(b.startAt);
                    const end = new Date(b.endAt);
                    const rawLeftPct = pctForDate(start);
                    const rawWidthPct = (durationMinutes(start, end) / 60 / TL_HOURS) * 100;
                    if (rawLeftPct >= 100 || rawLeftPct + rawWidthPct <= 0) return null;
                    // Clip to visible window so blocks crossing 08:00 / 20:00
                    // don't render outside their actual time bounds.
                    const visibleLeft = Math.max(0, rawLeftPct);
                    const visibleRight = Math.min(100, rawLeftPct + rawWidthPct);
                    const visibleWidth = Math.max(0, visibleRight - visibleLeft);
                    if (visibleWidth <= 0) return null;
                    const style = STATUS_STYLE[b.status] ?? STATUS_STYLE.CONFIRMED;
                    const isPending = b.status === "PENDING";
                    return (
                      <Link key={b.id} href={`/bookings/${b.id}`}>
                        <div
                          className={`absolute h-10 rounded px-2 py-1 overflow-hidden border ${style.bg} ${style.border} ${isPending ? "border-dashed" : ""} cursor-pointer hover:brightness-110 transition`}
                          style={{
                            top: `${lane * 48}px`,
                            left: `${visibleLeft}%`,
                            width: `${visibleWidth}%`,
                            minWidth: "44px",
                          }}
                          title={`${customerName(b.customer)} · ${b.service.name} · ${formatTime(b.startAt)}`}
                        >
                          <div className={`text-[10px] font-bold truncate ${style.text}`}>
                            {customerName(b.customer)}
                          </div>
                          <div className={`text-[9px] font-mono truncate ${style.text} opacity-70`}>
                            {b.service.name}
                          </div>
                        </div>
                      </Link>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        )}
      </Panel>

      {/* ============== Activity + Staff ============== */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Panel title="Activity Log">
          {isLoadingActivity ? (
            <div className="p-3 space-y-3">
              {[0, 1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : activityRows.length === 0 ? (
            <EmptyState icon={Clock} text="No recent activity yet." />
          ) : (
            <div className="flex flex-col">
              {activityRows.map((a) => {
                const enriched = a as {
                  label?: string;
                  detail?: string;
                  href?: string;
                  priority?: "info" | "watch" | "act";
                };
                const meta = getActivityEventMeta(
                  a.type,
                  (business as { vertical?: string } | undefined)?.vertical,
                  business?.category,
                );
                const label = enriched.label ?? meta.label;
                const rowInner = (
                  <>
                    <div className={`mt-0.5 shrink-0 ${meta.color}`}>
                      <meta.Icon className="h-3.5 w-3.5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[11px] truncate">{label}</div>
                      {enriched.detail ? (
                        <div className="text-[10px] text-muted-foreground truncate mt-0.5">
                          {enriched.detail}
                        </div>
                      ) : null}
                    </div>
                    <div className="text-[10px] text-muted-foreground font-mono shrink-0">
                      {formatRelativeTime(a.createdAt)}
                    </div>
                  </>
                );
                const rowClass =
                  "flex items-start gap-3 px-4 py-2.5 border-b border-border last:border-0 hover:bg-muted/30 transition-colors";
                if (enriched.href) {
                  return (
                    <Link
                      key={a.id}
                      href={enriched.href}
                      className={cn(
                        rowClass,
                        enriched.priority === "act" && "border-l-2 border-l-destructive pl-3",
                      )}
                    >
                      {rowInner}
                    </Link>
                  );
                }
                return (
                  <div key={a.id} className={rowClass}>
                    {rowInner}
                  </div>
                );
              })}
            </div>
          )}
        </Panel>

        <Panel
          title="Staff on Shift"
          right={
            staffShift.length > 0 ? (
              <span className="text-[10px] font-mono text-muted-foreground">
                {staffShift.length} active
              </span>
            ) : null
          }
        >
          {isLoadingSummary ? (
            <div className="p-4 space-y-4">
              {[0, 1, 2].map((i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : staffShift.length === 0 ? (
            <EmptyState icon={Users} text="No staff scheduled today." />
          ) : (
            <div className="p-4 flex flex-col gap-4">
              {staffShift.map((s) => {
                const util = s.total > 0 ? Math.round((s.completed / s.total) * 100) : 0;
                return (
                  <div key={s.id} className="flex flex-col gap-2">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center text-[10px] font-bold border border-border shrink-0">
                          {initials(s.name)}
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="text-xs font-medium truncate">{s.name}</span>
                          <span className="text-[10px] text-muted-foreground font-mono">
                            {s.completed}/{s.total} done
                          </span>
                        </div>
                      </div>
                      <div className="text-[10px] font-mono text-muted-foreground text-right shrink-0">
                        <div>Next</div>
                        <div className="text-foreground">
                          {s.next
                            ? `${formatTime(s.next.startAt)} · ${customerName(s.next.customer)}`
                            : "Done for today"}
                        </div>
                      </div>
                    </div>
                    <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary transition-all"
                        style={{ width: `${util}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Panel>
      </div>
      </>
      )}
    </div>
  );
}

// ------------ small composites ------------

function Panel({
  title,
  right,
  children,
}: {
  title: string;
  right?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden flex flex-col">
      <div className="h-10 border-b border-border flex items-center px-4 justify-between bg-card/60 shrink-0">
        <div className="text-xs font-semibold tracking-tight">{title}</div>
        {right}
      </div>
      <div className="flex-1 min-h-0">{children}</div>
    </div>
  );
}

type Tone = "good" | "warn" | "neutral";

function toneClass(t?: Tone): string {
  if (t === "good") return "text-[hsl(var(--chart-3))]";
  if (t === "warn") return "text-[hsl(var(--chart-4))]";
  return "text-foreground";
}

function KpiTile({
  label,
  value,
  sub,
  valueTone,
  subTone,
  loading,
}: {
  label: string;
  value: number | string;
  sub?: string;
  valueTone?: Tone;
  subTone?: Tone;
  loading?: boolean;
}) {
  return (
    <div className="bg-card border border-border rounded-lg p-4 flex flex-col justify-between gap-2 min-h-[88px]">
      <div className="text-xs text-muted-foreground font-medium">{label}</div>
      {loading ? (
        <Skeleton className="h-7 w-12" />
      ) : (
        <div className="flex items-baseline gap-2">
          <div
            className={`font-mono text-2xl tabular-nums ${toneClass(valueTone)}`}
            style={{ fontFamily: "var(--app-font-mono)" }}
          >
            {value}
          </div>
          {sub ? (
            <div className={`text-[10px] font-mono ${toneClass(subTone)}`}>{sub}</div>
          ) : null}
        </div>
      )}
    </div>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5 text-muted-foreground">
      <span className={`w-2 h-2 rounded-full ${color}`} />
      {label}
    </span>
  );
}

function EmptyState({ icon: Icon, text }: { icon: LucideIcon; text: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-8 px-4 text-center min-h-[120px]">
      <Icon className="h-8 w-8 text-muted-foreground mb-3 opacity-50" />
      <p className="text-xs text-muted-foreground">{text}</p>
    </div>
  );
}
