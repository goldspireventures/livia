import { Link } from "wouter";
import type { PresentationLayoutMorph } from "@workspace/policy";
import { cn } from "@/lib/utils";
import { bookingsListScheduleTitle, formatBookingStatusLabel } from "@workspace/policy";
import {
  BeautyCockpitSchedule,
  BeautyMenuCardSchedule,
  BeautySplitInboxBookingsSchedule,
  BeautyStationSchedule,
  type BeautyBookingRow,
} from "@/components/beauty/beauty-layout-surfaces";
import {
  WellnessAtriumSchedule,
  WellnessLedgerSchedule,
  WellnessTimelineSchedule,
  type PackageCreditSummaryView,
} from "@/components/wellness/wellness-layout-surfaces";
import { formatDateTime } from "@/lib/format";
import { bookingsListRowHeightClass, bookingsListScrollViewportClass } from "@/lib/bookings-list-layout";
import { PendingWhyLine } from "@/components/booking/pending-why-line";

type BookingRow = BeautyBookingRow & {
  status: string;
  pendingReason?: string | null;
  staff?: { displayName?: string | null } | null;
};

type Props = {
  morph: PresentationLayoutMorph;
  vertical?: string | null;
  category?: string | null;
  bookings: BookingRow[];
  pendingCount: number;
  handoffCount?: number;
  completedCount: number;
  packageCreditSummary?: PackageCreditSummaryView | null;
  bookingResources?: import("@/components/wellness/wellness-room-board").RoomBoardResource[];
  onAssignBookingToResource?: (bookingId: string, resourceId: string | null) => Promise<boolean>;
  assigningBookingId?: string | null;
  statusColors: Record<string, string>;
  rowClass: (pending: boolean) => string;
  avatarClass: () => string;
  bookingStatusClass: (status: string, fallback: string) => string;
};

function ConstellationBookingsList({
  bookings,
  pendingCount,
  vertical,
  category,
  rowClass,
  avatarClass,
  bookingStatusClass,
  statusColors,
}: Pick<
  Props,
  | "bookings"
  | "pendingCount"
  | "vertical"
  | "category"
  | "rowClass"
  | "avatarClass"
  | "bookingStatusClass"
  | "statusColors"
>) {
  return (
    <section
      className="constellation-bookings-morph flex flex-col gap-3"
      data-testid="bookings-morph-constellation"
    >
      <div className="flex items-center justify-between gap-2 shrink-0">
        <h2 className="text-sm font-semibold">{bookingsListScheduleTitle()}</h2>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 shrink-0">
        {[
          ["Showing", String(bookings.length)],
          ["Pending", String(pendingCount)],
        ].map(([label, val]) => (
          <div
            key={label}
            className="rounded-xl border border-[rgba(217,195,154,0.22)] bg-[rgba(42,45,58,0.45)] px-3 py-2"
          >
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
            <p className="text-lg font-serif text-[#d9c39a] tabular-nums mt-0.5">{val}</p>
          </div>
        ))}
      </div>
      <div
        className={cn(
          "divide-y divide-border rounded-xl border border-[rgba(217,195,154,0.18)]",
          bookingsListScrollViewportClass,
        )}
      >
        {bookings.map((booking) => (
          <Link key={booking.id} href={`/bookings/${booking.id}`}>
            <div
              data-testid={`row-booking-${booking.id}`}
              className={cn(
                rowClass(booking.status === "PENDING"),
                "constellation-booking-row",
                bookingsListRowHeightClass,
              )}
            >
              <div className={avatarClass()}>
                {booking.customer?.firstName?.charAt(0) ?? "?"}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">
                  {booking.customer?.firstName} {booking.customer?.lastName}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {booking.service?.name}
                  {booking.staff ? ` · ${booking.staff.displayName}` : ""}
                </p>
                {booking.status === "PENDING" ? (
                  <PendingWhyLine
                    reason={booking.pendingReason}
                    vertical={vertical}
                    category={category}
                    compact
                    className="mt-0.5"
                  />
                ) : null}
              </div>
              <div className="flex flex-col items-end gap-1 shrink-0">
                <span className="text-xs font-medium tabular-nums">
                  {formatDateTime(booking.startAt ?? booking.startTime ?? "")}
                </span>
                <span
                  className={cn(
                    "text-[10px] font-semibold px-2 py-0.5 rounded-full border",
                    bookingStatusClass(booking.status, statusColors[booking.status] ?? ""),
                  )}
                >
                  {formatBookingStatusLabel(booking.status)}
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

/** Bookings list — morph-specific structure (not palette-only). */
export function BookingsMorphList({
  morph,
  vertical,
  category,
  bookings,
  pendingCount,
  handoffCount = 0,
  completedCount,
  packageCreditSummary,
  bookingResources,
  onAssignBookingToResource,
  assigningBookingId,
  statusColors,
  rowClass,
  avatarClass,
  bookingStatusClass,
}: Props) {
  const rows = bookings as BeautyBookingRow[];

  if (vertical === "beauty") {
    if (morph === "split-inbox") {
      return (
        <BeautySplitInboxBookingsSchedule
          bookings={rows}
          vertical={vertical}
          className="w-full"
        />
      );
    }
    if (morph === "atrium") {
      return (
        <BeautyStationSchedule
          bookings={rows}
          resources={bookingResources}
          onAssignBookingToResource={onAssignBookingToResource}
          assigningBookingId={assigningBookingId}
          hero
          className="w-full"
        />
      );
    }
    if (morph === "menu-card") {
      return <BeautyMenuCardSchedule bookings={rows} vertical={vertical} className="w-full" />;
    }
    if (morph === "cockpit") {
      return (
        <BeautyCockpitSchedule
          bookings={rows}
          pendingCount={pendingCount}
          handoffCount={handoffCount}
          todayTotal={bookings.length}
          completedToday={completedCount}
          className="w-full"
        />
      );
    }
  }

  if (vertical === "wellness") {
    if (morph === "atrium") {
      return (
        <WellnessAtriumSchedule
          bookings={rows}
          resources={bookingResources}
          onAssignBookingToResource={onAssignBookingToResource}
          assigningBookingId={assigningBookingId}
          hero
          vertical={vertical}
          category={category}
          className="w-full"
        />
      );
    }
    if (morph === "timeline-rail") {
      return (
        <WellnessTimelineSchedule
          bookings={rows}
          vertical={vertical}
          category={category}
          className="w-full"
        />
      );
    }
    if (morph === "ledger") {
      return (
        <WellnessLedgerSchedule
          bookings={rows}
          packageCreditSummary={packageCreditSummary}
          vertical={vertical}
          category={category}
          className="w-full"
        />
      );
    }
  }

  if (morph === "constellation") {
    return (
      <ConstellationBookingsList
        bookings={bookings}
        pendingCount={pendingCount}
        vertical={vertical}
        category={category}
        rowClass={rowClass}
        avatarClass={avatarClass}
        bookingStatusClass={bookingStatusClass}
        statusColors={statusColors}
      />
    );
  }

  return null;
}

export function BookingsMorphFallbackRow({
  booking,
  rowClass,
  avatarClass,
  bookingStatusClass,
  statusColors,
  vertical,
  category,
}: {
  booking: BookingRow;
  rowClass: (pending: boolean) => string;
  avatarClass: () => string;
  bookingStatusClass: (status: string, fallback: string) => string;
  statusColors: Record<string, string>;
  vertical?: string | null;
  category?: string | null;
}) {
  return (
    <Link href={`/bookings/${booking.id}`}>
      <div
        data-testid={`row-booking-${booking.id}`}
        className={rowClass(booking.status === "PENDING")}
      >
        <div className={avatarClass()}>
          {booking.customer?.firstName?.charAt(0) ?? "?"}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium truncate">
            {booking.customer?.firstName} {booking.customer?.lastName}
          </p>
          <p className="text-xs text-muted-foreground truncate">
            {booking.service?.name}
            {booking.staff ? ` · ${booking.staff.displayName}` : ""}
          </p>
          {booking.status === "PENDING" ? (
            <PendingWhyLine
              reason={booking.pendingReason}
              vertical={vertical}
              category={category}
              compact
              className="mt-0.5"
            />
          ) : null}
        </div>
        <div className="flex flex-col items-end gap-1 shrink-0">
          <span className="text-xs font-medium tabular-nums">
            {formatDateTime(booking.startAt ?? booking.startTime ?? "")}
          </span>
          <span
            className={cn(
              "text-[10px] font-semibold px-2 py-0.5 rounded-full border",
              bookingStatusClass(booking.status, statusColors[booking.status] ?? ""),
            )}
          >
            {formatBookingStatusLabel(booking.status)}
          </span>
        </div>
      </div>
    </Link>
  );
}
