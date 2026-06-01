import { Link } from "wouter";
import { ChevronRight } from "lucide-react";
import type { OwnerHomeBookingRow } from "@workspace/policy";
import { sliceOwnerHomeSchedulePreview } from "@workspace/policy";
import { RunningLateSheet } from "@/components/ops/running-late-sheet";
import { PendingBookingActions } from "@/components/booking/pending-booking-actions";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

function customerName(c: OwnerHomeBookingRow["customer"]): string {
  return (
    c.displayName?.trim() ||
    [c.firstName, c.lastName].filter(Boolean).join(" ").trim() ||
    "Guest"
  );
}

type ScheduleRow = OwnerHomeBookingRow & { kind: "pending" | "confirmed" };

type Props = {
  pendingToday: OwnerHomeBookingRow[];
  confirmedToday: OwnerHomeBookingRow[];
  formatTime: (iso: string) => string;
  loading?: boolean;
  scheduleTitle: string;
  calendarCta: string;
  runningLateLabel: string;
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
  loading,
  scheduleTitle,
  calendarCta,
  runningLateLabel,
  updatePending,
  onConfirmBooking,
  onDeclineBooking,
  skipPendingId,
}: Props) {
  const pendingRows = pendingToday.filter((b) => b.id !== skipPendingId);
  const allRows: ScheduleRow[] = [
    ...pendingRows.map((b) => ({ ...b, kind: "pending" as const })),
    ...confirmedToday.map((b) => ({ ...b, kind: "confirmed" as const })),
  ].sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime());

  const { visible: rows, hiddenCount, totalCount } = sliceOwnerHomeSchedulePreview(allRows);

  if (!loading && totalCount === 0) return null;

  return (
    <section
      className="rounded-lg border border-border/80 bg-card overflow-hidden"
      data-testid="today-appointments-strip"
    >
      <div className="flex items-center justify-between px-3 py-2 border-b border-border/60">
        <h2 className="text-sm font-semibold">{scheduleTitle}</h2>
        <Link href="/bookings" className="text-xs text-primary hover:underline shrink-0">
          {calendarCta}
        </Link>
      </div>
      {loading ? (
        <div className="p-3 space-y-2">
          <Skeleton className="h-14 w-full rounded-lg" />
          <Skeleton className="h-14 w-full rounded-lg" />
        </div>
      ) : (
        <>
          <ul className="divide-y divide-border/60">
            {rows.map((b) => {
              const name = customerName(b.customer);
              return (
                <li
                  key={b.id}
                  className="px-3 py-2.5 flex items-center gap-3"
                  data-testid={`today-appointment-${b.id}`}
                >
                  <div className="min-w-0 flex-1">
                    <Link href={`/bookings/${b.id}`} className="block group">
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
                    {b.kind === "confirmed" ? (
                      <div className="mt-0.5">
                        <RunningLateSheet
                          bookingId={b.id}
                          customerName={name}
                          actionLabel={runningLateLabel}
                          trigger={
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="h-6 w-auto min-w-0 px-1.5 py-0 text-[10px] font-normal leading-tight"
                              data-testid={`today-running-late-${b.id}`}
                            >
                              {runningLateLabel}
                            </Button>
                          }
                        />
                      </div>
                    ) : null}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {b.kind === "pending" ? (
                      <PendingBookingActions
                        booking={b}
                        disabled={updatePending}
                        layout="compact"
                        onConfirm={onConfirmBooking}
                        onDecline={onDeclineBooking}
                      />
                    ) : null}
                    <Button variant="ghost" size="sm" className="h-8 px-2 text-muted-foreground" asChild>
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
          {hiddenCount > 0 ? (
            <p className="px-3 py-2 text-[11px] text-muted-foreground border-t border-border/60 text-center">
              {hiddenCount} more on today&apos;s calendar — use{" "}
              <Link href="/bookings" className="text-primary hover:underline">
                {calendarCta.toLowerCase()}
              </Link>
            </p>
          ) : null}
        </>
      )}
    </section>
  );
}
