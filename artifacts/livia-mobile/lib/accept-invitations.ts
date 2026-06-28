import { customFetch } from "@workspace/api-client-react";
import type { AcceptedStaffInvite } from "@workspace/policy";

export type AcceptInvitationsResult = {
  accepted: AcceptedStaffInvite[];
};

/** Materialise Clerk invite metadata into business_memberships (idempotent). */
export async function acceptPendingInvitations(): Promise<AcceptInvitationsResult> {
  return customFetch<AcceptInvitationsResult>("/api/me/accept-invitations", {
    method: "POST",
  });
}
