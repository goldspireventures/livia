import { Link } from "wouter";
import { AlertTriangle } from "lucide-react";
import {
  bookingDurationMinutes,
  staffClientFirstName,
  staffMyDayHeroLabel,
} from "@/lib/staff-my-day-helpers";
import { cn } from "@/lib/utils";

export type StaffMyDayBooking = {
  id: string;
  startAt: string;
  endAt: string;
  status: string;
  notes?: string | null;
  customer?: { id: string; displayName: string | null } | null;
  service?: { id: string; name: string; durationMinutes?: number | null } | null;
};

export function StaffMyDayHero({
  booking,
  formatTime,
  vertical,
  className,
}: {
  booking: StaffMyDayBooking;
  formatTime: (iso: string) => string;
  vertical?: string | null;
  className?: string;
}) {
  const firstName = staffClientFirstName(booking.customer?.displayName);
  const serviceName = booking.service?.name ?? "Appointment";
  const mins = bookingDurationMinutes(
    booking.startAt,
    booking.endAt,
    booking.service?.durationMinutes,
  );
  const notes = booking.notes?.trim();

  return (
    <Link href={`/bookings/${booking.id}`}>
      <article
        className={cn(
          "block rounded-[20px] border border-primary/25 bg-gradient-to-br from-primary/10 via-card to-violet-500/5 p-6 motion-hero-fade-in",
          className,
        )}
        data-testid="staff-my-day-hero"
      >
        <p className="text-[11px] uppercase tracking-widest text-primary font-medium">
          {staffMyDayHeroLabel(vertical)}
        </p>
        <h2
          className="mt-2 text-[32px] leading-[1.1] font-serif tracking-tight"
          style={{ fontFamily: "var(--app-font-serif)" }}
        >
          {firstName}
        </h2>
        <p className="mt-1 text-base text-foreground/90">
          {serviceName}
          {mins > 0 ? ` · ${mins} min` : ""}
        </p>
        <div className="mt-4 inline-flex rounded-full bg-background/80 border border-border/60 px-3 py-1.5 text-sm font-medium tabular-nums">
          {formatTime(booking.startAt)}
          {mins > 0 ? ` · ${mins} min` : ""}
        </div>
        {notes ? (
          <div
            className="mt-4 flex gap-2 rounded-lg border border-amber-500/30 bg-amber-50/90 dark:bg-amber-950/30 px-3 py-2 text-sm text-amber-950 dark:text-amber-100"
            data-testid="staff-my-day-notes-banner"
          >
            <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" aria-hidden />
            <p className="line-clamp-2 leading-snug">{notes}</p>
          </div>
        ) : null}
      </article>
    </Link>
  );
}
