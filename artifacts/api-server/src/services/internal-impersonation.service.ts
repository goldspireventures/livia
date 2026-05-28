import { getInternalTenantDetail } from "./internal-ops.service";

export type ImpersonationIntent = {
  ticketId: string;
  businessId: string;
  operatorEmail: string;
  reason: string;
  createdAt: string;
  /** No tenant JWT issued — deep links only. */
  tenantDashboardUrl: string | null;
  publicBookingUrl: string | null;
  policy: string;
};

/**
 * Ticket-gated support intent — audit-friendly, no break-glass JWT.
 * Full Clerk workforce SSO is configured via INTERNAL_CLERK_* (see portal SSO banner).
 */
export async function recordImpersonationIntent(args: {
  ticketId: string;
  businessId: string;
  operatorEmail: string;
  reason: string;
}): Promise<ImpersonationIntent | null> {
  if (!args.ticketId.trim() || args.ticketId.length < 4) {
    throw new Error("VALID_TICKET_REQUIRED");
  }
  if (!args.reason.trim() || args.reason.length < 8) {
    throw new Error("REASON_REQUIRED");
  }

  const detail = await getInternalTenantDetail(args.businessId);
  if (!detail) return null;

  return {
    ticketId: args.ticketId.trim(),
    businessId: args.businessId,
    operatorEmail: args.operatorEmail.trim().toLowerCase(),
    reason: args.reason.trim(),
    createdAt: new Date().toISOString(),
    tenantDashboardUrl: detail.deepLinks.tenantDashboard,
    publicBookingUrl: detail.deepLinks.publicBooking,
    policy:
      "No tenant session issued. Use dashboard deep link while logged in as Livia staff with separate workforce IdP when enabled.",
  };
}

export function internalSsoStatus(): {
  workforceSsoConfigured: boolean;
  banner: string;
} {
  const configured = Boolean(
    process.env.INTERNAL_CLERK_PUBLISHABLE_KEY?.trim() &&
      process.env.INTERNAL_CLERK_SECRET_KEY?.trim(),
  );
  return {
    workforceSsoConfigured: configured,
    banner: configured
      ? "Workforce Clerk app detected — route operators through SSO, not shared tenant keys."
      : "Set INTERNAL_CLERK_PUBLISHABLE_KEY + INTERNAL_CLERK_SECRET_KEY for a dedicated workforce app. Until then, ops secret + operator email is audited only.",
  };
}
