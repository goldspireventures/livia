import { Link } from "wouter";
import { ArrowRight, Check, Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { SettingsDisclosure } from "@/components/ui/settings-disclosure";
import { usePersonaBriefing } from "@/hooks/use-persona-briefing";
import { timeGreeting } from "@/lib/persona-rituals";
import { useListConversations } from "@workspace/api-client-react";
import { useBusiness } from "@/lib/business-context";
import { InboxPreviewPanel } from "@/components/dashboard/inbox-preview-panel";
import { OwnerLivGuardrails } from "@/components/dashboard/owner-liv-guardrails";
import { VerticalHomeModules } from "@/components/dashboard/vertical-home-modules";
import { resolveOwnerHomeModuleLayout } from "@workspace/policy";
import { cn } from "@/lib/utils";

type PendingBooking = {
  id: string;
  startAt: string;
  status: string;
  service: { name: string };
  customer: { firstName?: string | null; lastName?: string | null; displayName?: string | null };
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

function KpiChip({
  label,
  value,
  sub,
  tone,
  loading,
}: {
  label: string;
  value: number | string;
  sub?: string;
  tone?: "warn" | "good";
  loading?: boolean;
}) {
  return (
    <div className="rounded-lg border border-border/80 bg-card px-3 py-2.5 flex flex-col gap-0.5 min-h-[72px] justify-center">
      <p className="text-[12px] text-muted-foreground font-medium leading-tight">{label}</p>
      {loading ? (
        <Skeleton className="h-6 w-10" />
      ) : (
        <>
          <p
            className={cn(
              "text-2xl font-bold tabular-nums leading-none tracking-tight",
              tone === "warn" && "text-[hsl(var(--chart-4))]",
              tone === "good" && "text-[hsl(var(--chart-3))]",
            )}
          >
            {value}
          </p>
          {sub ? <p className="text-[10px] text-muted-foreground font-mono truncate">{sub}</p> : null}
        </>
      )}
    </div>
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
  compact,
}: {
  pendingBookings: PendingBooking[];
  pendingCount: number;
  isLoadingSummary: boolean;
  formatTime: (iso: string) => string;
  updatePending: boolean;
  onConfirmBooking: (id: string) => void;
  onDeclineBooking: (id: string) => void;
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
        {pendingCount > 0 ? (
          <span className="text-[10px] font-mono text-[hsl(var(--chart-4))]">{pendingCount} pending</span>
        ) : null}
      </div>
      {isLoadingSummary ? (
        <div className="p-3 space-y-2">
          {[1, 2].map((i) => (
            <Skeleton key={i} className="h-12 w-full rounded-lg" />
          ))}
        </div>
      ) : pendingBookings.length === 0 ? (
        <div className="flex flex-col items-center justify-center px-3 py-6 text-center">
          <Check className="h-6 w-6 text-[hsl(var(--chart-3))]/50 mb-1.5" aria-hidden />
          <p className="text-xs text-muted-foreground">Nothing waiting on you.</p>
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
              </Link>
              <div className="flex shrink-0 gap-1">
                <button
                  type="button"
                  aria-label="Decline booking"
                  disabled={updatePending}
                  onClick={() => onDeclineBooking(b.id)}
                  className="w-8 h-8 rounded-md bg-muted hover:bg-destructive/15 hover:text-destructive flex items-center justify-center transition-colors disabled:opacity-40"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  aria-label="Confirm booking"
                  disabled={updatePending}
                  onClick={() => onConfirmBooking(b.id)}
                  className="w-8 h-8 rounded-md bg-primary/15 text-primary hover:bg-primary/25 flex items-center justify-center transition-colors disabled:opacity-40"
                >
                  <Check className="h-3.5 w-3.5" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
      {pendingBookings.length > 1 ? (
        <div className="mt-auto border-t border-border/60 px-3 py-1.5">
          <Link href="/bookings?status=PENDING">
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
    upcomingBookings?: Array<{ startAt: string; available?: boolean }>;
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
  const moduleLayout = resolveOwnerHomeModuleLayout({
    pendingCount,
    openInboxCount: handoffCount,
  });

  const todayTotal = summary?.todayBookings ?? 0;
  const weekAvg = summary ? Math.round(summary.weekBookings! / 7) : 0;
  const todayDelta = summary ? summary.todayBookings! - weekAvg : 0;

  const oneThingHref =
    pendingCount > 0
      ? "/bookings?status=PENDING"
      : handoffCount > 0
        ? "/inbox?lens=taken_over"
        : openThreads.length > 0
          ? "/inbox"
          : ritual.primaryAction?.href ?? "/bookings";

  const oneThingLabel =
    pendingCount > 0
      ? `Confirm ${pendingCount} pending`
      : handoffCount > 0
        ? `Review ${handoffCount} handoff${handoffCount === 1 ? "" : "s"}`
        : openThreads.length > 0
          ? "Open inbox"
          : ritual.primaryAction?.label ?? "View calendar";

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

      <section
        className={cn(
          "rounded-lg border border-border/80 bg-card pl-3 pr-3 py-3 md:pl-4 border-l-4 border-l-primary",
          briefingLoading && "motion-liv-pulse",
        )}
        data-testid="owner-dashboard-briefing"
      >
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex gap-2 min-w-0 flex-1">
            <Sparkles className="h-4 w-4 shrink-0 mt-0.5 text-primary" aria-hidden />
            <div className="min-w-0">
              {briefingLoading ? (
                <div className="space-y-1.5">
                  <Skeleton className="h-3.5 w-full max-w-md" />
                  <Skeleton className="h-3.5 w-4/5 max-w-sm" />
                </div>
              ) : (
                <p className="text-sm leading-relaxed text-foreground/90 line-clamp-3">{livLine}</p>
              )}
              {livPulse !== "act" && livSource === "liv" ? (
                <p className="text-[10px] uppercase tracking-wider font-mono text-muted-foreground mt-0.5">
                  Liv · briefing
                </p>
              ) : null}
            </div>
          </div>
          <Link href={oneThingHref} className="shrink-0">
            <Button size="sm" className="gap-1.5 h-9 w-full sm:w-auto">
              {oneThingLabel}
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </Link>
        </div>
      </section>

      <OwnerLivGuardrails livNeedsAttention={livPulse === "act"} />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5" data-testid="owner-kpi-row">
        <KpiChip
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
        <Link href={handoffCount > 0 ? "/inbox?lens=taken_over" : "/inbox"} className="block">
          <KpiChip
            label="Inbox handoffs"
            value={handoffCount}
            sub={handoffCount === 1 ? "needs you" : handoffCount > 0 ? "need you" : "clear"}
            tone={handoffCount > 0 ? "warn" : undefined}
            loading={isLoadingSummary}
          />
        </Link>
        <KpiChip
          label="To confirm"
          value={pendingCount}
          sub="pending"
          tone={pendingCount > 0 ? "warn" : undefined}
          loading={isLoadingSummary}
        />
        <KpiChip
          label="Completed today"
          value={summary?.completedTodayCount ?? 0}
          sub={todayTotal > 0 ? `${Math.round(((summary?.completedTodayCount ?? 0) / todayTotal) * 100)}%` : "—"}
          tone="good"
          loading={isLoadingSummary}
        />
      </div>

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
            totalOpen={openThreads.length}
            compact
          />
        ) : (
          <PendingPanel
            pendingBookings={pendingBookings}
            pendingCount={pendingCount}
            isLoadingSummary={isLoadingSummary}
            formatTime={formatTime}
            updatePending={updatePending}
            onConfirmBooking={onConfirmBooking}
            onDeclineBooking={onDeclineBooking}
          />
        )
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          <InboxPreviewPanel
            threads={previewThreads}
            loading={convosLoading}
            totalOpen={openThreads.length}
            compact
          />
          <PendingPanel
            pendingBookings={pendingBookings}
            pendingCount={pendingCount}
            isLoadingSummary={isLoadingSummary}
            formatTime={formatTime}
            updatePending={updatePending}
            onConfirmBooking={onConfirmBooking}
            onDeclineBooking={onDeclineBooking}
            compact
          />
        </div>
      )}

      <SettingsDisclosure
        title="Shortcuts for your business"
        description="Vertical tools and pages — open when you need them."
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
