/** Staff My Day — vertical copy per w4.staff.my-day.mobile. */

export function staffMyDayHeroLabel(vertical?: string | null): string {
  switch (vertical) {
    case "body-art":
      return "SESSION";
    case "medspa":
    case "allied-health":
      return "PATIENT";
    case "pet-grooming":
      return "NEXT GROOM";
    default:
      return "UP NEXT";
  }
}

export function staffClientFirstName(displayName: string | null | undefined): string {
  const raw = displayName?.trim();
  if (!raw) return "Walk-in";
  return raw.split(/\s+/)[0] ?? raw;
}

export function bookingDurationMinutes(
  startAt: string,
  endAt: string,
  serviceDuration?: number | null,
): number {
  const fromRange = Math.round((new Date(endAt).getTime() - new Date(startAt).getTime()) / 60000);
  if (fromRange > 0) return fromRange;
  return serviceDuration ?? 0;
}
