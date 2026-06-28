import { staffInviteWebRedirectUrl } from "@workspace/policy";

/** Clerk redirect for invites sent from web Team page. */
export function getStaffInviteRedirectUrl(): string {
  if (typeof window === "undefined") return staffInviteWebRedirectUrl("https://app.livia-hq.com");
  return staffInviteWebRedirectUrl(window.location.origin);
}
