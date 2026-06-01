import { Link } from "wouter";
import { isSameDay } from "date-fns";
import { Clock, ChevronRight } from "lucide-react";
import type { OwnerHomeBookingRow } from "@workspace/policy";
import { RunningLateSheet } from "@/components/ops/running-late-sheet";
import { PendingBookingActions } from "@/components/booking/pending-booking-actions";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

function customerName(c: OwnerHomeBookingRow["customer"]): string {
  return (
    c.displayName?.trim() ||
    [c.firstName, c.lastName].filter(Boolean).join(" ").trim() ||
    "Guest"
  );
}

type Props = {
  pendingToday: OwnerHomeBookingRow[];
  confirmedToday: OwnerHomeBookingRow[];
  formatTime: (iso: string) => string;
  now: Date;
  loading?: boolean;
  runningLateLabel: string;
  serviceNoun: string;
  updatePending: boolean;
  onConfirmBooking: (id: string) => void;
  onDeclineBooking: (id: string) => void;
  /** Beauty hero already shows the first pending — skip duplicate in list */
  skipPendingId?: string | null;
};

export function TodayAppointmentsStrip({
  pendingToday,
  confirmedToday,
  formatTime,
  now,
  loading,
  runningLateLabel,
  serviceNoun,
  updatePending,
  onConfirmBooking,
  onDeclineBooking,
  skipPendingId,
}: Props) {
  const pendingRows = pendingToday.filter((b) => b.id !== skipPendingId);
  const rows = [
    ...pendingRows.map((b) => ({ ...b, kind: "pending" as const })),
    ...confirmedToday.map((b) => ({ ...b, kind: "confirmed" as const })),
  ].sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime());

  if (!loading && rows.length === 0) return null;

  return (
    <section
      className="rounded-lg border border-border/80 bg-card overflow-hidden"
      data-testid="today-appointments-strip"
    >
      <div className="flex items-center justify-between px-3 py-2 border-b border-border/60">
        <h2 className="text-sm font-semibold">Today&apos;s {serviceNoun.toLowerCase()}s</h2>
        <Link href="/bookings" className="text-xs text-primary hover:underline">
          Full calendar
        </Link>
      </div>
      {loading ? (
        <div className="p-3 space-y-2">
          <Skeleton className="h-14 w-full rounded-lg" />
          <Skeleton className="h-14 w-full rounded-lg" />
        </div>
      ) : (
        <ul className="divide-y divide-border/60">
          {rows.map((b) => {
            const inPast = new Date(b.startAt) < now && !isSameDay(new Date(b.startAt), now);
            const name = customerName(b.customer);
            return (
              <li
                key={b.id}
                className={cn(
                  "px-3 py-3 flex flex-col sm:flex-row sm:items-center gap-3",
                  inPast && "opacity-70",
                )}
                data-testid={`today-appointment-${b.id}`}
              >
                <Link href={`/bookings/${b.id}`} className="min-w-0 flex-1 group">
                  <p className="text-sm font-medium truncate group-hover:text-primary transition-colors">
                    {name}
                  </p>
                  <p className="text-xs text-muted-foreground font-mono">
                    {formatTime(b.startAt)} · {b.service.name}
                    <span className="ml-2 uppercase text-[10px] tracking-wide">
                      {b.kind === "pending" ? "· needs confirm" : "· confirmed"}
                    </span>
                  </p>
                </Link>
                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  {b.kind === "pending" ? (
                    <PendingBookingActions
                      booking={b}
                      disabled={updatePending}
                      layout="compact"
                      onConfirm={onConfirmBooking}
                      onDecline={onDeclineBooking}
                    />
                  ) : (
                    <RunningLateSheet
                      bookingId={b.id}
                      customerName={name}
                      actionLabel={runningLateLabel}
                      trigger={
                        <Button variant="outline" size="sm" className="gap-1.5 min-h-[40px]">
                          <Clock className="h-3.5 w-3.5" />
                          {runningLateLabel}
                        </Button>
                      }
                    />
                  )}
                  <Button variant="ghost" size="sm" className="h-9 px-2" asChild>
                    <Link href={`/bookings/${b.id}`}>
                      Open
                      <ChevronRight className="h-3.5 w-3.5 ml-0.5" />
                    </Link>
                  </Button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
