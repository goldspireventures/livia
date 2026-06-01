/** Whether no-show / day-of actions are allowed for this start time (local calendar day). */
export function isAppointmentDay(startAt: string | Date, now = new Date()): boolean {
  const start = typeof startAt === "string" ? new Date(startAt) : startAt;
  if (Number.isNaN(start.getTime())) return false;
  return (
    start.getFullYear() === now.getFullYear() &&
    start.getMonth() === now.getMonth() &&
    start.getDate() === now.getDate()
  );
}

export function canMarkNoShow(startAt: string | Date, status: string, now = new Date()): boolean {
  if (status !== "CONFIRMED") return false;
  const start = typeof startAt === "string" ? new Date(startAt) : startAt;
  if (Number.isNaN(start.getTime())) return false;
  if (isAppointmentDay(startAt, now)) return now >= start;
  return false;
}

export function noShowUnavailableHint(startAt: string | Date, now = new Date()): string {
  const start = typeof startAt === "string" ? new Date(startAt) : startAt;
  if (Number.isNaN(start.getTime())) return "No-show is available on the appointment day.";
  if (now < start && !isAppointmentDay(startAt, now)) {
    return "No-show unlocks on the day of the appointment, after the scheduled start time.";
  }
  if (now < start && isAppointmentDay(startAt, now)) {
    return "No-show is available after the scheduled start time today.";
  }
  return "No-show is only for confirmed appointments that did not arrive.";
}
