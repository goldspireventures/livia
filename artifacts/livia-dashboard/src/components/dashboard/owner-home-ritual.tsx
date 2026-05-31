import { Link } from "wouter";
import { ArrowRight, Check, Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { usePersonaBriefing } from "@/hooks/use-persona-briefing";
import { timeGreeting } from "@/lib/persona-rituals";
import { useListConversations } from "@workspace/api-client-react";
import { useBusiness } from "@/lib/business-context";
import { InboxPreviewPanel } from "@/components/dashboard/inbox-preview-panel";
import { VerticalHomeModules } from "@/components/dashboard/vertical-home-modules";
import { LazyMount } from "@/components/lazy-mount";
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
    <div className="rounded-xl border border-border/80 bg-card p-4 min-h-[88px] flex flex-col justify-between gap-1">
      <p className="text-[13px] text-muted-foreground font-medium">{label}</p>
      {loading ? (
        <Skeleton className="h-7 w-12" />
      ) : (
        <>
          <p
            className={cn(
              "text-[28px] font-bold tabular-nums leading-none tracking-tight",
              tone === "warn" && "text-[hsl(var(--chart-4))]",
              tone === "good" && "text-[hsl(var(--chart-3))]",
            )}
          >
            {value}
          </p>
          {sub ? <p className="text-[11px] text-muted-foreground font-mono">{sub}</p> : null}
        </>
      )}
    </div>
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

  const todayTotal = summary?.todayBookings ?? 0;
  const weekAvg = summary ? Math.round(summary.weekBookings! / 7) : 0;
  const todayDelta = summary ? summary.todayBookings! - weekAvg : 0;

  const oneThingHref =
    (summary?.pendingCount ?? 0) > 0
      ? "/bookings?status=PENDING"
      : openThreads.length > 0
        ? "/inbox"
        : ritual.primaryAction?.href ?? "/bookings";

  const oneThingLabel =
    (summary?.pendingCount ?? 0) > 0
      ? "Confirm pending bookings"
      : openThreads.length > 0
        ? "Reply in inbox"
        : ritual.primaryAction?.label ?? "View calendar";

  return (
    <div className="space-y-6" data-testid="owner-home-ritual">
      <header className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <h1
          className="text-[28px] font-serif tracking-tight leading-tight"
          style={{ fontFamily: "var(--app-font-serif)" }}
          data-testid="owner-dashboard-greeting"
        >
          {ownerGreeting(firstName)}
        </h1>
        <p className="text-sm text-muted-foreground font-mono tabular-nums">{formatHeaderDate(now)}</p>
      </header>

      <section
        className={cn(
          "rounded-xl border border-border/80 bg-card pl-4 pr-4 py-4 md:pl-5 border-l-4 border-l-primary",
          briefingLoading && "motion-liv-pulse",
        )}
        data-testid="owner-dashboard-briefing"
      >
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div className="flex gap-2 min-w-0 flex-1">
            <Sparkles className="h-4 w-4 shrink-0 mt-0.5 text-primary" aria-hidden />
            <div className="min-w-0">
              {briefingLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full max-w-lg" />
                  <Skeleton className="h-4 w-5/6 max-w-md" />
                </div>
              ) : (
                <p className="text-sm leading-relaxed text-foreground/90 max-w-2xl">{livLine}</p>
              )}
              {livPulse === "act" ? (
                <p className="text-xs text-destructive font-medium mt-1">Needs your attention</p>
              ) : livSource === "liv" ? (
                <p className="text-[10px] uppercase tracking-wider font-mono text-muted-foreground mt-1">
                  Liv · live briefing
                </p>
              ) : null}
            </div>
          </div>
          <Link href={oneThingHref} className="shrink-0">
            <Button size="sm" className="gap-1.5 min-h-[44px] w-full md:w-auto">
              {oneThingLabel}
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </Link>
        </div>
      </section>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4" data-testid="owner-kpi-row">
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
        <KpiChip
          label="Inbox waiting"
          value={openThreads.length}
          sub={openThreads.length === 1 ? "thread open" : "threads open"}
          tone={openThreads.length > 0 ? "warn" : undefined}
          loading={convosLoading}
        />
        <KpiChip
          label="To confirm"
          value={summary?.pendingCount ?? 0}
          sub="pending bookings"
          tone={(summary?.pendingCount ?? 0) > 0 ? "warn" : undefined}
          loading={isLoadingSummary}
        />
        <KpiChip
          label="Completed today"
          value={summary?.completedTodayCount ?? 0}
          sub={todayTotal > 0 ? `${Math.round(((summary?.completedTodayCount ?? 0) / todayTotal) * 100)}% of day` : "—"}
          tone="good"
          loading={isLoadingSummary}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <InboxPreviewPanel
          threads={previewThreads}
          loading={convosLoading}
          totalOpen={openThreads.length}
        />

        <section className="rounded-xl border border-border/80 bg-card overflow-hidden flex flex-col min-h-[220px]">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border/60">
            <h2 className="text-sm font-semibold">Needs confirmation</h2>
            {(summary?.pendingCount ?? 0) > 0 ? (
              <span className="text-[10px] font-mono text-[hsl(var(--chart-4))]">
                {summary?.pendingCount} pending
              </span>
            ) : null}
          </div>
          {isLoadingSummary ? (
            <div className="p-3 space-y-2">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-14 w-full rounded-lg" />
              ))}
            </div>
          ) : pendingBookings.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center px-4 py-10 text-center">
              <Check className="h-8 w-8 text-[hsl(var(--chart-3))]/50 mb-2" aria-hidden />
              <p className="text-sm text-muted-foreground">All caught up — nothing waiting on you.</p>
            </div>
          ) : (
            <ul className="divide-y divide-border/60">
              {pendingBookings.map((b) => (
                <li
                  key={b.id}
                  className="flex items-center justify-between gap-2 px-4 py-3"
                >
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
                      className="w-9 h-9 rounded-md bg-muted hover:bg-destructive/15 hover:text-destructive flex items-center justify-center transition-colors disabled:opacity-40"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      aria-label="Confirm booking"
                      disabled={updatePending}
                      onClick={() => onConfirmBooking(b.id)}
                      className="w-9 h-9 rounded-md bg-primary/15 text-primary hover:bg-primary/25 flex items-center justify-center transition-colors disabled:opacity-40"
                    >
                      <Check className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
          <div className="mt-auto border-t border-border/60 px-4 py-2">
            <Link href="/bookings?status=PENDING">
              <Button variant="ghost" size="sm" className="w-full text-xs h-9">
                View all pending
              </Button>
            </Link>
          </div>
        </section>
      </div>

      <LazyMount minHeight={120}>
        <VerticalHomeModules />
      </LazyMount>
    </div>
  );
}
