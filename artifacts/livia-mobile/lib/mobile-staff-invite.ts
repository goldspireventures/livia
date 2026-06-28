import {
  staffInviteMobileRedirectUrl,
  staffInviteWebRedirectUrl,
} from "@workspace/policy";
import { getDashboardBaseUrl } from "@/lib/dashboard-url";

/** Clerk redirect after staff accepts invitation — prefer universal https link. */
export function getStaffInviteRedirectUrl(): string {
  const fromEnv = process.env.EXPO_PUBLIC_STAFF_INVITE_REDIRECT_URL?.trim();
  if (fromEnv) return fromEnv;
  const dashboard = process.env.EXPO_PUBLIC_DASHBOARD_URL?.trim() || getDashboardBaseUrl();
  if (dashboard) return staffInviteWebRedirectUrl(dashboard);
  const scheme = process.env.EXPO_PUBLIC_APP_SCHEME?.trim() || "livia-mobile";
  return staffInviteMobileRedirectUrl(scheme);
}
