import { Link } from "wouter";
import { ChevronRight } from "lucide-react";
import type { StaffMyDayBooking } from "@/components/staff/staff-my-day-hero";
import { staffClientFirstName } from "@/lib/staff-my-day-helpers";
import { STAFF_MY_DAY_TIMELINE_MAX_VISIBLE } from "@workspace/policy";
import { cn } from "@/lib/utils";
import { MOTION } from "@/lib/motion";

export function StaffMyDayTimeline({
  bookings,
  nextId,
  formatTime,
  maxVisible = STAFF_MY_DAY_TIMELINE_MAX_VISIBLE,
}: {
  bookings: StaffMyDayBooking[];
  nextId?: string | null;
  formatTime: (iso: string) => string;
  maxVisible?: number;
}) {
  const rest = bookings.filter((b) => b.id !== nextId).slice(0, maxVisible);

  if (rest.length === 0 && bookings.length === 0) {
    return (
      <section className="text-center py-10" data-testid="staff-my-day-empty">
        <p className="text-lg font-medium">Your day is open</p>
        <p className="text-sm text-muted-foreground mt-1">Walk-ins welcome — check the floor calendar.</p>
      </section>
    );
  }

  if (rest.length === 0) {
    return null;
  }

  return (
    <section data-testid="staff-my-day-timeline">
      <h3 className="text-[13px] uppercase tracking-widest text-muted-foreground font-medium mb-3">
        Rest of today
      </h3>
      <ul className="divide-y divide-border/60 rounded-xl border border-border/70 overflow-hidden bg-card/50">
        {rest.map((b, i) => (
          <li key={b.id}>
            <Link
              href={`/bookings/${b.id}`}
              className={cn(
                "flex items-center gap-3 min-h-[56px] px-3 py-2 hover:bg-muted/40 transition-colors",
                MOTION.listItem,
              )}
              style={{ animationDelay: `${i * 40}ms` }}
            >
              <span className="w-16 shrink-0 text-[15px] font-medium tabular-nums">
                {formatTime(b.startAt)}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-[15px] font-medium truncate">
                  {staffClientFirstName(b.customer?.displayName)}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {b.service?.name ?? "Appointment"}
                </p>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" aria-hidden />
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
