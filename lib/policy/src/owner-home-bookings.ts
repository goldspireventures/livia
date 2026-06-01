/** Owner Today — which bookings to surface on home (single source for dashboard ritual). */

export type OwnerHomeBookingRow = {
  id: string;
  startAt: string;
  status: string;
  serviceId: string;
  staffId?: string | null;
  service: { name: string };
  customer: {
    firstName?: string | null;
    lastName?: string | null;
    displayName?: string | null;
  };
};

/** How many upcoming today rows to show on owner home before "full calendar". */
export const OWNER_HOME_TODAY_SCHEDULE_PREVIEW_LIMIT = 3;

export type OwnerHomeSchedulePreview<T> = {
  visible: T[];
  hiddenCount: number;
  totalCount: number;
};

/** Next N bookings on today's owner schedule card (chronological). */
export function sliceOwnerHomeSchedulePreview<T>(
  rows: T[],
  limit: number = OWNER_HOME_TODAY_SCHEDULE_PREVIEW_LIMIT,
): OwnerHomeSchedulePreview<T> {
  const totalCount = rows.length;
  const visible = rows.slice(0, Math.max(0, limit));
  return {
    visible,
    hiddenCount: Math.max(0, totalCount - visible.length),
    totalCount,
  };
}

export type OwnerHomeBookingSlices = {
  /** PENDING today — need confirm / reschedule / decline */
  pendingToday: OwnerHomeBookingRow[];
  /** CONFIRMED today — running-late + day-of ops */
  confirmedToday: OwnerHomeBookingRow[];
};

function isSameCalendarDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

/** Active day-of bookings for owner home (excludes completed/cancelled). */
export function resolveOwnerHomeBookingSlices(
  upcoming: OwnerHomeBookingRow[] | undefined | null,
  now: Date = new Date(),
): OwnerHomeBookingSlices {
  const rows = (upcoming ?? [])
    .filter((b) => {
      const st = b.status?.toUpperCase?.() ?? b.status;
      if (st !== "PENDING" && st !== "CONFIRMED") return false;
      try {
        return isSameCalendarDay(new Date(b.startAt), now);
      } catch {
        return false;
      }
    })
    .sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime());

  return {
    pendingToday: rows.filter((b) => b.status === "PENDING"),
    confirmedToday: rows.filter((b) => b.status === "CONFIRMED"),
  };
}
