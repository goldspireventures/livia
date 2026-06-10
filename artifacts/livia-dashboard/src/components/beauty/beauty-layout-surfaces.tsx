import { Link } from "wouter";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { layoutMorphLabel } from "@/lib/presentation-surface";
import { resolvePublicServiceImageUrl } from "@/lib/public-service-image";
import {
  WellnessAtriumSchedule,
  type PackageCreditSummaryView,
} from "@/components/wellness/wellness-layout-surfaces";
import type { RoomBoardBooking, RoomBoardResource } from "@/components/wellness/wellness-room-board";

export type BeautyBookingRow = RoomBoardBooking & {
  service?: { name?: string | null } | null;
};

function guestName(c: BeautyBookingRow["customer"]): string {
  if (!c) return "Guest";
  return (
    c.displayName ||
    [c.firstName, c.lastName].filter(Boolean).join(" ").trim() ||
    "Guest"
  );
}

function formatTime(row: BeautyBookingRow): string {
  const iso = row.startTime ?? row.startAt ?? "";
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
  } catch {
    return iso;
  }
}

function isFillService(name?: string | null): boolean {
  const n = (name ?? "").toLowerCase();
  return n.includes("fill") || n.includes("infills") || n.includes("refill");
}

/** Soft-studio — station swimlanes (reuses room board when resources exist). */
export function BeautyStationSchedule({
  bookings,
  resources,
  onAssignBookingToResource,
  assigningBookingId,
  className,
  hero = false,
}: {
  bookings: BeautyBookingRow[];
  resources?: RoomBoardResource[];
  onAssignBookingToResource?: (bookingId: string, resourceId: string | null) => Promise<boolean>;
  assigningBookingId?: string | null;
  className?: string;
  hero?: boolean;
}) {
  const stationResources = (resources ?? []).filter(
    (r) =>
      r.resourceType === "chair" ||
      r.resourceType === "station" ||
      r.resourceType === "room" ||
      !r.resourceType,
  );
  return (
    <div className={className}>
      <div className="flex items-center justify-between gap-2 mb-3">
        <h2 className="text-sm font-semibold">Studio floor</h2>
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
          {layoutMorphLabel("atrium")}
        </span>
      </div>
      <WellnessAtriumSchedule
        bookings={bookings}
        resources={stationResources.length > 0 ? stationResources : undefined}
        onAssignBookingToResource={onAssignBookingToResource}
        assigningBookingId={assigningBookingId}
        hero={hero}
        roomBoardFootnote="Assign chairs in Settings → Resources when you run multiple stations."
      />
    </div>
  );
}

/** Editorial — treatment menu cards for today's schedule. */
export function BeautyMenuCardSchedule({
  bookings,
  vertical,
  className,
}: {
  bookings: BeautyBookingRow[];
  vertical?: string | null;
  className?: string;
}) {
  const rows = bookings.slice(0, 6);
  return (
    <section
      className={cn("beauty-menu-card-board", className)}
      data-testid="beauty-menu-card-schedule"
    >
      <div className="flex items-center justify-between gap-2 mb-4">
        <h2 className="text-lg font-serif tracking-tight" style={{ fontFamily: "var(--app-font-serif)" }}>
          Today&apos;s treatments
        </h2>
        <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
          {layoutMorphLabel("menu-card")}
        </span>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {rows.length === 0 ? (
          <p className="text-sm text-muted-foreground col-span-full">
            No appointments on the books yet.{" "}
            <Link href="/bookings" className="text-primary hover:underline">
              Open calendar
            </Link>
          </p>
        ) : (
          rows.map((b) => {
            const serviceName = b.service?.name ?? "Treatment";
            const thumb = resolvePublicServiceImageUrl(serviceName, vertical);
            const fillDue = isFillService(serviceName);
            return (
              <Link
                key={b.id}
                href={`/bookings/${b.id}`}
                className="beauty-menu-card group block rounded-2xl border border-border/80 bg-card overflow-hidden transition-shadow hover:shadow-md"
              >
                <div className="flex gap-0 min-h-[88px]">
                  {thumb ? (
                    <img src={thumb} alt="" className="w-24 shrink-0 object-cover" />
                  ) : (
                    <div className="w-24 shrink-0 bg-muted" aria-hidden />
                  )}
                  <div className="flex-1 px-4 py-3 min-w-0">
                    <p className="text-[10px] font-mono tabular-nums text-muted-foreground">
                      {formatTime(b)}
                    </p>
                    <p className="text-base font-serif leading-snug truncate mt-0.5 group-hover:text-primary transition-colors">
                      {serviceName}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">{guestName(b.customer)}</p>
                    {fillDue ? (
                      <p className="text-[10px] uppercase tracking-wider text-primary mt-1.5 font-medium">
                        Fill cycle · remind client
                      </p>
                    ) : null}
                  </div>
                </div>
              </Link>
            );
          })
        )}
      </div>
    </section>
  );
}

/** Premium-dark — manager cockpit metrics + floor queue. */
export function BeautyCockpitSchedule({
  bookings,
  pendingCount,
  handoffCount,
  todayTotal,
  completedToday,
  className,
}: {
  bookings: BeautyBookingRow[];
  pendingCount: number;
  handoffCount: number;
  todayTotal: number;
  completedToday: number;
  className?: string;
}) {
  const queue = bookings.slice(0, 8);
  const util =
    todayTotal > 0 ? Math.round((completedToday / todayTotal) * 100) : 0;

  return (
    <section
      className={cn("beauty-cockpit-board space-y-4", className)}
      data-testid="beauty-cockpit-schedule"
    >
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-sm font-semibold">Floor cockpit</h2>
        <span className="text-[10px] uppercase tracking-wider text-primary/90">
          {layoutMorphLabel("cockpit")}
        </span>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2" data-testid="beauty-cockpit-metrics">
        {[
          ["On floor", String(todayTotal)],
          ["To confirm", String(pendingCount)],
          ["Inbox", String(handoffCount)],
          ["Done %", todayTotal > 0 ? `${util}%` : "—"],
        ].map(([label, val]) => (
          <div key={label} className="beauty-cockpit-metric rounded-xl border border-primary/25 bg-card/90 p-3">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
            <p className="text-xl font-serif mt-1 text-primary tabular-nums">{val}</p>
          </div>
        ))}
      </div>
      <div className="flex gap-2 overflow-x-auto pb-1 snap-x snap-mandatory" data-testid="beauty-cockpit-queue">
        {queue.length === 0 ? (
          <p className="text-sm text-muted-foreground px-1">Floor clear — no active appointments.</p>
        ) : (
          queue.map((b, i) => (
            <Link
              key={b.id}
              href={`/bookings/${b.id}`}
              className={cn(
                "beauty-cockpit-glow-card snap-start shrink-0 w-[min(100%,14rem)] rounded-xl border px-3 py-2.5",
                i === 0 && "beauty-cockpit-glow-card--active",
              )}
            >
              <p className="text-[10px] font-mono tabular-nums text-muted-foreground">{formatTime(b)}</p>
              <p className="text-sm font-medium truncate">{b.service?.name ?? "Treatment"}</p>
              <p className="text-xs text-muted-foreground truncate">{guestName(b.customer)}</p>
            </Link>
          ))
        )}
      </div>
    </section>
  );
}

/** Noir-dusk — confirm queue beside floor schedule (split-inbox morph on /bookings). */
export function BeautySplitInboxBookingsSchedule({
  bookings,
  vertical,
  className,
}: {
  bookings: BeautyBookingRow[];
  vertical?: string | null;
  className?: string;
}) {
  const pending = bookings.filter((b) => b.status === "PENDING");
  const floor = bookings.filter((b) => b.status !== "PENDING");

  return (
    <section
      className={cn("beauty-split-inbox-bookings grid gap-4 lg:grid-cols-2", className)}
      data-testid="beauty-split-inbox-bookings"
    >
      <div className="beauty-split-inbox-queue rounded-xl border border-border/80 bg-card/80 p-3">
        <h2 className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground mb-2">
          Confirm first · {layoutMorphLabel("split-inbox")}
        </h2>
        <ul className="space-y-2">
          {pending.length === 0 ? (
            <p className="text-xs text-muted-foreground py-4 text-center">Nothing waiting for approval.</p>
          ) : (
            pending.map((b) => (
              <li key={b.id}>
                <Link
                  href={`/bookings/${b.id}`}
                  className="block rounded-lg border border-primary/25 bg-primary/5 px-3 py-2 hover:bg-primary/10"
                >
                  <p className="text-xs font-mono text-muted-foreground">{formatTime(b)}</p>
                  <p className="text-sm font-medium truncate">{b.service?.name ?? "Treatment"}</p>
                  <p className="text-xs text-muted-foreground truncate">{guestName(b.customer)}</p>
                </Link>
              </li>
            ))
          )}
        </ul>
      </div>
      <div className="rounded-xl border border-border/80 bg-card/80 p-3">
        <h2 className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground mb-2">
          On the floor today
        </h2>
        <ul className="space-y-2">
          {floor.length === 0 ? (
            <p className="text-xs text-muted-foreground py-4 text-center">Floor clear.</p>
          ) : (
            floor.slice(0, 8).map((b) => (
              <li key={b.id}>
                <Link href={`/bookings/${b.id}`} className="block rounded-lg border px-3 py-2 hover:bg-muted/40">
                  <p className="text-xs font-mono text-muted-foreground">{formatTime(b)}</p>
                  <p className="text-sm font-medium truncate">{b.service?.name ?? "Treatment"}</p>
                  <p className="text-xs text-muted-foreground truncate">{guestName(b.customer)}</p>
                </Link>
              </li>
            ))
          )}
        </ul>
        {floor.length > 8 ? (
          <Link href="/bookings" className="inline-block mt-3 text-xs text-primary hover:underline">
            View all {floor.length} on calendar
          </Link>
        ) : null}
      </div>
    </section>
  );
}

export type { PackageCreditSummaryView };
