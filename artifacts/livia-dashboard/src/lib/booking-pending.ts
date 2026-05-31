/** Labels for API `pendingReason` values — keep in sync with api-server `booking-pending.ts`. */
export function pendingReasonLabel(reason: string | null | undefined): string {
  switch (reason) {
    case "awaiting_staff_confirm":
      return "Waiting for staff to confirm";
    case "awaiting_deposit":
      return "Waiting for deposit";
    case "awaiting_policy_review":
      return "Policy review required";
    case "created_by_liv":
      return "Liv created — confirm to finalize";
    case "owner_manual":
      return "Manual booking — confirm when ready";
    case "awaiting_continuity":
      return "Waiting for thread — pics or reply";
    default:
      return reason?.trim() ? reason.replace(/_/g, " ") : "Pending — needs your confirmation";
  }
}
