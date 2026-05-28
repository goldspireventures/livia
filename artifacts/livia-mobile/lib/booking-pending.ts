export function pendingReasonLabel(reason: string | null | undefined): string {
  switch (reason) {
    case "awaiting_staff_confirm":
      return "Staff must confirm time or stylist";
    case "awaiting_deposit":
      return "Deposit not received yet";
    case "awaiting_continuity":
      return "Waiting on client reply in thread";
    case "awaiting_policy_review":
      return "Policy check — needs your review";
    case "created_by_liv":
      return "Liv drafted this — quick yes to lock in";
    case "owner_manual":
      return "Manual booking — confirm details";
    default:
      return reason ? reason.replace(/_/g, " ") : "";
  }
}

/** Proactive guidance: what happened and what to do next. */
export function pendingApprovalGuidance(reason: string | null | undefined): string {
  switch (reason) {
    case "awaiting_staff_confirm":
      return "Assign or confirm the stylist, then approve — Liv can message the client once you confirm.";
    case "awaiting_deposit":
      return "Send the deposit link or mark paid, then approve so the slot stays held.";
    case "awaiting_continuity":
      return "Open the thread — Liv is waiting on the client. You can reply or approve if details are clear.";
    case "awaiting_policy_review":
      return "Review against your shop policy. Adjust time/service if needed, then approve.";
    case "created_by_liv":
      return "Liv matched availability and client request. Tap approve if it looks right — she learns from your yes/no.";
    case "owner_manual":
      return "You or staff entered this manually. Confirm time, service, and client, then approve.";
    default:
      return "Liv only escalates when a rule needs a human — approve, edit, or open the booking for full context.";
  }
}
