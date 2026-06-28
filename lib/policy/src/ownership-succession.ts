/**
 * G8 — Ownership succession (legal + product authority).
 *
 * **Not the same as Team → Invite.**
 * - **Staff roster** — people on the calendar (may have no Livia login).
 * - **Team invite** — grants sign-in (ADMIN/STAFF membership); required before succession.
 * - **Ownership transfer** — moves legal/contractual tenant authority (`businesses.owner_id`,
 *   billing, OWNER role). Irreversible without support.
 *
 * Spec: docs/product/TENANT-AUTHORITY-AND-SUCCESSION.md · journeys/configuration-graduation.md G8
 */

export type OutgoingOwnerDisposition = "STAFF" | "ADMIN" | "REVOKE";

export const OWNERSHIP_SUCCESSION = {
  settingsTabLabel: "Ownership",
  panelTitle: "Pass the keys",
  panelSubtitle:
    "Hand this location to someone who already signs in to Livia for your studio — not the same as adding them to the calendar.",
  whatChangesTitle: "What changes when you pass the keys",
  whatChangesBullets: [
    "They become the account owner for this location on Livia (billing, plan, invites, Liv rules).",
    "Stripe and invoices follow the new owner when billing is connected.",
    "You choose whether you stay as manager, staff, or leave this studio entirely.",
    "Customers and bookings stay on this studio — this is succession, not a new shop.",
  ],
  teamInviteNote:
    "Team → Invite (Staff page) is for everyday work only — calendar, inbox, and bookings. Do not use it to pass ownership.",
  successionInvite: {
    title: "Invite your successor",
    body: "Send a sign-in invite from here. When they accept the email and log in, they appear in the list below — then you can pass the keys.",
    emailLabel: "Their email",
    roleLabel: "Their sign-in role",
    roleAdmin: "Manager (Admin) — recommended",
    roleStaff: "Staff — own calendar only",
    cta: "Send succession invite",
    sending: "Sending invite…",
    successTitle: "Succession invite sent",
    successBody: "They'll appear here after they accept and sign in. Refresh if you already sent one.",
    error: "Could not send succession invite",
  },
  teamInvite: {
    dialogTitle: "Invite team member",
    dialogDescription:
      "Pick what they'll do in Livia — their role is set now, not at sign-up. For legal ownership handover, use Settings → Ownership instead.",
    rolePickerLabel: "What will they do in Livia?",
    rolePickerHint:
      "One email invite. Their role decides what they see after sign-up (My chair vs approvals vs front desk).",
  } as const,
  membershipRoleLabels: {
    ADMIN: "Manager (Admin)",
    STAFF: "Staff",
  } as const,
  candidatesEmptyTitle: "No successor signed in yet",
  candidatesEmptyBody: "Use the invite above — they'll show in the list once they've accepted and signed in.",
  rosterOnlyTitle: "On your calendar but not signed in",
  rosterOnlyHint:
    "Add their email in the succession invite above, or add them to the calendar from Team (roster only).",
  confirmTitle: "Pass the keys to this person?",
  confirmBody: (businessName: string, personLabel: string) =>
    `${personLabel} will become owner of ${businessName}. You cannot undo this yourself. Billing and admin control move to them.`,
  applyCta: "Pass the keys",
  dispositionLabels: {
    STAFF: "Stay as staff member",
    ADMIN: "Stay as manager",
    REVOKE: "Leave this studio",
  } as const satisfies Record<OutgoingOwnerDisposition, string>,
  auditAction: "tenant.ownership_transferred",
  errors: {
    INCOMING_NOT_MEMBER:
      "They need their own Livia sign-in for this studio first — send a succession invite from Settings → Ownership.",
    INCOMING_NOT_ELIGIBLE:
      "Only Admin or Staff members can receive ownership — update their role from Team or invite them again.",
    NOT_OWNER: "Only the current owner can pass the keys.",
    SAME_USER: "You are already the owner of this location.",
  } as const,
} as const;

/** Roles that may receive ownership (must have `business_memberships` + Clerk user). */
export const OWNERSHIP_INCOMING_MEMBERSHIP_ROLES = ["ADMIN", "STAFF"] as const;

export function isOwnershipIncomingRole(role: string): boolean {
  return (OWNERSHIP_INCOMING_MEMBERSHIP_ROLES as readonly string[]).includes(role);
}

/** Signed-in members (not owner) who may receive ownership — same filter as API candidates. */
export function countOwnershipEligibleSuccessors(
  memberships: ReadonlyArray<{ userId: string; role: string }>,
  ownerUserId: string,
): number {
  return memberships.filter(
    (m) => m.userId !== ownerUserId && isOwnershipIncomingRole(m.role),
  ).length;
}

/** Show G8 nudge only when at least one eligible successor exists (not roster-only). */
export function shouldSuggestOwnershipSuccession(eligibleSuccessorCount: number): boolean {
  return eligibleSuccessorCount >= 1;
}

/** Admin first — typical succession target. */
export function sortOwnershipCandidates<T extends { role: string }>(candidates: T[]): T[] {
  return [...candidates].sort((a, b) => {
    if (a.role === b.role) return 0;
    if (a.role === "ADMIN") return -1;
    if (b.role === "ADMIN") return 1;
    return 0;
  });
}

export function formatLifecycleRosterVsSignIn(rosterCount: number, signedInCount: number): string {
  const roster =
    rosterCount === 1 ? "1 person on your calendar" : `${rosterCount} people on your calendar`;
  if (signedInCount === 0) {
    return `${roster} — none signed in to Livia yet (calendar ≠ ownership)`;
  }
  const signIn =
    signedInCount === 1 ? "1 signed in" : `${signedInCount} signed in`;
  return `${roster} · ${signIn} to Livia (only signed-in members can receive ownership)`;
}
