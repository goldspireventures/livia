/**
 * Staff invite — owner-assigned role at invite time drives persona + landing.
 * Shared by web dashboard, mobile app, and API invitation metadata.
 *
 * Owner picks a job kind (floor / manager / desk) → Clerk metadata → membership scope
 * → persona shell (My chair / Queue / Floor). Invitee never self-selects role.
 */

export type StaffInviteJobKind = "floor" | "manager" | "desk";
export type StaffInviteDeskRole = "manager" | "reception";
export type InvitedMemberRole = "STAFF" | "ADMIN";
export type InvitedMemberPersona = "staff" | "manager" | "receptionist";
export type StaffInviteSurface = "web" | "mobile";

/** Owner-facing job cards — same copy on web Team invite and mobile Staff invite. */
export const STAFF_INVITE_JOBS: ReadonlyArray<{
  id: StaffInviteJobKind;
  title: string;
  body: string;
}> = [
  {
    id: "floor",
    title: "Works on the floor",
    body: "Stylist, therapist, coach, etc. Sees My chair and their own calendar — not billing or roster settings.",
  },
  {
    id: "manager",
    title: "Runs day-to-day ops",
    body: "Approves bookings, inbox, team rota. Cannot change ownership or Stripe.",
  },
  {
    id: "desk",
    title: "Front desk",
    body: "Books for everyone, messages, floor view. Same trust as manager without owner-only settings.",
  },
] as const;

/** Map owner job pick → API invitation payload (role + optional desk scope). */
export function staffInviteJobToMembership(job: StaffInviteJobKind): {
  role: InvitedMemberRole;
  deskRole?: StaffInviteDeskRole;
} {
  if (job === "floor") return { role: "STAFF" };
  if (job === "desk") return { role: "ADMIN", deskRole: "reception" };
  return { role: "ADMIN", deskRole: "manager" };
}

/** Reverse map for UI when editing — defaults unknown ADMIN to manager. */
export function membershipToStaffInviteJob(args: {
  role: InvitedMemberRole;
  deskRole?: StaffInviteDeskRole | null;
}): StaffInviteJobKind {
  if (args.role === "STAFF") return "floor";
  if (args.deskRole === "reception") return "desk";
  return "manager";
}

/** Persona from stored membership — not self-selected at sign-up. */
export function personaFromInvitedMembership(args: {
  role: InvitedMemberRole | "OWNER";
  deskRole?: StaffInviteDeskRole | null;
}): InvitedMemberPersona | null {
  if (args.role === "STAFF") return "staff";
  if (args.role === "ADMIN" && args.deskRole === "reception") return "receptionist";
  if (args.role === "ADMIN") return "manager";
  return null;
}

/** Universal invite landing — https URL works in email; web handles ticket, app via associated domain. */
export function staffInviteWebRedirectUrl(dashboardBaseUrl: string): string {
  const base = dashboardBaseUrl.replace(/\/+$/, "");
  return `${base}/staff-invite`;
}

/** Native scheme fallback when universal link is unavailable (dev builds). */
export function staffInviteMobileRedirectUrl(appScheme = "livia-mobile"): string {
  const scheme = appScheme.replace(/:\/\/?$/, "");
  return `${scheme}://staff-invite`;
}

/** Default Clerk redirect when caller omits redirectUrl — always staff-invite, not generic sign-in. */
export function staffInviteClerkRedirectUrl(dashboardBaseUrl: string): string {
  return staffInviteWebRedirectUrl(dashboardBaseUrl);
}

/** Post-invite landing after legal (or when legal already accepted). */
export function resolveStaffInviteLandingPath(args: {
  surface: StaffInviteSurface;
  persona: InvitedMemberPersona;
  vertical?: string | null;
}): string {
  const { surface, persona, vertical } = args;

  if (surface === "mobile") {
    if (persona === "staff") return "/(tabs)/my-day";
    if (persona === "manager") return "/(tabs)/approvals";
    return "/(tabs)/bookings";
  }

  if (persona === "staff") return "/my-day";
  if (persona === "manager") {
    if (vertical === "wellness") return "/wellness-reception";
    return "/inbox";
  }
  if (vertical === "wellness") return "/wellness-reception";
  if (vertical === "beauty") return "/beauty-reception";
  return "/bookings";
}

export type AcceptedStaffInvite = {
  businessId: string;
  businessName: string;
  role: InvitedMemberRole;
  deskRole?: StaffInviteDeskRole | null;
  vertical?: string | null;
};

/** Landing after legal when `from=staff-invite` — uses membership already on file. */
export function resolveStaffInviteLandingFromSession(args: {
  surface: StaffInviteSurface;
  role: InvitedMemberRole | "OWNER";
  deskRole?: StaffInviteDeskRole | null;
  isReception?: boolean;
  vertical?: string | null;
}): string {
  const deskRole =
    args.deskRole ??
    (args.isReception ? ("reception" as const) : args.role === "ADMIN" ? ("manager" as const) : null);
  const persona = personaFromInvitedMembership({
    role: args.role,
    deskRole,
  });
  if (!persona) {
    return args.surface === "mobile" ? "/(tabs)" : "/dashboard";
  }
  return resolveStaffInviteLandingPath({
    surface: args.surface,
    persona,
    vertical: args.vertical ?? null,
  });
}

export function resolveStaffInviteHandoff(args: {
  surface: StaffInviteSurface;
  accepted: AcceptedStaffInvite[];
  platformLegalAccepted: boolean;
}): { path: string; needsLegal: boolean } {
  const first = args.accepted[0];
  if (!first) {
    return {
      path: args.surface === "mobile" ? "/sign-in" : "/sign-in",
      needsLegal: false,
    };
  }

  const persona = personaFromInvitedMembership({
    role: first.role,
    deskRole: first.deskRole,
  });
  if (!persona) {
    return {
      path: args.surface === "mobile" ? "/(tabs)" : "/dashboard",
      needsLegal: !args.platformLegalAccepted,
    };
  }

  if (!args.platformLegalAccepted) {
    const legal =
      args.surface === "mobile"
        ? "/legal-acceptance?from=staff-invite"
        : "/legal-acceptance?from=staff-invite";
    return { path: legal, needsLegal: true };
  }

  return {
    path: resolveStaffInviteLandingPath({
      surface: args.surface,
      persona,
      vertical: first.vertical ?? null,
    }),
    needsLegal: false,
  };
}
