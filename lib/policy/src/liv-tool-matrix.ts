/**
 * Liv tool matrix — policy view of registry capabilities vs ship status.
 * @see docs/product/LIV-TOOL-REGISTRY-MATRIX.md
 */

export type LivToolShipStatus = "live" | "partial" | "planned";

export type LivToolMatrixRow = {
  toolId: string;
  label: string;
  status: LivToolShipStatus;
  profiles: Array<"tenant_public" | "tenant_staff" | "livia_internal">;
  mandateAction?: string;
  surfaceIds?: string[];
};

/** Rows aligned with lib/liv-runtime registry + product matrix. */
export const LIV_TOOL_MATRIX: LivToolMatrixRow[] = [
  {
    toolId: "send_message",
    label: "Reply in inbox thread",
    status: "live",
    profiles: ["tenant_staff"],
    mandateAction: "reply_inbox",
    surfaceIds: ["tenant.inbox"],
  },
  {
    toolId: "find_slots",
    label: "Suggest booking slot",
    status: "live",
    profiles: ["tenant_public", "tenant_staff"],
    mandateAction: "book_slot",
    surfaceIds: ["guest.public.book"],
  },
  {
    toolId: "create_booking",
    label: "Create booking",
    status: "live",
    profiles: ["tenant_public", "tenant_staff"],
    mandateAction: "book_slot",
  },
  {
    toolId: "confirm_booking",
    label: "Confirm pending booking",
    status: "live",
    profiles: ["tenant_staff"],
  },
  {
    toolId: "cancel_booking",
    label: "Cancel booking",
    status: "live",
    profiles: ["tenant_staff"],
    mandateAction: "cancel_booking",
  },
  {
    toolId: "reschedule_booking",
    label: "Reschedule booking",
    status: "live",
    profiles: ["tenant_staff"],
    mandateAction: "reschedule",
  },
  {
    toolId: "list_stuck_continuity",
    label: "Stuck continuity queue",
    status: "live",
    profiles: ["tenant_staff"],
    surfaceIds: ["tenant.owner.dashboard", "tenant.booking.detail"],
  },
  {
    toolId: "list_drift_candidates",
    label: "Lapsed client drift list",
    status: "live",
    profiles: ["tenant_staff"],
    surfaceIds: ["tenant.owner.dashboard"],
  },
  {
    toolId: "draft_drift_recovery",
    label: "Draft drift recovery message",
    status: "live",
    profiles: ["tenant_staff"],
    mandateAction: "send_reminder",
  },
  {
    toolId: "morning_briefing",
    label: "Morning briefing",
    status: "live",
    profiles: ["tenant_staff"],
    surfaceIds: ["tenant.owner.dashboard"],
  },
  {
    toolId: "lookup_customer",
    label: "Lookup customer",
    status: "live",
    profiles: ["tenant_staff"],
  },
  {
    toolId: "get_booking",
    label: "Get booking details",
    status: "live",
    profiles: ["tenant_staff"],
  },
  {
    toolId: "search_tenants",
    label: "Search tenants (internal)",
    status: "live",
    profiles: ["livia_internal"],
    surfaceIds: ["internal.support.thread"],
  },
  {
    toolId: "tenant_snapshot",
    label: "Tenant health snapshot",
    status: "live",
    profiles: ["livia_internal"],
    surfaceIds: ["internal.support.thread"],
  },
];

export function listLivToolMatrixRows(): LivToolMatrixRow[] {
  return [...LIV_TOOL_MATRIX];
}

export function getLivToolsForSurface(surfaceId: string): LivToolMatrixRow[] {
  const id = surfaceId.trim();
  return LIV_TOOL_MATRIX.filter(
    (r) => r.status === "live" && r.surfaceIds?.includes(id),
  );
}
