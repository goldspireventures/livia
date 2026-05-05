import { useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
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
import { formatTime } from "@/lib/format";
import {
  AlarmClockOff,
  Briefcase,
  Calendar,
  CalendarCheck,
  CalendarPlus,
  CalendarX,
  Check,
  CheckCircle2,
  Clock,
  UserCog,
  UserPlus,
  Users,
  Wrench,
  X,
  Zap,
  type LucideIcon,
} from "lucide-react";

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

function formatHeaderDate(d: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
  }).format(d);
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

interface EventMeta {
  label: string;
  Icon: LucideIcon;
  color: string;
}

const EVENT_META: Record<string, EventMeta> = {
  BOOKING_CREATED:    { label: "New booking created",         Icon: CalendarPlus,  color: "text-primary" },
  BOOKING_CONFIRMED:  { label: "Booking confirmed",           Icon: CalendarCheck, color: "text-[hsl(var(--chart-2))]" },
  BOOKING_CANCELLED:  { label: "Booking cancelled",           Icon: CalendarX,     color: "text-destructive" },
  BOOKING_COMPLETED:  { label: "Booking completed",           Icon: CheckCircle2,  color: "text-[hsl(var(--chart-3))]" },
  BOOKING_NO_SHOW:    { label: "Customer no-show",            Icon: CalendarX,     color: "text-muted-foreground" },
  CUSTOMER_CREATED:   { label: "New customer added",          Icon: UserPlus,      color: "text-[hsl(var(--chart-1))]" },
  CUSTOMER_UPDATED:   { label: "Customer profile updated",    Icon: UserCog,       color: "text-muted-foreground" },
  STAFF_CREATED:      { label: "Staff member added",          Icon: UserPlus,      color: "text-primary" },
  STAFF_UPDATED:      { label: "Staff member updated",        Icon: UserCog,       color: "text-muted-foreground" },
  STAFF_DEACTIVATED:  { label: "Staff member deactivated",    Icon: UserCog,       color: "text-destructive" },
  SERVICE_CREATED:    { label: "New service created",         Icon: Briefcase,     color: "text-primary" },
  SERVICE_UPDATED:    { label: "Service updated",             Icon: Briefcase,     color: "text-muted-foreground" },
  SERVICE_DEACTIVATED:{ label: "Service deactivated",         Icon: Briefcase,     color: "text-destructive" },
  AVAILABILITY_UPDATED:{ label: "Availability schedule updated", Icon: Wrench,     color: "text-muted-foreground" },
  TIME_OFF_CREATED:   { label: "Time off scheduled",          Icon: AlarmClockOff, color: "text-[hsl(var(--chart-4))]" },
  TIME_OFF_REMOVED:   { label: "Time off removed",            Icon: AlarmClockOff, color: "text-muted-foreground" },
};

function getEventMeta(type: string): EventMeta {
  return (
    EVENT_META[type] ?? {
      label: type.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase()),
      Icon: Clock,
      color: "text-muted-foreground",
    }
  );
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
const TL_PX_PER_HOUR = 96;
const TL_TRACK_WIDTH = TL_HOURS * TL_PX_PER_HOUR; // 1152px

function pctForDate(d: Date): number {
  const h = d.getHours() + d.getMinutes() / 60;
  return ((h - TL_START_HOUR) / TL_HOURS) * 100;
}

function durationMinutes(start: Date, end: Date): number {
  return Math.max(15, Math.round((end.getTime() - start.getTime()) / 60000));
}

// ------------ page ------------

export default function DashboardPage() {
  const { business } = useBusiness();
  const qc = useQueryClient();

  const businessId = business?.id ?? "";

  const { data: summary, isLoading: isLoadingSummary } = useGetDashboardSummary(
    businessId,
    { query: { enabled: !!businessId } as any }
  );

  const { data: activityFeed, isLoading: isLoadingActivity } = useGetActivityFeed(
    businessId,
    { limit: 12 },
    { query: { enabled: !!businessId } as any }
  );

  const updateBooking = useUpdateBooking({
    mutation: {
      onSuccess: () => {
        if (!businessId) return;
        qc.invalidateQueries({ queryKey: getGetDashboardSummaryQueryKey(businessId) });
        qc.invalidateQueries({ queryKey: getListBookingsQueryKey(businessId) });
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

  return (
    <div
      className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500"
      style={{ fontFamily: "var(--app-font-sans)" }}
    >
      {/* ============== Page header ============== */}
      <header className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3 flex-wrap">
          <h1
            className="text-base font-semibold tracking-tight"
            style={{ fontFamily: "var(--app-font-display)" }}
          >
            Today's flight plan
          </h1>
          <span className="hidden md:inline-block w-1 h-1 rounded-full bg-border" />
          <span className="text-xs text-muted-foreground font-mono">
            {formatHeaderDate(now)} · {todayTotal} today · {summary?.pendingCount ?? 0} to confirm
          </span>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-primary/30 bg-primary/5">
            <Zap className="w-3.5 h-3.5 text-primary" />
            <span className="text-[10px] font-medium text-primary">
              AI agent: {summary?.pendingCount ?? 0} action{(summary?.pendingCount ?? 0) === 1 ? "" : "s"} ready
            </span>
          </div>
          <div className="hidden md:flex items-center gap-2 text-[10px] font-mono text-muted-foreground bg-muted px-2 py-1 rounded border border-border">
            <span>⌘K</span>
            <span>Quick Actions</span>
          </div>
        </div>
      </header>

      {/* ============== KPI strip + Action Queue ============== */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 grid grid-cols-2 md:grid-cols-4 gap-4">
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
        </div>

        {/* Action Queue */}
        <Panel
          title="Action Queue"
          right={
            (summary?.pendingCount ?? 0) > 0 ? (
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[hsl(var(--chart-4))]/10 text-[hsl(var(--chart-4))]">
                {summary?.pendingCount} PENDING
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
          ) : pendingBookings.length === 0 ? (
            <EmptyState icon={Check} text="All caught up. Nothing waiting on you." />
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
      </div>

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
            className="relative overflow-x-auto bg-background/40"
            style={{ height: `${64 + blocksAreaHeightPx + 16}px` }}
          >
            <div
              className="relative h-full"
              style={{ width: `${TL_TRACK_WIDTH}px`, minWidth: "100%" }}
            >
              {/* Hour grid */}
              <div className="absolute inset-0 flex">
                {Array.from({ length: TL_HOURS + 1 }).map((_, i) => (
                  <div
                    key={i}
                    className="border-r border-dashed border-border/70 relative h-full"
                    style={{ width: `${TL_PX_PER_HOUR}px`, flexShrink: 0 }}
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
          ) : !activityFeed || activityFeed.length === 0 ? (
            <EmptyState icon={Clock} text="No recent activity yet." />
          ) : (
            <div className="flex flex-col">
              {activityFeed.map((a) => {
                const meta = getEventMeta(a.type);
                return (
                  <div
                    key={a.id}
                    className="flex items-start gap-3 px-4 py-2.5 border-b border-border last:border-0 hover:bg-muted/30 transition-colors"
                  >
                    <div className={`mt-0.5 shrink-0 ${meta.color}`}>
                      <meta.Icon className="h-3.5 w-3.5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[11px] truncate">{meta.label}</div>
                    </div>
                    <div className="text-[10px] text-muted-foreground font-mono shrink-0">
                      {formatRelativeTime(a.createdAt)}
                    </div>
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
