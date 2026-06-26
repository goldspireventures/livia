import { customFetch } from "@workspace/api-client-react";

/** Materialise Clerk invite metadata into business_memberships (idempotent). */
export async function acceptPendingInvitations(): Promise<void> {
  await customFetch("/api/me/accept-invitations", { method: "POST" });
}
